/**
 * 🔌 WebSocket Manager
 * Mirrors: CyntientOps/Services/Realtime/WebSocketManager.swift
 * Purpose: Real-time synchronization and live updates
 */

import { DatabaseManager } from '@cyntientops/database';
import { OfflineManager } from '@cyntientops/offline-support';

export interface WebSocketMessage {
  id: string;
  type: string;
  action: 'create' | 'update' | 'delete' | 'sync' | 'ping' | 'pong';
  entityType: string;
  entityId: string;
  data: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface WebSocketConnection {
  id: string;
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  lastHeartbeat?: Date;
}

export interface RealtimeEvent {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  userId?: string;
  processed: boolean;
}

export interface RealtimeConfig {
  enableRealtimeSync: boolean;
  websocketUrl: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  messageTimeout: number;
  enableHeartbeat: boolean;
  enableAutoReconnect: boolean;
  syncOnReconnect: boolean;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private databaseManager: DatabaseManager;
  private offlineManager: OfflineManager;
  private connection: WebSocketConnection;
  private websocket: WebSocket | null = null;
  private config: RealtimeConfig;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  private eventListeners: Set<(event: RealtimeEvent) => void> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected: boolean = false;

  private constructor(
    databaseManager: DatabaseManager,
    offlineManager: OfflineManager
  ) {
    this.databaseManager = databaseManager;
    this.offlineManager = offlineManager;
    
    this.connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: '',
      status: 'disconnected',
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000
    };
    
    this.config = {
      enableRealtimeSync: true,
      websocketUrl: 'wss://api.cyntientops.com/ws',
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      messageTimeout: 10000,
      enableHeartbeat: true,
      enableAutoReconnect: true,
      syncOnReconnect: true
    };
    
    this.initializeMessageHandlers();
  }

