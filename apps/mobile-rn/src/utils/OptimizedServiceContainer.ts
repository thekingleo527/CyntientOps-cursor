/**
 * 🚀 Optimized Service Container
 * Advanced service container with bundling optimizations and startup efficiency
 */

import { InteractionManager } from 'react-native';
import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';

interface ServiceConfig {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  lazy: boolean;
  dependencies: string[];
  timeout: number;
}

interface ServiceInstance {
  instance: any;
  config: ServiceConfig;
  isLoaded: boolean;
  loadTime: number;
  error?: Error;
}

class OptimizedServiceContainer {
  private static instance: OptimizedServiceContainer;
  private services = new Map<string, ServiceInstance>();
  private loadingPromises = new Map<string, Promise<any>>();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Service configurations with optimized loading strategies
  private serviceConfigs: ServiceConfig[] = [
    // Critical services - loaded immediately
    {
      name: 'logger',
      priority: 'critical',
      lazy: false,
      dependencies: [],
      timeout: 1000,
    },
    {
      name: 'secureStorage',
      priority: 'critical',
      lazy: false,
      dependencies: [],
      timeout: 1000,
    },
    {
      name: 'auth',
      priority: 'critical',
      lazy: false,
      dependencies: ['logger', 'secureStorage'],
      timeout: 2000,
    },
    {
      name: 'sessionManager',
      priority: 'critical',
      lazy: false,
      dependencies: ['logger', 'secureStorage'],
      timeout: 2000,
    },
    
    // High priority services - loaded after critical
    {
      name: 'database',
      priority: 'high',
      lazy: true,
      dependencies: ['logger'],
      timeout: 5000,
    },
    {
      name: 'offlineManager',
      priority: 'high',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 5000,
    },
    
    // Medium priority services - loaded in background
    {
      name: 'webSocket',
      priority: 'medium',
      lazy: true,
      dependencies: ['logger'],
      timeout: 10000,
    },
    {
      name: 'backupManager',
      priority: 'medium',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 10000,
    },
    {
      name: 'pushNotifications',
      priority: 'medium',
      lazy: true,
      dependencies: ['logger'],
      timeout: 10000,
    },
    
    // Low priority services - loaded last
    {
      name: 'intelligence',
      priority: 'low',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 15000,
    },
    {
      name: 'weather',
      priority: 'low',
      lazy: true,
      dependencies: ['logger'],
      timeout: 15000,
    },
    {
      name: 'realTimeSync',
      priority: 'low',
      lazy: true,
      dependencies: ['database', 'offlineManager', 'webSocket', 'logger'],
      timeout: 15000,
    },
  ];

  static getInstance(): OptimizedServiceContainer {
    if (!OptimizedServiceContainer.instance) {
      OptimizedServiceContainer.instance = new OptimizedServiceContainer();
    }
    return OptimizedServiceContainer.instance;
  }

  /**
   * Initialize the service container with optimized loading
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    const startTime = Date.now();
    performanceMonitor.startMeasurement('service_container_init', 'bundle');

    try {
      // Load critical services first
      await this._loadCriticalServices();
      
      // Start progressive loading in background
      this._startProgressiveLoading();
      
      this.isInitialized = true;
      const duration = Date.now() - startTime;
      
      performanceMonitor.endMeasurement('service_container_init');
      console.log(`🚀 Service container initialized in ${duration}ms`);
      
    } catch (error) {
      performanceMonitor.endMeasurement('service_container_init');
      console.error('Failed to initialize service container:', error);
      throw error;
    }
  }

  /**
   * Load critical services immediately
   */
  private async _loadCriticalServices(): Promise<void> {
    const criticalServices = this.serviceConfigs.filter(s => s.priority === 'critical');
    
    const loadPromises = criticalServices.map(config => 
      this._loadService(config).catch(error => {
        console.warn(`Failed to load critical service ${config.name}:`, error);
        return null;
      })
    );

    await Promise.allSettled(loadPromises);
    console.log('✅ Critical services loaded');
  }

  /**
   * Start progressive loading of non-critical services
   */
  private _startProgressiveLoading(): void {
    // Load high priority services after 100ms
    setTimeout(() => {
      this._loadServicesByPriority('high');
    }, 100);

    // Load medium priority services after 500ms
    setTimeout(() => {
      this._loadServicesByPriority('medium');
    }, 500);

    // Load low priority services after 1000ms
    setTimeout(() => {
      this._loadServicesByPriority('low');
    }, 1000);
  }

