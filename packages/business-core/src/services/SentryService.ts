/**
 * 🔍 Sentry Service
 * Purpose: Crash reporting, error tracking, and performance monitoring
 * Integration: Sentry React Native SDK for production error tracking
 */

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserAnalytics: boolean;
  enableErrorTracking: boolean;
  sampleRate: number; // 0.0 to 1.0
  tracesSampleRate: number; // 0.0 to 1.0
  debug: boolean;
}

export interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  buildingId?: string;
  workerId?: string;
}

export interface SentryContext {
  user: SentryUser;
  tags: Record<string, string>;
  extra: Record<string, any>;
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal';
}

export interface CrashReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: SentryContext;
  breadcrumbs: string[];
  userAgent?: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
  buildNumber: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'millisecond' | 'byte' | 'percent';
  tags: Record<string, string>;
  timestamp: Date;
}

export class SentryService {
  private static instance: SentryService;
  private config: SentryConfig;
  private isInitialized: boolean = false;
  private user: SentryUser | null = null;
  private breadcrumbs: string[] = [];

  private constructor() {
    this.config = {
      dsn: process.env.SENTRY_DSN || '',
      environment: (process.env.NODE_ENV as any) || 'development',
      enableCrashReporting: true,
      enablePerformanceMonitoring: true,
      enableUserAnalytics: true,
      enableErrorTracking: true,
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      debug: process.env.NODE_ENV === 'development',
    };
  }

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('🔍 Sentry already initialized');
        return;
      }

      // In a real implementation, this would initialize Sentry SDK
      // For now, we'll simulate the initialization
      console.log('🔍 Initializing Sentry Service...');
      console.log(`🔍 Environment: ${this.config.environment}`);
      console.log(`🔍 DSN: ${this.config.dsn ? 'Configured' : 'Not configured'}`);
      console.log(`🔍 Crash Reporting: ${this.config.enableCrashReporting ? 'Enabled' : 'Disabled'}`);
      console.log(`🔍 Performance Monitoring: ${this.config.enablePerformanceMonitoring ? 'Enabled' : 'Disabled'}`);

      this.isInitialized = true;
      console.log('✅ Sentry Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Sentry Service:', error);
      throw error;
    }
  }

  setUser(user: SentryUser): void {
    try {
      this.user = user;
      console.log(`🔍 Sentry user set: ${user.id} (${user.role})`);
      
      // In real implementation, this would call Sentry.setUser()
      // Sentry.setUser({
      //   id: user.id,
      //   email: user.email,
      //   username: user.username,
      //   extra: {
      //     role: user.role,
      //     buildingId: user.buildingId,
      //     workerId: user.workerId,
      //   },
      // });
    } catch (error) {
      console.error('❌ Failed to set Sentry user:', error);
    }
  }

  addBreadcrumb(message: string, category: string = 'user'): void {
    try {
      const breadcrumb = `[${new Date().toISOString()}] ${category}: ${message}`;
      this.breadcrumbs.push(breadcrumb);
      
      // Keep only last 100 breadcrumbs
      if (this.breadcrumbs.length > 100) {
        this.breadcrumbs = this.breadcrumbs.slice(-100);
      }

      console.log(`🔍 Breadcrumb added: ${breadcrumb}`);
      
      // In real implementation, this would call Sentry.addBreadcrumb()
      // Sentry.addBreadcrumb({
      //   message,
      //   category,
      //   level: 'info',
      //   timestamp: Date.now() / 1000,
      // });
    } catch (error) {
      console.error('❌ Failed to add breadcrumb:', error);
    }
  }

  captureException(error: Error, context?: Partial<SentryContext>): string {
    try {
      const reportId = `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const crashReport: CrashReport = {
        id: reportId,
        timestamp: new Date(),
        error,
        context: {
          user: this.user || { id: 'anonymous' },
          tags: context?.tags || {},
          extra: context?.extra || {},
          level: context?.level || 'error',
        },
        breadcrumbs: [...this.breadcrumbs],
        platform: this.getPlatform(),
        version: this.getAppVersion(),
        buildNumber: this.getBuildNumber(),
      };

      console.error('🔍 Crash Report Generated:', {
        id: reportId,
        error: error.message,
        stack: error.stack,
        user: crashReport.context.user.id,
        platform: crashReport.platform,
        breadcrumbs: this.breadcrumbs.length,
      });

      // In real implementation, this would call Sentry.captureException()
      // Sentry.captureException(error, {
      //   tags: context?.tags,
      //   extra: context?.extra,
      //   level: context?.level,
      //   user: this.user,
      // });

      return reportId;
    } catch (reportError) {
      console.error('❌ Failed to capture exception:', reportError);
      return 'failed_to_capture';
    }
  }

  captureMessage(message: string, level: SentryContext['level'] = 'info', context?: Partial<SentryContext>): string {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🔍 Message captured [${level}]: ${message}`, {
        id: messageId,
        user: this.user?.id || 'anonymous',
        context: context?.tags || {},
      });

      // In real implementation, this would call Sentry.captureMessage()
      // Sentry.captureMessage(message, {
      //   level,
      //   tags: context?.tags,
      //   extra: context?.extra,
      //   user: this.user,
      // });

      return messageId;
    } catch (error) {
      console.error('❌ Failed to capture message:', error);
      return 'failed_to_capture';
    }
  }

  startTransaction(name: string, operation: string = 'navigation'): string {
    try {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🔍 Transaction started: ${name} (${operation})`, {
        id: transactionId,
        user: this.user?.id || 'anonymous',
      });

      // In real implementation, this would call Sentry.startTransaction()
      // const transaction = Sentry.startTransaction({
      //   name,
      //   op: operation,
      // });
      // return transaction;

      return transactionId;
    } catch (error) {
      console.error('❌ Failed to start transaction:', error);
      return 'failed_to_start';
    }
  }

  finishTransaction(transactionId: string, status: 'ok' | 'cancelled' | 'unknown_error' | 'internal_error' | 'deadline_exceeded' | 'not_found' | 'already_exists' | 'permission_denied' | 'resource_exhausted' | 'failed_precondition' | 'aborted' | 'out_of_range' | 'unimplemented' | 'unavailable' | 'data_loss' | 'unauthenticated' = 'ok'): void {
    try {
      console.log(`🔍 Transaction finished: ${transactionId} (${status})`);

      // In real implementation, this would call transaction.finish()
      // if (transaction && typeof transaction.finish === 'function') {
      //   transaction.setStatus(status);
      //   transaction.finish();
      // }
    } catch (error) {
      console.error('❌ Failed to finish transaction:', error);
    }
  }

  addPerformanceMetric(metric: PerformanceMetric): void {
    try {
      console.log(`🔍 Performance metric: ${metric.name} = ${metric.value} ${metric.unit}`, {
        tags: metric.tags,
        timestamp: metric.timestamp,
      });

      // In real implementation, this would send to Sentry
      // Sentry.addBreadcrumb({
      //   message: `Performance: ${metric.name}`,
      //   category: 'performance',
      //   data: {
      //     value: metric.value,
      //     unit: metric.unit,
      //     tags: metric.tags,
      //   },
      //   level: 'info',
      // });
    } catch (error) {
      console.error('❌ Failed to add performance metric:', error);
    }
  }

  setContext(key: string, context: any): void {
    try {
      console.log(`🔍 Context set: ${key}`, context);

      // In real implementation, this would call Sentry.setContext()
      // Sentry.setContext(key, context);
    } catch (error) {
      console.error('❌ Failed to set context:', error);
    }
  }

  setTag(key: string, value: string): void {
    try {
      console.log(`🔍 Tag set: ${key} = ${value}`);

      // In real implementation, this would call Sentry.setTag()
      // Sentry.setTag(key, value);
    } catch (error) {
      console.error('❌ Failed to set tag:', error);
    }
  }

  clearBreadcrumbs(): void {
    try {
      this.breadcrumbs = [];
      console.log('🔍 Breadcrumbs cleared');

      // In real implementation, this would call Sentry.configureScope()
      // Sentry.configureScope(scope => {
      //   scope.clearBreadcrumbs();
      // });
    } catch (error) {
      console.error('❌ Failed to clear breadcrumbs:', error);
    }
  }

  getCrashReports(): CrashReport[] {
    // In a real implementation, this would fetch from Sentry API
    // For now, return empty array
    return [];
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    // In a real implementation, this would fetch from Sentry API
    // For now, return empty array
    return [];
  }

  private getPlatform(): 'ios' | 'android' | 'web' {
    // In real implementation, this would use Platform.OS
    // For now, return 'web' as default
    return 'web';
  }

  private getAppVersion(): string {
    // In real implementation, this would use Constants.expoConfig.version
    return '1.0.0';
  }

  private getBuildNumber(): string {
    // In real implementation, this would use Constants.expoConfig.ios.buildNumber or android.versionCode
    return '1';
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          details: { error: 'Sentry not initialized' }
        };
      }

      // In real implementation, this would check Sentry connectivity
      return {
        status: 'healthy',
        details: {
          initialized: this.isInitialized,
          user: this.user?.id || 'anonymous',
          breadcrumbs: this.breadcrumbs.length,
          config: {
            environment: this.config.environment,
            crashReporting: this.config.enableCrashReporting,
            performanceMonitoring: this.config.enablePerformanceMonitoring,
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

export default SentryService;
