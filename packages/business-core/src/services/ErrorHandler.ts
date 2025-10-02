/**
 * 🚨 Error Handler Service
 * Purpose: Comprehensive error handling, logging, and recovery
 */

import { Logger } from './LoggingService';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  API = 'api',
  SECURITY = 'security',
  SYSTEM = 'system',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service'
}

export interface ErrorContext {
  userId?: string;
  buildingId?: string;
  taskId?: string;
  operation?: string;
  component?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: ErrorContext;
  stack?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  userMessage?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorHistory: ErrorDetails[] = [];
  private readonly MAX_ERROR_HISTORY = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(
    error: Error | unknown,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
  ): ErrorDetails {
    const errorDetails = this.createErrorDetails(error, category, severity, context);
    
    // Log the error
    this.logError(errorDetails);
    
    // Store in history
    this.storeError(errorDetails);
    
    // Handle based on severity
    this.handleBySeverity(errorDetails);
    
    return errorDetails;
  }

  private createErrorDetails(
    error: Error | unknown,
    category: ErrorCategory,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): ErrorDetails {
    const timestamp = new Date();
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let stack: string | undefined;
    let recoverable = true;
    let retryable = false;
    let userMessage: string | undefined;

    if (error instanceof Error) {
      code = error.name || 'ERROR';
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
      code = 'STRING_ERROR';
    } else if (error && typeof error === 'object') {
      message = JSON.stringify(error);
      code = 'OBJECT_ERROR';
    }

    // Determine if error is recoverable and retryable
    ({ recoverable, retryable, userMessage } = this.analyzeError(code, message, category, severity));

    return {
      code,
      message,
      severity,
      category,
      context,
      stack,
      timestamp,
      recoverable,
      retryable,
      userMessage
    };
  }

  private analyzeError(
    code: string,
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity
  ): { recoverable: boolean; retryable: boolean; userMessage?: string } {
    let recoverable = true;
    let retryable = false;
    let userMessage: string | undefined;

    // Network errors are usually retryable
    if (category === ErrorCategory.NETWORK) {
      retryable = true;
      userMessage = 'Network connection issue. Please check your internet connection.';
    }

    // Authentication errors are not retryable but recoverable
    if (category === ErrorCategory.AUTHENTICATION) {
      retryable = false;
      recoverable = true;
      userMessage = 'Authentication failed. Please log in again.';
    }

    // Authorization errors are not retryable
    if (category === ErrorCategory.AUTHORIZATION) {
      retryable = false;
      recoverable = false;
      userMessage = 'You do not have permission to perform this action.';
    }

    // Validation errors are not retryable
    if (category === ErrorCategory.VALIDATION) {
      retryable = false;
      recoverable = true;
      userMessage = 'Invalid input provided. Please check your data.';
    }

    // Database errors might be retryable
    if (category === ErrorCategory.DATABASE) {
      retryable = true;
      userMessage = 'Database operation failed. Please try again.';
    }

    // Critical errors are not recoverable
    if (severity === ErrorSeverity.CRITICAL) {
      recoverable = false;
      retryable = false;
      userMessage = 'A critical error occurred. Please contact support.';
    }

    return { recoverable, retryable, userMessage };
  }

  private logError(errorDetails: ErrorDetails): void {
    const logMessage = `[${errorDetails.category.toUpperCase()}] ${errorDetails.code}: ${errorDetails.message}`;
    
    switch (errorDetails.severity) {
      case ErrorSeverity.LOW:
        Logger.debug(logMessage, errorDetails.context, 'ErrorHandler');
        break;
      case ErrorSeverity.MEDIUM:
        Logger.warn(logMessage, errorDetails.context, 'ErrorHandler');
        break;
      case ErrorSeverity.HIGH:
        Logger.error(logMessage, errorDetails.context, 'ErrorHandler');
        break;
      case ErrorSeverity.CRITICAL:
        Logger.error(`🚨 CRITICAL ERROR: ${logMessage}`, errorDetails.context, 'ErrorHandler');
        break;
    }

    // Log stack trace for high and critical errors
    if (errorDetails.severity === ErrorSeverity.HIGH || errorDetails.severity === ErrorSeverity.CRITICAL) {
      if (errorDetails.stack) {
        Logger.error('Stack trace:', { stack: errorDetails.stack }, 'ErrorHandler');
      }
    }
  }