  /**
   * Load services by priority
   */
  private async _loadServicesByPriority(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const services = this.serviceConfigs.filter(s => s.priority === priority);
    
    // Load services in batches to avoid overwhelming the system
    const batchSize = priority === 'high' ? 2 : priority === 'medium' ? 3 : 4;
    
    for (let i = 0; i < services.length; i += batchSize) {
      const batch = services.slice(i, i + batchSize);
      
      const batchPromises = batch.map(config => 
        this._loadService(config).catch(error => {
          console.warn(`Failed to load service ${config.name}:`, error);
          return null;
        })
      );

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < services.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`✅ ${priority} priority services loaded`);
  }

  /**
   * Load a single service with optimized loading
   */
  private async _loadService(config: ServiceConfig): Promise<any> {
    if (this.services.has(config.name)) {
      return this.services.get(config.name)!.instance;
    }

    // Check if already loading
    if (this.loadingPromises.has(config.name)) {
      return this.loadingPromises.get(config.name);
    }

    const loadingPromise = this._loadServiceInternal(config);
    this.loadingPromises.set(config.name, loadingPromise);

    try {
      const instance = await loadingPromise;
      this.loadingPromises.delete(config.name);
      return instance;
    } catch (error) {
      this.loadingPromises.delete(config.name);
      throw error;
    }
  }

  /**
   * Internal service loading with dependency resolution
   */
  private async _loadServiceInternal(config: ServiceConfig): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Wait for dependencies
      await this._waitForDependencies(config.dependencies);
      
      // Load the service
      const instance = await this._createServiceInstance(config);
      
      const loadTime = Date.now() - startTime;
      
      // Store service instance
      this.services.set(config.name, {
        instance,
        config,
        isLoaded: true,
        loadTime,
      });
      
      // Register cleanup task
      memoryManager.registerCleanupTask(
        `service_${config.name}`,
        () => this._cleanupService(config.name),
        config.priority === 'critical' ? 'high' : 'medium'
      );
      
      console.log(`✅ Service loaded: ${config.name} (${loadTime}ms)`);
      return instance;
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      
      this.services.set(config.name, {
        instance: null,
        config,
        isLoaded: false,
        loadTime,
        error: error as Error,
      });
      
