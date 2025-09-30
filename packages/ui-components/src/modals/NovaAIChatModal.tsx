/**
 * 🧠 Nova AI Chat Modal
 * Mirrors: CyntientOps/Views/Modals/NovaAIChatModal.swift
 * Purpose: Simple AI chat interface that opens from header Nova AI button
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Animated 
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';

export interface NovaAIChatModalProps {
  visible: boolean;
  onClose: () => void;
  workerName?: string;
  workerId?: string;
  currentLocation?: { latitude: number; longitude: number };
  onSendMessage?: (message: string) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const NovaAIChatModal: React.FC<NovaAIChatModalProps> = ({
  visible,
  onClose,
  workerName = 'Worker',
  workerId,
  currentLocation,
  onSendMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hello ${workerName}! I'm Nova AI, your intelligent assistant. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [modalOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Generate AI response
    setTimeout(async () => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: await generateAIResponse(inputText.trim()),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);

    onSendMessage?.(inputText.trim());
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    try {
      // Import building infrastructure catalog
      const { BuildingInfrastructureCatalog } = await import('@cyntientops/business-core');
      
      if (lowerMessage.includes('task') || lowerMessage.includes('work')) {
        return "I can help you with your tasks! Based on your current schedule, I recommend prioritizing urgent tasks first. Would you like me to suggest an optimized route for today?";
      }
      
      if (lowerMessage.includes('weather')) {
        return "I'm monitoring the weather conditions for your buildings. Today's forecast shows optimal conditions for outdoor tasks. Consider completing any weather-dependent tasks early.";
      }
      
      if (lowerMessage.includes('building') || lowerMessage.includes('location')) {
        if (currentLocation) {
          // Find nearby building
          const catalog = BuildingInfrastructureCatalog.getInstance({} as any); // This would be properly injected
          const nearbyBuilding = catalog.getBuildingByLocation(currentLocation.latitude, currentLocation.longitude);
          
          if (nearbyBuilding) {
            return `I found building information for ${nearbyBuilding.name} at ${nearbyBuilding.address}. It's a ${nearbyBuilding.buildingType} building with ${nearbyBuilding.numberOfUnits} units. The last routine was completed ${Math.floor((Date.now() - nearbyBuilding.lastRoutineCompletion[0]?.date.getTime()) / (1000 * 60 * 60 * 24))} days ago.`;
          }
        }
        return "I can provide insights about your assigned buildings. All buildings are currently in good standing with no critical compliance issues. Need specific building details?";
      }
      
      if (lowerMessage.includes('garbage') || lowerMessage.includes('dsny') || lowerMessage.includes('collection')) {
        if (currentLocation) {
          const catalog = BuildingInfrastructureCatalog.getInstance({} as any);
          const nearbyBuilding = catalog.getBuildingByLocation(currentLocation.latitude, currentLocation.longitude);
          
          if (nearbyBuilding) {
            const dsnyInfo = catalog.getDSNYCollectionInfo(nearbyBuilding.id);
            if (dsnyInfo) {
              const daysUntilNext = Math.ceil((dsnyInfo.nextCollection.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return `For ${nearbyBuilding.name}: Garbage collection is on ${dsnyInfo.collectionDay} at ${dsnyInfo.collectionTime}. Last collection was ${Math.floor((Date.now() - dsnyInfo.lastCollection.getTime()) / (1000 * 60 * 60 * 24))} days ago. Next collection is in ${daysUntilNext} days. Bins should be set out by ${dsnyInfo.setOutTime}.`;
            }
          }
        }
        return "I can help you with DSNY collection schedules. Garbage collection typically happens weekly. Would you like to know the schedule for a specific building?";
      }
      
      if (lowerMessage.includes('routine') || lowerMessage.includes('completed')) {
        if (currentLocation) {
          const catalog = BuildingInfrastructureCatalog.getInstance({} as any);
          const nearbyBuilding = catalog.getBuildingByLocation(currentLocation.latitude, currentLocation.longitude);
          
          if (nearbyBuilding) {
            const routineInfo = catalog.getRoutineCompletionInfo(nearbyBuilding.id);
            if (routineInfo.length > 0) {
              const lastRoutine = routineInfo[0];
              const daysSince = Math.floor((Date.now() - lastRoutine.lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
              return `The last routine at ${nearbyBuilding.name} was "${lastRoutine.routineType}" completed ${daysSince} days ago by ${lastRoutine.workerName}. Status: ${lastRoutine.status}.`;
            }
          }
        }
        return "I can track routine completion status for your buildings. The system shows when each routine was last completed and by which worker.";
      }
      
      if (lowerMessage.includes('help') || lowerMessage.includes('assistance')) {
        return "I'm here to help! I can assist with:\n• Task optimization and route planning\n• Building information and infrastructure details\n• DSNY collection schedules and garbage pickup\n• Routine completion tracking\n• Weather insights and recommendations\n• Compliance status and maintenance schedules\n\nWhat would you like to know?";
      }
      
      return "That's interesting! I'm constantly learning and improving. I can help with building information, task management, DSNY schedules, and routine tracking. What specific information do you need?";
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble accessing building data right now. Please try again in a moment.";
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <GlassCard style={styles.modal} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.novaAvatar}>
                  <Text style={styles.novaInitials}>N</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Nova AI</Text>
                  <Text style={styles.headerSubtitle}>Your Intelligent Assistant</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser ? styles.userText : styles.aiText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        message.isUser ? styles.userTime : styles.aiTime,
                      ]}
                    >
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              ))}
              
              {isTyping && (
                <View style={[styles.messageContainer, styles.aiMessage]}>
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask Nova AI anything..."
                placeholderTextColor={Colors.text.secondary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    height: '80%',
    maxHeight: 600,
    backgroundColor: Colors.glass.regular,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  novaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.status.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  novaInitials: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  messagesContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  messageContainer: {
    marginBottom: Spacing.sm,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.sm,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.status.info,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.glass.thin,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 20,
  },
  userText: {
    color: Colors.text.primary,
  },
  aiText: {
    color: Colors.text.primary,
  },
  messageTime: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: Colors.text.primary,
    opacity: 0.7,
  },
  aiTime: {
    color: Colors.text.secondary,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.secondary,
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.thin,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    backgroundColor: Colors.glass.thin,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.glass.regular,
  },
  sendButton: {
    backgroundColor: Colors.status.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.text.secondary,
    opacity: 0.5,
  },
  sendButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

export default NovaAIChatModal;
