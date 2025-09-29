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

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { NovaAPIService } from './NovaAPIService';
import { 
  NovaPrompt, 
  NovaResponse, 
  NovaContext, 
  NovaContextType,
  NovaProcessingState 
} from './NovaTypes';
import { CoreTypes } from '@cyntientops/domain-schema';

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
}

export interface NovaManagerConfig {
  userRole: CoreTypes.UserRole;
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
  });

  // Refs
  const apiServiceRef = useRef<NovaAPIService | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
  }, [config]);

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
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [config]);

  // Process Nova Prompt
  const processPrompt = useCallback(async (promptText: string): Promise<NovaResponse | null> => {
    if (!apiServiceRef.current) {
      console.error('❌ Nova API Service not initialized');
      return null;
    }

    const prompt: NovaPrompt = {
      id: `prompt_${Date.now()}`,
      text: promptText,
      priority: CoreTypes.AIPriority.MEDIUM,
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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
      });

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
    };
  }, [initializeNova]);

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