/**
 * 🔄 Cross-Context Communication
 * Purpose: Enable seamless communication and data sharing between different user contexts
 * 
 * Features:
 * - Inter-role communication protocols
 * - Context-aware message routing
 * - Data synchronization between contexts
 * - Communication history and audit trails
 * - Real-time notification system
 */

import { EventEmitter } from '../utils/EventEmitter';

export type UserRole = 'admin' | 'client' | 'worker';
export type CommunicationType = 'request' | 'response' | 'notification' | 'alert' | 'sync' | 'broadcast';
export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'acknowledged' | 'failed';

export interface CrossContextMessage {
  id: string;
  type: CommunicationType;
  priority: MessagePriority;
  fromContext: MessageContext;
  toContext: MessageContext;
  subject: string;
  content: string;
  data?: any;
  attachments?: MessageAttachment[];
  metadata: MessageMetadata;
  status: MessageStatus;
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
  acknowledgedAt?: Date;
}

export interface MessageContext {
  role: UserRole;
  contextId: string;
  userId: string;
  sessionId: string;
  location?: {
    buildingId?: string;
    buildingName?: string;
    coordinates?: { x: number; y: number; z?: number };
  };
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'data' | 'report' | 'log';
  size: number;
  url?: string;
  data?: any;
  metadata?: Record<string, any>;
}

export interface MessageMetadata {
  correlationId?: string;
  replyTo?: string;
  threadId?: string;
  tags: string[];
  expiresAt?: Date;
  retryCount: number;
  maxRetries: number;
  encryption?: {
    algorithm: string;
    keyId: string;
  };
  compression?: {
    algorithm: string;
    ratio: number;
  };
}

export interface CommunicationChannel {
  id: string;
  name: string;
  type: 'direct' | 'broadcast' | 'group' | 'system';
  participants: MessageContext[];
  permissions: ChannelPermissions;
  settings: ChannelSettings;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface ChannelPermissions {
  canSend: UserRole[];
  canReceive: UserRole[];
  canModerate: UserRole[];
  canInvite: UserRole[];
  canArchive: UserRole[];
}

export interface ChannelSettings {
  encryption: boolean;
  compression: boolean;
  retention: number; // days
  maxMessageSize: number; // bytes
  rateLimit: number; // messages per minute
  autoArchive: boolean;
  notifications: boolean;
}

export interface CommunicationSession {
  id: string;
  participants: MessageContext[];
  messages: CrossContextMessage[];
  status: 'active' | 'paused' | 'closed' | 'archived';
  startedAt: Date;
  lastActivity: Date;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  purpose: string;
  category: string;
  tags: string[];
  priority: MessagePriority;
  autoClose: boolean;
  closeAfter: number; // minutes
}

export interface CommunicationRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'exists';
  value: any;
  description: string;
}

export interface RuleAction {
  type: 'forward' | 'escalate' | 'notify' | 'auto-reply' | 'archive' | 'log';
  target: string;
  parameters: Record<string, any>;
  description: string;
}

export interface CommunicationState {
  activeChannels: Map<string, CommunicationChannel>;
  activeSessions: Map<string, CommunicationSession>;
  messageQueue: CrossContextMessage[];
  communicationRules: CommunicationRule[];
  messageHistory: CrossContextMessage[];
  isProcessing: boolean;
  lastUpdate: Date;
}

export class CrossContextCommunication extends EventEmitter {
  private state: CommunicationState;
  private messageProcessor: NodeJS.Timeout | null = null;
  private sessionManager: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.state = {
      activeChannels: new Map(),
      activeSessions: new Map(),
      messageQueue: [],
      communicationRules: [],
      messageHistory: [],
      isProcessing: false,
      lastUpdate: new Date()
    };

