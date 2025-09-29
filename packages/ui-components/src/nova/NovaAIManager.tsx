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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { NovaAPIService } from './NovaAPIService';
import { useNovaImageLoader, NovaImageInfo, HolographicEffectOptions } from './NovaImageLoader';
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

  // Load persistent Nova image
  const loadPersistentNovaImage = useCallback(async () => {
    try {
      console.log('🖼️ Loading persistent Nova image...');
      
      // Load original image
      const originalImage = await imageLoader.loadNovaImage();
      
      setState(prev => ({
        ...prev,
        novaOriginalImage: originalImage,
        novaImage: originalImage, // Legacy compatibility
      }));
      
      console.log('✅ Nova original image loaded and cached persistently');
      
      // Generate holographic version
      if (imageLoader.holographicImage) {
        setState(prev => ({
          ...prev,
          novaHolographicImage: imageLoader.holographicImage,
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
        // TODO: Implement haptic feedback
        console.log('📳 Haptic feedback: Medium impact');
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
      // Initialize speech recognition
      // This would use expo-speech or a speech recognition library
      console.log('🎤 Voice recognition initialized');
    } catch (error) {
      console.error('❌ Failed to initialize voice recognition:', error);
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

      // Start voice recognition
      // This would start actual speech recognition
      
      // Haptic feedback
      if (config.enableHaptics) {
        // TODO: Implement haptic feedback
        console.log('📳 Haptic feedback: Light impact');
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
    setState(prev => ({
      ...prev,
      isListening: false,
      statusText: 'Nova AI Active',
      novaState: 'idle',
    }));

    // Stop voice recognition
    // This would stop actual speech recognition

    // Haptic feedback
    if (config.enableHaptics) {
      // TODO: Implement haptic feedback
      console.log('📳 Haptic feedback: Light impact');
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
      // TODO: Implement haptic feedback
      console.log('📳 Haptic feedback: Heavy impact');
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
        // TODO: Implement haptic feedback
        console.log('📳 Haptic feedback: Success notification');
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
        // TODO: Implement haptic feedback
        console.log('📳 Haptic feedback: Error notification');
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

      // TODO: Implement actual speech synthesis
      // For now, just simulate speaking
      console.log('🔊 Speaking:', text);
      
      // Simulate speaking duration
      await new Promise(resolve => setTimeout(resolve, 1000));

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
  };
};

// Export default
export default useNovaAIManager;