/**
 * 🔌 Optimized WebSocket Manager
 * Purpose: High-performance WebSocket connection with automatic reconnection and cleanup
 * Features: Connection pooling, heartbeat, error recovery, memory leak prevention
 */

import { Logger } from './LoggingService';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  connectionTimeout?: number;
}

export interface WebSocketListener {
  id: string;
  callback: (message: WebSocketMessage) => void;
  filters?: string[];
}

export class OptimizedWebSocketManager {
  private static instance: OptimizedWebSocketManager;
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private listeners: Map<string, WebSocketListener> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private isDestroyed = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor(config: WebSocketConfig) {
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      reconnectInterval: 5000,  // 5 seconds
      maxReconnectAttempts: 10,
      connectionTimeout: 10000, // 10 seconds
      ...config,
    };
  }

  public static getInstance(config?: WebSocketConfig): OptimizedWebSocketManager {
    if (!OptimizedWebSocketManager.instance) {
      if (!config) {
        throw new Error('WebSocket config is required for first initialization');
      }
      OptimizedWebSocketManager.instance = new OptimizedWebSocketManager(config);
    }
    return OptimizedWebSocketManager.instance;
  }

  public async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('WebSocket manager has been destroyed');
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    return this.connectionPromise;
  }

  private async performConnection(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.createConnection();
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      Logger.info('WebSocket connected successfully', 'OptimizedWebSocketManager');
    } catch (error) {
      Logger.error('WebSocket connection failed', error, 'OptimizedWebSocketManager');
      this.scheduleReconnect();
      throw error;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.config.connectionTimeout!);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.handleClose(event);
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.handleError(error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Broadcast to all listeners
      this.listeners.forEach((listener) => {
        try {
          // Apply filters if specified
          if (listener.filters && listener.filters.length > 0) {
            if (!listener.filters.includes(message.type)) {
              return;
            }
          }
          
          listener.callback(message);
        } catch (error) {
          Logger.error(`Error in WebSocket listener ${listener.id}`, error, 'OptimizedWebSocketManager');
        }
      });
    } catch (error) {
      Logger.error('Failed to parse WebSocket message', error, 'OptimizedWebSocketManager');
    }
  }

  private handleClose(event: CloseEvent): void {
    Logger.warn(`WebSocket closed: ${event.code} - ${event.reason}`, 'OptimizedWebSocketManager');
    this.stopHeartbeat();
    
    if (!this.isDestroyed && event.code !== 1000) { // Not a normal closure
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    Logger.error('WebSocket error occurred', error, 'OptimizedWebSocketManager');
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      Logger.error('Max reconnection attempts reached', 'OptimizedWebSocketManager');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    Logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`, 'OptimizedWebSocketManager');

    this.reconnectTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.connect().catch((error) => {
          Logger.error('Reconnection failed', error, 'OptimizedWebSocketManager');
        });
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'ping',
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public send(message: WebSocketMessage): boolean {
    if (!this.isConnected()) {
      Logger.warn('Cannot send message: WebSocket not connected', 'OptimizedWebSocketManager');
      return false;
    }

    try {
      this.ws!.send(JSON.stringify(message));
      return true;
    } catch (error) {
      Logger.error('Failed to send WebSocket message', error, 'OptimizedWebSocketManager');
      return false;
    }
  }

  public addListener(id: string, callback: (message: WebSocketMessage) => void, filters?: string[]): void {
    this.listeners.set(id, { id, callback, filters });
    Logger.debug(`Added WebSocket listener: ${id}`, 'OptimizedWebSocketManager');
  }

  public removeListener(id: string): void {
    const removed = this.listeners.delete(id);
    if (removed) {
      Logger.debug(`Removed WebSocket listener: ${id}`, 'OptimizedWebSocketManager');
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  public getStats() {
    return {
      isConnected: this.isConnected(),
      connectionState: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      listenerCount: this.listeners.size,
      isDestroyed: this.isDestroyed,
    };
  }

  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    
    // Clear timers
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Manager destroyed');
      this.ws = null;
    }

    // Clear listeners
    this.listeners.clear();

    Logger.info('WebSocket manager destroyed', 'OptimizedWebSocketManager');
  }

  // Static method to destroy singleton instance
  public static destroyInstance(): void {
    if (OptimizedWebSocketManager.instance) {
      OptimizedWebSocketManager.instance.destroy();
      OptimizedWebSocketManager.instance = null as any;
    }
  }
}

export default OptimizedWebSocketManager;
