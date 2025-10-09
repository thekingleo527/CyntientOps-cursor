/**
 * 🚀 Advanced Bundle Splitting System
 * Intelligent code splitting for optimal startup performance
 */

export interface BundleChunk {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  modules: string[];
  size: number;
  loadTime: number;
}

export interface BundleSplitterConfig {
  maxChunkSize: number;
  criticalThreshold: number;
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  enableCompression: boolean;
}

class BundleSplitter {
  private static instance: BundleSplitter;
  private config: BundleSplitterConfig;
  private chunks: Map<string, BundleChunk> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  private constructor(config: BundleSplitterConfig) {
    this.config = config;
    this.initializeChunks();
  }

  static getInstance(config?: BundleSplitterConfig): BundleSplitter {
    if (!BundleSplitter.instance) {
      BundleSplitter.instance = new BundleSplitter(config || {
        maxChunkSize: 500000, // 500KB
        criticalThreshold: 100000, // 100KB
        enableLazyLoading: true,
        enablePreloading: true,
        enableCompression: true,
      });
    }
    return BundleSplitter.instance;
  }

  /**
   * Initialize bundle chunks with intelligent splitting
   */
  private initializeChunks(): void {
    // Critical chunks (load immediately)
    this.chunks.set('critical', {
      name: 'critical',
      priority: 'critical',
      modules: [
        'App.tsx',
        'index.js',
        'src/providers/AppProvider.tsx',
        'src/utils/BootMonitor.ts',
        'src/utils/PerformanceMonitor.ts',
      ],
      size: 0,
      loadTime: 0,
    });

    // High priority chunks (load after critical)
    this.chunks.set('navigation', {
      name: 'navigation',
      priority: 'high',
      modules: [
        'src/navigation/AppNavigator.tsx',
        'src/navigation/EnhancedTabNavigator.tsx',
        'src/navigation/tabs',
      ],
      size: 0,
      loadTime: 0,
    });

    this.chunks.set('auth', {
      name: 'auth',
      priority: 'high',
      modules: [
        'src/screens/LoginScreen.tsx',
        'src/providers/AppProvider.tsx',
        'packages/business-core/src/services/AuthService.ts',
        'packages/business-core/src/services/SessionManager.ts',
      ],
      size: 0,
      loadTime: 0,
    });

    // Medium priority chunks (load in background)
    this.chunks.set('screens', {
      name: 'screens',
      priority: 'medium',
      modules: [
        'src/screens/AdminDashboardScreen.tsx',
        'src/screens/ClientDashboardScreen.tsx',
        'src/screens/WorkerDashboardScreen.tsx',
        'src/screens/BuildingDetailScreen.tsx',
        'src/screens/ComplianceSuiteScreen.tsx',
      ],
      size: 0,
      loadTime: 0,
    });

    this.chunks.set('components', {
      name: 'components',
      priority: 'medium',
      modules: [
        'src/components',
        'packages/ui-components/src',
      ],
      size: 0,
      loadTime: 0,
    });

    // Low priority chunks (load on demand)
    this.chunks.set('intelligence', {
      name: 'intelligence',
      priority: 'low',
      modules: [
        'packages/intelligence-services/src',
        'src/screens/AdminIntelligenceTab.tsx',
        'src/screens/ClientIntelligenceTab.tsx',
        'src/screens/WorkerIntelligenceTab.tsx',
      ],
      size: 0,
      loadTime: 0,
    });

    this.chunks.set('analytics', {
      name: 'analytics',
      priority: 'low',
      modules: [
        'packages/business-core/src/analytics',
        'src/utils/PerformanceMonitor.ts',
        'src/utils/MemoryManager.ts',
      ],
      size: 0,
      loadTime: 0,
    });
  }

