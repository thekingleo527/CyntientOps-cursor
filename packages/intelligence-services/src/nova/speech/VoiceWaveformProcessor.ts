/**
 * 🌊 Voice Waveform Processor
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 VOICE WAVEFORM PROCESSING - Real-time audio visualization and analysis
 * ✅ REAL-TIME: Live audio buffer processing and waveform generation
 * ✅ VISUALIZATION: Waveform data for UI components
 * ✅ VOICE ACTIVITY: Advanced voice activity detection
 * ✅ NOISE CANCELLATION: Real-time noise filtering and enhancement
 * ✅ AUDIO ANALYSIS: Frequency analysis and audio quality metrics
 * 
 * Based on SwiftUI VoiceWaveformProcessor.swift (250+ lines)
 */

import { Platform } from 'react-native';

export interface WaveformData {
  amplitude: number;
  frequency: number;
  phase: number;
  timestamp: number;
  quality: number;
}

export interface VoiceActivityDetection {
  isVoiceActive: boolean;
  confidence: number;
  noiseLevel: number;
  signalToNoiseRatio: number;
  voiceLevel: number;
  timestamp: number;
}

export interface AudioQualityMetrics {
  signalToNoiseRatio: number;
  totalHarmonicDistortion: number;
  frequencyResponse: number[];
  dynamicRange: number;
  clarity: number;
  overallQuality: number;
}

export interface WaveformConfig {
  sampleRate: number;
  bufferSize: number;
  windowSize: number;
  smoothingFactor: number;
  noiseThreshold: number;
  voiceActivityThreshold: number;
  enableNoiseCancellation: boolean;
  enableFrequencyAnalysis: boolean;
  enableRealTimeProcessing: boolean;
}

export interface FrequencyBin {
  frequency: number;
  amplitude: number;
  phase: number;
}

export class VoiceWaveformProcessor {
  private config: WaveformConfig;
  private isProcessing: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private noiseGate: DynamicsCompressorNode | null = null;
  
  // Processing buffers
  private waveformBuffer: WaveformData[] = [];
  private frequencyBuffer: FrequencyBin[] = [];
  private voiceActivityHistory: VoiceActivityDetection[] = [];
  private noiseBaseline: number = 0;
  private noiseHistory: number[] = [];
  
  // Event callbacks
  private onWaveformDataCallback?: (data: WaveformData[]) => void;
  private onVoiceActivityCallback?: (detection: VoiceActivityDetection) => void;
  private onAudioQualityCallback?: (metrics: AudioQualityMetrics) => void;
  private onErrorCallback?: (error: Error) => void;

  constructor(config: Partial<WaveformConfig> = {}) {
    this.config = {
      sampleRate: 44100,
      bufferSize: 4096,
      windowSize: 1024,
      smoothingFactor: 0.8,
      noiseThreshold: 0.01,
      voiceActivityThreshold: 0.1,
      enableNoiseCancellation: true,
      enableFrequencyAnalysis: true,
      enableRealTimeProcessing: true,
      ...config
    };
  }