      console.error(`❌ Service failed: ${config.name} (${loadTime}ms)`, error);
      throw error;
    }
  }

  /**
   * Wait for service dependencies
   */
  private async _waitForDependencies(dependencies: string[]): Promise<void> {
    const dependencyPromises = dependencies.map(dep => {
      if (this.services.has(dep)) {
        return Promise.resolve();
      }
      
      // Wait for dependency to load
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Dependency ${dep} not available`));
        }, 5000);
        
        const checkDependency = () => {
          if (this.services.has(dep)) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkDependency, 100);
          }
        };
        
        checkDependency();
      });
    });
    
    await Promise.all(dependencyPromises);
  }

  /**
   * Create service instance with dynamic imports
   */
  private async _createServiceInstance(config: ServiceConfig): Promise<any> {
    // Use dynamic imports for better tree shaking
    switch (config.name) {
      case 'logger':
        const { LoggingService } = await import('@cyntientops/business-core/src/services/LoggingService');
        return LoggingService.getInstance();
        
      case 'secureStorage':
        const { SecureStorageService } = await import('@cyntientops/business-core/src/services/SecureStorageService');
        return SecureStorageService.getInstance();
        
      case 'auth':
        const { AuthService } = await import('@cyntientops/business-core/src/services/AuthService');
        const secureStorage = this.getService('secureStorage');
        const logger = this.getService('logger');
        return new AuthService(secureStorage, logger);
        
      case 'sessionManager':
        const { SessionManager } = await import('@cyntientops/business-core/src/services/SessionManager');
        const secureStorage2 = this.getService('secureStorage');
        const logger2 = this.getService('logger');
        return new SessionManager(secureStorage2, logger2);
        
      case 'database':
        const { DatabaseManager } = await import('@cyntientops/database/src/DatabaseManager');
        const logger3 = this.getService('logger');
        const db = new DatabaseManager(logger3);
        await db.initialize();
        return db;
        
      case 'offlineManager':
        const { OfflineTaskManager } = await import('@cyntientops/business-core/src/services/OfflineTaskManager');
        const database = this.getService('database');
        const logger4 = this.getService('logger');
        const offline = new OfflineTaskManager(database, logger4);
        await offline.initialize();
        return offline;
        
      case 'webSocket':
        const { OptimizedWebSocketManager } = await import('@cyntientops/business-core/src/services/OptimizedWebSocketManager');
        const logger5 = this.getService('logger');
        return new OptimizedWebSocketManager(logger5);
        
      case 'backupManager':
        const { BackupManager } = await import('@cyntientops/business-core/src/services/BackupManager');
        const database2 = this.getService('database');
        const logger6 = this.getService('logger');
        return new BackupManager(database2, logger6);
        
      case 'pushNotifications':
        const { PushNotificationService } = await import('@cyntientops/business-core/src/services/PushNotificationService');
        const logger7 = this.getService('logger');
        const push = new PushNotificationService(logger7);
        await push.initialize();
        return push;
        
      case 'intelligence':
        const { IntelligenceService } = await import('@cyntientops/business-core/src/services/IntelligenceService');
        const database3 = this.getService('database');
        const logger8 = this.getService('logger');
        const intel = new IntelligenceService(database3, logger8);
        await intel.initialize();
        return intel;
        
      case 'weather':
        const { WeatherTriggeredTaskManager } = await import('@cyntientops/business-core/src/services/WeatherTriggeredTaskManager');
        const logger9 = this.getService('logger');
        const weather = new WeatherTriggeredTaskManager(logger9);
        await weather.initialize();
        return weather;
        
      case 'realTimeSync':
        const { RealTimeSyncIntegration } = await import('@cyntientops/business-core/src/services/RealTimeSyncIntegration');
        const database4 = this.getService('database');
        const offlineManager = this.getService('offlineManager');
        const webSocket = this.getService('webSocket');
        const logger10 = this.getService('logger');
        const sync = new RealTimeSyncIntegration(database4, offlineManager, webSocket, logger10);
        await sync.initialize();
        return sync;
        
      default:
        throw new Error(`Unknown service: ${config.name}`);
    }
  }

  /**
   * Get a service instance
   */
  getService<T>(serviceName: string): T | null {
    const service = this.services.get(serviceName);
    return service?.isLoaded ? service.instance : null;
  }

  /**
   * Wait for a service to be available
   */
  async waitForService<T>(serviceName: string, timeout = 10000): Promise<T> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const service = this.services.get(serviceName);
      if (service?.isLoaded) {
        return service.instance;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Service ${serviceName} not available within ${timeout}ms`);
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    const service = this.services.get(serviceName);
    return service?.isLoaded || false;
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalServices: number;
    loadedServices: number;
    loadingServices: number;
    failedServices: number;
    averageLoadTime: number;
    servicesByPriority: Record<string, number>;
  } {
    const services = Array.from(this.services.values());
    const loadedServices = services.filter(s => s.isLoaded);
    const loadingServices = Array.from(this.loadingPromises.keys()).length;
    const failedServices = services.filter(s => s.error).length;
    
    const averageLoadTime = loadedServices.length > 0 
      ? loadedServices.reduce((sum, s) => sum + s.loadTime, 0) / loadedServices.length 
      : 0;
    
    const servicesByPriority: Record<string, number> = {};
    services.forEach(service => {
      const priority = service.config.priority;
      servicesByPriority[priority] = (servicesByPriority[priority] || 0) + 1;
    });
    
    return {
      totalServices: services.length,
      loadedServices: loadedServices.length,
      loadingServices,
      failedServices,
      averageLoadTime,
      servicesByPriority,
    };
  }

  /**
   * Cleanup a service
   */
  private async _cleanupService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (service?.instance?.destroy) {
      try {
        await service.instance.destroy();
        console.log(`🧹 Service cleaned up: ${serviceName}`);
      } catch (error) {
        console.warn(`Failed to cleanup service ${serviceName}:`, error);
      }
    }
  }

  /**
   * Destroy all services
   */
  async destroy(): Promise<void> {
    const services = Array.from(this.services.values());
    
    await Promise.allSettled(
      services.map(service => this._cleanupService(service.config.name))
    );
    
    this.services.clear();
    this.loadingPromises.clear();
    this.isInitialized = false;
    this.initializationPromise = null;
    
    console.log('🧹 Service container destroyed');
  }
}

export const optimizedServiceContainer = OptimizedServiceContainer.getInstance();
export default optimizedServiceContainer;
