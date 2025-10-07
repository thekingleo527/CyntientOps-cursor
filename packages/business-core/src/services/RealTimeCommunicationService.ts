/**
 * 🔌 Real-Time Communication Service
 * Purpose: Enhanced WebSocket implementation with real-time server communication
 * Mirrors: CyntientOps/Services/RealTime/WebSocketManager.swift enhanced features
 */

import { EventEmitter } from '../utils/EventEmitter';
import { WebSocketManager, WebSocketMessage, WebSocketConfig } from '@cyntientops/realtime-sync';
import { DatabaseManager } from '@cyntientops/database';
import { UserRole } from '@cyntientops/domain-schema';
import { Logger } from './LoggingService';

export interface RealTimeEvent {
  id: string;
  type: string;
  category: 'task' | 'worker' | 'building' | 'system' | 'emergency' | 'analytics';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  timestamp: Date;
  source: {
    userId: string;
    userRole: UserRole;
    buildingId?: string;
    workerId?: string;
  };
  targets: {
    userIds?: string[];
    userRoles?: UserRole[];
    buildingIds?: string[];
    broadcast?: boolean;
  };
}

export interface RealTimeSubscription {
  id: string;
  userId: string;
  userRole: UserRole;
  eventTypes: string[];
  filters: {
    buildingIds?: string[];
    workerIds?: string[];
    categories?: string[];
  };
  callback: (event: RealTimeEvent) => void;
  isActive: boolean;
}

export interface RealTimeConfig {
  serverUrl: string;
  reconnectAttempts: number;
  pingInterval: number;
  messageQueueSize: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  enableHeartbeat: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export class RealTimeCommunicationService extends EventEmitter {
  private static instance: RealTimeCommunicationService;
  private webSocketManager: WebSocketManager;
  private database: DatabaseManager;
  private config: RealTimeConfig;
  private subscriptions: Map<string, RealTimeSubscription> = new Map();
  private connectionStatus: ConnectionStatus;
  private messageQueue: RealTimeEvent[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor(
    database: DatabaseManager, 
    webSocketManager: WebSocketManager, 
    config: RealTimeConfig
  ) {
    super();
    this.database = database;
    this.webSocketManager = webSocketManager;
    this.config = config;
    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      connectionQuality: 'disconnected'
    };
    this.setupWebSocketHandlers();
  }

  public static getInstance(
    database: DatabaseManager,
    webSocketManager: WebSocketManager,
    config?: Partial<RealTimeConfig>
  ): RealTimeCommunicationService {
    if (!RealTimeCommunicationService.instance) {
      const defaultConfig: RealTimeConfig = {
        serverUrl: 'wss://api.cyntientops.com/ws',
        reconnectAttempts: 5,
        pingInterval: 30000, // 30 seconds
        messageQueueSize: 1000,
        enableCompression: true,
        enableEncryption: true,
        enableHeartbeat: true
      };

      RealTimeCommunicationService.instance = new RealTimeCommunicationService(
        database,
        webSocketManager,
        { ...defaultConfig, ...config }
      );
    }
    return RealTimeCommunicationService.instance;
  }

  // MARK: - Initialization

  /**
   * Initialize real-time communication
   */
  async initialize(sessionToken: string): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Configure WebSocket with authentication
      const wsConfig: WebSocketConfig = {
        url: `${this.config.serverUrl}?token=${sessionToken}`,
        maxReconnectAttempts: this.config.reconnectAttempts,
        pingInterval: this.config.pingInterval,
        timeout: 10000
      };

      this.webSocketManager = new WebSocketManager(wsConfig);
      this.setupWebSocketHandlers();

      // Connect to server
      await this.webSocketManager.connect();
      
      this.isInitialized = true;
      Logger.debug('🔌 Real-time communication initialized', undefined, 'RealTimeCommunicationService');
      return true;
    } catch (error) {
      Logger.error('Failed to initialize real-time communication:', undefined, 'RealTimeCommunicationService');
      return false;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.webSocketManager.on('connected', this.handleConnected.bind(this));
    this.webSocketManager.on('disconnected', this.handleDisconnected.bind(this));
    this.webSocketManager.on('message', this.handleMessage.bind(this));
    this.webSocketManager.on('error', this.handleError.bind(this));
  }

  // MARK: - Connection Management