  private storeError(errorDetails: ErrorDetails): void {
    this.errorHistory.push(errorDetails);
    
    // Keep only the most recent errors
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory = this.errorHistory.slice(-this.MAX_ERROR_HISTORY);
    }
  }

  private handleBySeverity(errorDetails: ErrorDetails): void {
    switch (errorDetails.severity) {
      case ErrorSeverity.CRITICAL:
        this.handleCriticalError(errorDetails);
        break;
      case ErrorSeverity.HIGH:
        this.handleHighSeverityError(errorDetails);
        break;
      case ErrorSeverity.MEDIUM:
        this.handleMediumSeverityError(errorDetails);
        break;
      case ErrorSeverity.LOW:
        this.handleLowSeverityError(errorDetails);
        break;
    }
  }

  private handleCriticalError(errorDetails: ErrorDetails): void {
    // Critical errors require immediate attention
    Logger.error('🚨 CRITICAL ERROR DETECTED - IMMEDIATE ACTION REQUIRED', errorDetails, 'ErrorHandler');
    
    // In a real application, this would:
    // - Send alerts to administrators
    // - Create incident tickets
    // - Potentially trigger system shutdown procedures
  }

  private handleHighSeverityError(errorDetails: ErrorDetails): void {
    // High severity errors should be monitored
    Logger.error('⚠️ HIGH SEVERITY ERROR DETECTED', errorDetails, 'ErrorHandler');
    
    // In a real application, this would:
    // - Send notifications to administrators
    // - Log to external monitoring systems
  }

  private handleMediumSeverityError(errorDetails: ErrorDetails): void {
    // Medium severity errors are logged and monitored
    Logger.warn('⚠️ MEDIUM SEVERITY ERROR DETECTED', errorDetails, 'ErrorHandler');
  }

  private handleLowSeverityError(errorDetails: ErrorDetails): void {
    // Low severity errors are logged for debugging
    Logger.debug('ℹ️ LOW SEVERITY ERROR DETECTED', errorDetails, 'ErrorHandler');
  }

  public getErrorHistory(limit: number = 100): ErrorDetails[] {
    return this.errorHistory.slice(-limit);
  }

  public getErrorsByCategory(category: ErrorCategory, limit: number = 100): ErrorDetails[] {
    return this.errorHistory
      .filter(error => error.category === category)
      .slice(-limit);
  }

  public getErrorsBySeverity(severity: ErrorSeverity, limit: number = 100): ErrorDetails[] {
    return this.errorHistory
      .filter(error => error.severity === severity)
      .slice(-limit);
  }

  public getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    const recent = this.errorHistory.filter(error => 
      error.timestamp.getTime() > oneHourAgo
    ).length;

    const byCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = this.errorHistory.filter(error => error.category === category).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorHistory.filter(error => error.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    return {
      total: this.errorHistory.length,
      byCategory,
      bySeverity,
      recent
    };
  }

  public clearErrorHistory(): void {
    this.errorHistory = [];
    Logger.info('Error history cleared', undefined, 'ErrorHandler');
  }

  // Utility methods for common error scenarios
  public handleValidationError(field: string, value: any, rule: string): ErrorDetails {
    return this.handleError(
      new Error(`Validation failed for field '${field}': ${rule}`),
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      { metadata: { field, value, rule } }
    );
  }

  public handleAuthenticationError(userId?: string): ErrorDetails {
    return this.handleError(
      new Error('Authentication failed'),
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      { userId }
    );
  }

  public handleAuthorizationError(userId: string, resource: string): ErrorDetails {
    return this.handleError(
      new Error(`Access denied to resource: ${resource}`),
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      { userId, metadata: { resource } }
    );
  }

  public handleNetworkError(operation: string, url?: string): ErrorDetails {
    return this.handleError(
      new Error(`Network error during ${operation}`),
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      { operation, metadata: { url } }
    );
  }

  public handleDatabaseError(operation: string, table?: string): ErrorDetails {
    return this.handleError(
      new Error(`Database error during ${operation}`),
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      { operation, metadata: { table } }
    );
  }

  public handleAPIError(service: string, endpoint: string, status?: number): ErrorDetails {
    return this.handleError(
      new Error(`API error from ${service}: ${endpoint}${status ? ` (${status})` : ''}`),
      ErrorCategory.API,
      ErrorSeverity.MEDIUM,
      { metadata: { service, endpoint, status } }
    );
  }
}
