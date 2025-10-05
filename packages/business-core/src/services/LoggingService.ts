/**
 * 🔍 Logging Service
 * Centralized logging with log levels, formatting, and production safety
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class LoggingService {
  private static instance: LoggingService;
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Debug level logging - only in development
   */
  public debug(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data, context);
    }
  }

  /**
   * Info level logging
   */
  public info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Warning level logging
   */
  public warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Error level logging
   */
  public error(message: string, error?: Error | any, context?: string): void {
    this.log(LogLevel.ERROR, message, error, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    };

    // Add to history
    this.addToHistory(entry);

    // Console output in development
    if (this.isDevelopment) {
      this.logToConsole(entry);
    }

    // In production, only log errors and warnings
    if (!this.isDevelopment && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      this.logToConsole(entry);
      
      // Send to remote logging service
      this.sendToRemoteLogging(entry).catch((error) => {
        console.warn('Failed to send log to remote service:', error);
      });
    }
  }

  /**
   * Format and output to console
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * Add entry to circular history buffer
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Get recent log history
   */
  public getHistory(limit?: number): LogEntry[] {
    const logs = this.logHistory;
    return limit ? logs.slice(-limit) : logs;
  }

  /**
   * Clear log history
   */
  public clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Get logs filtered by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logHistory.filter((entry) => entry.level === level);
  }

  /**
   * Send log entry to remote logging service
   */
  private async sendToRemoteLogging(entry: LogEntry): Promise<void> {
    try {
      // Try multiple remote logging services in order of preference
      const services = [
        this.sendToSentry(entry),
        this.sendToLogRocket(entry),
        this.sendToCustomEndpoint(entry),
      ];

      // Try each service until one succeeds
      for (const service of services) {
        try {
          await service;
          return; // Success, no need to try other services
        } catch (error) {
          // Continue to next service
          continue;
        }
      }
    } catch (error) {
      // All services failed, but don't throw to avoid breaking the app
      console.warn('All remote logging services failed:', error);
    }
  }

  /**
   * Send to Sentry
   */
  private async sendToSentry(entry: LogEntry): Promise<void> {
    if (!process.env.SENTRY_DSN) return;
    
    const Sentry = await import('@sentry/react-native');
    
    if (entry.level === LogLevel.ERROR) {
      Sentry.captureException(new Error(entry.message), {
        tags: { context: entry.context },
        extra: entry.data,
      });
    } else {
      Sentry.addBreadcrumb({
        message: entry.message,
        level: entry.level.toLowerCase() as any,
        data: entry.data,
        category: entry.context,
      });
    }
  }

  /**
   * Send to LogRocket
   */
  private async sendToLogRocket(entry: LogEntry): Promise<void> {
    if (!process.env.LOGROCKET_APP_ID) return;
    
    const LogRocket = await import('logrocket');
    LogRocket.log(entry.message, {
      level: entry.level,
      context: entry.context,
      data: entry.data,
      timestamp: entry.timestamp,
    });
  }

  /**
   * Send to custom logging endpoint
   */
  private async sendToCustomEndpoint(entry: LogEntry): Promise<void> {
    if (!process.env.LOGGING_ENDPOINT) return;
    
    await fetch(process.env.LOGGING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        service: 'cyntientops-mobile',
        version: process.env.APP_VERSION || '1.0.0',
      }),
    });
  }
}

// Export singleton instance
export const Logger = LoggingService.getInstance();

// Export type for external use
export type { LogEntry };
