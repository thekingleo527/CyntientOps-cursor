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

    // Initialize Sentry for error tracking (optional, only if available)
    try {
      if (process.env.SENTRY_DSN) {
        // Avoid static import to prevent bundler resolution when dependency isn't installed
        const req: any = (0, eval)('require');
        const Sentry = req?.('@sentry/react-native');
        if (Sentry && typeof Sentry.init === 'function') {
          Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            debug: process.env.NODE_ENV === 'development',
          });
          this.sentryEnabled = true;
          Logger.info('Sentry initialized successfully', undefined, 'ProductionMonitoring');
        } else {
          Logger.warn('Sentry not installed; skipping initialization', undefined, 'ProductionMonitoring');
        }
      }
    } catch (error) {
      Logger.warn('Sentry initialization failed:', error, 'ProductionMonitoring');
    }

    // Initialize Analytics (optional RN Firebase analytics if present)
    try {
      if (process.env.ANALYTICS_KEY) {
        const req: any = (0, eval)('require');
        const analytics = req?.('@react-native-firebase/analytics');
        if (analytics) {
          this.analyticsEnabled = true;
          Logger.info('Analytics initialized successfully', undefined, 'ProductionMonitoring');
        } else {
          Logger.warn('Analytics module not installed; skipping initialization', undefined, 'ProductionMonitoring');
        }
      }
    } catch (error) {
      Logger.warn('Analytics initialization failed:', error, 'ProductionMonitoring');
    }

    Logger.info('Production monitoring initialized', undefined, 'ProductionMonitoring');
  }

  /**
   * Set current user for context
   */
  setUser(userId: string, userInfo?: Record<string, any>) {
    this.userId = userId;

    if (this.sentryEnabled) {
      try {
        const req: any = (0, eval)('require');
        const Sentry = req?.('@sentry/react-native');
        if (Sentry?.setUser) {
          Sentry.setUser({ id: userId, ...userInfo });
        }
      } catch (error) {
        Logger.warn('Sentry setUser failed:', error, 'ProductionMonitoring');
      }
    }

    if (this.analyticsEnabled) {
      try {
        const req: any = (0, eval)('require');
        const analytics = req?.('@react-native-firebase/analytics');
        analytics && analytics().setUserId(userId);
      } catch (error) {
        Logger.warn('Analytics setUserId failed:', error, 'ProductionMonitoring');
      }
    }

    Logger.info('User context set', { userId }, 'ProductionMonitoring');
  }

  /**
   * Clear user context (on logout)
   */
  clearUser() {
    this.userId = null;

    if (this.sentryEnabled) {
      try {
        import('@sentry/react-native').then((Sentry) => {
          Sentry.setUser(null);
        }).catch((error) => {
          Logger.warn('Failed to clear Sentry user:', error, 'ProductionMonitoring');
        });
      } catch (error) {
        Logger.warn('Sentry clearUser failed:', error, 'ProductionMonitoring');
      }
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
      try {
        // Send performance metrics to external monitoring service
        if (process.env.MONITORING_ENDPOINT) {
          fetch(process.env.MONITORING_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'performance',
              metric,
              timestamp: new Date().toISOString(),
              userId: this.userId,
            }),
          }).catch((error) => {
            Logger.warn('Failed to send performance metric to monitoring service:', error, 'ProductionMonitoring');
          });
        }
      } catch (error) {
        Logger.warn('Monitoring service integration failed:', error, 'ProductionMonitoring');
      }
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
      try {
        const req: any = (0, eval)('require');
        const Sentry = req?.('@sentry/react-native');
        if (Sentry?.captureException) {
          Sentry.captureException(error, {
            tags: { context },
            extra: metadata,
            user: this.userId ? { id: this.userId } : undefined,
          });
        }
      } catch (error) {
        Logger.warn('Sentry captureException failed:', error, 'ProductionMonitoring');
      }
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
      try {
        const req: any = (0, eval)('require');
        const analytics = req?.('@react-native-firebase/analytics');
        analytics && analytics().logEvent(event, properties);
      } catch (error) {
        Logger.warn('Analytics track failed:', error, 'ProductionMonitoring');
      }
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
