/**
 * 📦 Bundle Optimizer
 * Advanced bundling optimizations for faster startup and better performance
 */

import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';

interface BundleChunk {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  size: number;
  loadTime: number;
  dependencies: string[];
  isLoaded: boolean;
}

interface BundleStats {
  totalSize: number;
  loadedSize: number;
  chunksLoaded: number;
  totalChunks: number;
  averageLoadTime: number;
  compressionRatio: number;
}

class BundleOptimizer {
  private static instance: BundleOptimizer;
  private chunks = new Map<string, BundleChunk>();
  private loadingPromises = new Map<string, Promise<any>>();
  private isInitialized = false;

  // Critical chunks that must be loaded first
  private criticalChunks = [
    'react',
    'react-native',
    'expo',
    'navigation',
    'auth',
    'logger',
  ];

  // High priority chunks
  private highPriorityChunks = [
    'ui-components',
    'business-core',
    'database',
    'offline-manager',
  ];

  // Medium priority chunks
  private mediumPriorityChunks = [
    'websocket',
    'backup',
    'push-notifications',
    'intelligence',
  ];

  // Low priority chunks (loaded last)
  private lowPriorityChunks = [
    'weather',
    'realtime-sync',
    'analytics',
    'reporting',
  ];

  static getInstance(): BundleOptimizer {
    if (!BundleOptimizer.instance) {
      BundleOptimizer.instance = new BundleOptimizer();
    }
    return BundleOptimizer.instance;
  }

  /**
   * Initialize bundle optimization
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Register critical chunks
      this._registerCriticalChunks();
      
      // Start progressive loading
      this._startProgressiveLoading();
      
      this.isInitialized = true;
      console.log('📦 Bundle optimizer initialized');
      
    } catch (error) {
      console.error('Failed to initialize bundle optimizer:', error);
      throw error;
    }
  }

  /**
   * Register critical chunks
   */
  private _registerCriticalChunks(): void {
    // Register critical chunks
    this.criticalChunks.forEach(chunkName => {
      this.chunks.set(chunkName, {
        name: chunkName,
        priority: 'critical',
        size: 0, // Will be updated when loaded
        loadTime: 0,
        dependencies: [],
        isLoaded: false,
      });
    });

    // Register high priority chunks
    this.highPriorityChunks.forEach(chunkName => {
      this.chunks.set(chunkName, {
        name: chunkName,
        priority: 'high',
        size: 0,
        loadTime: 0,
        dependencies: ['react', 'react-native'],
        isLoaded: false,
      });
    });

    // Register medium priority chunks
    this.mediumPriorityChunks.forEach(chunkName => {
      this.chunks.set(chunkName, {
        name: chunkName,
        priority: 'medium',
        size: 0,
        loadTime: 0,
        dependencies: ['business-core'],
        isLoaded: false,
      });
    });

    // Register low priority chunks
    this.lowPriorityChunks.forEach(chunkName => {
      this.chunks.set(chunkName, {
        name: chunkName,
        priority: 'low',
        size: 0,
        loadTime: 0,
        dependencies: ['intelligence'],
        isLoaded: false,
      });
    });
  }

  /**
   * Start progressive loading of chunks
   */
  private _startProgressiveLoading(): void {
    // Load critical chunks immediately
    setTimeout(() => {
      this._loadChunksByPriority('critical');
    }, 0);

    // Load high priority chunks after 100ms
    setTimeout(() => {
      this._loadChunksByPriority('high');
    }, 100);

    // Load medium priority chunks after 500ms
    setTimeout(() => {
      this._loadChunksByPriority('medium');
    }, 500);

    // Load low priority chunks after 1000ms
    setTimeout(() => {
      this._loadChunksByPriority('low');
    }, 1000);
  }

