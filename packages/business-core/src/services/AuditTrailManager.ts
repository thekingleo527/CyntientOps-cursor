/**
 * 📋 Audit Trail Manager
 * Purpose: Comprehensive audit trail and logging for compliance and security
 */

import { DatabaseManager } from '@cyntientops/database';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './ErrorHandler';
import { Logger } from './LoggingService';

export enum AuditEventType {
  // Authentication & Authorization
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  
  // Data Operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  
  // System Operations
  SYSTEM_START = 'system_start',
  SYSTEM_STOP = 'system_stop',
  CONFIGURATION_CHANGE = 'configuration_change',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  
  // Security Events
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH = 'data_breach',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  
  // Business Operations
  TASK_CREATED = 'task_created',
  TASK_COMPLETED = 'task_completed',
  TASK_ASSIGNED = 'task_assigned',
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BUILDING_ACCESS = 'building_access',
  VENDOR_ACCESS = 'vendor_access',
  
  // Compliance
  COMPLIANCE_CHECK = 'compliance_check',
  AUDIT_PERFORMED = 'audit_performed',
  POLICY_VIOLATION = 'policy_violation',
  
  // API Operations
  API_CALL = 'api_call',
  API_ERROR = 'api_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  COMPLIANCE = 'compliance',
  API = 'api'
}

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  outcome: 'success' | 'failure' | 'partial';
  errorCode?: string;
  errorMessage?: string;
  timestamp: Date;
  createdAt: Date;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType;
  category?: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  outcome?: 'success' | 'failure' | 'partial';
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByCategory: Record<AuditCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByOutcome: Record<string, number>;
  recentEvents: number;
  criticalEvents: number;
}

export class AuditTrailManager {
  private static instance: AuditTrailManager;
  private database: DatabaseManager;
  private errorHandler: ErrorHandler;

  private constructor(database: DatabaseManager) {
    this.database = database;
    this.errorHandler = ErrorHandler.getInstance();
  }

  public static getInstance(database: DatabaseManager): AuditTrailManager {
    if (!AuditTrailManager.instance) {
      AuditTrailManager.instance = new AuditTrailManager(database);
    }
    return AuditTrailManager.instance;
  }

  public async logEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const auditEvent: AuditEvent = {
        ...event,
        id,
        createdAt: now
      };

