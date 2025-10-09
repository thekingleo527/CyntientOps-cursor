/**
 * 🚀 Optimized Service Container
 * Advanced service container with bundling optimizations and startup efficiency
 */

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
  private sharedServiceContainer: any = null;

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
      dependencies: ['logger', 'secureStorage', 'database'],
      timeout: 2000,
    },
    {
      name: 'sessionManager',
      priority: 'critical',
      lazy: false,
      dependencies: ['database', 'auth'],
      timeout: 2000,
    },
    
    // High priority services - loaded after critical
    {
      name: 'database',
      priority: 'critical',
      lazy: false,
      dependencies: ['logger'],
      timeout: 5000,
    },
    {
      name: 'offlineSupport',
      priority: 'high',
      lazy: true,
      dependencies: ['logger'],
      timeout: 5000,
    },
    
    // Medium priority services - loaded in background
    {
      name: 'optimizedWebSocket',
      priority: 'medium',
      lazy: true,
      dependencies: ['logger'],
      timeout: 10000,
    },
    {
      name: 'messageRouter',
      priority: 'medium',
      lazy: true,
      dependencies: [],
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
    {
      name: 'clockIn',
      priority: 'medium',
      lazy: true,
      dependencies: ['database'],
      timeout: 10000,
    },
    {
      name: 'apiClients',
      priority: 'medium',
      lazy: true,
      dependencies: [],
      timeout: 10000,
    },
    
    // Business services - medium priority
    {
      name: 'inventory',
      priority: 'medium',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 10000,
    },
    {
      name: 'compliance',
      priority: 'medium',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 10000,
    },
    {
      name: 'buildings',
      priority: 'medium',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 10000,
    },
    {
      name: 'workers',
      priority: 'medium',
      lazy: true,
      dependencies: ['database', 'logger'],
      timeout: 10000,
    },
    {
      name: 'clients',
      priority: 'medium',
      lazy: true,
      dependencies: ['database', 'logger'],
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
      name: 'syncIntegration',
      priority: 'low',
      lazy: true,
      dependencies: ['database', 'offlineSupport', 'optimizedWebSocket', 'messageRouter', 'logger'],
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

    // Prevent multiple initialization attempts
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    const startTime = Date.now();
    performanceMonitor.startMeasurement('service_container_init', 'bundle');

    try {
      // Prevent concurrent initialization
      if (this.isInitialized) {
        return;
      }

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
      // Reset initialization state on error
      this.isInitialized = false;
      this.initializationPromise = null;
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
   * Get or create shared ServiceContainer instance
   */
  private async _getSharedServiceContainer(): Promise<any> {
    if (!this.sharedServiceContainer) {
      const { ServiceContainer } = await import('@cyntientops/business-core/src/ServiceContainer');
      const appConfig = (await import('../config/app.config')).default;
      this.sharedServiceContainer = ServiceContainer.getInstance({ databasePath: appConfig.databasePath });
      if (!this.sharedServiceContainer.isInitialized) {
        await this.sharedServiceContainer.initialize();
      }
    }
    return this.sharedServiceContainer;
  }

  /**
   * Create service instance with dynamic imports
   */
  private async _createServiceInstance(config: ServiceConfig): Promise<any> {
    // Use dynamic imports for better tree shaking
    switch (config.name) {
      case 'logger':
        const { Logger } = await import('@cyntientops/business-core/src/services/LoggingService');
        return Logger;
        
      case 'secureStorage':
        const { SecureStorageService } = await import('@cyntientops/business-core/src/services/SecureStorageService');
        return SecureStorageService.getInstance();
        
      case 'auth':
        {
          const container = await this._getSharedServiceContainer();
          return container.auth;
        }
        
      case 'sessionManager':
        {
          const container = await this._getSharedServiceContainer();
          return container.sessionManager;
        }
        
      case 'database':
        {
          const container = await this._getSharedServiceContainer();
          return container.database;
        }
        
      case 'offlineSupport':
        {
          const { OfflineSupportManager } = await import('@cyntientops/business-core/src/services/OfflineSupportManager');
          const offline = OfflineSupportManager.getInstance({
            cacheConfig: { maxSize: 1000, ttl: 5 * 60 * 1000, compressionEnabled: true },
            syncBatchSize: 10,
            syncInterval: 30000,
            maxRetries: 3,
            retryDelay: 5000,
          });
          await offline.initialize();
          return offline;
        }
        
      case 'optimizedWebSocket':
        {
          const container = await this._getSharedServiceContainer();
          return container.optimizedWebSocket;
        }

      case 'messageRouter':
        {
          const container = await this._getSharedServiceContainer();
          return container.messageRouter;
        }
        
      case 'backupManager':
        {
          // ServiceContainer does not expose a backupManager getter; fallback to direct instance if needed
          const { BackupManager } = await import('@cyntientops/business-core/src/services/BackupManager');
          const backupDb = this.getService('database') as any;
          return BackupManager.getInstance(backupDb);
        }
        
      case 'pushNotifications':
        {
          const container = await this._getSharedServiceContainer();
          return container.pushNotifications;
        }
        
      case 'intelligence':
        {
          const container = await this._getSharedServiceContainer();
          return container.intelligence;
        }
        
      case 'weather':
        {
          const container = await this._getSharedServiceContainer();
          return container.weatherTasks;
        }
        
      case 'syncIntegration':
        const { RealTimeSyncIntegration } = await import('@cyntientops/business-core/src/services/RealTimeSyncIntegration');
        type MessageContext = import('@cyntientops/business-core/src/services/RealTimeMessageRouter').MessageContext;
        const sync = RealTimeSyncIntegration.getInstance();
        const wsMgr = this.getService('optimizedWebSocket') as any;
        const messageRouter = this.getService('messageRouter') as any;
        const offlineMgr = this.getService('offlineSupport') as any;
        const context: MessageContext = {
          userId: '',
          userRole: 'worker',
          buildingIds: [],
          permissions: []
        };
        await sync.initialize(wsMgr, messageRouter, offlineMgr, context);
        return sync;

      case 'clockIn':
        {
          const { ClockInManager } = await import('@cyntientops/managers');
          const clockDb = this.getService('database') as any;
          return ClockInManager.getInstance(clockDb);
        }

      case 'apiClients':
        {
          const { APIClientManager } = await import('@cyntientops/api-clients');
          const appConfig = (await import('../config/app.config')).default;
          const manager = APIClientManager.getInstance({
            dsnyApiKey: appConfig.dsnyApiKey,
            hpdApiKey: appConfig.hpdApiKey,
            dobApiKey: appConfig.dobApiKey,
            weatherApiKey: appConfig.weatherApiKey,
          });
          try {
            await manager.initialize();
          } catch {}
          return manager;
        }
        
      case 'inventory':
        {
          const container = await this._getSharedServiceContainer();
          return container.inventory;
        }
        
      case 'compliance':
        {
          const container = await this._getSharedServiceContainer();
          return container.compliance;
        }
        
      case 'buildings':
        {
          const container = await this._getSharedServiceContainer();
          return container.buildings;
        }
        
      case 'workers':
        {
          const container = await this._getSharedServiceContainer();
          return container.workers;
        }
        
      case 'clients':
        {
          const container = await this._getSharedServiceContainer();
          return container.client;
        }
        
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
   * Get inventory service
   */
  get inventory() {
    return this.getService('inventory');
  }

  /**
   * Get compliance service
   */
  get compliance() {
    return this.getService('compliance');
  }

  /**
   * Get building service
   */
  get buildings() {
    return this.getService('buildings');
  }

  /**
   * Get worker service
   */
  get workers() {
    return this.getService('workers');
  }

  /**
   * Get client service
   */
  get clients() {
    return this.getService('clients');
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

  // Getter shortcuts to mirror expected usage in screens
  get database(): any { return this.getService('database'); }
  get auth(): any { return this.getService('auth'); }
  get sessionManager(): any { return this.getService('sessionManager'); }
  get optimizedWebSocket(): any { return this.getService('optimizedWebSocket'); }
  get messageRouter(): any { return this.getService('messageRouter'); }
  get offlineSupport(): any { return this.getService('offlineSupport'); }
  get syncIntegration(): any { return this.getService('syncIntegration'); }
  get inventory(): any { return this.getService('inventory'); }
  get compliance(): any { return this.getService('compliance'); }
  get buildings(): any { return this.getService('buildings'); }
  get workers(): any { return this.getService('workers'); }
  get clients(): any { return this.getService('clients'); }
  get apiClients(): any { return this.getService('apiClients'); }
  get clockIn(): any { return this.getService('clockIn'); }
  get realTimeOrchestrator(): any {
    // Use shared ServiceContainer instance
    if (!this.sharedServiceContainer) {
      throw new Error('ServiceContainer not initialized. Call initialize() first.');
    }
    return this.sharedServiceContainer.realTimeOrchestrator;
  }
}

export const optimizedServiceContainer = OptimizedServiceContainer.getInstance();
export default optimizedServiceContainer;