  public static getInstance(
    databaseManager: DatabaseManager,
    offlineManager: OfflineManager
  ): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(
        databaseManager,
        offlineManager
      );
    }
    return WebSocketManager.instance;
  }

  /**
   * Initialize message handlers
   */
  private initializeMessageHandlers(): void {
    this.messageHandlers.set('worker_update', this.handleWorkerUpdate.bind(this));
    this.messageHandlers.set('building_update', this.handleBuildingUpdate.bind(this));
    this.messageHandlers.set('task_update', this.handleTaskUpdate.bind(this));
    this.messageHandlers.set('clock_event', this.handleClockEvent.bind(this));
    this.messageHandlers.set('location_update', this.handleLocationUpdate.bind(this));
    this.messageHandlers.set('notification', this.handleNotification.bind(this));
    this.messageHandlers.set('sync_request', this.handleSyncRequest.bind(this));
    this.messageHandlers.set('ping', this.handlePing.bind(this));
    this.messageHandlers.set('pong', this.handlePong.bind(this));
  }

  /**
   * Connect to WebSocket
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }
    
    try {
      this.connection.status = 'connecting';
      this.connection.url = this.config.websocketUrl;
      
      // Simulate WebSocket connection (in a real app, this would be actual WebSocket)
      this.websocket = this.createMockWebSocket();
      
      this.connection.status = 'connected';
      this.connection.lastConnected = new Date();
      this.connection.reconnectAttempts = 0;
      this.isConnected = true;
      
      // Start heartbeat
      if (this.config.enableHeartbeat) {
        this.startHeartbeat();
      }
      
      // Process queued messages
      this.processMessageQueue();
      
      console.log('WebSocket connected successfully');
      return true;
    } catch (error) {
      this.connection.status = 'error';
      this.connection.lastDisconnected = new Date();
      console.error('WebSocket connection failed:', error);
      
      if (this.config.enableAutoReconnect) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  }

  /**
   * Create mock WebSocket (for simulation)
   */
  private createMockWebSocket(): any {
    return {
      send: (data: string) => {
        console.log('Mock WebSocket send:', data);
      },
      close: () => {
        console.log('Mock WebSocket closed');
      }
    };
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.connection.status = 'disconnected';
    this.connection.lastDisconnected = new Date();
    this.isConnected = false;
    
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    
    console.log('WebSocket disconnected');
  }

  /**
   * Send message
   */
  public sendMessage(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): boolean {
    if (!this.isConnected) {
      // Queue message for later
      this.messageQueue.push({
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      });
      return false;
    }
    
    const fullMessage: WebSocketMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    try {
      const messageData = JSON.stringify(fullMessage);
      this.websocket?.send(messageData);
      console.log(`Sent WebSocket message: ${fullMessage.type}`);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'ping',
          action: 'ping',
          entityType: 'system',
          entityId: 'heartbeat',
          data: { timestamp: new Date().toISOString() }
        });
        this.connection.lastHeartbeat = new Date();
      }
    }, this.config.heartbeatInterval);
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
   * Schedule reconnect
   */
  private scheduleReconnect(): void {
    if (this.connection.reconnectAttempts >= this.connection.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    this.connection.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.connection.reconnectAttempts - 1);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.connection.reconnectAttempts}/${this.connection.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Handle worker update
   */
  private handleWorkerUpdate(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'worker_update',
      entityType: 'worker',
      entityId: message.entityId,
      action: message.action,
      data: message.data,
      timestamp: message.timestamp,
      userId: message.userId,
      processed: false
    };
    
    this.notifyEventListeners(event);
    console.log('Handled worker update:', message.entityId);
  }

  /**
   * Handle building update
   */
  private handleBuildingUpdate(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'building_update',
      entityType: 'building',
      entityId: message.entityId,
      action: message.action,
      data: message.data,
      timestamp: message.timestamp,
      userId: message.userId,
      processed: false
    };
    
    this.notifyEventListeners(event);
    console.log('Handled building update:', message.entityId);
  }

  /**
   * Handle task update
   */
  private handleTaskUpdate(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'task_update',
      entityType: 'task',
      entityId: message.entityId,
      action: message.action,
      data: message.data,
      timestamp: message.timestamp,
      userId: message.userId,
      processed: false
    };
    
    this.notifyEventListeners(event);
    console.log('Handled task update:', message.entityId);
  }

  /**
   * Handle clock event
   */
  private handleClockEvent(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'clock_event',
      entityType: 'clock_event',
      entityId: message.entityId,
      action: message.action,
      data: message.data,
      timestamp: message.timestamp,
      userId: message.userId,
      processed: false
    };
    
    this.notifyEventListeners(event);
    console.log('Handled clock event:', message.entityId);
  }

  /**
   * Handle location update
   */
  private handleLocationUpdate(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'location_update',
      entityType: 'location',
      entityId: message.entityId,
      action: message.action,
      data: message.data,
      timestamp: message.timestamp,
      userId: message.userId,
      processed: false
    };
    
    this.notifyEventListeners(event);
    console.log('Handled location update:', message.entityId);
  }

  /**
   * Handle notification
   */
  private handleNotification(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'notification',
      entityType: 'notification',
      entityId: message.entityId,
      action: message.action,
      data: message.data,
      timestamp: message.timestamp,
      userId: message.userId,
      processed: false
    };
    
    this.notifyEventListeners(event);
    console.log('Handled notification:', message.entityId);
  }

  /**
   * Handle sync request
   */
  private handleSyncRequest(message: WebSocketMessage): void {
    console.log('Handling sync request:', message.data);
    
    // Trigger offline sync
    if (this.offlineManager) {
      this.offlineManager.syncAllQueues();
    }
  }

  /**
   * Handle ping
   */
  private handlePing(message: WebSocketMessage): void {
    this.sendMessage({
      type: 'pong',
      action: 'pong',
      entityType: 'system',
      entityId: 'heartbeat',
      data: { timestamp: new Date().toISOString() }
    });
  }

  /**
   * Handle pong
   */
  private handlePong(message: WebSocketMessage): void {
    this.connection.lastHeartbeat = new Date();
    console.log('Received pong');
  }

  /**
   * Subscribe to realtime events
   */
  public subscribeToEvents(listener: (event: RealtimeEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Notify event listeners
   */
  private notifyEventListeners(event: RealtimeEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): WebSocketConnection {
    return { ...this.connection };
  }

  /**
   * Get configuration
   */
  public getConfig(): RealtimeConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.heartbeatInterval && this.heartbeatInterval) {
      this.startHeartbeat();
    }
  }

  /**
   * Get message queue size
   */
  public getMessageQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  public clearMessageQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Get connection statistics
   */
  public getConnectionStatistics(): {
    isConnected: boolean;
    connectionTime?: number;
    reconnectAttempts: number;
    lastHeartbeat?: Date;
    messageQueueSize: number;
    eventListenersCount: number;
  } {
    const connectionTime = this.connection.lastConnected ? 
      Date.now() - this.connection.lastConnected.getTime() : undefined;
    
    return {
      isConnected: this.isConnected,
      connectionTime,
      reconnectAttempts: this.connection.reconnectAttempts,
      lastHeartbeat: this.connection.lastHeartbeat,
      messageQueueSize: this.messageQueue.length,
      eventListenersCount: this.eventListeners.size
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.disconnect();
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    this.eventListeners.clear();
    this.messageQueue = [];
  }
}
