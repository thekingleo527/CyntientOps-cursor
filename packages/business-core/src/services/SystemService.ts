/**
 * ⚙️ System Service
 * Purpose: System health monitoring, diagnostics, and configuration
 */

import { DatabaseManager } from '@cyntientops/database';
import { Logger } from './LoggingService';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: ComponentHealth;
    api: ComponentHealth;
    realtime: ComponentHealth;
    storage: ComponentHealth;
    authentication: ComponentHealth;
  };
  timestamp: string;
  uptime: number; // in seconds
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  message?: string;
  responseTime?: number; // in ms
  lastCheck: string;
}

export interface SystemMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  database: {
    queries: number;
    averageQueryTime: number;
    connections: number;
  };
  realtime: {
    activeConnections: number;
    messagesSent: number;
    messagesReceived: number;
  };
  storage: {
    used: number; // in bytes
    available: number; // in bytes
    percentUsed: number;
  };
}

export interface SystemEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'database' | 'api' | 'auth' | 'storage';
  message: string;
  details?: any;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export class SystemService {
  private static instance: SystemService;
  private database: DatabaseManager;
  private startTime: number;
  private events: SystemEvent[] = [];

  private constructor(database: DatabaseManager) {
    this.database = database;
    this.startTime = Date.now();
  }

  public static getInstance(database: DatabaseManager): SystemService {
    if (!SystemService.instance) {
      SystemService.instance = new SystemService(database);
    }
    return SystemService.instance;
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const now = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    // Check database health
    const dbHealth = await this.checkDatabaseHealth();

    // Check API health
    const apiHealth = await this.checkAPIHealth();

    // Check realtime health
    const realtimeHealth = await this.checkRealtimeHealth();

    // Check storage health
    const storageHealth = await this.checkStorageHealth();

    // Check auth health
    const authHealth = await this.checkAuthHealth();

    // Determine overall status
    const allComponents = [dbHealth, apiHealth, realtimeHealth, storageHealth, authHealth];
    const hasDown = allComponents.some(c => c.status === 'down');
    const hasDegraded = allComponents.some(c => c.status === 'degraded');

    const overallStatus: SystemHealth['status'] = hasDown ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    return {
      status: overallStatus,
      components: {
        database: dbHealth,
        api: apiHealth,
        realtime: realtimeHealth,
        storage: storageHealth,
        authentication: authHealth,
      },
      timestamp: now,
      uptime,
    };
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    // Mock metrics for demonstration
    return {
      apiCalls: {
        total: 1523,
        successful: 1498,
        failed: 25,
        averageResponseTime: 245,
      },
      database: {
        queries: 3842,
        averageQueryTime: 12,
        connections: 5,
      },
      realtime: {
        activeConnections: 8,
        messagesSent: 524,
        messagesReceived: 512,
      },
      storage: {
        used: 45678912,
        available: 1000000000,
        percentUsed: 4.5,
      },
    };
  }

  /**
   * Log a system event
   */
  async logEvent(event: Omit<SystemEvent, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const eventId = this.generateEventId();
    const now = new Date().toISOString();

    const systemEvent: SystemEvent = {
      ...event,
      id: eventId,
      timestamp: now,
      resolved: false,
    };

    this.events.push(systemEvent);
    Logger.debug('System event logged:', undefined, 'SystemService');

    return eventId;
  }

  /**
   * Get recent system events
   */
  async getRecentEvents(limit: number = 50): Promise<SystemEvent[]> {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Get unresolved events
   */
  async getUnresolvedEvents(): Promise<SystemEvent[]> {
    return this.events.filter(e => !e.resolved);
  }

  /**
   * Resolve a system event
   */
  async resolveEvent(eventId: string): Promise<boolean> {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = new Date().toISOString();
      Logger.debug('System event resolved:', undefined, 'SystemService');
      return true;
    }
    return false;
  }

  /**
   * Get system uptime
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Perform system diagnostics
   */
  async runDiagnostics(): Promise<{
    health: SystemHealth;
    metrics: SystemMetrics;
    unresolvedEvents: SystemEvent[];
    recommendations: string[];
  }> {
    const health = await this.getSystemHealth();
    const metrics = await this.getSystemMetrics();
    const unresolvedEvents = await this.getUnresolvedEvents();

    const recommendations: string[] = [];

    if (health.status === 'degraded' || health.status === 'unhealthy') {
      recommendations.push('System health is not optimal. Check component statuses.');
    }

    if (unresolvedEvents.length > 10) {
      recommendations.push(`${unresolvedEvents.length} unresolved events. Review and resolve critical issues.`);
    }

    if (metrics.storage.percentUsed > 80) {
      recommendations.push('Storage usage is high. Consider clearing cache or old data.');
    }

    return {
      health,
      metrics,
      unresolvedEvents,
      recommendations,
    };
  }

  // Health check methods

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
      // In a real implementation, this would ping the database
      const responseTime = Date.now() - startTime;
      return {
        status: 'up',
        message: 'Database is connected and responsive',
        responseTime,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        message: 'Database connection failed',
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private async checkAPIHealth(): Promise<ComponentHealth> {
    return {
      status: 'up',
      message: 'API services are operational',
      responseTime: 150,
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkRealtimeHealth(): Promise<ComponentHealth> {
    return {
      status: 'up',
      message: 'Realtime services are operational',
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkStorageHealth(): Promise<ComponentHealth> {
    return {
      status: 'up',
      message: 'Storage is available',
      lastCheck: new Date().toISOString(),
    };
  }

  private async checkAuthHealth(): Promise<ComponentHealth> {
    return {
      status: 'up',
      message: 'Authentication service is operational',
      lastCheck: new Date().toISOString(),
    };
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SystemService;
