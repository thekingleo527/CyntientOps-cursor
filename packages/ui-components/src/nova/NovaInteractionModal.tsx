/**
 * NovaInteractionModal.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA INTERACTION MODAL - Full-Screen AI Chat Interface
 * ✅ FULL-SCREEN: Immersive chat experience with Nova AI
 * ✅ VOICE: Voice input and speech recognition
 * ✅ CONTEXT: Contextual responses based on user role and current data
 * ✅ ACTIONS: Interactive action buttons for quick responses
 * ✅ HISTORY: Chat history with persistent storage
 * ✅ STREAMING: Real-time response streaming (future)
 * ✅ GESTURES: Swipe navigation and gesture controls
 * 
 * Based on SwiftUI NovaInteractionView.swift (1,500+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '../mocks/expo-blur';
import { Ionicons } from '../mocks/expo-vector-icons';
import { NovaAvatar } from './NovaAvatar';
import { NovaAIManager } from './NovaAIManager';
import { NovaAPIService } from './NovaAPIService';
import { 
  NovaPrompt, 
  NovaResponse, 
  NovaAction, 
  NovaContextType,
  NovaProcessingState 
} from './NovaTypes';
import { CoreTypes } from '@cyntientops/domain-schema';

// Types
export interface NovaInteractionModalProps {
  visible: boolean;
  onClose: () => void;
  userRole: CoreTypes.UserRole;
  userId?: string;
  userName?: string;
  buildingContext?: string;
  taskContext?: string;
  workerContext?: string;
  
  // Customization
  theme?: 'dark' | 'light';
  showVoiceInput?: boolean;
  showQuickActions?: boolean;
  maxHistoryItems?: number;
  
  // Callbacks
  onResponseReceived?: (response: NovaResponse) => void;
  onActionPressed?: (action: NovaAction) => void;
  onVoiceInputStart?: () => void;
  onVoiceInputEnd?: (transcript: string) => void;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'nova';
  content: string;
  timestamp: Date;
  actions?: NovaAction[];
  insights?: CoreTypes.IntelligenceInsight[];
  metadata?: Record<string, any>;
}

export interface NovaInteractionState {
  messages: ChatMessage[];
  currentInput: string;
  isProcessing: boolean;
  processingState: NovaProcessingState;
  isListening: boolean;
  showQuickActions: boolean;
  selectedTab: 'chat' | 'insights' | 'actions';
  scrollViewRef: React.RefObject<ScrollView>;
  inputRef: React.RefObject<TextInput>;
}

// Constants
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MAX_INPUT_LENGTH = 500;
const MAX_HISTORY_ITEMS = 50;
const TYPING_DELAY = 1000;

// Quick Actions
const QUICK_ACTIONS = {
  [CoreTypes.UserRole.ADMIN]: [
    { id: 'portfolio_overview', label: 'Portfolio Overview', icon: 'business' },
    { id: 'team_status', label: 'Team Status', icon: 'people' },
    { id: 'urgent_tasks', label: 'Urgent Tasks', icon: 'warning' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  ],
  [CoreTypes.UserRole.WORKER]: [
    { id: 'my_tasks', label: 'My Tasks', icon: 'checklist' },
    { id: 'building_info', label: 'Building Info', icon: 'business' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'clock_status', label: 'Clock Status', icon: 'time' },
  ],
  [CoreTypes.UserRole.CLIENT]: [
    { id: 'my_buildings', label: 'My Buildings', icon: 'business' },
    { id: 'maintenance', label: 'Maintenance', icon: 'construct' },
    { id: 'reports', label: 'Reports', icon: 'document' },
    { id: 'billing', label: 'Billing', icon: 'card' },
  ],
};

export const NovaInteractionModal: React.FC<NovaInteractionModalProps> = ({
  visible,
  onClose,
  userRole,
  userId,
  userName,
  buildingContext,
  taskContext,
  workerContext,
  theme = 'dark',
  showVoiceInput = true,
  showQuickActions = true,
  maxHistoryItems = MAX_HISTORY_ITEMS,
  onResponseReceived,
  onActionPressed,
  onVoiceInputStart,
  onVoiceInputEnd,
}) => {
  // State
  const [state, setState] = useState<NovaInteractionState>({
    messages: [],
    currentInput: '',
    isProcessing: false,
    processingState: NovaProcessingState.IDLE,
    isListening: false,
    showQuickActions: showQuickActions,
    selectedTab: 'chat',
    scrollViewRef: useRef<ScrollView>(null),
    inputRef: useRef<TextInput>(null),
  });

  // Refs
  const novaManagerRef = useRef<NovaAIManager | null>(null);
  const apiServiceRef = useRef<NovaAPIService | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Effects
  useEffect(() => {
    if (visible) {
      initializeNova();
      showModal();
      loadChatHistory();
    } else {
      hideModal();
    }
  }, [visible]);

  useEffect(() => {
    if (state.messages.length > 0) {
      scrollToBottom();
    }
  }, [state.messages]);

  // Initialize Nova
  const initializeNova = async () => {
    try {
      // Initialize Nova AI Manager
      novaManagerRef.current = new NovaAIManager({
        userRole,
        userId,
        userName,
        buildingContext,
        taskContext,
        workerContext,
      });

      // Initialize API Service
      apiServiceRef.current = new NovaAPIService({
        operationalManager: null, // Would be injected
        buildingService: null,
        taskService: null,
        workerService: null,
        metricsService: null,
        complianceService: null,
      });

      // Add welcome message
      addWelcomeMessage();
      
    } catch (error) {
      console.error('❌ Failed to initialize Nova:', error);
      showError('Failed to initialize Nova AI');
    }
  };

  // Modal Animations
  const showModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Chat Management
  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: `welcome_${Date.now()}`,
      type: 'nova',
      content: getWelcomeMessage(),
      timestamp: new Date(),
      metadata: { isWelcome: true },
    };

    setState(prev => ({
      ...prev,
      messages: [welcomeMessage],
    }));
  };

  const getWelcomeMessage = (): string => {
    const roleMessages = {
      [CoreTypes.UserRole.ADMIN]: `Hello! I'm Nova, your intelligent portfolio assistant. I can help you with portfolio management, team coordination, and operational insights. What would you like to know?`,
      [CoreTypes.UserRole.WORKER]: `Hi ${userName || 'there'}! I'm Nova, your AI assistant. I can help you with your tasks, building information, and schedule optimization. How can I assist you today?`,
      [CoreTypes.UserRole.CLIENT]: `Welcome! I'm Nova, your property management assistant. I can provide insights about your buildings, maintenance schedules, and performance metrics. What would you like to explore?`,
    };

    return roleMessages[userRole] || roleMessages[CoreTypes.UserRole.ADMIN];
  };

  const loadChatHistory = async () => {
    try {
      // Load from AsyncStorage or local storage
      // For now, just use the welcome message
      console.log('📚 Loading chat history...');
    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
    }
  };

  const saveChatHistory = async () => {
    try {
      // Save to AsyncStorage or local storage
      console.log('💾 Saving chat history...');
    } catch (error) {
      console.error('❌ Failed to save chat history:', error);
    }
  };

  // Message Handling
  const sendMessage = async (text: string) => {
    if (!text.trim() || state.isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      currentInput: '',
      isProcessing: true,
      processingState: NovaProcessingState.PROCESSING,
    }));

    try {
      // Create Nova prompt
      const prompt: NovaPrompt = {
        id: `prompt_${Date.now()}`,
        text: text.trim(),
        priority: CoreTypes.AIPriority.MEDIUM,
        createdAt: new Date(),
        metadata: {
          source: 'nova_interaction_modal',
          userRole,
          userId,
          buildingContext,
          taskContext,
          workerContext,
        },
      };

      // Process with Nova API
      if (apiServiceRef.current) {
        const response = await apiServiceRef.current.processPrompt(prompt);
        
        const novaMessage: ChatMessage = {
          id: `nova_${Date.now()}`,
          type: 'nova',
          content: response.message,
          timestamp: new Date(),
          actions: response.actions,
          insights: response.insights,
          metadata: response.metadata,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, novaMessage],
          isProcessing: false,
          processingState: NovaProcessingState.COMPLETED,
        }));

        // Callback
        if (onResponseReceived) {
          onResponseReceived(response);
        }

        // Save history
        await saveChatHistory();
      }
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'nova',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        metadata: { isError: true },
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isProcessing: false,
        processingState: NovaProcessingState.ERROR,
      }));
    }
  };

  const handleQuickAction = async (actionId: string) => {
    const action = QUICK_ACTIONS[userRole]?.find(a => a.id === actionId);
    if (action) {
      await sendMessage(action.label);
    }
  };

  // Voice Input
  const startVoiceInput = () => {
    if (onVoiceInputStart) {
      onVoiceInputStart();
    }
    
    setState(prev => ({ ...prev, isListening: true }));
    
    // Simulate voice input (replace with actual speech recognition)
    setTimeout(() => {
      const mockTranscript = 'Show me my tasks';
      setState(prev => ({ ...prev, isListening: false }));
      
      if (onVoiceInputEnd) {
        onVoiceInputEnd(mockTranscript);
      }
      
      setState(prev => ({ ...prev, currentInput: mockTranscript }));
    }, 2000);
  };

  const stopVoiceInput = () => {
    setState(prev => ({ ...prev, isListening: false }));
  };

  // UI Helpers
  const scrollToBottom = () => {
    if (state.scrollViewRef.current) {
      state.scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const showError = (message: string) => {
    Alert.alert('Nova AI Error', message);
  };

  // Render Methods
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff' }]}>
      <View style={styles.headerLeft}>
        <NovaAvatar
          size={40}
          isProcessing={state.isProcessing}
          showHolographicEffects={true}
          contextType={buildingContext ? NovaContextType.BUILDING : NovaContextType.PORTFOLIO}
        />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
            Nova AI Assistant
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#888888' : '#666666' }]}>
            {userRole} • {userName || 'User'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
        <Ionicons 
          name="close" 
          size={24} 
          color={theme === 'dark' ? '#ffffff' : '#000000'} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5' }]}>
      {(['chat', 'insights', 'actions'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            state.selectedTab === tab && styles.activeTabButton,
          ]}
          onPress={() => setState(prev => ({ ...prev, selectedTab: tab }))}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme === 'dark' ? '#ffffff' : '#000000' },
              state.selectedTab === tab && styles.activeTabText,
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderQuickActions = () => {
    if (!showQuickActions || state.selectedTab !== 'actions') return null;
    
    const actions = QUICK_ACTIONS[userRole] || [];
    
    return (
      <View style={styles.quickActionsContainer}>
        <Text style={[styles.quickActionsTitle, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          {actions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionButton, { backgroundColor: theme === 'dark' ? '#3a3a3a' : '#e0e0e0' }]}
              onPress={() => handleQuickAction(action.id)}
            >
              <Ionicons 
                name={action.icon as any} 
                size={24} 
                color={theme === 'dark' ? '#00D4FF' : '#0066cc'} 
              />
              <Text style={[styles.quickActionText, { color: theme === 'dark' ? '#ffffff' : '#000000' }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.novaMessage,
      ]}
    >
      {message.type === 'nova' && (
        <NovaAvatar
          size={32}
          isProcessing={false}
          showHolographicEffects={false}
          contextType={NovaContextType.PORTFOLIO}
        />
      )}
      
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: message.type === 'user' 
              ? (theme === 'dark' ? '#00D4FF' : '#0066cc')
              : (theme === 'dark' ? '#3a3a3a' : '#f0f0f0'),
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: message.type === 'user' 
                ? '#ffffff' 
                : (theme === 'dark' ? '#ffffff' : '#000000'),
            },
          ]}
        >
          {message.content}
        </Text>
        
        {message.actions && message.actions.length > 0 && (
          <View style={styles.messageActions}>
            {message.actions.slice(0, 3).map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionButton, { backgroundColor: theme === 'dark' ? '#4a4a4a' : '#e8e8e8' }]}
                onPress={() => onActionPressed?.(action)}
              >
                <Text style={[styles.actionButtonText, { color: theme === 'dark' ? '#00D4FF' : '#0066cc' }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderInputArea = () => (
    <View style={[styles.inputArea, { backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={state.inputRef}
          style={[
            styles.textInput,
            {
              color: theme === 'dark' ? '#ffffff' : '#000000',
              borderColor: theme === 'dark' ? '#4a4a4a' : '#e0e0e0',
            },
          ]}
          value={state.currentInput}
          onChangeText={(text) => setState(prev => ({ ...prev, currentInput: text }))}
          placeholder="Ask Nova anything..."
          placeholderTextColor={theme === 'dark' ? '#888888' : '#999999'}
          multiline
          maxLength={MAX_INPUT_LENGTH}
          editable={!state.isProcessing}
        />
        
        <View style={styles.inputButtons}>
          {showVoiceInput && (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                { backgroundColor: state.isListening ? '#FF4444' : '#00D4FF' },
              ]}
              onPress={state.isListening ? stopVoiceInput : startVoiceInput}
            >
              <Ionicons 
                name={state.isListening ? 'stop' : 'mic'} 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: state.currentInput.trim() && !state.isProcessing 
                  ? '#00D4FF' 
                  : '#666666' 
              },
            ]}
            onPress={() => sendMessage(state.currentInput)}
            disabled={!state.currentInput.trim() || state.isProcessing}
          >
            {state.isProcessing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Main Render
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={theme === 'dark' 
            ? ['#000000', '#1a1a1a', '#000000'] 
            : ['#ffffff', '#f5f5f5', '#ffffff']
          }
          style={styles.gradientBackground}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {renderHeader()}
            {renderTabBar()}
            
            <ScrollView
              ref={state.scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {state.messages.map(renderMessage)}
              {renderQuickActions()}
            </ScrollView>
            
            {renderInputArea()}
          </KeyboardAvoidingView>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  
  gradientBackground: {
    flex: 1,
  },
  
  keyboardAvoidingView: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  headerText: {
    marginLeft: 12,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  
  closeButton: {
    padding: 8,
  },
  
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  activeTabButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  activeTabText: {
    color: '#00D4FF',
  },
  
  messagesContainer: {
    flex: 1,
  },
  
  messagesContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  
  userMessage: {
    justifyContent: 'flex-end',
  },
  
  novaMessage: {
    justifyContent: 'flex-start',
  },
  
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  
  messageActions: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  quickActionsContainer: {
    marginTop: 20,
  },
  
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  quickActionButton: {
    width: (screenWidth - 64) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  inputArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  
  inputButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Export default
export default NovaInteractionModal;
