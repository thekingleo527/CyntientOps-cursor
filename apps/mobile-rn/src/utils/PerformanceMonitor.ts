/**
 * 📊 Performance Monitor
 * Advanced performance monitoring and metrics collection
 */

import { InteractionManager } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'navigation' | 'rendering' | 'network' | 'memory' | 'bundle';
  metadata?: Record<string, any>;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private memoryStats: MemoryStats[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startMemoryMonitoring();
    console.log('📊 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name: string, category: PerformanceMetric['category'], metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      category,
      metadata,
    };
    
    this.metrics.push(metric);
    console.log(`🚀 Performance measurement started: ${name}`);
  }

  /**
   * End a performance measurement
   */
  endMeasurement(name: string): number | null {
    const metric = this.metrics.find(m => m.name === name && !m.endTime);
    if (!metric) {
      console.warn(`Performance measurement not found: ${name}`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    
    console.log(`✅ Performance measurement completed: ${name} (${metric.duration}ms)`);
    return metric.duration;
  }

  /**
   * Measure a function execution time
   */
  async measureFunction<T>(
    name: string,
    category: PerformanceMetric['category'],
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startMeasurement(name, category, metadata);
    
    try {
      const result = await fn();
      this.endMeasurement(name);
      return result;
    } catch (error) {
      this.endMeasurement(name);
      throw error;
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryStats();
    }, 5000); // Collect every 5 seconds
  }

  /**
   * Collect memory statistics
   */
  private collectMemoryStats(): void {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory: MemoryStats = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
      
      this.memoryStats.push(memory);
      
      // Keep only last 100 memory stats to prevent memory leaks
      if (this.memoryStats.length > 100) {
        this.memoryStats = this.memoryStats.slice(-100);
      }
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    totalMeasurements: number;
    averageDuration: number;
    slowestMeasurements: PerformanceMetric[];
    memoryStats: MemoryStats[];
    categoryBreakdown: Record<string, { count: number; averageDuration: number }>;
  } {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;

    // Get slowest measurements
    const slowestMeasurements = [...completedMetrics]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; averageDuration: number }> = {};
    completedMetrics.forEach(metric => {
      if (!categoryBreakdown[metric.category]) {
        categoryBreakdown[metric.category] = { count: 0, averageDuration: 0 };
      }
      categoryBreakdown[metric.category].count++;
      categoryBreakdown[metric.category].averageDuration += metric.duration || 0;
    });

    // Calculate averages for each category
    Object.keys(categoryBreakdown).forEach(category => {
      const stats = categoryBreakdown[category];
      stats.averageDuration = stats.count > 0 ? stats.averageDuration / stats.count : 0;
    });

    return {
      totalMeasurements: completedMetrics.length,
      averageDuration,
      slowestMeasurements,
      memoryStats: this.memoryStats.slice(-20), // Last 20 memory stats
      categoryBreakdown,
    };
  }

  /**
   * Log performance report
   */
  logPerformanceReport(): void {
    const report = this.getPerformanceReport();
    
    console.log('\n📊 Performance Report');
    console.log('=' .repeat(50));
    console.log(`Total Measurements: ${report.totalMeasurements}`);
    console.log(`Average Duration: ${report.averageDuration.toFixed(2)}ms`);
    
    console.log('\n🐌 Slowest Measurements:');
    report.slowestMeasurements.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.name}: ${metric.duration}ms (${metric.category})`);
    });
    
    console.log('\n📈 Category Breakdown:');
    Object.entries(report.categoryBreakdown).forEach(([category, stats]) => {
      console.log(`${category}: ${stats.count} measurements, avg ${stats.averageDuration.toFixed(2)}ms`);
    });
    
    if (report.memoryStats.length > 0) {
      const latestMemory = report.memoryStats[report.memoryStats.length - 1];
      console.log(`\n💾 Memory Usage: ${(latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.memoryStats = [];
    console.log('📊 Performance metrics cleared');
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): MemoryStats | null {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
    }
    return null;
  }

  /**
   * Check if memory usage is high
   */
  isMemoryUsageHigh(threshold: number = 0.8): boolean {
    const memory = this.getCurrentMemoryUsage();
    if (!memory) return false;
    
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    return usageRatio > threshold;
  }

  /**
   * Measure navigation performance
   */
  measureNavigation(screenName: string, navigationTime: number): void {
    this.startMeasurement(`navigation_${screenName}`, 'navigation', {
      screenName,
      navigationTime,
    });
  }

  /**
   * Measure bundle loading performance
   */
  measureBundleLoading(bundleName: string, loadTime: number): void {
    this.startMeasurement(`bundle_${bundleName}`, 'bundle', {
      bundleName,
      loadTime,
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export default performanceMonitor;