      await this.database.execute(
        `INSERT INTO audit_events (id, event_type, category, severity, user_id, session_id, 
         resource_type, resource_id, action, description, details, ip_address, user_agent, 
         location, outcome, error_code, error_message, timestamp, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditEvent.id,
          auditEvent.eventType,
          auditEvent.category,
          auditEvent.severity,
          auditEvent.userId,
          auditEvent.sessionId,
          auditEvent.resourceType,
          auditEvent.resourceId,
          auditEvent.action,
          auditEvent.description,
          auditEvent.details ? JSON.stringify(auditEvent.details) : null,
          auditEvent.ipAddress,
          auditEvent.userAgent,
          auditEvent.location ? JSON.stringify(auditEvent.location) : null,
          auditEvent.outcome,
          auditEvent.errorCode,
          auditEvent.errorMessage,
          auditEvent.timestamp.toISOString(),
          auditEvent.createdAt.toISOString()
        ]
      );

      // Log to application logger based on severity
      this.logToApplicationLogger(auditEvent);

      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  private logToApplicationLogger(event: AuditEvent): void {
    const logMessage = `[AUDIT] ${event.eventType}: ${event.description}`;
    const context = {
      auditEventId: event.id,
      userId: event.userId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome
    };

    switch (event.severity) {
      case AuditSeverity.LOW:
        Logger.debug(logMessage, context, 'AuditTrailManager');
        break;
      case AuditSeverity.MEDIUM:
        Logger.info(logMessage, context, 'AuditTrailManager');
        break;
      case AuditSeverity.HIGH:
        Logger.warn(logMessage, context, 'AuditTrailManager');
        break;
      case AuditSeverity.CRITICAL:
        Logger.error(`🚨 CRITICAL AUDIT EVENT: ${logMessage}`, context, 'AuditTrailManager');
        break;
    }
  }

  public async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      let sql = 'SELECT * FROM audit_events WHERE 1=1';
      const params: any[] = [];

      if (query.startDate) {
        sql += ' AND timestamp >= ?';
        params.push(query.startDate.toISOString());
      }

      if (query.endDate) {
        sql += ' AND timestamp <= ?';
        params.push(query.endDate.toISOString());
      }

      if (query.userId) {
        sql += ' AND user_id = ?';
        params.push(query.userId);
      }

      if (query.eventType) {
        sql += ' AND event_type = ?';
        params.push(query.eventType);
      }

      if (query.category) {
        sql += ' AND category = ?';
        params.push(query.category);
      }

      if (query.severity) {
        sql += ' AND severity = ?';
        params.push(query.severity);
      }

      if (query.resourceType) {
        sql += ' AND resource_type = ?';
        params.push(query.resourceType);
      }

      if (query.resourceId) {
        sql += ' AND resource_id = ?';
        params.push(query.resourceId);
      }

      if (query.outcome) {
        sql += ' AND outcome = ?';
        params.push(query.outcome);
      }

      sql += ' ORDER BY timestamp DESC';

      if (query.limit) {
        sql += ' LIMIT ?';
        params.push(query.limit);
      }

      if (query.offset) {
        sql += ' OFFSET ?';
        params.push(query.offset);
      }

      const result = await this.database.query<AuditEvent>(sql, params);

      return result.map(event => ({
        ...event,
        details: event.details ? JSON.parse(event.details) : undefined,
        location: event.location ? JSON.parse(event.location) : undefined,
        timestamp: new Date(event.timestamp),
        createdAt: new Date(event.createdAt)
      }));
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  public async getAuditStats(startDate?: Date, endDate?: Date): Promise<AuditStats> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      
      const start = startDate || oneHourAgo;
      const end = endDate || now;

      const [totalEvents, eventsByType, eventsByCategory, eventsBySeverity, eventsByOutcome, recentEvents, criticalEvents] = await Promise.all([
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM audit_events WHERE timestamp BETWEEN ? AND ?',
          [start.toISOString(), end.toISOString()]
        ),
        this.database.query<{event_type: AuditEventType, count: number}>(
          'SELECT event_type, COUNT(*) as count FROM audit_events WHERE timestamp BETWEEN ? AND ? GROUP BY event_type',
          [start.toISOString(), end.toISOString()]
        ),
        this.database.query<{category: AuditCategory, count: number}>(
          'SELECT category, COUNT(*) as count FROM audit_events WHERE timestamp BETWEEN ? AND ? GROUP BY category',
          [start.toISOString(), end.toISOString()]
        ),
        this.database.query<{severity: AuditSeverity, count: number}>(
          'SELECT severity, COUNT(*) as count FROM audit_events WHERE timestamp BETWEEN ? AND ? GROUP BY severity',
          [start.toISOString(), end.toISOString()]
        ),
        this.database.query<{outcome: string, count: number}>(
          'SELECT outcome, COUNT(*) as count FROM audit_events WHERE timestamp BETWEEN ? AND ? GROUP BY outcome',
          [start.toISOString(), end.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM audit_events WHERE timestamp > ?',
          [oneHourAgo.toISOString()]
        ),
        this.database.query<{count: number}>(
          'SELECT COUNT(*) as count FROM audit_events WHERE severity = "critical" AND timestamp BETWEEN ? AND ?',
          [start.toISOString(), end.toISOString()]
        )
      ]);

      // Convert arrays to objects
      const eventsByTypeObj = Object.values(AuditEventType).reduce((acc, type) => {
        acc[type] = eventsByType.find(e => e.event_type === type)?.count || 0;
        return acc;
      }, {} as Record<AuditEventType, number>);

      const eventsByCategoryObj = Object.values(AuditCategory).reduce((acc, category) => {
        acc[category] = eventsByCategory.find(e => e.category === category)?.count || 0;
        return acc;
      }, {} as Record<AuditCategory, number>);

      const eventsBySeverityObj = Object.values(AuditSeverity).reduce((acc, severity) => {
        acc[severity] = eventsBySeverity.find(e => e.severity === severity)?.count || 0;
        return acc;
      }, {} as Record<AuditSeverity, number>);

      const eventsByOutcomeObj = eventsByOutcome.reduce((acc, event) => {
        acc[event.outcome] = event.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents: totalEvents[0]?.count || 0,
        eventsByType: eventsByTypeObj,
        eventsByCategory: eventsByCategoryObj,
        eventsBySeverity: eventsBySeverityObj,
        eventsByOutcome: eventsByOutcomeObj,
        recentEvents: recentEvents[0]?.count || 0,
        criticalEvents: criticalEvents[0]?.count || 0
      };
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  // Convenience methods for common audit events
  public async logAuthentication(userId: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<string> {
    return this.logEvent({
      eventType: success ? AuditEventType.LOGIN : AuditEventType.LOGIN_FAILED,
      category: AuditCategory.AUTHENTICATION,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      userId,
      action: success ? 'User logged in' : 'Login attempt failed',
      description: success ? `User ${userId} successfully logged in` : `Failed login attempt for user ${userId}`,
      outcome: success ? 'success' : 'failure',
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  }

  public async logDataAccess(userId: string, resourceType: string, resourceId: string, action: string): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.READ,
      category: AuditCategory.DATA_ACCESS,
      severity: AuditSeverity.LOW,
      userId,
      resourceType,
      resourceId,
      action,
      description: `User ${userId} accessed ${resourceType} ${resourceId}`,
      outcome: 'success',
      timestamp: new Date()
    });
  }

  public async logDataModification(userId: string, resourceType: string, resourceId: string, action: string, details?: Record<string, any>): Promise<string> {
    return this.logEvent({
      eventType: AuditEventType.UPDATE,
      category: AuditCategory.DATA_MODIFICATION,
      severity: AuditSeverity.MEDIUM,
      userId,
      resourceType,
      resourceId,
      action,
      description: `User ${userId} modified ${resourceType} ${resourceId}`,
      details,
      outcome: 'success',
      timestamp: new Date()
    });
  }

  public async logSecurityEvent(eventType: AuditEventType, description: string, severity: AuditSeverity = AuditSeverity.HIGH, details?: Record<string, any>): Promise<string> {
    return this.logEvent({
      eventType,
      category: AuditCategory.SECURITY,
      severity,
      action: 'Security event detected',
      description,
      details,
      outcome: 'failure',
      timestamp: new Date()
    });
  }

  public async logBusinessEvent(eventType: AuditEventType, userId: string, description: string, resourceType?: string, resourceId?: string): Promise<string> {
    return this.logEvent({
      eventType,
      category: AuditCategory.BUSINESS,
      severity: AuditSeverity.LOW,
      userId,
      resourceType,
      resourceId,
      action: 'Business operation',
      description,
      outcome: 'success',
      timestamp: new Date()
    });
  }

  public async logAPIEvent(endpoint: string, method: string, statusCode: number, userId?: string, duration?: number): Promise<string> {
    const eventType = statusCode >= 400 ? AuditEventType.API_ERROR : AuditEventType.API_CALL;
    const severity = statusCode >= 500 ? AuditSeverity.HIGH : statusCode >= 400 ? AuditSeverity.MEDIUM : AuditSeverity.LOW;
    
    return this.logEvent({
      eventType,
      category: AuditCategory.API,
      severity,
      userId,
      action: `${method} ${endpoint}`,
      description: `API call to ${endpoint} returned ${statusCode}`,
      details: { endpoint, method, statusCode, duration },
      outcome: statusCode < 400 ? 'success' : 'failure',
      timestamp: new Date()
    });
  }

  // Data retention and cleanup
  public async cleanupOldEvents(retentionDays: number = 2555): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.database.execute(
        'DELETE FROM audit_events WHERE timestamp < ?',
        [cutoffDate.toISOString()]
      );

      Logger.info(`Cleaned up ${result.changes} old audit events`, { retentionDays, cutoffDate }, 'AuditTrailManager');
      return result.changes || 0;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  // Export functionality for compliance
  public async exportAuditTrail(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const events = await this.queryEvents(query);
      
      if (format === 'csv') {
        return this.convertToCSV(events);
      } else {
        return JSON.stringify(events, null, 2);
      }
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID', 'Event Type', 'Category', 'Severity', 'User ID', 'Session ID',
      'Resource Type', 'Resource ID', 'Action', 'Description', 'IP Address',
      'User Agent', 'Outcome', 'Error Code', 'Error Message', 'Timestamp'
    ];

    const rows = events.map(event => [
      event.id,
      event.eventType,
      event.category,
      event.severity,
      event.userId || '',
      event.sessionId || '',
      event.resourceType || '',
      event.resourceId || '',
      event.action,
      event.description,
      event.ipAddress || '',
      event.userAgent || '',
      event.outcome,
      event.errorCode || '',
      event.errorMessage || '',
      event.timestamp.toISOString()
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  // Utility methods
  private generateId(): string {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  public async initializeTables(): Promise<void> {
    try {
      const table = `
        CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          category TEXT NOT NULL,
          severity TEXT NOT NULL,
          user_id TEXT,
          session_id TEXT,
          resource_type TEXT,
          resource_id TEXT,
          action TEXT NOT NULL,
          description TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          user_agent TEXT,
          location TEXT,
          outcome TEXT NOT NULL,
          error_code TEXT,
          error_message TEXT,
          timestamp TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `;

      await this.database.execute(table);

      // Create indexes for better query performance
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp)',
        'CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type)',
        'CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(category)',
        'CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity)',
        'CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id)',
        'CREATE INDEX IF NOT EXISTS idx_audit_events_outcome ON audit_events(outcome)'
      ];

      for (const index of indexes) {
        await this.database.execute(index);
      }

      Logger.info('Audit trail tables initialized', undefined, 'AuditTrailManager');
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.CRITICAL);
      throw error;
    }
  }
}
