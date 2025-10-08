/**
 * 🧠 Memory Manager
 * Advanced memory management and cleanup strategies
 */

import { InteractionManager } from 'react-native';
import { performanceMonitor } from './PerformanceMonitor';

interface MemoryCleanupTask {
  id: string;
  cleanup: () => void;
  priority: 'high' | 'medium' | 'low';
  lastUsed: number;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usageRatio: number;
  timestamp: number;
}

class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: Map<string, MemoryCleanupTask> = new Map();
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private memoryThreshold = 0.75; // 75% memory usage threshold
  private cleanupInterval = 30000; // 30 seconds

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.cleanupInterval);
    
    console.log('🧠 Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🧠 Memory monitoring stopped');
  }

  /**
   * Register a cleanup task
   */
  registerCleanupTask(
    id: string,
    cleanup: () => void,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    this.cleanupTasks.set(id, {
      id,
      cleanup,
      priority,
      lastUsed: Date.now(),
    });
    
    console.log(`🧠 Cleanup task registered: ${id} (${priority} priority)`);
  }

  /**
   * Unregister a cleanup task
   */
  unregisterCleanupTask(id: string): void {
    this.cleanupTasks.delete(id);
    console.log(`🧠 Cleanup task unregistered: ${id}`);
  }

  /**
   * Update last used time for a cleanup task
   */
  updateLastUsed(id: string): void {
    const task = this.cleanupTasks.get(id);
    if (task) {
      task.lastUsed = Date.now();
    }
  }

  /**
   * Check memory usage and trigger cleanup if needed
   */
  private checkMemoryUsage(): void {
    const memoryStats = this.getMemoryStats();
    if (!memoryStats) return;

    if (memoryStats.usageRatio > this.memoryThreshold) {
      console.warn(`🧠 High memory usage detected: ${(memoryStats.usageRatio * 100).toFixed(1)}%`);
      this.performCleanup();
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | null {
    if (typeof performance !== 'undefined' && performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;
      const usageRatio = used / limit;
      
      return {
        usedJSHeapSize: used,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: limit,
        usageRatio,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  /**
   * Perform memory cleanup
   */
  private performCleanup(): void {
    console.log('🧠 Performing memory cleanup...');
    
    // Sort tasks by priority and last used time
    const sortedTasks = Array.from(this.cleanupTasks.values())
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.lastUsed - b.lastUsed; // Older tasks first
      });

    // Execute cleanup tasks
    sortedTasks.forEach(task => {
      try {
        task.cleanup();
        console.log(`🧠 Cleanup task executed: ${task.id}`);
      } catch (error) {
        console.warn(`🧠 Cleanup task failed: ${task.id}`, error);
      }
    });

    // Force garbage collection if available
    this.forceGarbageCollection();
  }

  /**
   * Force garbage collection
   */
  private forceGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
        console.log('🧠 Garbage collection forced');
      } catch (error) {
        console.warn('🧠 Failed to force garbage collection:', error);
      }
    }
  }

  /**
   * Set memory threshold
   */
  setMemoryThreshold(threshold: number): void {
    this.memoryThreshold = Math.max(0, Math.min(1, threshold));
    console.log(`🧠 Memory threshold set to ${(this.memoryThreshold * 100).toFixed(1)}%`);
  }

  /**
   * Get cleanup task statistics
   */
  getCleanupStats(): {
    totalTasks: number;
    tasksByPriority: Record<string, number>;
    oldestTask: string | null;
    newestTask: string | null;
  } {
    const tasks = Array.from(this.cleanupTasks.values());
    const tasksByPriority: Record<string, number> = {};
    
    tasks.forEach(task => {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });

    const sortedByTime = tasks.sort((a, b) => a.lastUsed - b.lastUsed);
    
    return {
      totalTasks: tasks.length,
      tasksByPriority,
      oldestTask: sortedByTime[0]?.id || null,
      newestTask: sortedByTime[sortedByTime.length - 1]?.id || null,
    };
  }

  /**
   * Clear all cleanup tasks
   */
  clearAllCleanupTasks(): void {
    this.cleanupTasks.clear();
    console.log('🧠 All cleanup tasks cleared');
  }

  /**
   * Create a memory-aware cache
   */
  createMemoryAwareCache<T>(maxSize: number = 100): Map<string, T> {
    const cache = new Map<string, T>();
    const accessCount = new Map<string, number>();
    const lastAccess = new Map<string, number>();

    const cleanupTaskId = `cache_${Date.now()}`;
    
    this.registerCleanupTask(cleanupTaskId, () => {
      // Remove least recently used items
      if (cache.size > maxSize) {
        const sortedEntries = Array.from(cache.keys())
          .sort((a, b) => (lastAccess.get(a) || 0) - (lastAccess.get(b) || 0));
        
        const itemsToRemove = cache.size - maxSize;
        for (let i = 0; i < itemsToRemove; i++) {
          const key = sortedEntries[i];
          cache.delete(key);
          accessCount.delete(key);
          lastAccess.delete(key);
        }
      }
    }, 'medium');

    return new Proxy(cache, {
      get(target, prop) {
        if (prop === 'get') {
          return (key: string) => {
            const value = target.get(key);
            if (value !== undefined) {
              accessCount.set(key, (accessCount.get(key) || 0) + 1);
              lastAccess.set(key, Date.now());
            }
            return value;
          };
        }
        if (prop === 'set') {
          return (key: string, value: T) => {
            target.set(key, value);
            accessCount.set(key, 1);
            lastAccess.set(key, Date.now());
            return target;
          };
        }
        return target[prop as keyof Map<string, T>];
      }
    });
  }

  /**
   * Monitor memory usage and log warnings
   */
  startMemoryMonitoring(): void {
    this.startMonitoring();
    
    // Log memory usage every 30 seconds
    setInterval(() => {
      const stats = this.getMemoryStats();
      if (stats) {
        const usageMB = (stats.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const limitMB = (stats.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
        console.log(`🧠 Memory: ${usageMB}MB / ${limitMB}MB (${(stats.usageRatio * 100).toFixed(1)}%)`);
      }
    }, 30000);
  }
}

export const memoryManager = MemoryManager.getInstance();
export default memoryManager;
