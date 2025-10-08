/**
 * 🚀 Real-Time Message Router
 * Purpose: Intelligent routing and processing of WebSocket messages
 * Features: Message filtering, role-based routing, conflict resolution
 */

import { Logger } from './LoggingService';
import { OptimizedWebSocketManager, WebSocketMessage } from './OptimizedWebSocketManager';

export interface MessageRoute {
  id: string;
  type: string;
  filters?: string[];
  handler: (message: WebSocketMessage) => void;
  priority: number;
  retryable: boolean;
}

export interface MessageContext {
  userId: string;
  userRole: 'worker' | 'client' | 'admin';
  buildingIds?: string[];
  permissions?: string[];
}

export class RealTimeMessageRouter {
  private static instance: RealTimeMessageRouter;
  private routes: Map<string, MessageRoute[]> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isProcessing = false;
  private context: MessageContext | null = null;
  private webSocketManager: OptimizedWebSocketManager | null = null;

  private constructor() {
    this.setupDefaultRoutes();
  }

  public static getInstance(): RealTimeMessageRouter {
    if (!RealTimeMessageRouter.instance) {
      RealTimeMessageRouter.instance = new RealTimeMessageRouter();
    }
    return RealTimeMessageRouter.instance;
  }

  public initialize(webSocketManager: OptimizedWebSocketManager, context: MessageContext): void {
    this.webSocketManager = webSocketManager;
    this.context = context;
    
    // Subscribe to WebSocket messages
    this.webSocketManager.addListener('message-router', this.handleMessage.bind(this));
    
    Logger.info(`Real-time message router initialized for ${context.userRole} user ${context.userId}`, 'RealTimeMessageRouter');
  }

  private setupDefaultRoutes(): void {
    // Task-related routes
    this.addRoute({
      id: 'task-update',
      type: 'task',
      handler: this.handleTaskUpdate.bind(this),
      priority: 1,
      retryable: true,
    });

    this.addRoute({
      id: 'task-assignment',
      type: 'task_assignment',
      handler: this.handleTaskAssignment.bind(this),
      priority: 2,
      retryable: true,
    });

    // Building-related routes
    this.addRoute({
      id: 'building-update',
      type: 'building',
      handler: this.handleBuildingUpdate.bind(this),
      priority: 1,
      retryable: true,
    });

    this.addRoute({
      id: 'compliance-update',
      type: 'compliance',
      handler: this.handleComplianceUpdate.bind(this),
      priority: 2,
      retryable: true,
    });

    // Worker-related routes
    this.addRoute({
      id: 'worker-status',
      type: 'worker_status',
      handler: this.handleWorkerStatus.bind(this),
      priority: 1,
      retryable: false,
    });

    this.addRoute({
      id: 'clock-in-out',
      type: 'clock_event',
      handler: this.handleClockEvent.bind(this),
      priority: 2,
      retryable: false,
    });

    // System routes
    this.addRoute({
      id: 'system-alert',
      type: 'system_alert',
      handler: this.handleSystemAlert.bind(this),
      priority: 3,
      retryable: false,
    });

    this.addRoute({
      id: 'emergency-alert',
      type: 'emergency',
      handler: this.handleEmergencyAlert.bind(this),
      priority: 4,
      retryable: false,
    });
  }

  public addRoute(route: MessageRoute): void {
    if (!this.routes.has(route.type)) {
      this.routes.set(route.type, []);
    }
    
    const routes = this.routes.get(route.type)!;
    routes.push(route);
    
    // Sort by priority (higher priority first)
    routes.sort((a, b) => b.priority - a.priority);
    
    Logger.debug(`Added route: ${route.id} for type: ${route.type}`, 'RealTimeMessageRouter');
  }

  public removeRoute(routeId: string): void {
    for (const [type, routes] of this.routes.entries()) {
      const index = routes.findIndex(route => route.id === routeId);
      if (index !== -1) {
        routes.splice(index, 1);
        Logger.debug(`Removed route: ${routeId} from type: ${type}`, 'RealTimeMessageRouter');
        break;
      }
    }
  }

