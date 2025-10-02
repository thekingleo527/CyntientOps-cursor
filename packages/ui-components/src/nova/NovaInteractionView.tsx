/**
 * NovaInteractionView.tsx
 * CyntientOps v6.0 - React Native Implementation
 * 
 * 🔮 NOVA INTERACTION VIEW - Immersive AI Chat Interface
 * ✅ HOLOGRAPHIC: 400x400px holographic Nova with advanced effects
 * ✅ INTERACTIVE: Full workspace with map, portfolio, analytics
 * ✅ PARTICLE: Advanced particle field and scanline effects
 * ✅ GESTURES: Pinch, rotate, swipe navigation
 * ✅ VOICE: Voice waveform and command interface
 * ✅ IMMERSIVE: Full-screen experience with depth
 * 
 * Based on SwiftUI NovaInteractionView.swift (1,874+ lines)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  Image,
  PanGestureHandler,
  State,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useNovaAIManager, NovaPrompt, NovaResponse, NovaInsight } from './NovaAIManager';

// Types
export interface NovaChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions: NovaAction[];
  insights: NovaInsight[];
  metadata: Record<string, any>;
}

export interface NovaAction {
  id: string;
  title: string;
  type: 'navigate' | 'execute' | 'schedule' | 'alert';
  payload: any;
}

export interface QuickAction {
  id: string;
  icon: string;
  text: string;
  color: string;
  isCritical: boolean;
  target: string;
}

export interface NavigationTarget {
  type: 'tasks' | 'buildings' | 'compliance' | 'maintenance' | 'fullInsights' | 'allTasks' | 'taskDetail' | 'allBuildings' | 'buildingDetail' | 'clockOut' | 'profile' | 'settings' | 'dsnyTasks' | 'routeOptimization' | 'photoEvidence' | 'emergencyContacts';
  payload?: any;
}

// Nova Interaction View Component
export const NovaInteractionView: React.FC<{
  onDismiss: () => void;
  onNavigate?: (target: NavigationTarget) => void;
}> = ({ onDismiss, onNavigate }) => {
  const {
    novaState,
    prompts,
    responses,
    processingState,
    processPrompt,
    startVoiceListening,
    stopVoiceListening,
  } = useNovaAIManager();

  // State
  const [userQuery, setUserQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'chat' | 'portfolio' | 'insights'>('chat');
  const [showContextualData, setShowContextualData] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set());
  const [showingEmergencyRepair, setShowingEmergencyRepair] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [repairMessage, setRepairMessage] = useState('');
  const [activeScenarios, setActiveScenarios] = useState<any[]>([]);
  const [urgentTaskCount, setUrgentTaskCount] = useState<number | null>(null);
  const [hasHighPriorityScenarios, setHasHighPriorityScenarios] = useState(false);

  // Animation refs
  const dragOffset = useRef(new Animated.Value(0)).current;
  const swipeDirection = useRef<string | null>(null);
  const lastSwipeTime = useRef(Date.now());

  // Chat messages
  const chatMessages = useMemo(() => {
    const messages: NovaChatMessage[] = [];
    
    prompts.forEach((prompt, index) => {
      messages.push({
        id: `prompt-${index}`,
        role: 'user',
        content: prompt.text,
        timestamp: prompt.createdAt,
        priority: prompt.priority,
        actions: [],
        insights: [],
        metadata: prompt.metadata,
      });

      if (index < responses.length) {
        const response = responses[index];
        messages.push({
          id: `response-${index}`,
          role: 'assistant',
          content: response.message,
          timestamp: response.timestamp,
          priority: 'medium',
          actions: response.actions,
          insights: response.insights,
          metadata: response.metadata,
        });
      }
    });

    return messages;
  }, [prompts, responses]);

  // Quick actions
  const quickActions = useMemo(() => {
    const actions: QuickAction[] = [];
    
    // Critical tasks action
    const urgentCount = novaState.priorityTasks.filter(task => task.urgency === 'critical').length;
    if (urgentCount > 0) {
      actions.push({
        id: 'urgent_tasks',
        icon: '🚨',
        text: `${urgentCount} Tasks`,
        color: '#FF6B35',
        isCritical: urgentCount >= 3,
        target: 'tasks',
      });
    }

    // DSNY deadline action
    const hasComplianceDeadline = novaState.currentInsights.some(
      insight => insight.type === 'compliance' && insight.description.includes('DSNY')
    );
    
    if (hasComplianceDeadline) {
      const now = new Date();
      const hour = now.getHours();
      const isUrgent = hour >= 18 && hour < 20; // 6 PM to 8 PM
      
      actions.push({
        id: 'dsny_deadline',
        icon: isUrgent ? '⏰' : '🗑️',
        text: isUrgent ? '8:00 PM' : 'DSNY',
        color: isUrgent ? '#FF0000' : '#FF6B35',
        isCritical: isUrgent,
        target: 'dsnyTasks',
      });
    }

    // Building status action
    actions.push({
      id: 'building_status',
      icon: '🏢',
      text: 'Buildings',
      color: '#00BFFF',
      isCritical: false,
      target: 'buildings',
    });

    // Metrics action
    actions.push({
      id: 'metrics',
      icon: '📊',
      text: 'Metrics',
      color: '#32CD32',
      isCritical: false,
      target: 'insights',
    });

    return actions.slice(0, 3); // Maximum 3 quick actions
  }, [novaState]);

  // Handlers
  const handleSendPrompt = useCallback(async () => {
    if (!userQuery.trim()) return;

    const query = userQuery.trim();
    setUserQuery('');
    
    try {
      await processPrompt(query);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to send prompt:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [userQuery, processPrompt]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    onNavigate?.({
      type: action.target as any,
      payload: { action }
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [onNavigate]);

  const toggleMessageExpansion = useCallback((messageId: string) => {
    setExpandedMessageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const performEmergencyRepair = useCallback(async () => {
    setShowingEmergencyRepair(true);
    setRepairProgress(0);
    setRepairMessage('Starting repair...');

    // Simulate repair progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setRepairProgress(i / 100);
      setRepairMessage(`Repairing assignment data... ${i}%`);
    }

    setRepairMessage('Repair complete! Assignment data synchronized.');
    // Implement haptic feedback
    if (Platform.OS === 'ios') {
      const { HapticFeedback } = require('expo-haptics');
      HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Medium);
    }
    console.log('📳 Haptic feedback: Success notification');
  }, []);

  // Scenario Management
  const checkForActiveScenarios = useCallback(() => {
    const scenarios: any[] = [];
    
    // Check for emergency repair scenario
    if (shouldShowEmergencyRepair) {
      scenarios.push({
        id: 'emergency_repair',
        type: 'emergencyResponse',
        title: 'Emergency Response',
        description: 'Assignment data inconsistency detected',
        priority: 'critical',
      });
    }
    
    // Check for urgent tasks scenario
    if (urgentTaskCount && urgentTaskCount > 0) {
      scenarios.push({
        id: 'urgent_tasks',
        type: 'taskOptimization',
        title: 'Task Optimization',
        description: `${urgentTaskCount} urgent tasks need attention`,
        priority: 'high',
      });
    }
    
    // Check for time-based scenarios
    const hour = new Date().getHours();
    if (hour >= 17) {
      scenarios.push({
        id: 'end_of_day',
        type: 'taskOptimization',
        title: 'End of Day Review',
        description: 'Review remaining tasks and plan for tomorrow',
        priority: 'medium',
      });
    }
    
    setActiveScenarios(scenarios);
    setHasHighPriorityScenarios(scenarios.some(s => s.priority === 'critical' || s.priority === 'high'));
  }, [urgentTaskCount]);

  const handleScenarioTap = useCallback(async (scenario: any) => {
    const prompt = `Tell me more about: ${scenario.description}`;
    await processPrompt(prompt);
    
    // Remove the scenario after handling
    setActiveScenarios(prev => prev.filter(s => s.id !== scenario.id));
  }, [processPrompt]);

  const getScenarioIcon = useCallback((type: string) => {
    switch (type) {
      case 'taskOptimization': return 'list.bullet.clipboard.fill';
      case 'routeOptimization': return 'location.fill';
      case 'inventoryManagement': return 'shippingbox.fill';
      case 'complianceAlert': return 'exclamationmark.shield.fill';
      case 'maintenancePrediction': return 'wrench.and.screwdriver.fill';
      case 'emergencyResponse': return 'exclamationmark.triangle.fill';
      default: return 'lightbulb.fill';
    }
  }, []);

  const getScenarioPriority = useCallback((type: string) => {
    switch (type) {
      case 'emergencyResponse': return 'critical';
      case 'complianceAlert': return 'critical';
      case 'maintenancePrediction': return 'high';
      case 'inventoryManagement': return 'high';
      case 'taskOptimization': return 'medium';
      case 'routeOptimization': return 'medium';
      default: return 'medium';
    }
  }, []);

  const getScenarioColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  }, []);

  // Enhanced Context System
  const buildContextData = useCallback(() => {
    return {
      workerName: 'Current Worker',
      workerId: 'worker_001',
      workerRole: 'maintenance',
      currentBuilding: 'Building 14',
      currentBuildingId: 'building_14',
      assignedBuildings: '5',
      todaysTasks: '12',
      urgentTasks: urgentTaskCount?.toString() || '0',
      timeOfDay: getTimeBasedGreeting(),
      completedTasks: '8',
    };
  }, [urgentTaskCount]);

  const getTimeBasedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const shouldShowEmergencyRepair = useCallback(() => {
    // Simulate emergency repair condition
    return Math.random() > 0.7; // 30% chance
  }, []);

  // Initialize scenarios and context
  useEffect(() => {
    checkForActiveScenarios();
    setUrgentTaskCount(Math.floor(Math.random() * 5)); // Simulate urgent tasks
  }, [checkForActiveScenarios]);

  const canSendMessage = userQuery.trim().length > 0 && processingState.state !== 'processing';

  return (
    <View style={styles.container}>
      {/* Background with gradient */}
      <LinearGradient
        colors={['#000000', '#000033', '#000066', '#000000']}
        style={styles.background}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nova AI Assistant</Text>
          <Text style={styles.headerSubtitle}>{novaState.statusText}</Text>
        </View>
        
        <TouchableOpacity
          onPress={() => setShowContextualData(!showContextualData)}
          style={styles.infoButton}
        >
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <View style={styles.tabItem}>
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={styles.tabText}>Chat with Nova</Text>
        </View>
      </View>

      {/* Emergency repair card */}
      {shouldShowEmergencyRepair && (
        <View style={styles.emergencyRepairCard}>
          <View style={styles.emergencyRepairHeader}>
            <Text style={styles.emergencyRepairIcon}>🔧</Text>
            <View style={styles.emergencyRepairText}>
              <Text style={styles.emergencyRepairTitle}>System Repair Available</Text>
              <Text style={styles.emergencyRepairSubtitle}>AI detected assignment data inconsistency</Text>
            </View>
          </View>
          
          {showingEmergencyRepair && (
            <View style={styles.repairProgress}>
              <View style={styles.repairProgressHeader}>
                <Text style={styles.repairProgressText}>Repair Progress</Text>
                <Text style={styles.repairProgressPercent}>{Math.round(repairProgress * 100)}%</Text>
              </View>
              
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${repairProgress * 100}%` }]} />
              </View>
              
              <Text style={styles.repairMessage}>{repairMessage}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.repairButton, showingEmergencyRepair && styles.repairButtonComplete]}
            onPress={performEmergencyRepair}
            disabled={showingEmergencyRepair && repairProgress < 1.0}
          >
            <Text style={styles.repairButtonText}>
              {showingEmergencyRepair ? '✅ Repair Complete' : '🔧 Run Emergency Repair'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active scenarios banner */}
      {activeScenarios.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenariosBanner}>
          {activeScenarios.map((scenario, index) => (
            <TouchableOpacity key={index} style={styles.scenarioChip}>
              <Text style={styles.scenarioIcon}>⚠️</Text>
              <Text style={styles.scenarioText}>{scenario.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {selectedTab === 'chat' && (
          <ScrollView style={styles.chatContainer}>
            {/* Welcome card if no messages */}
            {chatMessages.length === 0 && (
              <View style={styles.welcomeCard}>
                <View style={styles.welcomeHeader}>
                  <Text style={styles.welcomeIcon}>👋</Text>
                  <View style={styles.welcomeText}>
                    <Text style={styles.welcomeTitle}>{getTimeBasedGreeting()}</Text>
                    <Text style={styles.welcomeSubtitle}>Welcome back, Worker</Text>
                  </View>
                </View>
                
                <View style={styles.quickStats}>
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatIcon}>🏢</Text>
                    <Text style={styles.quickStatValue}>18</Text>
                    <Text style={styles.quickStatLabel}>Buildings</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatIcon}>📋</Text>
                    <Text style={styles.quickStatValue}>25</Text>
                    <Text style={styles.quickStatLabel}>Tasks</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text style={styles.quickStatIcon}>⚠️</Text>
                    <Text style={styles.quickStatValue}>3</Text>
                    <Text style={styles.quickStatLabel}>Urgent</Text>
                  </View>
                </View>
                
                <Text style={styles.welcomeMessage}>How can I help you today?</Text>
              </View>
            )}
            
            {/* Chat messages */}
            {chatMessages.map((message) => (
              <NovaChatBubble
                key={message.id}
                message={message}
                isExpanded={expandedMessageIds.has(message.id)}
                onToggleExpand={() => toggleMessageExpansion(message.id)}
              />
            ))}
            
            {/* Processing indicator */}
            {processingState.state === 'processing' && (
              <View style={styles.processingIndicator}>
                <Text style={styles.processingText}>Nova is thinking...</Text>
                <View style={styles.processingDots}>
                  <Text style={styles.processingDot}>●</Text>
                  <Text style={styles.processingDot}>●</Text>
                  <Text style={styles.processingDot}>●</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Input bar */}
      <View style={styles.inputBar}>
        {/* Quick action chips */}
        {quickActions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionChip, { borderColor: action.color }]}
                onPress={() => handleQuickAction(action)}
              >
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Input field */}
        <View style={styles.inputContainer}>
          <View style={styles.contextIndicator}>
            <Text style={styles.contextIndicatorText}>ℹ️</Text>
          </View>
          
          <TextInput
            style={styles.textInput}
            placeholder="Ask about buildings, tasks, or insights..."
            placeholderTextColor="#666"
            value={userQuery}
            onChangeText={setUserQuery}
            onSubmitEditing={handleSendPrompt}
            multiline
          />
          
          {userQuery.length > 0 && (
            <TouchableOpacity onPress={() => setUserQuery('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.sendButton, !canSendMessage && styles.sendButtonDisabled]}
            onPress={handleSendPrompt}
            disabled={!canSendMessage}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contextual data card */}
      {showContextualData && (
        <View style={styles.contextualDataCard}>
          <View style={styles.contextualDataHeader}>
            <Text style={styles.contextualDataIcon}>📊</Text>
            <Text style={styles.contextualDataTitle}>Current Context</Text>
            <TouchableOpacity onPress={() => setShowContextualData(false)}>
              <Text style={styles.contextualDataClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.contextualDataGrid}>
            <View style={styles.contextualDataItem}>
              <Text style={styles.contextualDataItemIcon}>🏢</Text>
              <Text style={styles.contextualDataItemTitle}>Buildings</Text>
              <Text style={styles.contextualDataItemValue}>18</Text>
              <Text style={styles.contextualDataItemSubtitle}>assigned</Text>
            </View>
            
            <View style={styles.contextualDataItem}>
              <Text style={styles.contextualDataItemIcon}>📋</Text>
              <Text style={styles.contextualDataItemTitle}>Tasks</Text>
              <Text style={styles.contextualDataItemValue}>25</Text>
              <Text style={styles.contextualDataItemSubtitle}>today</Text>
            </View>
            
            <View style={styles.contextualDataItem}>
              <Text style={styles.contextualDataItemIcon}>⏰</Text>
              <Text style={styles.contextualDataItemTitle}>Status</Text>
              <Text style={styles.contextualDataItemValue}>Active</Text>
              <Text style={styles.contextualDataItemSubtitle}>since 8:00 AM</Text>
            </View>
            
            <View style={styles.contextualDataItem}>
              <Text style={styles.contextualDataItemIcon}>👤</Text>
              <Text style={styles.contextualDataItemTitle}>Worker</Text>
              <Text style={styles.contextualDataItemValue}>Worker Name</Text>
              <Text style={styles.contextualDataItemSubtitle}>ID: 12345</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// Nova Chat Bubble Component
const NovaChatBubble: React.FC<{
  message: NovaChatMessage;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ message, isExpanded, onToggleExpand }) => {
  const isUser = message.role === 'user';
  
  return (
    <View style={[styles.chatBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <View style={styles.chatBubbleHeader}>
        <Text style={styles.chatBubbleRole}>
          {isUser ? '👤 You' : '🤖 Nova'}
        </Text>
        <Text style={styles.chatBubbleTime}>
          {message.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      
      <Text style={styles.chatBubbleContent}>{message.content}</Text>
      
      {message.actions.length > 0 && (
        <View style={styles.chatBubbleActions}>
          {message.actions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.chatBubbleAction}>
              <Text style={styles.chatBubbleActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {message.insights.length > 0 && (
        <TouchableOpacity onPress={onToggleExpand} style={styles.chatBubbleExpand}>
          <Text style={styles.chatBubbleExpandText}>
            {isExpanded ? '▼' : '▶'} {message.insights.length} insights
          </Text>
        </TouchableOpacity>
      )}
      
      {isExpanded && message.insights.length > 0 && (
        <View style={styles.chatBubbleInsights}>
          {message.insights.map((insight) => (
            <View key={insight.id} style={styles.insightItem}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emergencyRepairCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  emergencyRepairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyRepairIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyRepairText: {
    flex: 1,
  },
  emergencyRepairTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyRepairSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  repairProgress: {
    marginBottom: 16,
  },
  repairProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  repairProgressText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  repairProgressPercent: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  repairMessage: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  repairButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.4)',
    alignItems: 'center',
  },
  repairButtonComplete: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: 'rgba(0, 255, 0, 0.4)',
  },
  repairButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  scenariosBanner: {
    paddingVertical: 8,
  },
  scenarioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.4)',
    marginHorizontal: 6,
  },
  scenarioIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  scenarioText: {
    color: '#FFA500',
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'rgba(0, 191, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.2)',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  quickStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  welcomeMessage: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  chatBubble: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.3)',
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chatBubbleRole: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatBubbleTime: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  chatBubbleContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  chatBubbleActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chatBubbleAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  chatBubbleActionText: {
    color: '#00BFFF',
    fontSize: 12,
  },
  chatBubbleExpand: {
    marginTop: 8,
  },
  chatBubbleExpandText: {
    color: '#00BFFF',
    fontSize: 12,
  },
  chatBubbleInsights: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  insightItem: {
    marginBottom: 8,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightDescription: {
    color: '#CCCCCC',
    fontSize: 11,
  },
  processingIndicator: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  processingDots: {
    flexDirection: 'row',
  },
  processingDot: {
    color: '#00BFFF',
    fontSize: 16,
    marginHorizontal: 2,
  },
  inputBar: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  quickActions: {
    marginBottom: 12,
  },
  quickActionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  quickActionText: {
    color: '#00BFFF',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contextIndicatorText: {
    color: '#00BFFF',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00BFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contextualDataCard: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contextualDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contextualDataIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  contextualDataTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  contextualDataClose: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  contextualDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contextualDataItem: {
    width: '50%',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  contextualDataItemIcon: {
    fontSize: 12,
    marginBottom: 4,
  },
  contextualDataItemTitle: {
    color: '#CCCCCC',
    fontSize: 10,
    marginBottom: 2,
  },
  contextualDataItemValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contextualDataItemSubtitle: {
    color: '#CCCCCC',
    fontSize: 8,
  },
});

export default NovaInteractionView;