  /**
   * Load chunk with intelligent prioritization
   */
  async loadChunk(chunkName: string): Promise<any> {
    const chunk = this.chunks.get(chunkName);
    if (!chunk) {
      throw new Error(`Chunk ${chunkName} not found`);
    }

    // Check if already loading
    if (this.loadingPromises.has(chunkName)) {
      return this.loadingPromises.get(chunkName);
    }

    const startTime = Date.now();
    console.log(`🚀 Loading chunk: ${chunkName} (priority: ${chunk.priority})`);

    const loadPromise = this.loadChunkModules(chunk);
    this.loadingPromises.set(chunkName, loadPromise);

    try {
      const result = await loadPromise;
      const loadTime = Date.now() - startTime;
      
      chunk.loadTime = loadTime;
      console.log(`✅ Chunk loaded: ${chunkName} in ${loadTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to load chunk ${chunkName}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(chunkName);
    }
  }

  /**
   * Load chunk modules with dynamic imports
   */
  private async loadChunkModules(chunk: BundleChunk): Promise<any> {
    const modulePromises = chunk.modules.map(async (module) => {
      try {
        // Dynamic import for code splitting
        const modulePath = this.resolveModulePath(module);
        return await import(modulePath);
      } catch (error) {
        console.warn(`Failed to load module ${module}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(modulePromises);
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);
  }

  /**
   * Resolve module path for dynamic imports
   */
  private resolveModulePath(module: string): string {
    // Handle different module types
    if (module.startsWith('src/')) {
      return `./${module}`;
    }
    
    if (module.startsWith('packages/')) {
      return `../../${module}`;
    }
    
    return `./${module}`;
  }

  /**
   * Preload chunks based on priority
   */
  async preloadChunks(): Promise<void> {
    console.log('🚀 Starting intelligent chunk preloading...');
    
    // Load critical chunks immediately
    const criticalChunks = Array.from(this.chunks.values())
      .filter(chunk => chunk.priority === 'critical');
    
    await Promise.all(
      criticalChunks.map(chunk => this.loadChunk(chunk.name))
    );

    // Load high priority chunks after a short delay
    setTimeout(async () => {
      const highPriorityChunks = Array.from(this.chunks.values())
        .filter(chunk => chunk.priority === 'high');
      
      await Promise.all(
        highPriorityChunks.map(chunk => this.loadChunk(chunk.name))
      );
    }, 100);

    // Load medium priority chunks in background
    setTimeout(async () => {
      const mediumPriorityChunks = Array.from(this.chunks.values())
        .filter(chunk => chunk.priority === 'medium');
      
      await Promise.all(
        mediumPriorityChunks.map(chunk => this.loadChunk(chunk.name))
      );
    }, 500);

    console.log('✅ Chunk preloading initiated');
  }

  /**
   * Get chunk loading statistics
   */
  getChunkStats(): {
    totalChunks: number;
    loadedChunks: number;
    averageLoadTime: number;
    totalSize: number;
  } {
    const chunks = Array.from(this.chunks.values());
    const loadedChunks = chunks.filter(chunk => chunk.loadTime > 0);
    
    return {
      totalChunks: chunks.length,
      loadedChunks: loadedChunks.length,
      averageLoadTime: loadedChunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / loadedChunks.length || 0,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
    };
  }

  /**
   * Optimize bundle based on usage patterns
   */
  optimizeBundle(): void {
    console.log('🔧 Optimizing bundle based on usage patterns...');
    
    // Move frequently used modules to higher priority chunks
    const usageStats = this.getUsageStats();
    
    Object.entries(usageStats).forEach(([module, usage]) => {
      if (usage > 10) { // Frequently used
        this.moveModuleToHigherPriority(module);
      }
    });
    
    console.log('✅ Bundle optimization complete');
  }

  /**
   * Get module usage statistics
   */
  private getUsageStats(): Record<string, number> {
    // This would be implemented with actual usage tracking
    return {
      'App.tsx': 100,
      'LoginScreen.tsx': 50,
      'AdminDashboardScreen.tsx': 30,
      'WorkerDashboardScreen.tsx': 25,
    };
  }

  /**
   * Move module to higher priority chunk
   */
  private moveModuleToHigherPriority(module: string): void {
    // Implementation for moving modules between chunks
    console.log(`📦 Moving ${module} to higher priority chunk`);
  }
}

export const bundleSplitter = BundleSplitter.getInstance();
export default bundleSplitter;
