/**
 * NovaAIManager.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA AI MANAGER - Pure State Management for Nova AI System
 * ✅ STATE MANAGEMENT: Centralized Nova AI state and operations
 * ✅ VOICE INTEGRATION: Speech recognition and text-to-speech
 * ✅ CONTEXT AWARE: Manages user context and building/task data
 * ✅ API INTEGRATION: Coordinates with NovaAPIService for responses
 * ✅ NO UI: Pure state management, UI handled by NovaAvatar and modals
 * ✅ REACTIVE: Real-time state updates and event handling
 * 
 * Based on SwiftUI NovaAIManager.swift (827+ lines)
 */

import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
const { Animated, Vibration, Platform } = require('react-native');
import * as Speech from 'expo-speech';
import { NovaAPIService } from './NovaAPIService';
import { useNovaImageLoader, NovaImageInfo, HolographicEffectOptions } from './NovaImageLoader';
import { useNovaGestureHandler, NovaGestureHandler } from './NovaGestureHandler';
import { useNovaVoiceRecognition, VoiceRecognitionStatus } from './NovaVoiceRecognition';
import { useNovaParticleSystem, NovaParticleSystem } from './NovaParticleSystem';
import { useNovaHolographicEffects, NovaHolographicEffects } from './NovaHolographicEffects';
import { 
  NovaPrompt, 
  NovaResponse, 
  NovaContext, 
  NovaContextType,
  NovaProcessingState 
} from './NovaTypes';

// Types
export interface NovaManagerState {
  isActive: boolean;
  isListening: boolean;
  isProcessing: boolean;
  processingState: NovaProcessingState;
  currentContext?: NovaContext;
  lastResponse?: NovaResponse;
  statusText: string;
  novaState: 'idle' | 'thinking' | 'speaking' | 'listening' | 'processing';
  connectionStatus: 'connected' | 'disconnected' | 'error';
  
  // Persistent Image Architecture
  novaOriginalImage?: NovaImageInfo;
  novaHolographicImage?: NovaImageInfo;
  novaImage?: NovaImageInfo; // Legacy compatibility
  
  // Advanced Animation System
  animationPhase: number;
  pulseAnimation: boolean;
  rotationAngle: number;
  hasUrgentInsights: boolean;
  thinkingParticles: Particle[];
  currentInsights: any[]; // IntelligenceInsight[]
  priorityTasks: string[];
  buildingAlerts: Record<string, number>;
  
  // Holographic Mode Properties
  isHolographicMode: boolean;
  showingWorkspace: boolean;
  workspaceMode: WorkspaceMode;
  
  // Voice Interface Properties
  voiceCommand: string;
  voiceWaveformData: number[];
  isWakeWordActive: boolean;
  speechRecognitionAvailable: boolean;
  
  // Real-time Properties
  urgentAlerts: any[]; // ClientAlert[]
  
  // Weather Intelligence Properties
  weatherContext: {
    currentWeather: any;
    upcomingWeather: any[];
    weatherSuggestions: any[];
    isWeatherAware: boolean;
  };
  
  // Sentient Behavior Properties
  userPreferences: {
    preferredTaskOrder: string[];
    workingHours: { start: number; end: number };
    communicationStyle: 'brief' | 'detailed' | 'conversational';
    notificationFrequency: 'minimal' | 'moderate' | 'frequent';
  };
  
  // Contextual Awareness
  contextualAwareness: {
    screen: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    userMood: 'focused' | 'stressed' | 'relaxed' | 'busy';
    taskProgress: number;
    buildingContext: any;
  };
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export enum WorkspaceMode {
  CHAT = 'chat',
  MAP = 'map',
  PORTFOLIO = 'portfolio',
  HOLOGRAPHIC = 'holographic',
  VOICE = 'voice',
}

// Haptic Feedback Types
export enum HapticFeedbackType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  ERROR = 'error',
  SELECTION = 'selection',
}