  /**
   * Handle WebSocket connection
   */
  private handleConnected(): void {
    this.connectionStatus = {
      isConnected: true,
      isConnecting: false,
      lastConnected: new Date(),
      reconnectAttempts: 0,
      connectionQuality: 'excellent'
    };

    this.emit('connected');
    this.startHeartbeat();
    this.processMessageQueue();

    Logger.debug('🔌 Real-time connection established', undefined, 'RealTimeCommunicationService');
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnected(event: any): void {
    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      lastDisconnected: new Date(),
      reconnectAttempts: this.connectionStatus.reconnectAttempts + 1,
      connectionQuality: 'disconnected'
    };

    this.emit('disconnected', event);
    this.stopHeartbeat();

    Logger.debug('🔌 Real-time connection lost', undefined, 'RealTimeCommunicationService');
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    try {
      const event: RealTimeEvent = {
        id: message.id,
        type: message.event,
        category: this.getEventCategory(message.event),
        priority: this.getEventPriority(message.data),
        data: message.data,
        timestamp: message.timestamp,
        source: message.data.source || {},
        targets: message.data.targets || {}
      };

      this.processEvent(event);
    } catch (error) {
      Logger.error('Failed to process WebSocket message:', undefined, 'RealTimeCommunicationService');
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: any): void {
    Logger.error('WebSocket error:', undefined, 'RealTimeCommunicationService');
    this.emit('error', error);
  }

  // MARK: - Event Management

  /**
   * Subscribe to real-time events
   */
  subscribe(subscription: Omit<RealTimeSubscription, 'id'>): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullSubscription: RealTimeSubscription = {
      ...subscription,
      id: subscriptionId,
      isActive: true
    };

    this.subscriptions.set(subscriptionId, fullSubscription);
    
    // Send subscription to server
    this.sendToServer({
      type: 'subscribe',
      data: {
        subscriptionId,
        eventTypes: subscription.eventTypes,
        filters: subscription.filters
      }
    });

    console.log(`📡 Subscribed to events: ${subscription.eventTypes.join(', ')}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    // Send unsubscription to server
    this.sendToServer({
      type: 'unsubscribe',
      data: { subscriptionId }
    });

    console.log(`📡 Unsubscribed from events: ${subscriptionId}`);
    return true;
  }

  /**
   * Process incoming event
   */
  private processEvent(event: RealTimeEvent): void {
    // Check if event matches any subscriptions
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;

      if (this.eventMatchesSubscription(event, subscription)) {
        try {
          subscription.callback(event);
        } catch (error) {
          Logger.error('Error in event callback:', undefined, 'RealTimeCommunicationService');
        }
      }
    }

    // Emit event for global listeners
    this.emit('event', event);
    this.emit(`event:${event.type}`, event);
  }

  /**
   * Check if event matches subscription
   */
  private eventMatchesSubscription(event: RealTimeEvent, subscription: RealTimeSubscription): boolean {
    // Check event type
    if (!subscription.eventTypes.includes(event.type) && !subscription.eventTypes.includes('*')) {
      return false;
    }

    // Check user role
    if (subscription.userRole !== event.source.userRole && !subscription.eventTypes.includes('*')) {
      return false;
    }

    // Check building filter
    if (subscription.filters.buildingIds && event.source.buildingId) {
      if (!subscription.filters.buildingIds.includes(event.source.buildingId)) {
        return false;
      }
    }

    // Check worker filter
    if (subscription.filters.workerIds && event.source.workerId) {
      if (!subscription.filters.workerIds.includes(event.source.workerId)) {
        return false;
      }
    }

    // Check category filter
    if (subscription.filters.categories && !subscription.filters.categories.includes(event.category)) {
      return false;
    }

    return true;
  }

  // MARK: - Event Broadcasting

  /**
   * Broadcast event to server
   */
  async broadcastEvent(event: Omit<RealTimeEvent, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const fullEvent: RealTimeEvent = {
        ...event,
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      if (this.connectionStatus.isConnected) {
        this.sendToServer({
          type: 'broadcast',
          data: fullEvent
        });
        return true;
      } else {
        // Queue event for later transmission
        this.queueEvent(fullEvent);
        return false;
      }
    } catch (error) {
      Logger.error('Failed to broadcast event:', undefined, 'RealTimeCommunicationService');
      return false;
    }
  }

  /**
   * Send direct message to specific user
   */
  async sendDirectMessage(
    targetUserId: string, 
    messageType: string, 
    data: any, 
    source: RealTimeEvent['source']
  ): Promise<boolean> {
    try {
      const event: RealTimeEvent = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: messageType,
        category: 'system',
        priority: 'medium',
        data,
        timestamp: new Date(),
        source,
        targets: {
          userIds: [targetUserId]
        }
      };

      if (this.connectionStatus.isConnected) {
        this.sendToServer({
          type: 'direct_message',
          data: event
        });
        return true;
      } else {
        this.queueEvent(event);
        return false;
      }
    } catch (error) {
      Logger.error('Failed to send direct message:', undefined, 'RealTimeCommunicationService');
      return false;
    }
  }

  // MARK: - Task Events

  /**
   * Broadcast task update
   */
  async broadcastTaskUpdate(
    taskId: string, 
    updateType: 'created' | 'updated' | 'completed' | 'assigned',
    taskData: any,
    source: RealTimeEvent['source']
  ): Promise<boolean> {
    return await this.broadcastEvent({
      type: `task:${updateType}`,
      category: 'task',
      priority: updateType === 'completed' ? 'high' : 'medium',
      data: {
        taskId,
        updateType,
        task: taskData
      },
      source,
      targets: {
        userRoles: ['worker', 'admin', 'manager'],
        buildingIds: taskData.buildingId ? [taskData.buildingId] : undefined
      }
    });
  }

  /**
   * Broadcast worker status update
   */
  async broadcastWorkerStatusUpdate(
    workerId: string,
    status: 'clocked_in' | 'clocked_out' | 'location_update' | 'task_started' | 'task_completed',
    workerData: any,
    source: RealTimeEvent['source']
  ): Promise<boolean> {
    return await this.broadcastEvent({
      type: `worker:${status}`,
      category: 'worker',
      priority: status === 'clocked_out' ? 'high' : 'medium',
      data: {
        workerId,
        status,
        worker: workerData
      },
      source,
      targets: {
        userRoles: ['admin', 'manager'],
        workerIds: [workerId]
      }
    });
  }

  /**
   * Broadcast building alert
   */
  async broadcastBuildingAlert(
    buildingId: string,
    alertType: 'maintenance' | 'security' | 'compliance' | 'emergency',
    alertData: any,
    source: RealTimeEvent['source']
  ): Promise<boolean> {
    return await this.broadcastEvent({
      type: `building:${alertType}`,
      category: 'building',
      priority: alertType === 'emergency' ? 'critical' : 'high',
      data: {
        buildingId,
        alertType,
        alert: alertData
      },
      source,
      targets: {
        userRoles: ['admin', 'manager', 'worker'],
        buildingIds: [buildingId]
      }
    });
  }

  // MARK: - Utility Methods

  /**
   * Send message to server
   */
  private sendToServer(message: any): void {
    if (this.connectionStatus.isConnected) {
      this.webSocketManager.send(message);
    }
  }

  /**
   * Queue event for later transmission
   */
  private queueEvent(event: RealTimeEvent): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest event
    }
    this.messageQueue.push(event);
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.connectionStatus.isConnected) {
      const event = this.messageQueue.shift();
      if (event) {
        this.sendToServer({
          type: 'broadcast',
          data: event
        });
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (!this.config.enableHeartbeat) return;

    this.heartbeatInterval = setInterval(() => {
      this.sendToServer({
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() }
      });
    }, this.config.pingInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get event category from event type
   */
  private getEventCategory(eventType: string): RealTimeEvent['category'] {
    if (eventType.startsWith('task:')) return 'task';
    if (eventType.startsWith('worker:')) return 'worker';
    if (eventType.startsWith('building:')) return 'building';
    if (eventType.startsWith('emergency:')) return 'emergency';
    if (eventType.startsWith('analytics:')) return 'analytics';
    return 'system';
  }

  /**
   * Get event priority from data
   */
  private getEventPriority(data: any): RealTimeEvent['priority'] {
    if (data.priority) return data.priority;
    if (data.urgent || data.critical) return 'critical';
    if (data.important) return 'high';
    return 'medium';
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return Array.from(this.subscriptions.values()).filter(s => s.isActive).length;
  }

  /**
   * Get queued messages count
   */
  getQueuedMessagesCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.stopHeartbeat();
    this.webSocketManager.disconnect();
    this.subscriptions.clear();
    this.messageQueue = [];
    this.isInitialized = false;
    Logger.debug('🔌 Real-time communication disconnected', undefined, 'RealTimeCommunicationService');
  }
}

export default RealTimeCommunicationService;
