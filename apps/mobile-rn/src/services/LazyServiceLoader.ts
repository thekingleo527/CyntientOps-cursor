/**
 * 🚀 Lazy Service Loader
 * Optimized service loading with lazy initialization and caching
 */

import { InteractionManager } from 'react-native';

interface ServiceCache {
  [key: string]: any;
}

class LazyServiceLoader {
  private static instance: LazyServiceLoader;
  private cache: ServiceCache = {};
  private loadingPromises: { [key: string]: Promise<any> } = {};

  private constructor() {}

  public static getInstance(): LazyServiceLoader {
    if (!LazyServiceLoader.instance) {
      LazyServiceLoader.instance = new LazyServiceLoader();
    }
    return LazyServiceLoader.instance;
  }

  /**
   * Lazy load a service with caching and error handling
   */
  public async loadService<T>(
    serviceName: string,
    loader: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    // Return cached service if available
    if (this.cache[serviceName]) {
      return this.cache[serviceName];
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises[serviceName]) {
      return this.loadingPromises[serviceName];
    }

    // Create loading promise
    const loadingPromise = this.loadServiceInternal(serviceName, loader, priority);
    this.loadingPromises[serviceName] = loadingPromise;

    try {
      const service = await loadingPromise;
      this.cache[serviceName] = service;
      delete this.loadingPromises[serviceName];
      return service;
    } catch (error) {
      delete this.loadingPromises[serviceName];
      throw error;
    }
  }

  private async loadServiceInternal<T>(
    serviceName: string,
    loader: () => Promise<T>,
    priority: 'high' | 'medium' | 'low'
  ): Promise<T> {
    // High priority services load immediately
    if (priority === 'high') {
      return await loader();
    }

    // Medium and low priority services wait for interactions to complete
    return new Promise((resolve, reject) => {
      const task = InteractionManager.runAfterInteractions(async () => {
        try {
          const service = await loader();
          resolve(service);
        } catch (error) {
          reject(error);
        }
      });

      // For low priority services, add additional delay
      if (priority === 'low') {
        setTimeout(() => {
          task.cancel();
          loader().then(resolve).catch(reject);
        }, 100);
      }
    });
  }

  /**
   * Preload critical services - optimized for faster startup
   */
  public async preloadCriticalServices(): Promise<void> {
    // Only preload the most essential service to reduce startup time
    const criticalServices = [
      {
        name: 'Logger',
        loader: () => import('@cyntientops/business-core').then(m => m.Logger),
        priority: 'high' as const
      }
      // Defer ServiceContainer loading until actually needed
    ];

    await Promise.allSettled(
      criticalServices.map(service => 
        this.loadService(service.name, service.loader, service.priority)
      )
    );
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  public clearCache(): void {
    this.cache = {};
    this.loadingPromises = {};
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { cachedServices: string[]; loadingServices: string[] } {
    return {
      cachedServices: Object.keys(this.cache),
      loadingServices: Object.keys(this.loadingPromises)
    };
  }
}

export const lazyServiceLoader = LazyServiceLoader.getInstance();
export default lazyServiceLoader;
