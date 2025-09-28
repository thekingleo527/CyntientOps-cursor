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
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface NovaAIChatModalProps {
  visible: boolean;
  onClose: () => void;
  workerName?: string;
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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText.trim()),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);

    onSendMessage?.(inputText.trim());
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('task') || lowerMessage.includes('work')) {
      return "I can help you with your tasks! Based on your current schedule, I recommend prioritizing urgent tasks first. Would you like me to suggest an optimized route for today?";
    }
    
    if (lowerMessage.includes('weather')) {
      return "I'm monitoring the weather conditions for your buildings. Today's forecast shows optimal conditions for outdoor tasks. Consider completing any weather-dependent tasks early.";
    }
    
    if (lowerMessage.includes('building') || lowerMessage.includes('location')) {
      return "I can provide insights about your assigned buildings. All buildings are currently in good standing with no critical compliance issues. Need specific building details?";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('assistance')) {
      return "I'm here to help! I can assist with task optimization, weather insights, building information, compliance updates, and route planning. What would you like to know?";
    }
    
    return "That's interesting! I'm constantly learning and improving. Is there anything specific about your work today that I can help you with?";
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
          <GlassCard style={styles.modal}>
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
