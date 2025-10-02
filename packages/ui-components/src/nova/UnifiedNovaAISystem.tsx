/**
 * 🔮 Unified Nova AI System
 * Complete integration of Nova AI Brain Service with UI Components
 * Purpose: Single source of truth for all Nova AI functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Vibration, Platform } from 'react-native';
import { NovaAIBrainService, NovaPrompt, NovaResponse, NovaContext, NovaInsight, NovaAction } from '@cyntientops/business-core';
import { DatabaseManager } from '@cyntientops/database';
import { ServiceContainer } from '@cyntientops/business-core';

// Import UI Components
import { NovaAvatar } from './NovaAvatar';
import { NovaHolographicModal } from './NovaHolographicModal';
import { NovaInteractionModal } from './NovaInteractionModal';
import { useNovaVoiceRecognition } from './NovaVoiceRecognition';
import { useNovaHolographicEffects } from './NovaHolographicEffects';
import { useNovaParticleSystem } from './NovaParticleSystem';

// Types
export interface UnifiedNovaState {
  isActive: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isHolographic: boolean;
  currentContext?: NovaContext;
  lastResponse?: NovaResponse;
  conversationHistory: NovaResponse[];
  statusText: string;
  novaState: 'idle' | 'thinking' | 'speaking' | 'listening' | 'processing' | 'holographic';
  connectionStatus: 'connected' | 'disconnected' | 'error';
  emotionalState: 'calm' | 'alert' | 'thinking' | 'happy' | 'concerned';
  breathingIntensity: number;
  particleIntensity: number;
  holographicIntensity: number;
}

export interface UnifiedNovaConfig {
  enableVoice: boolean;
  enableHolographic: boolean;
  enableParticles: boolean;
  enableHaptic: boolean;
  enableSupabase: boolean;
  voiceLanguage: string;
  responseDelay: number;
  maxConversationHistory: number;
}

export interface UnifiedNovaProps {
  userId: string;
  userRole: 'worker' | 'client' | 'admin';
  currentBuilding?: any;
  currentTask?: any;
  weatherContext?: any;
  onInsightGenerated?: (insight: NovaInsight) => void;
  onActionTriggered?: (action: NovaAction) => void;
  onStateChanged?: (state: UnifiedNovaState) => void;
  config?: Partial<UnifiedNovaConfig>;
}

const DEFAULT_CONFIG: UnifiedNovaConfig = {
  enableVoice: true,
  enableHolographic: true,
  enableParticles: true,
  enableHaptic: true,
  enableSupabase: true,
  voiceLanguage: 'en-US',
  responseDelay: 1000,
  maxConversationHistory: 50
};

export const useUnifiedNovaAI = (props: UnifiedNovaProps) => {
  const {
    userId,
    userRole,
    currentBuilding,
    currentTask,
    weatherContext,
    onInsightGenerated,
    onActionTriggered,
    onStateChanged,
    config = {}
  } = props;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State
  const [state, setState] = useState<UnifiedNovaState>({
    isActive: false,
    isListening: false,
    isProcessing: false,
    isHolographic: false,
    conversationHistory: [],
    statusText: 'Nova AI Ready',
    novaState: 'idle',
    connectionStatus: 'connected',
    emotionalState: 'calm',
    breathingIntensity: 0.3,
    particleIntensity: 0.5,
    holographicIntensity: 0.7
  });

  // Refs
  const brainServiceRef = useRef<NovaAIBrainService | null>(null);
  const serviceContainerRef = useRef<ServiceContainer | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Nova AI Brain Service
  useEffect(() => {
    const initializeNovaAI = async () => {
      try {
        const serviceContainer = ServiceContainer.getInstance();
        const database = serviceContainer.database;
        
        const brainService = NovaAIBrainService.getInstance(database, {
          enableAI: finalConfig.enableSupabase,
          enableRealTime: true,
          enableAnalytics: true
        });

        brainServiceRef.current = brainService;
        serviceContainerRef.current = serviceContainer;

        setState(prev => ({
          ...prev,
          isActive: true,
          statusText: 'Nova AI Initialized',
          connectionStatus: 'connected'
        }));

        console.log('🔮 Unified Nova AI System initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Nova AI:', error);
        setState(prev => ({
          ...prev,
          connectionStatus: 'error',
          statusText: 'Nova AI Error'
        }));
      }
    };

    initializeNovaAI();
  }, [finalConfig.enableSupabase]);

  // Voice Recognition Hook
  const {
    isListening: voiceListening,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    recognizedText,
    voiceError
  } = useNovaVoiceRecognition({
    enabled: finalConfig.enableVoice,
    language: finalConfig.voiceLanguage,
    onResult: handleVoiceResult,
    onError: handleVoiceError
  });

  // Holographic Effects Hook
  const {
    isHolographic,
    holographicIntensity,
    startHolographicMode,
    stopHolographicMode,
    updateHolographicIntensity
  } = useNovaHolographicEffects({
    enabled: finalConfig.enableHolographic,
    onStateChanged: handleHolographicStateChanged
  });

  // Particle System Hook
  const {
    particleIntensity,
    startParticles,
    stopParticles,
    updateParticleIntensity
  } = useNovaParticleSystem({
    enabled: finalConfig.enableParticles,
    onStateChanged: handleParticleStateChanged
  });

  // Voice Result Handler
  function handleVoiceResult(text: string) {
    if (text.trim()) {
      processUserInput(text);
    }
  }

  // Voice Error Handler
  function handleVoiceError(error: string) {
    setState(prev => ({
      ...prev,
      statusText: `Voice Error: ${error}`,
      emotionalState: 'concerned'
    }));
  }

  // Holographic State Handler
  function handleHolographicStateChanged(newState: any) {
    setState(prev => ({
      ...prev,
      isHolographic: newState.isActive,
      holographicIntensity: newState.intensity
    }));
  }

  // Particle State Handler
  function handleParticleStateChanged(newState: any) {
    setState(prev => ({
      ...prev,
      particleIntensity: newState.intensity
    }));
  }

  // Process User Input
  const processUserInput = useCallback(async (input: string) => {
    if (!brainServiceRef.current || !input.trim()) return;

    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        novaState: 'processing',
        statusText: 'Processing your request...',
        emotionalState: 'thinking'
      }));

      // Create Nova Context
      const context: NovaContext = {
        userRole,
        userId,
        currentBuilding: currentBuilding ? {
          id: currentBuilding.id,
          name: currentBuilding.name,
          address: currentBuilding.address,
          latitude: currentBuilding.latitude,
          longitude: currentBuilding.longitude
        } : undefined,
        currentTask: currentTask ? {
          id: currentTask.id,
          name: currentTask.name,
          category: currentTask.category,
          priority: currentTask.priority,
          status: currentTask.status,
          due_date: currentTask.due_date
        } : undefined,
        weatherContext,
        timeContext: {
          timeOfDay: getTimeOfDay(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          season: getSeason()
        }
      };

      // Create Nova Prompt
      const prompt: NovaPrompt = {
        id: `prompt_${Date.now()}`,
        text: input,
        context,
        priority: 'medium',
        expectedResponseType: 'analysis',
        metadata: {
          timestamp: new Date().toISOString(),
          inputMethod: 'voice',
          userAgent: 'UnifiedNovaAI'
        }
      };

      // Process with Brain Service
      const response = await brainServiceRef.current.processPrompt(prompt);

      // Update state with response
      setState(prev => ({
        ...prev,
        isProcessing: false,
        novaState: 'speaking',
        statusText: 'Response generated',
        lastResponse: response,
        conversationHistory: [...prev.conversationHistory.slice(-finalConfig.maxConversationHistory + 1), response],
        emotionalState: response.confidence > 80 ? 'happy' : 'calm'
      }));

      // Trigger callbacks
      if (onInsightGenerated && response.insights.length > 0) {
        response.insights.forEach(insight => onInsightGenerated(insight));
      }

      if (onActionTriggered && response.actions.length > 0) {
        response.actions.forEach(action => onActionTriggered(action));
      }

      // Haptic feedback
      if (finalConfig.enableHaptic && Platform.OS === 'ios') {
        Vibration.vibrate([0, 100, 50, 100]);
      }

      // Auto-return to idle after delay
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      processingTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          novaState: 'idle',
          statusText: 'Nova AI Ready'
        }));
      }, finalConfig.responseDelay);

    } catch (error) {
      console.error('❌ Failed to process user input:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        novaState: 'idle',
        statusText: 'Processing failed',
        emotionalState: 'concerned'
      }));
    }
  }, [userRole, userId, currentBuilding, currentTask, weatherContext, onInsightGenerated, onActionTriggered, finalConfig]);

  // Start Listening
  const startListening = useCallback(() => {
    if (!finalConfig.enableVoice) return;
    
    setState(prev => ({
      ...prev,
      isListening: true,
      novaState: 'listening',
      statusText: 'Listening...',
      emotionalState: 'alert'
    }));

    startVoiceListening();
  }, [finalConfig.enableVoice, startVoiceListening]);

  // Stop Listening
  const stopListening = useCallback(() => {
    setState(prev => ({
      ...prev,
      isListening: false,
      novaState: 'idle',
      statusText: 'Nova AI Ready'
    }));

    stopVoiceListening();
  }, [stopVoiceListening]);

  // Toggle Holographic Mode
  const toggleHolographicMode = useCallback(() => {
    if (!finalConfig.enableHolographic) return;

    if (isHolographic) {
      stopHolographicMode();
      setState(prev => ({
        ...prev,
        isHolographic: false,
        novaState: 'idle'
      }));
    } else {
      startHolographicMode();
      setState(prev => ({
        ...prev,
        isHolographic: true,
        novaState: 'holographic'
      }));
    }
  }, [finalConfig.enableHolographic, isHolographic, startHolographicMode, stopHolographicMode]);

  // Update Emotional State
  const updateEmotionalState = useCallback((newState: UnifiedNovaState['emotionalState']) => {
    setState(prev => ({
      ...prev,
      emotionalState: newState,
      breathingIntensity: getBreathingIntensity(newState)
    }));
  }, []);

  // Get Breathing Intensity based on emotional state
  const getBreathingIntensity = (emotionalState: UnifiedNovaState['emotionalState']): number => {
    switch (emotionalState) {
      case 'calm': return 0.3;
      case 'alert': return 0.7;
      case 'thinking': return 0.5;
      case 'happy': return 0.6;
      case 'concerned': return 0.4;
      default: return 0.3;
    }
  };

  // Get Time of Day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // Get Season
  const getSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  // Notify state changes
  useEffect(() => {
    if (onStateChanged) {
      onStateChanged(state);
    }
  }, [state, onStateChanged]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    
    // Actions
    processUserInput,
    startListening,
    stopListening,
    toggleHolographicMode,
    updateEmotionalState,
    
    // Voice
    isListening: voiceListening,
    recognizedText,
    voiceError,
    
    // Holographic
    isHolographic,
    holographicIntensity,
    startHolographicMode,
    stopHolographicMode,
    
    // Particles
    particleIntensity,
    startParticles,
    stopParticles,
    
    // Service
    brainService: brainServiceRef.current,
    isInitialized: !!brainServiceRef.current
  };
};

// Unified Nova AI Component
export const UnifiedNovaAI: React.FC<UnifiedNovaProps> = (props) => {
  const novaAI = useUnifiedNovaAI(props);
  const { state } = novaAI;

  return (
    <>
      {/* Nova Avatar */}
      <NovaAvatar
        isActive={state.isActive}
        isListening={state.isListening}
        isProcessing={state.isProcessing}
        isHolographic={state.isHolographic}
        emotionalState={state.emotionalState}
        breathingIntensity={state.breathingIntensity}
        onPress={novaAI.toggleHolographicMode}
      />

      {/* Holographic Modal */}
      {state.isHolographic && (
        <NovaHolographicModal
          isVisible={state.isHolographic}
          intensity={state.holographicIntensity}
          onClose={() => novaAI.toggleHolographicMode()}
          response={state.lastResponse}
          onActionTriggered={props.onActionTriggered}
        />
      )}

      {/* Interaction Modal */}
      <NovaInteractionModal
        isVisible={state.isListening || state.isProcessing}
        isListening={state.isListening}
        isProcessing={state.isProcessing}
        recognizedText={novaAI.recognizedText}
        response={state.lastResponse}
        onStartListening={novaAI.startListening}
        onStopListening={novaAI.stopListening}
        onClose={() => novaAI.stopListening()}
      />
    </>
  );
};

export default UnifiedNovaAI;