  /**
   * Initialize the waveform processor
   */
  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        console.warn('⚠️ Voice waveform processing is only available on web platform');
        return false;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
          channelCount: 1
        }
      });

      this.mediaStream = stream;

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create audio nodes
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();
      this.noiseGate = this.audioContext.createDynamicsCompressor();
      this.audioProcessor = this.audioContext.createScriptProcessor(
        this.config.bufferSize,
        1,
        1
      );

      // Configure analyser
      this.analyserNode.fftSize = this.config.windowSize * 2;
      this.analyserNode.smoothingTimeConstant = this.config.smoothingFactor;

      // Configure noise gate
      this.noiseGate.threshold.value = -24;
      this.noiseGate.knee.value = 30;
      this.noiseGate.ratio.value = 12;
      this.noiseGate.attack.value = 0.003;
      this.noiseGate.release.value = 0.25;

      // Connect audio nodes
      source.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.noiseGate);
      this.noiseGate.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      // Set up audio processing
      this.audioProcessor.onaudioprocess = (event) => {
        this.processAudioBuffer(event.inputBuffer);
      };

      // Initialize noise baseline
      await this.initializeNoiseBaseline();

      console.log('✅ Voice Waveform Processor initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Voice Waveform Processor:', error);
      return false;
    }
  }

  /**
   * Initialize noise baseline
   */
  private async initializeNoiseBaseline(): Promise<void> {
    try {
      if (!this.analyserNode) return;

      // Collect noise samples for 2 seconds
      const noiseSamples: number[] = [];
      const startTime = Date.now();
      const duration = 2000; // 2 seconds

      const collectNoise = () => {
        if (Date.now() - startTime < duration) {
          const dataArray = new Uint8Array(this.analyserNode!.frequencyBinCount);
          this.analyserNode!.getByteFrequencyData(dataArray);
          
          const rms = this.calculateRMS(dataArray);
          noiseSamples.push(rms);
          
          requestAnimationFrame(collectNoise);
        } else {
          // Calculate noise baseline
          this.noiseBaseline = noiseSamples.reduce((sum, sample) => sum + sample, 0) / noiseSamples.length;
          this.noiseHistory = [...noiseSamples];
          console.log('🎵 Noise baseline established:', this.noiseBaseline);
        }
      };

      collectNoise();
    } catch (error) {
      console.error('❌ Failed to initialize noise baseline:', error);
    }
  }

  /**
   * Start waveform processing
   */
  async startProcessing(): Promise<boolean> {
    try {
      if (this.isProcessing) {
        console.warn('⚠️ Waveform processing already active');
        return true;
      }

      if (!this.audioContext || !this.audioProcessor) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      this.isProcessing = true;
      console.log('🌊 Voice waveform processing started');
      return true;
    } catch (error) {
      console.error('❌ Failed to start waveform processing:', error);
      this.onErrorCallback?.(error as Error);
      return false;
    }
  }

  /**
   * Stop waveform processing
   */
  async stopProcessing(): Promise<void> {
    try {
      if (!this.isProcessing) return;

      this.isProcessing = false;

      // Disconnect audio nodes
      if (this.audioProcessor) {
        this.audioProcessor.disconnect();
        this.audioProcessor = null;
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      console.log('🛑 Voice waveform processing stopped');
    } catch (error) {
      console.error('❌ Failed to stop waveform processing:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  /**
   * Process audio buffer
   */
  private processAudioBuffer(buffer: AudioBuffer): void {
    try {
      if (!this.isProcessing) return;

      const channelData = buffer.getChannelData(0);
      const timestamp = Date.now();

      // Process waveform data
      if (this.config.enableRealTimeProcessing) {
        this.processWaveformData(channelData, timestamp);
      }

      // Process frequency analysis
      if (this.config.enableFrequencyAnalysis) {
        this.processFrequencyAnalysis(channelData, timestamp);
      }

      // Detect voice activity
      this.detectVoiceActivity(channelData, timestamp);

      // Calculate audio quality metrics
      this.calculateAudioQuality(channelData, timestamp);
    } catch (error) {
      console.error('❌ Error processing audio buffer:', error);
    }
  }

  /**
   * Process waveform data
   */
  private processWaveformData(audioData: Float32Array, timestamp: number): void {
    try {
      const waveformData: WaveformData[] = [];

      // Calculate amplitude and frequency for each sample
      for (let i = 0; i < audioData.length; i += 4) { // Process every 4th sample for performance
        const amplitude = Math.abs(audioData[i]);
        const frequency = this.calculateFrequency(audioData, i);
        const phase = Math.atan2(audioData[i], audioData[i + 1] || 0);
        const quality = this.calculateSampleQuality(amplitude, frequency);

        waveformData.push({
          amplitude,
          frequency,
          phase,
          timestamp: timestamp + (i / this.config.sampleRate * 1000),
          quality
        });
      }

      // Apply noise cancellation if enabled
      const processedData = this.config.enableNoiseCancellation
        ? this.applyNoiseCancellation(waveformData)
        : waveformData;

      // Add to buffer
      this.waveformBuffer.push(...processedData);

      // Keep buffer size manageable
      if (this.waveformBuffer.length > 1000) {
        this.waveformBuffer = this.waveformBuffer.slice(-500);
      }

      // Notify callback
      this.onWaveformDataCallback?.(processedData);
    } catch (error) {
      console.error('❌ Error processing waveform data:', error);
    }
  }

  /**
   * Process frequency analysis
   */
  private processFrequencyAnalysis(audioData: Float32Array, timestamp: number): void {
    try {
      if (!this.analyserNode) return;

      const frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.analyserNode.getByteFrequencyData(frequencyData);

      const frequencyBins: FrequencyBin[] = [];
      const nyquist = this.config.sampleRate / 2;
      const binSize = nyquist / frequencyData.length;

      for (let i = 0; i < frequencyData.length; i++) {
        const frequency = i * binSize;
        const amplitude = frequencyData[i] / 255; // Normalize to 0-1
        const phase = Math.random() * Math.PI * 2; // Placeholder phase calculation

        frequencyBins.push({
          frequency,
          amplitude,
          phase
        });
      }

      // Add to buffer
      this.frequencyBuffer = frequencyBins;
    } catch (error) {
      console.error('❌ Error processing frequency analysis:', error);
    }
  }

  /**
   * Detect voice activity
   */
  private detectVoiceActivity(audioData: Float32Array, timestamp: number): void {
    try {
      const rms = this.calculateRMS(audioData);
      const noiseLevel = Math.max(0, rms - this.noiseBaseline);
      const signalToNoiseRatio = rms / Math.max(0.001, this.noiseBaseline);
      const voiceLevel = Math.max(0, rms - this.noiseBaseline);
      
      const isVoiceActive = rms > this.config.voiceActivityThreshold && 
                           signalToNoiseRatio > 2.0;

      const detection: VoiceActivityDetection = {
        isVoiceActive,
        confidence: Math.min(1.0, signalToNoiseRatio / 5.0),
        noiseLevel,
        signalToNoiseRatio,
        voiceLevel,
        timestamp
      };

      // Add to history
      this.voiceActivityHistory.push(detection);

      // Keep history manageable
      if (this.voiceActivityHistory.length > 100) {
        this.voiceActivityHistory = this.voiceActivityHistory.slice(-50);
      }

      // Update noise baseline
      this.updateNoiseBaseline(rms);

      // Notify callback
      this.onVoiceActivityCallback?.(detection);
    } catch (error) {
      console.error('❌ Error detecting voice activity:', error);
    }
  }

  /**
   * Calculate audio quality metrics
   */
  private calculateAudioQuality(audioData: Float32Array, timestamp: number): void {
    try {
      const rms = this.calculateRMS(audioData);
      const signalToNoiseRatio = rms / Math.max(0.001, this.noiseBaseline);
      
      // Calculate total harmonic distortion (simplified)
      const totalHarmonicDistortion = this.calculateTHD(audioData);
      
      // Calculate frequency response
      const frequencyResponse = this.calculateFrequencyResponse();
      
      // Calculate dynamic range
      const dynamicRange = this.calculateDynamicRange(audioData);
      
      // Calculate clarity
      const clarity = this.calculateClarity(audioData);
      
      // Calculate overall quality
      const overallQuality = (
        signalToNoiseRatio * 0.3 +
        (1 - totalHarmonicDistortion) * 0.2 +
        clarity * 0.3 +
        Math.min(1.0, dynamicRange / 60) * 0.2
      );

      const metrics: AudioQualityMetrics = {
        signalToNoiseRatio,
        totalHarmonicDistortion,
        frequencyResponse,
        dynamicRange,
        clarity,
        overallQuality
      };

      // Notify callback
      this.onAudioQualityCallback?.(metrics);
    } catch (error) {
      console.error('❌ Error calculating audio quality:', error);
    }
  }

  /**
   * Calculate RMS (Root Mean Square)
   */
  private calculateRMS(data: Float32Array | Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      sum += value * value;
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Calculate frequency from audio data
   */
  private calculateFrequency(audioData: Float32Array, index: number): number {
    // Simple frequency calculation using zero-crossing detection
    let crossings = 0;
    const windowSize = Math.min(64, audioData.length - index);
    
    for (let i = index; i < index + windowSize - 1; i++) {
      if ((audioData[i] >= 0) !== (audioData[i + 1] >= 0)) {
        crossings++;
      }
    }
    
    return (crossings / 2) * (this.config.sampleRate / windowSize);
  }

  /**
   * Calculate sample quality
   */
  private calculateSampleQuality(amplitude: number, frequency: number): number {
    // Quality based on amplitude and frequency characteristics
    const amplitudeQuality = Math.min(1.0, amplitude * 10);
    const frequencyQuality = frequency > 80 && frequency < 8000 ? 1.0 : 0.5;
    return (amplitudeQuality + frequencyQuality) / 2;
  }

  /**
   * Apply noise cancellation
   */
  private applyNoiseCancellation(waveformData: WaveformData[]): WaveformData[] {
    return waveformData.map(data => ({
      ...data,
      amplitude: Math.max(0, data.amplitude - this.noiseBaseline * 0.5),
      quality: data.quality * (1 - this.noiseBaseline)
    }));
  }

  /**
   * Update noise baseline
   */
  private updateNoiseBaseline(currentRms: number): void {
    // Adaptive noise baseline using exponential moving average
    const alpha = 0.01; // Learning rate
    this.noiseBaseline = this.noiseBaseline * (1 - alpha) + currentRms * alpha;
    
    // Add to noise history
    this.noiseHistory.push(currentRms);
    if (this.noiseHistory.length > 100) {
      this.noiseHistory = this.noiseHistory.slice(-50);
    }
  }

  /**
   * Calculate Total Harmonic Distortion (simplified)
   */
  private calculateTHD(audioData: Float32Array): number {
    // Simplified THD calculation
    const rms = this.calculateRMS(audioData);
    const peak = Math.max(...Array.from(audioData).map(Math.abs));
    return Math.min(1.0, (peak - rms) / peak);
  }

  /**
   * Calculate frequency response
   */
  private calculateFrequencyResponse(): number[] {
    if (!this.frequencyBuffer.length) return [];
    
    return this.frequencyBuffer.map(bin => bin.amplitude);
  }

  /**
   * Calculate dynamic range
   */
  private calculateDynamicRange(audioData: Float32Array): number {
    const max = Math.max(...Array.from(audioData).map(Math.abs));
    const min = Math.min(...Array.from(audioData).map(Math.abs));
    return 20 * Math.log10(max / Math.max(0.001, min));
  }

  /**
   * Calculate clarity
   */
  private calculateClarity(audioData: Float32Array): number {
    // Clarity based on signal consistency
    const rms = this.calculateRMS(audioData);
    const variance = this.calculateVariance(audioData, rms);
    return Math.max(0, 1 - variance / rms);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(data: Float32Array, mean: number): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += Math.pow(data[i] - mean, 2);
    }
    return sum / data.length;
  }

  /**
   * Get current waveform data
   */
  getWaveformData(): WaveformData[] {
    return [...this.waveformBuffer];
  }

  /**
   * Get current frequency data
   */
  getFrequencyData(): FrequencyBin[] {
    return [...this.frequencyBuffer];
  }

  /**
   * Get voice activity history
   */
  getVoiceActivityHistory(): VoiceActivityDetection[] {
    return [...this.voiceActivityHistory];
  }

  /**
   * Get noise baseline
   */
  getNoiseBaseline(): number {
    return this.noiseBaseline;
  }

  /**
   * Clear all buffers
   */
  clearBuffers(): void {
    this.waveformBuffer = [];
    this.frequencyBuffer = [];
    this.voiceActivityHistory = [];
    this.noiseHistory = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WaveformConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: {
    onWaveformData?: (data: WaveformData[]) => void;
    onVoiceActivity?: (detection: VoiceActivityDetection) => void;
    onAudioQuality?: (metrics: AudioQualityMetrics) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onWaveformDataCallback = callbacks.onWaveformData;
    this.onVoiceActivityCallback = callbacks.onVoiceActivity;
    this.onAudioQualityCallback = callbacks.onAudioQuality;
    this.onErrorCallback = callbacks.onError;
  }

  /**
   * Check if waveform processing is available
   */
  static isAvailable(): boolean {
    return Platform.OS === 'web' && 
           typeof window !== 'undefined' && 
           'AudioContext' in window;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isProcessing) {
        await this.stopProcessing();
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.clearBuffers();
      console.log('🧹 Voice Waveform Processor cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const voiceWaveformProcessor = new VoiceWaveformProcessor();