  /**
   * Load chunks by priority
   */
  private async _loadChunksByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<void> {
    const chunks = Array.from(this.chunks.values()).filter(c => c.priority === priority);
    
    // Load chunks in parallel but with concurrency limit
    const concurrency = priority === 'critical' ? 3 : priority === 'high' ? 2 : 1;
    
    for (let i = 0; i < chunks.length; i += concurrency) {
      const batch = chunks.slice(i, i + concurrency);
      
      const batchPromises = batch.map(chunk => 
        this._loadChunk(chunk).catch(error => {
          console.warn(`Failed to load chunk ${chunk.name}:`, error);
          return null;
        })
      );

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches
      if (i + concurrency < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`📦 ${priority} priority chunks loaded`);
  }

  /**
   * Load a single chunk
   */
  private async _loadChunk(chunk: BundleChunk): Promise<any> {
    if (chunk.isLoaded) {
      return;
    }

    // Check if already loading
    if (this.loadingPromises.has(chunk.name)) {
      return this.loadingPromises.get(chunk.name);
    }

    const loadingPromise = this._loadChunkInternal(chunk);
    this.loadingPromises.set(chunk.name, loadingPromise);

    try {
      await loadingPromise;
      this.loadingPromises.delete(chunk.name);
    } catch (error) {
      this.loadingPromises.delete(chunk.name);
      throw error;
    }
  }

  /**
   * Internal chunk loading
   */
  private async _loadChunkInternal(chunk: BundleChunk): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Wait for dependencies
      await this._waitForDependencies(chunk.dependencies);
      
      // Load the chunk based on its name
      await this._loadChunkByType(chunk.name);
      
      const loadTime = Date.now() - startTime;
      chunk.loadTime = loadTime;
      chunk.isLoaded = true;
      
      // Register cleanup task
      memoryManager.registerCleanupTask(
        `chunk_${chunk.name}`,
        () => this._cleanupChunk(chunk.name),
        chunk.priority === 'critical' ? 'high' : 'medium'
      );
      
      console.log(`📦 Chunk loaded: ${chunk.name} (${loadTime}ms)`);
      
    } catch (error) {
      console.error(`❌ Chunk failed: ${chunk.name}`, error);
      throw error;
    }
  }

  /**
   * Wait for chunk dependencies
   */
  private async _waitForDependencies(dependencies: string[]): Promise<void> {
    const dependencyPromises = dependencies.map(dep => {
      const chunk = this.chunks.get(dep);
      if (chunk?.isLoaded) {
        return Promise.resolve();
      }
      
      // Wait for dependency to load
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Dependency ${dep} not available`));
        }, 5000);
        
        const checkDependency = () => {
          const chunk = this.chunks.get(dep);
          if (chunk?.isLoaded) {
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
   * Load chunk by type
   */
  private async _loadChunkByType(chunkName: string): Promise<void> {
    switch (chunkName) {
      case 'react':
      case 'react-native':
      case 'expo':
        // These are already loaded by the runtime
        return;
        
      case 'navigation':
        await import('@react-navigation/native');
        await import('@react-navigation/native-stack');
        await import('@react-navigation/bottom-tabs');
        break;
        
      case 'auth':
        await import('@cyntientops/business-core/src/services/AuthService');
        break;
        
      case 'logger':
        await import('@cyntientops/business-core/src/services/LoggingService');
        break;
        
      case 'ui-components':
        await import('@cyntientops/ui-components');
        break;
        
      case 'business-core':
        await import('@cyntientops/business-core');
        break;
        
      case 'database':
        await import('@cyntientops/database');
        break;
        
      case 'offline-manager':
        await import('@cyntientops/business-core/src/services/OfflineTaskManager');
        break;
        
      case 'websocket':
        await import('@cyntientops/business-core/src/services/WebSocketService');
        break;
        
      case 'backup':
        await import('@cyntientops/business-core/src/services/BackupManager');
        break;
        
      case 'push-notifications':
        await import('@cyntientops/business-core/src/services/PushNotificationService');
        break;
        
      case 'intelligence':
        await import('@cyntientops/intelligence-services');
        break;
        
      case 'weather':
        await import('@cyntientops/business-core/src/services/WeatherService');
        break;
        
      case 'realtime-sync':
        await import('@cyntientops/business-core/src/services/RealTimeSyncIntegration');
        break;
        
      default:
        console.warn(`Unknown chunk type: ${chunkName}`);
    }
  }

  /**
   * Preload a specific chunk
   */
  async preloadChunk(chunkName: string): Promise<void> {
    const chunk = this.chunks.get(chunkName);
    if (!chunk) {
      throw new Error(`Chunk ${chunkName} not found`);
    }

    if (chunk.isLoaded) {
      return;
    }

    await this._loadChunk(chunk);
  }

  /**
   * Get bundle statistics
   */
  getBundleStats(): BundleStats {
    const chunks = Array.from(this.chunks.values());
    const loadedChunks = chunks.filter(c => c.isLoaded);
    
    const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
    const loadedSize = loadedChunks.reduce((sum, c) => sum + c.size, 0);
    const averageLoadTime = loadedChunks.length > 0 
      ? loadedChunks.reduce((sum, c) => sum + c.loadTime, 0) / loadedChunks.length 
      : 0;
    
    return {
      totalSize,
      loadedSize,
      chunksLoaded: loadedChunks.length,
      totalChunks: chunks.length,
      averageLoadTime,
      compressionRatio: totalSize > 0 ? loadedSize / totalSize : 1,
    };
  }

  /**
   * Get chunk loading progress
   */
  getLoadingProgress(): {
    critical: number;
    high: number;
    medium: number;
    low: number;
    overall: number;
  } {
    const chunks = Array.from(this.chunks.values());
    
    const critical = chunks.filter(c => c.priority === 'critical');
    const high = chunks.filter(c => c.priority === 'high');
    const medium = chunks.filter(c => c.priority === 'medium');
    const low = chunks.filter(c => c.priority === 'low');
    
    return {
      critical: critical.length > 0 ? critical.filter(c => c.isLoaded).length / critical.length : 1,
      high: high.length > 0 ? high.filter(c => c.isLoaded).length / high.length : 1,
      medium: medium.length > 0 ? medium.filter(c => c.isLoaded).length / medium.length : 1,
      low: low.length > 0 ? low.filter(c => c.isLoaded).length / low.length : 1,
      overall: chunks.length > 0 ? chunks.filter(c => c.isLoaded).length / chunks.length : 1,
    };
  }

  /**
   * Cleanup a chunk
   */
  private async _cleanupChunk(chunkName: string): Promise<void> {
    const chunk = this.chunks.get(chunkName);
    if (chunk) {
      chunk.isLoaded = false;
      console.log(`🧹 Chunk cleaned up: ${chunkName}`);
    }
  }

  /**
   * Check if a chunk is loaded
   */
  isChunkLoaded(chunkName: string): boolean {
    const chunk = this.chunks.get(chunkName);
    return chunk?.isLoaded || false;
  }

  /**
   * Wait for a chunk to be loaded
   */
  async waitForChunk(chunkName: string, timeout = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.isChunkLoaded(chunkName)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Chunk ${chunkName} not loaded within ${timeout}ms`);
  }

  /**
   * Destroy bundle optimizer
   */
  async destroy(): Promise<void> {
    const chunks = Array.from(this.chunks.values());
    
    await Promise.allSettled(
      chunks.map(chunk => this._cleanupChunk(chunk.name))
    );
    
    this.chunks.clear();
    this.loadingPromises.clear();
    this.isInitialized = false;
    
    console.log('🧹 Bundle optimizer destroyed');
  }
}

export const bundleOptimizer = BundleOptimizer.getInstance();
export default bundleOptimizer;
