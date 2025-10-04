/**
 * 🔌 WebSocket Manager
 * Mirrors: CyntientOps/Services/RealTime/WebSocketManager.swift
 * Purpose: Real-time communication with broadcasting and event handling
 * Features: Connection management, message broadcasting, event subscriptions, reconnection logic
 */

import { EventEmitter } from 'events';

export interface WebSocketMessage {
  id: string;
  type: 'broadcast' | 'direct' | 'system';
  event: string;
  data: any;
  timestamp: Date;
  senderId?: string;
  targetId?: string;
  buildingId?: string;
  workerId?: string;
}

export interface WebSocketConnection {
  id: string;
  isConnected: boolean;
  lastPing: Date;
  subscriptions: string[];
  userRole: 'admin' | 'worker' | 'client';
  userId: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  pingInterval: number;
  timeout: number;
}

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connections: Map<string, WebSocketConnection> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions: Set<string> = new Set();

  constructor(config: WebSocketConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.on('message', this.handleMessage.bind(this));
    this.on('error', this.handleError.bind(this));
    this.on('close', this.handleClose.bind(this));
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.startPingTimer();
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.emit('message', message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.emit('disconnected', event);
        this.handleReconnection();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopPingTimer();
    this.stopReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connections.clear();
    this.emit('disconnected');
  }

  /**
   * Send a message through WebSocket
   */
  send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      // Queue message for later sending
      this.messageQueue.push(fullMessage);
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, data: any, options?: {
    buildingId?: string;
    userRole?: string;
    excludeSender?: boolean;
  }): void {
    this.send({
      type: 'broadcast',
      event,
      data,
      buildingId: options?.buildingId,
      targetId: options?.userRole,
    });
  }

  /**
   * Send a direct message to a specific user
   */
  sendDirect(targetId: string, event: string, data: any): void {
    this.send({
      type: 'direct',
      event,
      data,
      targetId,
    });
  }

  /**
   * Subscribe to specific events
   */
  subscribe(events: string | string[]): void {
    const eventList = Array.isArray(events) ? events : [events];
    
    eventList.forEach(event => {
      this.subscriptions.add(event);
    });

    this.send({
      type: 'system',
      event: 'subscribe',
      data: { events: eventList },
    });
  }

  /**
   * Unsubscribe from specific events
   */
  unsubscribe(events: string | string[]): void {
    const eventList = Array.isArray(events) ? events : [events];
    
    eventList.forEach(event => {
      this.subscriptions.delete(event);
    });

    this.send({
      type: 'system',
      event: 'unsubscribe',
      data: { events: eventList },
    });
  }

  /**
   * Register a connection with user information
   */
  registerConnection(connectionId: string, userInfo: {
    userId: string;
    userRole: 'admin' | 'worker' | 'client';
  }): void {
    const connection: WebSocketConnection = {
      id: connectionId,
      isConnected: true,
      lastPing: new Date(),
      subscriptions: [],
      userRole: userInfo.userRole,
      userId: userInfo.userId,
    };

    this.connections.set(connectionId, connection);
    
    this.send({
      type: 'system',
      event: 'register',
      data: {
        connectionId,
        userInfo,
      },
    });
  }

  /**
   * Unregister a connection
   */
  unregisterConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    
    this.send({
      type: 'system',
      event: 'unregister',
      data: { connectionId },
    });
  }

  /**
   * Get connection information
   */
  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections by role
   */
  getConnectionsByRole(role: 'admin' | 'worker' | 'client'): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.userRole === role);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    connectionCount: number;
    subscriptions: string[];
  } {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      connectionCount: this.connections.size,
      subscriptions: Array.from(this.subscriptions),
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Update connection ping time
    if (message.senderId) {
      const connection = this.connections.get(message.senderId);
      if (connection) {
        connection.lastPing = new Date();
      }
    }

    // Emit specific event
    this.emit(message.event, message.data, message);
  }

  private handleError(error: any): void {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.emit('close', event);
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  private startPingTimer(): void {
    this.stopPingTimer();
    
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'system',
          event: 'ping',
          data: { timestamp: new Date().toISOString() },
        });
      }
    }, this.config.pingInterval);
  }

  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws?.send(JSON.stringify(message));
      }
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 🔧 Enhanced Error Handling and Testing Methods
   */

  /**
   * Test WebSocket connection with comprehensive error handling
   */
  public async testConnection(): Promise<{
    isConnected: boolean;
    latency: number;
    error?: string;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'failed';
  }> {
    const startTime = Date.now();
    
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return {
          isConnected: false,
          latency: 0,
          error: 'WebSocket not connected',
          connectionQuality: 'failed'
        };
      }

      // Send test ping
      const testMessage = {
        type: 'system',
        event: 'ping',
        data: { timestamp: Date.now() }
      };

      this.ws.send(JSON.stringify(testMessage));
      
      const latency = Date.now() - startTime;
      
      let connectionQuality: 'excellent' | 'good' | 'poor' | 'failed';
      if (latency < 100) {
        connectionQuality = 'excellent';
      } else if (latency < 300) {
        connectionQuality = 'good';
      } else if (latency < 1000) {
        connectionQuality = 'poor';
      } else {
        connectionQuality = 'failed';
      }

      return {
        isConnected: true,
        latency,
        connectionQuality
      };
    } catch (error) {
      return {
        isConnected: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionQuality: 'failed'
      };
    }
  }

  /**
   * Enhanced error handling for connection failures
   */
  private handleConnectionError(error: Event): void {
    console.error('🔌 WebSocket connection error:', error);
    
    // Emit error event with detailed information
    this.emit('error', {
      type: 'connection_error',
      message: 'WebSocket connection failed',
      timestamp: new Date(),
      error: error
    });

    // Attempt reconnection with exponential backoff
    this.scheduleReconnection();
  }

  /**
   * Enhanced reconnection logic with exponential backoff
   */
  private scheduleReconnection(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30 seconds
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Health check for WebSocket connection
   */
  public async performHealthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check connection status
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      issues.push('WebSocket not connected');
      recommendations.push('Attempt to reconnect');
    }

    // Check message queue
    if (this.messageQueue.length > 100) {
      issues.push('Message queue is large');
      recommendations.push('Process queued messages');
    }

    // Check connection count
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isConnected).length;
    
    if (activeConnections === 0) {
      issues.push('No active connections');
      recommendations.push('Check connection registration');
    }

    // Check subscription count
    if (this.subscriptions.size === 0) {
      issues.push('No active subscriptions');
      recommendations.push('Subscribe to relevant events');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Force reconnection with cleanup
   */
  public async forceReconnect(): Promise<boolean> {
    try {
      console.log('🔄 Forcing WebSocket reconnection...');
      
      // Clean up existing connection
      this.disconnect();
      
      // Reset reconnection attempts
      this.reconnectAttempts = 0;
      
      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Attempt new connection
      await this.connect();
      
      console.log('✅ Force reconnection completed');
      return true;
    } catch (error) {
      console.error('❌ Force reconnection failed:', error);
      return false;
    }
  }

  /**
   * Get detailed connection diagnostics
   */
  public getConnectionDiagnostics(): {
    connectionState: string;
    config: WebSocketConfig;
    stats: {
      totalConnections: number;
      activeConnections: number;
      subscriptions: number;
      messageQueue: number;
    };
    health: Promise<ReturnType<WebSocketManager['performHealthCheck']>>;
    test: Promise<ReturnType<WebSocketManager['testConnection']>>;
  } {
    return {
      connectionState: this.ws ? this.ws.readyState.toString() : 'DISCONNECTED',
      config: this.config,
      stats: {
        totalConnections: this.connections.size,
        activeConnections: Array.from(this.connections.values()).filter(conn => conn.isConnected).length,
        subscriptions: this.subscriptions.size,
        messageQueue: this.messageQueue.length
      },
      health: this.performHealthCheck(),
      test: this.testConnection()
    };
  }
}

// Default configuration
export const defaultWebSocketConfig: WebSocketConfig = {
  url: 'ws://localhost:8080/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  pingInterval: 30000,
  timeout: 10000,
};

// Singleton instance
let webSocketManager: WebSocketManager | null = null;

export const getWebSocketManager = (config?: Partial<WebSocketConfig>): WebSocketManager => {
  if (!webSocketManager) {
    const finalConfig = { ...defaultWebSocketConfig, ...config };
    webSocketManager = new WebSocketManager(finalConfig);
  }
  return webSocketManager;
};

export default WebSocketManager;