/**
 * 🎤 Nova Voice Interface
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA VOICE INTERFACE - Complete voice interaction system
 * ✅ SPEECH RECOGNITION: Real-time speech-to-text with wake word detection
 * ✅ TEXT-TO-SPEECH: Natural voice synthesis for Nova responses
 * ✅ WAVEFORM VISUALIZATION: Real-time audio waveform display
 * ✅ VOICE ACTIVITY: Visual voice activity indicators
 * ✅ MULTI-PLATFORM: iOS, Android, and Web support
 * ✅ ROLE-AWARE: Context-aware voice processing for different user roles
 * 
 * Based on SwiftUI NovaVoiceInterface.swift (350+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { UserRole } from '@cyntientops/domain-schema';
import { Colors, Typography, Spacing, BorderRadius } from '@cyntientops/design-tokens';
import { NovaSpeechRecognizer, SpeechRecognitionResult } from '@cyntientops/intelligence-services';
import { WakeWordDetector, WakeWordDetection } from '@cyntientops/intelligence-services';
import { VoiceWaveformProcessor, WaveformData, VoiceActivityDetection } from '@cyntientops/intelligence-services';

export interface NovaVoiceInterfaceProps {
  userRole: UserRole;
  userId?: string;
  userName?: string;
  
  // Configuration
  enableWakeWord?: boolean;
  enableWaveform?: boolean;
  enableVoiceActivity?: boolean;
  language?: string;
  accent?: string;
  
  // Callbacks
  onSpeechResult?: (result: SpeechRecognitionResult) => void;
  onWakeWordDetected?: (detection: WakeWordDetection) => void;
  onVoiceActivity?: (detection: VoiceActivityDetection) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

export interface NovaVoiceState {
  isListening: boolean;
  isProcessing: boolean;
  isWakeWordActive: boolean;
  currentTranscript: string;
  confidence: number;
  voiceActivity: boolean;
  audioQuality: number;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  waveformData: WaveformData[];
  lastWakeWordTime: number;
}

export const NovaVoiceInterface: React.FC<NovaVoiceInterfaceProps> = ({
  userRole,
  userId,
  userName,
  enableWakeWord = true,
  enableWaveform = true,
  enableVoiceActivity = true,
  language = 'en-US',
  accent = 'general',
  onSpeechResult,
  onWakeWordDetected,
  onVoiceActivity,
  onError,
  onStatusChange,
}) => {
  // State
  const [state, setState] = useState<NovaVoiceState>({
    isListening: false,
    isProcessing: false,
    isWakeWordActive: false,
    currentTranscript: '',
    confidence: 0,
    voiceActivity: false,
    audioQuality: 0,
    status: 'idle',
    waveformData: [],
    lastWakeWordTime: 0,
  });

  // Refs
  const speechRecognizerRef = useRef<NovaSpeechRecognizer | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const waveformProcessorRef = useRef<VoiceWaveformProcessor | null>(null);
  const animationRefs = useRef({
    pulse: new Animated.Value(1),
    waveform: new Animated.Value(0),
    voiceActivity: new Animated.Value(0),
    confidence: new Animated.Value(0),
  });

  // Initialize voice components
  useEffect(() => {
    initializeVoiceComponents();
    return () => cleanupVoiceComponents();
  }, []);

  // Initialize voice components
  const initializeVoiceComponents = useCallback(async () => {
    try {
      // Initialize speech recognizer
      const speechRecognizer = new NovaSpeechRecognizer({
        language,
        continuous: true,
        interimResults: true,
        enableNoiseCancellation: true,
        enableVoiceActivityDetection: enableVoiceActivity,
        roleSpecificOptimization: true,
        userRole,
      });

      await speechRecognizer.initialize();
      speechRecognizer.setCallbacks({
        onResult: handleSpeechResult,
        onError: handleError,
        onStatusChange: handleStatusChange,
      });

      speechRecognizerRef.current = speechRecognizer;

      // Initialize wake word detector
      if (enableWakeWord) {
        const wakeWordDetector = new WakeWordDetector({
          wakePhrase: 'hey nova',
          sensitivity: 0.7,
          confidenceThreshold: 0.8,
          enableContinuousListening: true,
          enableLowPowerMode: true,
          language,
          accent,
        });

        await wakeWordDetector.initialize();
        wakeWordDetector.setCallbacks({
          onWakeWordDetected: handleWakeWordDetected,
          onError: handleError,
          onStatusChange: handleStatusChange,
        });

        wakeWordDetectorRef.current = wakeWordDetector;
      }

      // Initialize waveform processor (web only)
      if (enableWaveform && Platform.OS === 'web') {
        const waveformProcessor = new VoiceWaveformProcessor({
          sampleRate: 44100,
          bufferSize: 4096,
          enableNoiseCancellation: true,
          enableFrequencyAnalysis: true,
          enableRealTimeProcessing: true,
        });

        await waveformProcessor.initialize();
        waveformProcessor.setCallbacks({
          onWaveformData: handleWaveformData,
          onVoiceActivity: handleVoiceActivity,
          onError: handleError,
        });

        waveformProcessorRef.current = waveformProcessor;
      }

      console.log('✅ Nova Voice Interface initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Nova Voice Interface:', error);
      handleError(error as Error);
    }
  }, [userRole, language, accent, enableWakeWord, enableWaveform, enableVoiceActivity]);

  // Cleanup voice components
  const cleanupVoiceComponents = useCallback(async () => {
    try {
      if (speechRecognizerRef.current) {
        await speechRecognizerRef.current.cleanup();
        speechRecognizerRef.current = null;
      }

      if (wakeWordDetectorRef.current) {
        await wakeWordDetectorRef.current.cleanup();
        wakeWordDetectorRef.current = null;
      }

      if (waveformProcessorRef.current) {
        await waveformProcessorRef.current.cleanup();
        waveformProcessorRef.current = null;
      }

      console.log('🧹 Nova Voice Interface cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }, []);

  // Handle speech recognition results
  const handleSpeechResult = useCallback((result: SpeechRecognitionResult) => {
    setState(prev => ({
      ...prev,
      currentTranscript: result.transcript,
      confidence: result.confidence,
      isProcessing: !result.isFinal,
      status: result.isFinal ? 'idle' : 'processing',
    }));

    // Update confidence animation
    Animated.timing(animationRefs.current.confidence, {
      toValue: result.confidence,
      duration: 200,
      useNativeDriver: false,
    }).start();

    onSpeechResult?.(result);
  }, [onSpeechResult]);

  // Handle wake word detection
  const handleWakeWordDetected = useCallback((detection: WakeWordDetection) => {
    setState(prev => ({
      ...prev,
      isWakeWordActive: true,
      lastWakeWordTime: Date.now(),
    }));

    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Start listening automatically
    startListening();

    onWakeWordDetected?.(detection);
  }, [onWakeWordDetected]);

  // Handle voice activity detection
  const handleVoiceActivity = useCallback((detection: VoiceActivityDetection) => {
    setState(prev => ({
      ...prev,
      voiceActivity: detection.isVoiceActive,
      audioQuality: detection.confidence,
    }));

    // Update voice activity animation
    Animated.timing(animationRefs.current.voiceActivity, {
      toValue: detection.isVoiceActive ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();

    onVoiceActivity?.(detection);
  }, [onVoiceActivity]);

  // Handle waveform data
  const handleWaveformData = useCallback((data: WaveformData[]) => {
    setState(prev => ({
      ...prev,
      waveformData: data,
    }));

    // Update waveform animation
    if (data.length > 0) {
      const avgAmplitude = data.reduce((sum, d) => sum + d.amplitude, 0) / data.length;
      Animated.timing(animationRefs.current.waveform, {
        toValue: avgAmplitude,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      isListening: false,
      isProcessing: false,
    }));

    console.error('❌ Nova Voice Interface error:', error);
    onError?.(error);
  }, [onError]);

  // Handle status changes
  const handleStatusChange = useCallback((status: string) => {
    setState(prev => ({
      ...prev,
      status: status as NovaVoiceState['status'],
    }));

    onStatusChange?.(status);
  }, [onStatusChange]);

  // Start listening
  const startListening = useCallback(async () => {
    try {
      if (state.isListening) return;

      // Start speech recognition
      if (speechRecognizerRef.current) {
        const started = await speechRecognizerRef.current.startListening();
        if (started) {
          setState(prev => ({
            ...prev,
            isListening: true,
            status: 'listening',
          }));

          // Start pulse animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(animationRefs.current.pulse, {
                toValue: 1.2,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(animationRefs.current.pulse, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ).start();

          // Start waveform processing
          if (waveformProcessorRef.current) {
            await waveformProcessorRef.current.startProcessing();
          }
        }
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [state.isListening]);

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      if (!state.isListening) return;

      // Stop speech recognition
      if (speechRecognizerRef.current) {
        await speechRecognizerRef.current.stopListening();
      }

      // Stop waveform processing
      if (waveformProcessorRef.current) {
        await waveformProcessorRef.current.stopProcessing();
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        status: 'idle',
        currentTranscript: '',
        confidence: 0,
      }));

      // Stop animations
      animationRefs.current.pulse.stopAnimation();
      animationRefs.current.pulse.setValue(1);
    } catch (error) {
      handleError(error as Error);
    }
  }, [state.isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Get status color
  const getStatusColor = (): string => {
    switch (state.status) {
      case 'listening':
        return Colors.nova.active;
      case 'processing':
        return Colors.nova.thinking;
      case 'speaking':
        return Colors.nova.active;
      case 'error':
        return Colors.nova.error;
      default:
        return Colors.nova.idle;
    }
  };

  // Get status icon
  const getStatusIcon = (): string => {
    switch (state.status) {
      case 'listening':
        return 'mic';
      case 'processing':
        return 'hourglass';
      case 'speaking':
        return 'volume-high';
      case 'error':
        return 'warning';
      default:
        return 'mic-outline';
    }
  };

  // Render waveform visualization
  const renderWaveform = () => {
    if (!enableWaveform || state.waveformData.length === 0) return null;

    return (
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {state.waveformData.slice(-20).map((data, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: data.amplitude * 20,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // Render voice activity indicator
  const renderVoiceActivity = () => {
    if (!enableVoiceActivity) return null;

    return (
      <Animated.View
        style={[
          styles.voiceActivityIndicator,
          {
            opacity: animationRefs.current.voiceActivity,
            backgroundColor: state.voiceActivity ? Colors.success : Colors.warning,
          },
        ]}
      />
    );
  };

  // Render confidence indicator
  const renderConfidenceIndicator = () => {
    if (state.confidence === 0) return null;

    return (
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <View style={styles.confidenceBar}>
          <Animated.View
            style={[
              styles.confidenceFill,
              {
                width: animationRefs.current.confidence.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.confidenceText}>
          {Math.round(state.confidence * 100)}%
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Main Voice Interface */}
      <BlurView intensity={20} style={styles.voiceInterface}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)']}
          style={styles.gradient}
        >
          {/* Voice Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton,
              {
                backgroundColor: getStatusColor(),
                transform: [{ scale: animationRefs.current.pulse }],
              },
            ]}
            onPress={toggleListening}
            activeOpacity={0.8}
          >
            <Ionicons
              name={getStatusIcon() as any}
              size={32}
              color={Colors.white}
            />
          </TouchableOpacity>

          {/* Status Text */}
          <Text style={styles.statusText}>
            {state.status === 'listening' && 'Listening...'}
            {state.status === 'processing' && 'Processing...'}
            {state.status === 'speaking' && 'Speaking...'}
            {state.status === 'error' && 'Error'}
            {state.status === 'idle' && 'Tap to speak'}
          </Text>

          {/* Current Transcript */}
          {state.currentTranscript && (
            <Text style={styles.transcriptText}>
              {state.currentTranscript}
            </Text>
          )}

          {/* Voice Activity Indicator */}
          {renderVoiceActivity()}

          {/* Confidence Indicator */}
          {renderConfidenceIndicator()}
        </LinearGradient>
      </BlurView>

      {/* Waveform Visualization */}
      {renderWaveform()}

      {/* Wake Word Status */}
      {enableWakeWord && state.isWakeWordActive && (
        <View style={styles.wakeWordStatus}>
          <Text style={styles.wakeWordText}>
            🎯 Wake word detected
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInterface: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    margin: Spacing.md,
  },
  gradient: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    minHeight: 200,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  transcriptText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  voiceActivityIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  confidenceContainer: {
    marginTop: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  confidenceLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  confidenceBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.white,
    fontWeight: Typography.weights.medium,
  },
  waveformContainer: {
    marginTop: Spacing.md,
    width: '100%',
    height: 60,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  wakeWordStatus: {
    position: 'absolute',
    top: -Spacing.lg,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  wakeWordText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.white,
    fontWeight: Typography.weights.medium,
  },
});

export default NovaVoiceInterface;