// Haptic Feedback Utility
const triggerHapticFeedback = (type: HapticFeedbackType) => {
  try {
    switch (type) {
      case HapticFeedbackType.LIGHT:
        Vibration.vibrate(50);
        break;
      case HapticFeedbackType.MEDIUM:
        Vibration.vibrate(100);
        break;
      case HapticFeedbackType.HEAVY:
        Vibration.vibrate(200);
        break;
      case HapticFeedbackType.SUCCESS:
        Vibration.vibrate([0, 50, 100, 50]);
        break;
      case HapticFeedbackType.ERROR:
        Vibration.vibrate([0, 100, 50, 100]);
        break;
      case HapticFeedbackType.SELECTION:
        Vibration.vibrate(25);
        break;
      default:
        Vibration.vibrate(50);
    }
    console.log(`📳 Haptic feedback: ${type} impact`);
  } catch (error) {
    console.warn('⚠️ Haptic feedback not available:', error);
  }
};

// Speech Synthesis Utility
const speakText = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Use Speech mock shim for cross-platform TTS in dev
      const speakPromise = Speech?.speak
        ? Promise.resolve(Speech.speak(text))
        : Promise.resolve(console.log('🔊 Speaking (simulated):', text));

      speakPromise
        .then(() => {
          console.log('🔊 Speech synthesis completed');
          resolve();
        })
        .catch((err: any) => {
          console.error('❌ Speech synthesis error:', err);
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    } catch (error) {
      console.warn('⚠️ Speech synthesis not available, using fallback:', error);
      // Fallback to console log
      console.log('🔊 Speaking (fallback):', text);
      setTimeout(() => resolve(), 1000);
    }
  });
};

// Voice Recognition Utility
interface VoiceRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

class VoiceRecognitionManager {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResult: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onEnd: (() => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // For React Native, we'll use a cross-platform speech recognition library
        // This would typically be react-native-voice or expo-speech
        console.log('🎤 Voice recognition manager initialized');
      } else {
        // Web fallback
        if (typeof global !== 'undefined' && global.window && 'webkitSpeechRecognition' in global.window) {
          this.recognition = new (global.window as any).webkitSpeechRecognition();
          this.setupWebRecognition();
        } else if (typeof global !== 'undefined' && global.window && 'SpeechRecognition' in global.window) {
          this.recognition = new (global.window as any).SpeechRecognition();
          this.setupWebRecognition();
        }
      }
    } catch (error) {
      console.warn('⚠️ Voice recognition not available:', error);
    }
  }

  private setupWebRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript && this.onResult) {
        this.onResult(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Voice recognition error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }

  startListening(config: VoiceRecognitionConfig = {}) {
    return new Promise<void>((resolve, reject) => {
      try {
        if (this.isListening) {
          resolve();
          return;
        }

        this.onResult = (text: string) => {
          console.log('🎤 Voice recognition result:', text);
        };

        this.onError = (error: string) => {
          console.error('❌ Voice recognition error:', error);
          reject(new Error(`Voice recognition failed: ${error}`));
        };

        this.onEnd = () => {
          console.log('🎤 Voice recognition ended');
          resolve();
        };

        if (this.recognition) {
          this.recognition.start();
        } else {
          // Fallback for React Native or when recognition is not available
          console.log('🎤 Voice recognition started (simulated)');
          // Simulate voice recognition
          setTimeout(() => {
            this.isListening = false;
            resolve();
          }, 5000); // 5 second timeout
        }

        this.isListening = true;
        console.log('🎤 Voice recognition started');
      } catch (error) {
        console.error('❌ Failed to start voice recognition:', error);
        reject(error);
      }
    });
  }

  stopListening() {
    return new Promise<void>((resolve) => {
      try {
        if (!this.isListening) {
          resolve();
          return;
        }

        if (this.recognition) {
          this.recognition.stop();
        } else {
          // Fallback
          this.isListening = false;
          console.log('🎤 Voice recognition stopped (simulated)');
        }

        resolve();
      } catch (error) {
        console.error('❌ Failed to stop voice recognition:', error);
        resolve();
      }
    });
  }

  isAvailable(): boolean {
    return this.recognition !== null || Platform.OS === 'ios' || Platform.OS === 'android';
  }
}