    this.initializeDefaultChannels();
    this.initializeDefaultRules();
    this.startMessageProcessor();
    this.startSessionManager();
    this.setupEventListeners();
  }

  /**
   * Initialize default communication channels
   */
  private initializeDefaultChannels(): void {
    // Admin to Worker channel
    this.createChannel({
      id: 'admin-worker',
      name: 'Admin to Worker Communication',
      type: 'direct',
      participants: [],
      permissions: {
        canSend: ['admin'],
        canReceive: ['worker'],
        canModerate: ['admin'],
        canInvite: ['admin'],
        canArchive: ['admin']
      },
      settings: {
        encryption: true,
        compression: true,
        retention: 30,
        maxMessageSize: 1024 * 1024, // 1MB
        rateLimit: 60,
        autoArchive: false,
        notifications: true
      },
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    // Client to Admin channel
    this.createChannel({
      id: 'client-admin',
      name: 'Client to Admin Communication',
      type: 'direct',
      participants: [],
      permissions: {
        canSend: ['client'],
        canReceive: ['admin'],
        canModerate: ['admin'],
        canInvite: ['admin'],
        canArchive: ['admin']
      },
      settings: {
        encryption: true,
        compression: true,
        retention: 90,
        maxMessageSize: 5 * 1024 * 1024, // 5MB
        rateLimit: 30,
        autoArchive: false,
        notifications: true
      },
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    // Emergency broadcast channel
    this.createChannel({
      id: 'emergency-broadcast',
      name: 'Emergency Broadcast',
      type: 'broadcast',
      participants: [],
      permissions: {
        canSend: ['admin', 'worker'],
        canReceive: ['admin', 'client', 'worker'],
        canModerate: ['admin'],
        canInvite: ['admin'],
        canArchive: ['admin']
      },
      settings: {
        encryption: true,
        compression: false,
        retention: 365,
        maxMessageSize: 1024 * 1024, // 1MB
        rateLimit: 10,
        autoArchive: false,
        notifications: true
      },
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    // System notifications channel
    this.createChannel({
      id: 'system-notifications',
      name: 'System Notifications',
      type: 'system',
      participants: [],
      permissions: {
        canSend: ['admin'],
        canReceive: ['admin', 'client', 'worker'],
        canModerate: ['admin'],
        canInvite: ['admin'],
        canArchive: ['admin']
      },
      settings: {
        encryption: false,
        compression: true,
        retention: 7,
        maxMessageSize: 512 * 1024, // 512KB
        rateLimit: 120,
        autoArchive: true,
        notifications: true
      },
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    });
  }

  /**
   * Initialize default communication rules
   */
  private initializeDefaultRules(): void {
    // Emergency escalation rule
    this.addRule({
      id: 'emergency-escalation',
      name: 'Emergency Message Escalation',
      description: 'Automatically escalate emergency messages to all relevant parties',
      conditions: [
        {
          field: 'priority',
          operator: 'equals',
          value: 'critical',
          description: 'Message priority is critical'
        },
        {
          field: 'type',
          operator: 'equals',
          value: 'alert',
          description: 'Message type is alert'
        }
      ],
      actions: [
        {
          type: 'broadcast',
          target: 'emergency-broadcast',
          parameters: { immediate: true },
          description: 'Broadcast to emergency channel'
        },
        {
          type: 'notify',
          target: 'admin',
          parameters: { method: 'all' },
          description: 'Notify all admins immediately'
        }
      ],
      isActive: true,
      priority: 1,
      createdAt: new Date(),
      triggerCount: 0
    });

    // Auto-reply rule for common requests
    this.addRule({
      id: 'auto-reply-common',
      name: 'Auto-reply to Common Requests',
      description: 'Automatically reply to common information requests',
      conditions: [
        {
          field: 'content',
          operator: 'contains',
          value: 'building status',
          description: 'Message contains building status request'
        }
      ],
      actions: [
        {
          type: 'auto-reply',
          target: 'sender',
          parameters: { template: 'building-status-template' },
          description: 'Send automated building status response'
        }
      ],
      isActive: true,
      priority: 5,
      createdAt: new Date(),
      triggerCount: 0
    });

    // Message archiving rule
    this.addRule({
      id: 'auto-archive',
      name: 'Auto-archive Old Messages',
      description: 'Automatically archive messages older than retention period',
      conditions: [
        {
          field: 'timestamp',
          operator: 'less-than',
          value: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
          description: 'Message is older than 7 days'
        }
      ],
      actions: [
        {
          type: 'archive',
          target: 'message',
          parameters: { reason: 'retention-policy' },
          description: 'Archive message due to retention policy'
        }
      ],
      isActive: true,
      priority: 10,
      createdAt: new Date(),
      triggerCount: 0
    });
  }

  /**
   * Create a communication channel
   */
  private createChannel(channel: CommunicationChannel): void {
    this.state.activeChannels.set(channel.id, channel);
    this.emit('channelCreated', channel);
  }

  /**
   * Add a communication rule
   */
  private addRule(rule: CommunicationRule): void {
    this.state.communicationRules.push(rule);
    this.emit('ruleAdded', rule);
  }

  /**
   * Start message processor
   */
  private startMessageProcessor(): void {
    this.messageProcessor = setInterval(() => {
      this.processMessageQueue();
    }, 1000); // Process every second
  }

  /**
   * Stop message processor
   */
  private stopMessageProcessor(): void {
    if (this.messageProcessor) {
      clearInterval(this.messageProcessor);
      this.messageProcessor = null;
    }
  }

  /**
   * Start session manager
   */
  private startSessionManager(): void {
    this.sessionManager = setInterval(() => {
      this.manageSessions();
    }, 60000); // Manage every minute
  }

  /**
   * Stop session manager
   */
  private stopSessionManager(): void {
    if (this.sessionManager) {
      clearInterval(this.sessionManager);
      this.sessionManager = null;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('messageReceived', this.handleMessageReceived.bind(this));
    this.on('messageSent', this.handleMessageSent.bind(this));
    this.on('sessionCreated', this.handleSessionCreated.bind(this));
  }

  /**
   * Handle message received event
   */
  private handleMessageReceived(message: CrossContextMessage): void {
    // Apply communication rules
    this.applyCommunicationRules(message);
    
    // Update message status
    message.status = 'delivered';
    message.deliveredAt = new Date();
    
    this.emit('messageDelivered', message);
  }

  /**
   * Handle message sent event
   */
  private handleMessageSent(message: CrossContextMessage): void {
    // Add to message history
    this.state.messageHistory.push(message);
    
    // Limit history size
    if (this.state.messageHistory.length > 10000) {
      this.state.messageHistory = this.state.messageHistory.slice(-5000);
    }
    
    this.emit('messageLogged', message);
  }

  /**
   * Handle session created event
   */
  private handleSessionCreated(session: CommunicationSession): void {
    this.state.activeSessions.set(session.id, session);
    this.emit('sessionActive', session);
  }

  /**
   * Process message queue
   */
  private processMessageQueue(): void {
    if (this.state.messageQueue.length === 0) return;

    this.state.isProcessing = true;

    const message = this.state.messageQueue.shift();
    if (!message) {
      this.state.isProcessing = false;
      return;
    }

    this.processMessage(message).then(() => {
      this.state.isProcessing = false;
    }).catch(error => {
      this.emit('messageProcessingError', { message, error });
      this.state.isProcessing = false;
    });
  }

  /**
   * Process a single message
   */
  private async processMessage(message: CrossContextMessage): Promise<void> {
    try {
      // Validate message
      this.validateMessage(message);

      // Find appropriate channel
      const channel = this.findChannel(message);
      if (!channel) {
        throw new Error(`No suitable channel found for message ${message.id}`);
      }

      // Check permissions
      this.checkPermissions(message, channel);

      // Apply channel settings
      this.applyChannelSettings(message, channel);

      // Send message
      await this.sendMessageInternal(message, channel);

      // Update message status
      message.status = 'sent';
      this.emit('messageSent', message);

    } catch (error) {
      message.status = 'failed';
      this.emit('messageFailed', { message, error });
      throw error;
    }
  }

  /**
   * Validate message
   */
  private validateMessage(message: CrossContextMessage): void {
    if (!message.id || !message.fromContext || !message.toContext) {
      throw new Error('Invalid message: missing required fields');
    }

    if (!message.content || message.content.trim().length === 0) {
      throw new Error('Invalid message: empty content');
    }

    if (message.content.length > 10000) {
      throw new Error('Invalid message: content too long');
    }
  }

  /**
   * Find appropriate channel for message
   */
  private findChannel(message: CrossContextMessage): CommunicationChannel | null {
    const fromRole = message.fromContext.role;
    const toRole = message.toContext.role;

    // Direct communication
    if (message.type === 'request' || message.type === 'response') {
      const channelId = `${fromRole}-${toRole}`;
      return this.state.activeChannels.get(channelId) || null;
    }

    // Broadcast communication
    if (message.type === 'broadcast' || message.priority === 'critical') {
      return this.state.activeChannels.get('emergency-broadcast') || null;
    }

    // System notifications
    if (message.type === 'notification') {
      return this.state.activeChannels.get('system-notifications') || null;
    }

    return null;
  }

  /**
   * Check permissions for message
   */
  private checkPermissions(message: CrossContextMessage, channel: CommunicationChannel): void {
    const fromRole = message.fromContext.role;
    const toRole = message.toContext.role;

    if (!channel.permissions.canSend.includes(fromRole)) {
      throw new Error(`Role ${fromRole} not permitted to send messages to this channel`);
    }

    if (!channel.permissions.canReceive.includes(toRole)) {
      throw new Error(`Role ${toRole} not permitted to receive messages from this channel`);
    }
  }

  /**
   * Apply channel settings to message
   */
  private applyChannelSettings(message: CrossContextMessage, channel: CommunicationChannel): void {
    // Check message size
    if (message.content.length > channel.settings.maxMessageSize) {
      throw new Error(`Message size exceeds channel limit of ${channel.settings.maxMessageSize} bytes`);
    }

    // Apply encryption if required
    if (channel.settings.encryption) {
      message.metadata.encryption = {
        algorithm: 'AES-256',
        keyId: 'default-key'
      };
    }

    // Apply compression if required
    if (channel.settings.compression) {
      message.metadata.compression = {
        algorithm: 'gzip',
        ratio: 0.7
      };
    }
  }

  /**
   * Send message through channel
   */
  private async sendMessageInternal(message: CrossContextMessage, channel: CommunicationChannel): Promise<void> {
    // Simulate message sending
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update channel activity
    channel.lastActivity = new Date();
    
    this.emit('messageReceived', message);
  }

  /**
   * Apply communication rules to message
   */
  private applyCommunicationRules(message: CrossContextMessage): void {
    for (const rule of this.state.communicationRules) {
      if (!rule.isActive) continue;

      if (this.evaluateRuleConditions(rule, message)) {
        this.executeRuleActions(rule, message);
        rule.lastTriggered = new Date();
        rule.triggerCount++;
        this.emit('ruleTriggered', { rule, message });
      }
    }
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(rule: CommunicationRule, message: CrossContextMessage): boolean {
    return rule.conditions.every(condition => {
      const fieldValue = this.getFieldValue(message, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  /**
   * Get field value from message
   */
  private getFieldValue(message: CrossContextMessage, field: string): any {
    const fieldMap: Record<string, any> = {
      'priority': message.priority,
      'type': message.type,
      'content': message.content,
      'timestamp': message.timestamp.getTime(),
      'fromContext.role': message.fromContext.role,
      'toContext.role': message.toContext.role
    };

    return fieldMap[field];
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not-equals':
        return fieldValue !== expectedValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'greater-than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less-than':
        return Number(fieldValue) < Number(expectedValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  /**
   * Execute rule actions
   */
  private executeRuleActions(rule: CommunicationRule, message: CrossContextMessage): void {
    for (const action of rule.actions) {
      this.executeAction(action, message);
    }
  }

  /**
   * Execute a single action
   */
  private executeAction(action: RuleAction, message: CrossContextMessage): void {
    switch (action.type) {
      case 'forward':
        this.forwardMessage(message, action.target, action.parameters);
        break;
      case 'escalate':
        this.escalateMessage(message, action.parameters);
        break;
      case 'notify':
        this.notifyUsers(message, action.target, action.parameters);
        break;
      case 'auto-reply':
        this.sendAutoReply(message, action.parameters);
        break;
      case 'archive':
        this.archiveMessage(message, action.parameters);
        break;
      case 'log':
        this.logMessage(message, action.parameters);
        break;
    }
  }

  /**
   * Forward message to another target
   */
  private forwardMessage(message: CrossContextMessage, target: string, parameters: Record<string, any>): void {
    // Implementation for forwarding messages
    this.emit('messageForwarded', { message, target, parameters });
  }

  /**
   * Escalate message
   */
  private escalateMessage(message: CrossContextMessage, parameters: Record<string, any>): void {
    // Implementation for escalating messages
    this.emit('messageEscalated', { message, parameters });
  }

  /**
   * Notify users
   */
  private notifyUsers(message: CrossContextMessage, target: string, parameters: Record<string, any>): void {
    // Implementation for notifying users
    this.emit('usersNotified', { message, target, parameters });
  }

  /**
   * Send auto-reply
   */
  private sendAutoReply(message: CrossContextMessage, parameters: Record<string, any>): void {
    // Implementation for auto-replies
    this.emit('autoReplySent', { message, parameters });
  }

  /**
   * Archive message
   */
  private archiveMessage(message: CrossContextMessage, parameters: Record<string, any>): void {
    // Implementation for archiving messages
    this.emit('messageArchived', { message, parameters });
  }

  /**
   * Log message
   */
  private logMessage(message: CrossContextMessage, parameters: Record<string, any>): void {
    // Implementation for logging messages
    this.emit('messageLogged', { message, parameters });
  }

  /**
   * Manage active sessions
   */
  private manageSessions(): void {
    for (const [sessionId, session] of this.state.activeSessions) {
      // Check for auto-close
      if (session.metadata.autoClose) {
        const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
        if (timeSinceLastActivity > session.metadata.closeAfter * 60 * 1000) {
          this.closeSession(sessionId, 'auto-close');
        }
      }

      // Check for session expiration
      const sessionAge = Date.now() - session.startedAt.getTime();
      if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
        this.closeSession(sessionId, 'expired');
      }
    }
  }

  /**
   * Close a session
   */
  private closeSession(sessionId: string, reason: string): void {
    const session = this.state.activeSessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      this.state.activeSessions.delete(sessionId);
      this.emit('sessionClosed', { session, reason });
    }
  }

  /**
   * Send a cross-context message
   */
  async sendMessage(message: Partial<CrossContextMessage>): Promise<string> {
    const crossContextMessage: CrossContextMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending'
    };

    // Add to message queue
    this.state.messageQueue.push(crossContextMessage);
    this.emit('messageQueued', crossContextMessage);

    return crossContextMessage.id;
  }

  /**
   * Create a communication session
   */
  public createSession(participants: MessageContext[], metadata: SessionMetadata): string {
    const session: CommunicationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants,
      messages: [],
      status: 'active',
      startedAt: new Date(),
      lastActivity: new Date(),
      metadata
    };

    this.emit('sessionCreated', session);
    return session.id;
  }

  /**
   * Get message by ID
   */
  public getMessage(messageId: string): CrossContextMessage | undefined {
    return this.state.messageHistory.find(msg => msg.id === messageId);
  }

  /**
   * Get messages for a context
   */
  public getMessagesForContext(contextId: string, limit?: number): CrossContextMessage[] {
    const messages = this.state.messageHistory.filter(msg => 
      msg.fromContext.contextId === contextId || msg.toContext.contextId === contextId
    );

    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Get active channels
   */
  public getActiveChannels(): CommunicationChannel[] {
    return Array.from(this.state.activeChannels.values());
  }

  /**
   * Get active sessions
   */
  public getActiveSessions(): CommunicationSession[] {
    return Array.from(this.state.activeSessions.values());
  }

  /**
   * Get communication rules
   */
  public getCommunicationRules(): CommunicationRule[] {
    return [...this.state.communicationRules];
  }

  /**
   * Get message history
   */
  public getMessageHistory(limit?: number): CrossContextMessage[] {
    if (limit) {
      return this.state.messageHistory.slice(-limit);
    }
    return [...this.state.messageHistory];
  }

  /**
   * Get current state
   */
  public getState(): CommunicationState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopMessageProcessor();
    this.stopSessionManager();
    this.removeAllListeners();
    this.state.activeChannels.clear();
    this.state.activeSessions.clear();
    this.state.messageQueue = [];
    this.state.communicationRules = [];
    this.state.messageHistory = [];
  }
}
