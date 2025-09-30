/**
 * 💬 Emergency Messaging System
 * Purpose: Real-time messaging between workers, admins, and clients for emergency coordination
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { UserRole, NamedCoordinate } from '@cyntientops/domain-schema';

export interface EmergencyMessagingSystemProps {
  userRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  currentLocation?: { latitude: number; longitude: number };
  currentBuilding?: NamedCoordinate;
  onMessageSent?: (message: EmergencyMessage) => void;
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
}

export interface EmergencyMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId?: string; // undefined for broadcast messages
  recipientRole?: UserRole;
  messageType: MessageType;
  priority: MessagePriority;
  content: string;
  timestamp: Date;
  isRead: boolean;
  location?: {
    latitude: number;
    longitude: number;
    buildingId?: string;
    buildingName?: string;
  };
  attachments?: MessageAttachment[];
  emergencyId?: string; // Link to emergency report if applicable
}

export interface EmergencyAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  senderId: string;
  senderName: string;
  recipientRoles: UserRole[];
  timestamp: Date;
  isAcknowledged: boolean;
  location?: {
    latitude: number;
    longitude: number;
    buildingId?: string;
    buildingName?: string;
  };
}

export interface MessageAttachment {
  id: string;
  type: 'photo' | 'document' | 'location';
  url: string;
  name: string;
  size?: number;
}

export enum MessageType {
  EMERGENCY = 'emergency',
  URGENT = 'urgent',
  INFORMATIONAL = 'informational',
  COORDINATION = 'coordination',
  STATUS_UPDATE = 'status_update',
  REQUEST = 'request',
  RESPONSE = 'response'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertType {
  EMERGENCY_REPORT = 'emergency_report',
  SAFETY_ALERT = 'safety_alert',
  WEATHER_WARNING = 'weather_warning',
  SYSTEM_ALERT = 'system_alert',
  COORDINATION_REQUEST = 'coordination_request'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export const EmergencyMessagingSystem: React.FC<EmergencyMessagingSystemProps> = ({
  userRole,
  currentUserId,
  currentUserName,
  currentLocation,
  currentBuilding,
  onMessageSent,
  onEmergencyAlert,
}) => {
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<UserRole | 'all'>('all');
  const [messageType, setMessageType] = useState<MessageType>(MessageType.INFORMATIONAL);
  const [messagePriority, setMessagePriority] = useState<MessagePriority>(MessagePriority.NORMAL);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    loadAlerts();
    // In real implementation, this would set up real-time message listening
    setupMessageListener();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const loadMessages = () => {
    // Mock messages - in real implementation, this would come from database/WebSocket
    const mockMessages: EmergencyMessage[] = [
      {
        id: 'msg-1',
        senderId: 'admin-1',
        senderName: 'Admin User',
        senderRole: 'admin',
        messageType: MessageType.EMERGENCY,
        priority: MessagePriority.CRITICAL,
        content: 'Emergency reported at Building A. All workers please respond.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: true,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          buildingId: 'building-1',
          buildingName: 'Building A'
        }
      },
      {
        id: 'msg-2',
        senderId: 'worker-1',
        senderName: 'John Worker',
        senderRole: 'worker',
        recipientId: 'admin-1',
        recipientRole: 'admin',
        messageType: MessageType.STATUS_UPDATE,
        priority: MessagePriority.HIGH,
        content: 'On my way to Building A. ETA 15 minutes.',
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        isRead: true
      },
      {
        id: 'msg-3',
        senderId: 'client-1',
        senderName: 'Client User',
        senderRole: 'client',
        recipientId: 'admin-1',
        recipientRole: 'admin',
        messageType: MessageType.REQUEST,
        priority: MessagePriority.NORMAL,
        content: 'Can you provide an update on the emergency situation?',
        timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        isRead: false
      }
    ];
    setMessages(mockMessages);
    updateUnreadCount();
  };

  const loadAlerts = () => {
    // Mock alerts - in real implementation, this would come from database/WebSocket
    const mockAlerts: EmergencyAlert[] = [
      {
        id: 'alert-1',
        type: AlertType.EMERGENCY_REPORT,
        severity: AlertSeverity.CRITICAL,
        title: 'Emergency Reported',
        message: 'Fire emergency reported at Building A. Immediate response required.',
        senderId: 'system',
        senderName: 'System',
        recipientRoles: ['admin', 'manager'],
        timestamp: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago
        isAcknowledged: true,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          buildingId: 'building-1',
          buildingName: 'Building A'
        }
      },
      {
        id: 'alert-2',
        type: AlertType.WEATHER_WARNING,
        severity: AlertSeverity.WARNING,
        title: 'Weather Warning',
        message: 'Severe weather conditions expected. Consider postponing outdoor tasks.',
        senderId: 'system',
        senderName: 'Weather System',
        recipientRoles: ['worker', 'admin'],
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        isAcknowledged: false
      }
    ];
    setAlerts(mockAlerts);
  };

  const setupMessageListener = () => {
    // In real implementation, this would set up WebSocket or real-time listener
    console.log('Setting up message listener for real-time updates');
  };

  const updateUnreadCount = () => {
    const unread = messages.filter(msg => !msg.isRead && msg.recipientId === currentUserId).length;
    setUnreadCount(unread);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: EmergencyMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: userRole,
      recipientId: selectedRecipient === 'all' ? undefined : undefined, // In real implementation, get actual recipient ID
      recipientRole: selectedRecipient === 'all' ? undefined : selectedRecipient as UserRole,
      messageType,
      priority: messagePriority,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
      location: currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        buildingId: currentBuilding?.id,
        buildingName: currentBuilding?.name
      } : undefined
    };

    // Add to local messages
    setMessages(prev => [...prev, message]);
    
    // Send via service
    onMessageSent?.(message);

    // Reset form
    setNewMessage('');
    setShowComposeModal(false);

    // If it's an emergency message, also send alert
    if (messageType === MessageType.EMERGENCY || messagePriority === MessagePriority.CRITICAL) {
      const alert: EmergencyAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: AlertType.EMERGENCY_REPORT,
        severity: messagePriority === MessagePriority.CRITICAL ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: 'Emergency Message',
        message: message.content,
        senderId: currentUserId,
        senderName: currentUserName,
        recipientRoles: getRecipientRoles(selectedRecipient),
        timestamp: new Date(),
        isAcknowledged: false,
        location: message.location
      };
      
      setAlerts(prev => [...prev, alert]);
      onEmergencyAlert?.(alert);
    }
  };

  const getRecipientRoles = (recipient: UserRole | 'all'): UserRole[] => {
    if (recipient === 'all') {
      return ['worker', 'admin', 'client', 'manager'];
    }
    return [recipient as UserRole];
  };

  const getMessageTypeIcon = (type: MessageType): string => {
    switch (type) {
      case MessageType.EMERGENCY: return '🚨';
      case MessageType.URGENT: return '⚠️';
      case MessageType.INFORMATIONAL: return 'ℹ️';
      case MessageType.COORDINATION: return '🤝';
      case MessageType.STATUS_UPDATE: return '📊';
      case MessageType.REQUEST: return '❓';
      case MessageType.RESPONSE: return '💬';
      default: return '💬';
    }
  };

  const getPriorityColor = (priority: MessagePriority): string => {
    switch (priority) {
      case MessagePriority.LOW: return Colors.status.success;
      case MessagePriority.NORMAL: return Colors.primary.blue;
      case MessagePriority.HIGH: return Colors.status.warning;
      case MessagePriority.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getAlertSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.INFO: return Colors.primary.blue;
      case AlertSeverity.WARNING: return Colors.status.warning;
      case AlertSeverity.ERROR: return Colors.primary.yellow;
      case AlertSeverity.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const renderMessage = (message: EmergencyMessage) => {
    const isOwnMessage = message.senderId === currentUserId;
    const isUnread = !message.isRead && message.recipientId === currentUserId;

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isOwnMessage && styles.ownMessage,
        isUnread && styles.unreadMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageIcon}>
            {getMessageTypeIcon(message.messageType)}
          </Text>
          <View style={styles.messageInfo}>
            <Text style={styles.senderName}>{message.senderName}</Text>
            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </View>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(message.priority) }
          ]}>
            <Text style={styles.priorityText}>
              {message.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={styles.messageContent}>{message.content}</Text>
        
        {message.location && (
          <View style={styles.messageLocation}>
            <Text style={styles.locationText}>
              📍 {message.location.buildingName || 'Current Location'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAlert = (alert: EmergencyAlert) => (
    <View key={alert.id} style={[
      styles.alertContainer,
      { borderLeftColor: getAlertSeverityColor(alert.severity) }
    ]}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertTitle}>{alert.title}</Text>
        <View style={[
          styles.severityBadge,
          { backgroundColor: getAlertSeverityColor(alert.severity) }
        ]}>
          <Text style={styles.severityText}>
            {alert.severity.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.alertMessage}>{alert.message}</Text>
      
      <View style={styles.alertFooter}>
        <Text style={styles.alertTime}>
          {alert.timestamp.toLocaleString()}
        </Text>
        {!alert.isAcknowledged && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => {
              setAlerts(prev => prev.map(a => 
                a.id === alert.id ? { ...a, isAcknowledged: true } : a
              ));
            }}
          >
            <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderComposeModal = () => (
    <Modal
      visible={showComposeModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowComposeModal(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Send Message</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowComposeModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.composeContent}>
          <View style={styles.recipientSection}>
            <Text style={styles.inputLabel}>Recipient</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['all', 'worker', 'admin', 'client', 'manager'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.recipientButton,
                    selectedRecipient === role && styles.selectedRecipientButton,
                  ]}
                  onPress={() => setSelectedRecipient(role)}
                >
                  <Text style={[
                    styles.recipientButtonText,
                    selectedRecipient === role && styles.selectedRecipientButtonText,
                  ]}>
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.messageTypeSection}>
            <Text style={styles.inputLabel}>Message Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.values(MessageType).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    messageType === type && styles.selectedTypeButton,
                  ]}
                  onPress={() => setMessageType(type)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    messageType === type && styles.selectedTypeButtonText,
                  ]}>
                    {getMessageTypeIcon(type)} {type.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.prioritySection}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {Object.values(MessagePriority).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    { backgroundColor: getPriorityColor(priority) + '20' },
                    messagePriority === priority && { backgroundColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => setMessagePriority(priority)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    messagePriority === priority && { color: Colors.text.primary }
                  ]}>
                    {priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.messageInputSection}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message here..."
              placeholderTextColor={Colors.text.secondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowComposeModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: getPriorityColor(messagePriority) }
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAlertsModal = () => (
    <Modal
      visible={showAlertsModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowAlertsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Emergency Alerts</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAlertsModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.alertsContent}>
          {alerts.map(renderAlert)}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Messaging</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.alertsButton}
            onPress={() => setShowAlertsModal(true)}
          >
            <Text style={styles.alertsButtonText}>🚨 Alerts</Text>
            {alerts.filter(a => !a.isAcknowledged).length > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>
                  {alerts.filter(a => !a.isAcknowledged).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.composeButton}
            onPress={() => setShowComposeModal(true)}
          >
            <Text style={styles.composeButtonText}>✏️ Compose</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {renderComposeModal()}
      {renderAlertsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  alertsButton: {
    position: 'relative',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.status.error,
    borderRadius: 8,
  },
  alertsButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  alertBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.primary.yellow,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  composeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.blue,
    borderRadius: 8,
  },
  composeButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  messageContainer: {
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
  },
  ownMessage: {
    backgroundColor: Colors.primary.blue + '20',
    borderLeftColor: Colors.primary.blue,
  },
  unreadMessage: {
    backgroundColor: Colors.status.warning + '20',
    borderLeftColor: Colors.status.warning,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  messageIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  messageInfo: {
    flex: 1,
  },
  senderName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  messageTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  priorityText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  messageContent: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  messageLocation: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 6,
    padding: Spacing.sm,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.primary.blue,
  },
  alertContainer: {
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  alertTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  severityText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  alertMessage: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  acknowledgeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary.green,
    borderRadius: 6,
  },
  acknowledgeButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  modalTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  composeContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  recipientSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  recipientButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  selectedRecipientButton: {
    backgroundColor: Colors.primary.blue + '20',
    borderColor: Colors.primary.blue,
  },
  recipientButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedRecipientButtonText: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  messageTypeSection: {
    marginBottom: Spacing.lg,
  },
  typeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  selectedTypeButton: {
    backgroundColor: Colors.primary.green + '20',
    borderColor: Colors.primary.green,
  },
  typeButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: Colors.primary.green,
    fontWeight: '600',
  },
  prioritySection: {
    marginBottom: Spacing.lg,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  messageInputSection: {
    marginBottom: Spacing.lg,
  },
  messageInput: {
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    ...Typography.body,
    color: Colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  alertsContent: {
    flex: 1,
    padding: Spacing.lg,
  },
});

export default EmergencyMessagingSystem;