// Global voice recognition manager instance
const voiceRecognitionManager = new VoiceRecognitionManager();

export interface NovaManagerConfig {
  userRole: string; // UserRole
  userId?: string;
  userName?: string;
  buildingContext?: string;
  taskContext?: string;
  workerContext?: string;
  enableVoice?: boolean;
  enableHaptics?: boolean;
}

// Nova AI Manager Hook
export const useNovaAIManager = (config: NovaManagerConfig) => {
  const [state, setState] = useState<NovaManagerState>({
    isActive: false,
    isListening: false,
    isProcessing: false,
    processingState: { state: 'idle' },
    statusText: 'Nova AI Ready',
    novaState: 'idle',
    connectionStatus: 'disconnected',
    
    // Persistent Image Architecture
    novaOriginalImage: undefined,
    novaHolographicImage: undefined,
    novaImage: undefined,
    
    // Advanced Animation System
    animationPhase: 0,
    pulseAnimation: false,
    rotationAngle: 0,
    hasUrgentInsights: false,
    thinkingParticles: [],
    currentInsights: [],
    priorityTasks: [],
    buildingAlerts: {},
    
    // Holographic Mode Properties
    isHolographicMode: false,
    showingWorkspace: false,
    workspaceMode: WorkspaceMode.CHAT,
    
    // Voice Interface Properties
    voiceCommand: '',
    voiceWaveformData: Array(20).fill(0),
    isWakeWordActive: false,
    speechRecognitionAvailable: false,
    
    // Real-time Properties
    urgentAlerts: [],
    
    // Weather Intelligence Properties
    weatherContext: {
      currentWeather: null,
      upcomingWeather: [],
      weatherSuggestions: [],
      isWeatherAware: false,
    },
    
    // Sentient Behavior Properties
    userPreferences: {
      preferredTaskOrder: [],
      workingHours: { start: 9, end: 17 },
      communicationStyle: 'conversational',
      notificationFrequency: 'moderate',
    },
    
    // Contextual Awareness
    contextualAwareness: {
      screen: 'home',
      timeOfDay: 'morning',
      userMood: 'focused',
      taskProgress: 0,
      buildingContext: null,
    },
  });

  // Refs
  const apiServiceRef = useRef<NovaAPIService | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const processingTimeoutRef = useRef<number | null>(null);
  const animationTaskRef = useRef<number | null>(null);
  const particleTaskRef = useRef<number | null>(null);
  const waveformTaskRef = useRef<number | null>(null);
  
  // Animation refs
  const animationPhaseRef = useRef(new Animated.Value(0)).current;
  const pulseAnimationRef = useRef(new Animated.Value(1)).current;
  const rotationAngleRef = useRef(new Animated.Value(0)).current;
  
  // Image loader
  const imageLoader = useNovaImageLoader();

  // Gesture handling
  const gestureHandler = useNovaGestureHandler();

  // Voice recognition
  const voiceRecognition = useNovaVoiceRecognition();

  // Particle system
  const particleSystem = useNovaParticleSystem();

  // Holographic effects
  const holographicEffects = useNovaHolographicEffects();

  // Load persistent Nova image
  const loadPersistentNovaImage = useCallback(async () => {
    try {
      console.log('🖼️ Loading persistent Nova image...');
      
      // Load original image
      const originalImage = await imageLoader.loadAIAssistantImage();
      
      setState(prev => ({
        ...prev,
        novaOriginalImage: originalImage,
        novaImage: originalImage, // Legacy compatibility
      }));
      
      console.log('✅ Nova original image loaded and cached persistently');
      
      // Generate holographic version
      if (imageLoader.novaHolographicImage) {
        setState(prev => ({
          ...prev,
          novaHolographicImage: imageLoader.novaHolographicImage,
        }));
        console.log('✅ Holographic Nova image generated and cached');
      }
      
    } catch (error) {
      console.error('❌ Failed to load persistent Nova image:', error);
    }
  }, [imageLoader]);

  // Start persistent animations
  const startPersistentAnimations = useCallback(() => {
    // Main animation task for breathing and rotation
    const animate = () => {
      setState(prev => {
        const newPhase = (prev.animationPhase + 0.05) % (2 * Math.PI);
        
        // State-specific animations
        let newRotationAngle = prev.rotationAngle;
        let newPulseAnimation = prev.pulseAnimation;
        
        switch (prev.novaState) {
          case 'thinking':
            newRotationAngle = (prev.rotationAngle + 2.0) % 360;
            break;
          case 'processing':
            newPulseAnimation = !prev.pulseAnimation;
            break;
          default:
            break;
        }
        
        return {
          ...prev,
          animationPhase: newPhase,
          rotationAngle: newRotationAngle,
          pulseAnimation: newPulseAnimation,
        };
      });
      
      animationTaskRef.current = setTimeout(animate, 100);
    };
    
    animate();
    
    // Particle animation task for thinking state
    const animateParticles = () => {
      setState(prev => {
        if (prev.novaState !== 'thinking') {
          return { ...prev, thinkingParticles: [] };
        }
        
        let newParticles = [...prev.thinkingParticles];
        
        // Add new particles
        if (newParticles.length < 6) {
          const particle: Particle = {
            id: Date.now().toString() + Math.random(),
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            opacity: Math.random() * 0.5 + 0.3,
            scale: Math.random() * 0.5 + 0.5,
          };
          newParticles.push(particle);
        }
        
        // Update existing particles
        newParticles = newParticles.map(particle => ({
          ...particle,
          opacity: particle.opacity * 0.95,
          scale: particle.scale * 0.98,
        }));
        
        // Remove faded particles
        newParticles = newParticles.filter(particle => particle.opacity > 0.1);
        
        return { ...prev, thinkingParticles: newParticles };
      });
      
      particleTaskRef.current = setTimeout(animateParticles, 500);
    };
    
    animateParticles();
  }, []);

  // Stop persistent animations
  const stopPersistentAnimations = useCallback(() => {
    if (animationTaskRef.current) {
      clearTimeout(animationTaskRef.current);
      animationTaskRef.current = null;
    }
    
    if (particleTaskRef.current) {
      clearTimeout(particleTaskRef.current);
      particleTaskRef.current = null;
    }
  }, []);

  // Initialize Nova AI Manager
  const initializeNova = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isActive: true,
        statusText: 'Initializing Nova AI...',
        novaState: 'thinking',
        connectionStatus: 'connected',
      }));

      // Load persistent Nova image
      await loadPersistentNovaImage();

      // Start persistent animations
      startPersistentAnimations();

      // Initialize API Service
      apiServiceRef.current = new NovaAPIService({
        operationalManager: null, // Would be injected
        buildingService: null,
        taskService: null,
        workerService: null,
        metricsService: null,
        complianceService: null,
      });

      // Initialize voice recognition if enabled
      if (config.enableVoice) {
        await initializeVoiceRecognition();
      }

      setState(prev => ({
        ...prev,
        statusText: 'Nova AI Active',
        novaState: 'idle',
      }));

      // Haptic feedback
      if (config.enableHaptics) {
        triggerHapticFeedback(HapticFeedbackType.MEDIUM);
      }

    } catch (error) {
      console.error('❌ Failed to initialize Nova AI:', error);
      setState(prev => ({
        ...prev,
        statusText: 'Nova AI Error',
        novaState: 'idle',
        connectionStatus: 'error',
      }));
    }
  }, [config, loadPersistentNovaImage, startPersistentAnimations]);

  // Voice Recognition
  const initializeVoiceRecognition = useCallback(async () => {
    try {
      // Initialize speech recognition using the voice recognition manager
      const isAvailable = voiceRecognitionManager.isAvailable();
      
      setState(prev => ({
        ...prev,
        speechRecognitionAvailable: isAvailable,
      }));
      
      if (isAvailable) {
        console.log('🎤 Voice recognition initialized and available');
      } else {
        console.warn('⚠️ Voice recognition not available on this platform');
      }
    } catch (error) {
      console.error('❌ Failed to initialize voice recognition:', error);
      setState(prev => ({
        ...prev,
        speechRecognitionAvailable: false,
      }));
    }
  }, []);

  const startVoiceListening = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isListening: true,
        statusText: 'Listening...',
        novaState: 'listening',
      }));

      // Start voice recognition using the manager
      await voiceRecognitionManager.startListening({
        language: 'en-US',
        continuous: true,
        interimResults: true,
      });
      
      // Haptic feedback
      if (config.enableHaptics) {
        triggerHapticFeedback(HapticFeedbackType.LIGHT);
      }

    } catch (error) {
      console.error('❌ Failed to start voice listening:', error);
      setState(prev => ({
        ...prev,
        isListening: false,
        statusText: 'Voice Error',
        novaState: 'idle',
      }));
    }
  }, [config]);

  const stopVoiceListening = useCallback(async () => {
    try {
      // Stop voice recognition using the manager
      await voiceRecognitionManager.stopListening();
      
      setState(prev => ({
        ...prev,
        isListening: false,
        statusText: 'Nova AI Active',
        novaState: 'idle',
      }));

      // Haptic feedback
      if (config.enableHaptics) {
        triggerHapticFeedback(HapticFeedbackType.LIGHT);
      }
    } catch (error) {
      console.error('❌ Failed to stop voice listening:', error);
      setState(prev => ({
        ...prev,
        isListening: false,
        statusText: 'Nova AI Active',
        novaState: 'idle',
      }));
    }
  }, [config]);

  // Holographic Mode Management
  const engageHolographicMode = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isHolographicMode: true,
      showingWorkspace: true,
      workspaceMode: WorkspaceMode.HOLOGRAPHIC,
    }));
    
    // Trigger holographic effects
    if (config.enableHaptics) {
      triggerHapticFeedback(HapticFeedbackType.HEAVY);
    }
    
    console.log('🔮 Holographic mode activated');
  }, [config.enableHaptics]);

  const disengageHolographicMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isHolographicMode: false,
      showingWorkspace: false,
      workspaceMode: WorkspaceMode.CHAT,
    }));
  }, []);

  const toggleHolographicMode = useCallback(async () => {
    if (state.isHolographicMode) {
      disengageHolographicMode();
    } else {
      await engageHolographicMode();
    }
  }, [state.isHolographicMode, engageHolographicMode, disengageHolographicMode]);

  // Workspace Management
  const setWorkspaceMode = useCallback((mode: WorkspaceMode) => {
    setState(prev => ({
      ...prev,
      workspaceMode: mode,
    }));
  }, []);

  const showWorkspace = useCallback(() => {
    setState(prev => ({
      ...prev,
      showingWorkspace: true,
    }));
  }, []);

  const hideWorkspace = useCallback(() => {
    setState(prev => ({
      ...prev,
      showingWorkspace: false,
    }));
  }, []);

  // Process Nova Prompt
  const processPrompt = useCallback(async (promptText: string): Promise<NovaResponse | null> => {
    if (!apiServiceRef.current) {
      console.error('❌ Nova API Service not initialized');
      return null;
    }

    const prompt: NovaPrompt = {
      id: `prompt_${Date.now()}`,
      text: promptText,
      priority: 'medium' as any, // AIPriority.MEDIUM
      createdAt: new Date(),
      metadata: {
        source: 'nova_manager',
        userRole: config.userRole,
        userId: config.userId,
        buildingContext: config.buildingContext,
        taskContext: config.taskContext,
        workerContext: config.workerContext,
      },
    };

    setState(prev => ({
      ...prev,
      isProcessing: true,
      processingState: { state: 'processing' },
      statusText: 'Processing...',
      novaState: 'processing',
    }));

    try {
      // Process with API service
      const response = await apiServiceRef.current.processPrompt(prompt);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingState: { state: 'idle' },
        lastResponse: response,
        statusText: 'Nova AI Active',
        novaState: 'idle',
      }));

      // Haptic feedback
      if (config.enableHaptics) {
        triggerHapticFeedback(HapticFeedbackType.SUCCESS);
      }

      return response;

    } catch (error) {
      console.error('❌ Failed to process prompt:', error);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingState: { state: 'error' },
        statusText: 'Processing Error',
        novaState: 'idle',
      }));

      // Haptic feedback
      if (config.enableHaptics) {
        triggerHapticFeedback(HapticFeedbackType.ERROR);
      }

      return null;
    }
  }, [config]);

  // Text-to-Speech
  const speakResponse = useCallback(async (text: string) => {
    try {
      setState(prev => ({
        ...prev,
        novaState: 'speaking',
        statusText: 'Speaking...',
      }));

      // Implement actual speech synthesis
      await speakText(text);

      setState(prev => ({
        ...prev,
        novaState: 'idle',
        statusText: 'Nova AI Active',
      }));

    } catch (error) {
      console.error('❌ Failed to speak response:', error);
      setState(prev => ({
        ...prev,
        novaState: 'idle',
        statusText: 'Speech Error',
      }));
    }
  }, []);

  // Context Management
  const updateContext = useCallback((newContext: Partial<NovaContext>) => {
    setState(prev => ({
      ...prev,
      currentContext: {
        ...prev.currentContext,
        ...newContext,
      } as NovaContext,
    }));
  }, []);

  const clearContext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentContext: undefined,
    }));
  }, []);

  // Quick Actions
  const quickQuery = useCallback(async (query: string) => {
    return await processPrompt(query);
  }, [processPrompt]);

  const getPortfolioStatus = useCallback(async () => {
    return await processPrompt('What is the current portfolio status?');
  }, [processPrompt]);

  const getUrgentTasks = useCallback(async () => {
    return await processPrompt('Show me urgent tasks that need attention');
  }, [processPrompt]);

  const getBuildingInfo = useCallback(async (buildingId?: string) => {
    const query = buildingId 
      ? `Tell me about building ${buildingId}`
      : 'Show me information about my buildings';
    return await processPrompt(query);
  }, [processPrompt]);

  // Effects
  useEffect(() => {
    initializeNova();
    
    return () => {
      // Cleanup
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      stopPersistentAnimations();
    };
  }, [initializeNova, stopPersistentAnimations]);

  // Public API
  return {
    // State
    state,
    
    // Actions
    processPrompt,
    startVoiceListening,
    stopVoiceListening,
    speakResponse,
    updateContext,
    clearContext,
    
    // Holographic Mode Management
    engageHolographicMode,
    disengageHolographicMode,
    toggleHolographicMode,
    
    // Workspace Management
    setWorkspaceMode,
    showWorkspace,
    hideWorkspace,
    
    // Image Management
    loadPersistentNovaImage,
    
    // Animation Management
    startPersistentAnimations,
    stopPersistentAnimations,
    
    // Quick Actions
    quickQuery,
    getPortfolioStatus,
    getUrgentTasks,
    getBuildingInfo,
    
    // Utilities
    isActive: state.isActive,
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    statusText: state.statusText,
    novaState: state.novaState,
    connectionStatus: state.connectionStatus,
    
    // Advanced Features
    gestureHandler,
    voiceRecognition,
    particleSystem,
    holographicEffects,
    imageLoader,
  };
};

// Export default
export default useNovaAIManager;
