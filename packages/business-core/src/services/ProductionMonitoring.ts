/**
 * 📊 Production Monitoring Service
 * Performance tracking, error monitoring, and analytics
 * Ready for Sentry, LogRocket, or custom monitoring
 */

import { Logger } from './LoggingService';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

export class ProductionMonitoring {
  private static instance: ProductionMonitoring;
  private performanceMetrics: PerformanceMetric[] = [];
  private errorReports: ErrorReport[] = [];
  private analyticsEvents: AnalyticsEvent[] = [];
  private maxHistorySize: number = 100;
  private userId: string | null = null;

  // Monitoring providers (to be configured)
  private sentryEnabled: boolean = false;
  private analyticsEnabled: boolean = false;

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): ProductionMonitoring {
    if (!ProductionMonitoring.instance) {
      ProductionMonitoring.instance = new ProductionMonitoring();
    }
    return ProductionMonitoring.instance;
  }

  /**
   * Initialize monitoring providers
   */
  private initializeMonitoring() {
    if (__DEV__) {
      Logger.info('Production monitoring initialized (dev mode)', undefined, 'ProductionMonitoring');
      return;
    }

    // TODO: Initialize Sentry
    // Sentry.init({ dsn: process.env.SENTRY_DSN });
    // this.sentryEnabled = true;

    // TODO: Initialize Analytics (Firebase, Amplitude, etc.)
    // Analytics.init({ apiKey: process.env.ANALYTICS_KEY });
    // this.analyticsEnabled = true;

    Logger.info('Production monitoring initialized', undefined, 'ProductionMonitoring');
  }

  /**
   * Set current user for context
   */
  setUser(userId: string, userInfo?: Record<string, any>) {
    this.userId = userId;

    if (this.sentryEnabled) {
      // TODO: Sentry.setUser({ id: userId, ...userInfo });
    }

    if (this.analyticsEnabled) {
      // TODO: Analytics.setUserId(userId);
    }

    Logger.info('User context set', { userId }, 'ProductionMonitoring');
  }

  /**
   * Clear user context (on logout)
   */
  clearUser() {
    this.userId = null;

    if (this.sentryEnabled) {
      // TODO: Sentry.setUser(null);
    }

    Logger.info('User context cleared', undefined, 'ProductionMonitoring');
  }

  /**
   * Track performance metric
   */
  trackPerformance(name: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.performanceMetrics.push(metric);
    this.trimHistory(this.performanceMetrics);

    // Log slow operations
    if (duration > 1000) {
      Logger.warn(`Slow operation detected: ${name}`, { duration, metadata }, 'ProductionMonitoring');
    } else {
      Logger.debug(`Performance tracked: ${name}`, { duration }, 'ProductionMonitoring');
    }

    // Send to monitoring service
    if (!__DEV__) {
      // TODO: Send to your monitoring service
    }
  }

  /**
   * Report error with context
   */
  reportError(error: Error, context: string, metadata?: Record<string, any>) {
    const report: ErrorReport = {
      error,
      context,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      metadata,
    };

    this.errorReports.push(report);
    this.trimHistory(this.errorReports);

    Logger.error(`Error reported: ${context}`, error, 'ProductionMonitoring');

    if (this.sentryEnabled) {
      // TODO: Sentry.captureException(error, { tags: { context }, extra: metadata });
    }
  }

  /**
   * Track analytics event
   */
  trackEvent(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    this.analyticsEvents.push(analyticsEvent);
    this.trimHistory(this.analyticsEvents);

    Logger.debug(`Event tracked: ${event}`, properties, 'ProductionMonitoring');

    if (this.analyticsEnabled) {
      // TODO: Analytics.track(event, properties);
    }
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, properties?: Record<string, any>) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track user action
   */
  trackAction(actionName: string, properties?: Record<string, any>) {
    this.trackEvent('user_action', {
      action: actionName,
      ...properties,
    });
  }

  /**
   * Measure async operation performance
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.trackPerformance(name, duration, metadata);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.trackPerformance(name, duration, { ...metadata, failed: true });
      this.reportError(error as Error, name, metadata);

      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    count: number;
    averageDuration: number;
    slowestOperations: PerformanceMetric[];
  } {
    if (this.performanceMetrics.length === 0) {
      return { count: 0, averageDuration: 0, slowestOperations: [] };
    }

    const totalDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / this.performanceMetrics.length;

    const slowestOperations = [...this.performanceMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      count: this.performanceMetrics.length,
      averageDuration,
      slowestOperations,
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary(): {
    count: number;
    recentErrors: ErrorReport[];
    errorsByContext: Record<string, number>;
  } {
    const errorsByContext: Record<string, number> = {};

    this.errorReports.forEach((report) => {
      errorsByContext[report.context] = (errorsByContext[report.context] || 0) + 1;
    });

    return {
      count: this.errorReports.length,
      recentErrors: this.errorReports.slice(-10),
      errorsByContext,
    };
  }

  /**
   * Trim history arrays to max size
   */
  private trimHistory(array: any[]) {
    if (array.length > this.maxHistorySize) {
      array.splice(0, array.length - this.maxHistorySize);
    }
  }

  /**
   * Export monitoring data (for debugging)
   */
  exportData() {
    return {
      performance: this.performanceMetrics,
      errors: this.errorReports,
      analytics: this.analyticsEvents,
      summary: {
        performance: this.getPerformanceSummary(),
        errors: this.getErrorSummary(),
      },
    };
  }
}

// Export singleton
export const monitoring = ProductionMonitoring.getInstance();