  private async handleMessage(message: WebSocketMessage): Promise<void> {
    if (!this.context) {
      Logger.warn('Message received but no context set', 'RealTimeMessageRouter');
      return;
    }

    // Add to queue for processing
    this.messageQueue.push(message);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processMessageQueue();
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        await this.processMessage(message);
      }
    } catch (error) {
      Logger.error('Error processing message queue', error, 'RealTimeMessageRouter');
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessage(message: WebSocketMessage): Promise<void> {
    const routes = this.routes.get(message.type);
    if (!routes || routes.length === 0) {
      Logger.debug(`No routes found for message type: ${message.type}`, 'RealTimeMessageRouter');
      return;
    }

    // Check if user has permission to receive this message
    if (!this.hasPermission(message)) {
      Logger.debug(`User ${this.context!.userId} does not have permission for message type: ${message.type}`, 'RealTimeMessageRouter');
      return;
    }

    // Process routes in priority order
    for (const route of routes) {
      try {
        await route.handler(message);
      } catch (error) {
        Logger.error(`Error in route handler ${route.id}`, error, 'RealTimeMessageRouter');
        
        // Retry if retryable
        if (route.retryable) {
          this.retryMessage(message, route);
        }
      }
    }
  }

  private hasPermission(message: WebSocketMessage): boolean {
    if (!this.context) return false;

    // Role-based permissions
    switch (message.type) {
      case 'task':
      case 'task_assignment':
        return this.context.userRole === 'worker' || this.context.userRole === 'admin';
      
      case 'building':
      case 'compliance':
        return this.context.userRole === 'client' || this.context.userRole === 'admin';
      
      case 'worker_status':
      case 'clock_event':
        return this.context.userRole === 'admin';
      
      case 'system_alert':
        return this.context.userRole === 'admin';
      
      case 'emergency':
        return true; // Everyone can receive emergency alerts
      
      default:
        return true;
    }
  }

  private retryMessage(message: WebSocketMessage, route: MessageRoute): void {
    // Simple retry mechanism - in production, you might want more sophisticated retry logic
    setTimeout(() => {
      try {
        route.handler(message);
      } catch (error) {
        Logger.error(`Retry failed for route ${route.id}`, error, 'RealTimeMessageRouter');
      }
    }, 1000);
  }

  // Message handlers
  private async handleTaskUpdate(message: WebSocketMessage): Promise<void> {
    Logger.info(`Task update received: ${message.data.taskId}`, 'RealTimeMessageRouter');
    
    // Emit event for UI components to listen to
    this.emitEvent('task-updated', message.data);
  }

  private async handleTaskAssignment(message: WebSocketMessage): Promise<void> {
    Logger.info(`Task assignment received: ${message.data.taskId}`, 'RealTimeMessageRouter');
    
    // Check if assigned to current user
    if (message.data.workerId === this.context?.userId) {
      this.emitEvent('task-assigned', message.data);
    }
  }

  private async handleBuildingUpdate(message: WebSocketMessage): Promise<void> {
    Logger.info(`Building update received: ${message.data.buildingId}`, 'RealTimeMessageRouter');
    
    // Check if user has access to this building
    if (this.context?.buildingIds?.includes(message.data.buildingId)) {
      this.emitEvent('building-updated', message.data);
    }
  }

  private async handleComplianceUpdate(message: WebSocketMessage): Promise<void> {
    Logger.info(`Compliance update received: ${message.data.buildingId}`, 'RealTimeMessageRouter');
    
    this.emitEvent('compliance-updated', message.data);
  }

  private async handleWorkerStatus(message: WebSocketMessage): Promise<void> {
    Logger.info(`Worker status update received: ${message.data.workerId}`, 'RealTimeMessageRouter');
    
    this.emitEvent('worker-status-updated', message.data);
  }

  private async handleClockEvent(message: WebSocketMessage): Promise<void> {
    Logger.info(`Clock event received: ${message.data.workerId}`, 'RealTimeMessageRouter');
    
    this.emitEvent('clock-event', message.data);
  }

  private async handleSystemAlert(message: WebSocketMessage): Promise<void> {
    Logger.warn(`System alert received: ${message.data.alertType}`, 'RealTimeMessageRouter');
    
    this.emitEvent('system-alert', message.data);
  }

  private async handleEmergencyAlert(message: WebSocketMessage): Promise<void> {
    Logger.error(`Emergency alert received: ${message.data.alertType}`, 'RealTimeMessageRouter');
    
    this.emitEvent('emergency-alert', message.data);
  }

  private emitEvent(eventType: string, data: any): void {
    // In a real implementation, you would use an event emitter
    // For now, we'll use a simple callback system
    if (typeof window !== 'undefined' && (window as any).cyntientopsEvents) {
      (window as any).cyntientopsEvents.emit(eventType, data);
    }
  }

  public updateContext(newContext: MessageContext): void {
    this.context = newContext;
    Logger.info(`Message router context updated for ${newContext.userRole} user ${newContext.userId}`, 'RealTimeMessageRouter');
  }

  public getStats() {
    return {
      routeCount: Array.from(this.routes.values()).reduce((sum, routes) => sum + routes.length, 0),
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
      context: this.context,
    };
  }

  public destroy(): void {
    if (this.webSocketManager) {
      this.webSocketManager.removeListener('message-router');
    }
    
    this.routes.clear();
    this.messageQueue = [];
    this.context = null;
    this.webSocketManager = null;
    
    Logger.info('Real-time message router destroyed', 'RealTimeMessageRouter');
  }

  public static destroyInstance(): void {
    if (RealTimeMessageRouter.instance) {
      RealTimeMessageRouter.instance.destroy();
      RealTimeMessageRouter.instance = null as any;
    }
  }
}

export default RealTimeMessageRouter;
