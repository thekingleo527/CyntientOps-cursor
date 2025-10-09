/**
 * 📊 Compression Monitor
 * Advanced compression metrics and monitoring system
 */

import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';

interface CompressionMetrics {
  totalImages: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  totalSpaceSaved: number;
  averageProcessingTime: number;
  compressionByType: Record<string, CompressionTypeMetrics>;
  performanceOverTime: Array<{
    timestamp: number;
    compressionRatio: number;
    processingTime: number;
    spaceSaved: number;
  }>;
}

interface CompressionTypeMetrics {
  count: number;
  originalSize: number;
  compressedSize: number;
  averageCompressionRatio: number;
  averageProcessingTime: number;
  spaceSaved: number;
}

interface CompressionEvent {
  type: 'start' | 'complete' | 'error';
  imageType: string;
  originalSize: number;
  compressedSize?: number;
  processingTime?: number;
  error?: string;
  timestamp: number;
}

class CompressionMonitor {
  private static instance: CompressionMonitor;
  private metrics: CompressionMetrics = {
    totalImages: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    averageCompressionRatio: 0,
    totalSpaceSaved: 0,
    averageProcessingTime: 0,
    compressionByType: {},
    performanceOverTime: [],
  };
  private events: CompressionEvent[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): CompressionMonitor {
    if (!CompressionMonitor.instance) {
      CompressionMonitor.instance = new CompressionMonitor();
    }
    return CompressionMonitor.instance;
  }

  /**
   * Start compression monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Collect metrics every 10 seconds
    
    console.log('📊 Compression monitoring started');
  }

  /**
   * Stop compression monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('📊 Compression monitoring stopped');
  }

  /**
   * Record compression start event
   */
  recordCompressionStart(imageType: string, originalSize: number): void {
    const event: CompressionEvent = {
      type: 'start',
      imageType,
      originalSize,
      timestamp: Date.now(),
    };
    
    this.events.push(event);
    console.log(`📊 Compression started: ${imageType} (${originalSize} bytes)`);
  }

  /**
   * Record compression completion event
   */
  recordCompressionComplete(
    imageType: string,
    originalSize: number,
    compressedSize: number,
    processingTime: number
  ): void {
    const event: CompressionEvent = {
      type: 'complete',
      imageType,
      originalSize,
      compressedSize,
      processingTime,
      timestamp: Date.now(),
    };
    
    this.events.push(event);
    this.updateMetrics(event);
    
    console.log(`📊 Compression completed: ${imageType} (${((compressedSize / originalSize) * 100).toFixed(1)}% of original)`);
  }

  /**
   * Record compression error event
   */
  recordCompressionError(imageType: string, originalSize: number, error: string): void {
    const event: CompressionEvent = {
      type: 'error',
      imageType,
      originalSize,
      error,
      timestamp: Date.now(),
    };
    
    this.events.push(event);
    console.warn(`📊 Compression error: ${imageType} - ${error}`);
  }

  /**
   * Update compression metrics
   */
  private updateMetrics(event: CompressionEvent): void {
    if (event.type !== 'complete') return;
    
    const { imageType, originalSize, compressedSize, processingTime } = event;
    
    // Update overall metrics
    this.metrics.totalImages++;
    this.metrics.totalOriginalSize += originalSize;
    this.metrics.totalCompressedSize += compressedSize!;
    this.metrics.totalSpaceSaved += originalSize - compressedSize!;
    this.metrics.averageCompressionRatio = this.metrics.totalCompressedSize / this.metrics.totalOriginalSize;
    this.metrics.averageProcessingTime = (this.metrics.averageProcessingTime * (this.metrics.totalImages - 1) + processingTime!) / this.metrics.totalImages;
    
    // Update type-specific metrics
    if (!this.metrics.compressionByType[imageType]) {
      this.metrics.compressionByType[imageType] = {
        count: 0,
        originalSize: 0,
        compressedSize: 0,
        averageCompressionRatio: 0,
        averageProcessingTime: 0,
        spaceSaved: 0,
      };
    }
    
    const typeMetrics = this.metrics.compressionByType[imageType];
    typeMetrics.count++;
    typeMetrics.originalSize += originalSize;
    typeMetrics.compressedSize += compressedSize!;
    typeMetrics.spaceSaved += originalSize - compressedSize!;
    typeMetrics.averageCompressionRatio = typeMetrics.compressedSize / typeMetrics.originalSize;
    typeMetrics.averageProcessingTime = (typeMetrics.averageProcessingTime * (typeMetrics.count - 1) + processingTime!) / typeMetrics.count;
    
    // Add to performance over time
    this.metrics.performanceOverTime.push({
      timestamp: Date.now(),
      compressionRatio: compressedSize! / originalSize,
      processingTime: processingTime!,
      spaceSaved: originalSize - compressedSize!,
    });
    
    // Keep only last 100 performance records
    if (this.metrics.performanceOverTime.length > 100) {
      this.metrics.performanceOverTime = this.metrics.performanceOverTime.slice(-100);
    }
  }

  /**
   * Collect additional metrics
   */
  private collectMetrics(): void {
    // Get memory usage
    const memoryStats = memoryManager.getMemoryStats();
    if (memoryStats) {
      console.log(`📊 Memory usage: ${(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memoryStats.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Check if compression is affecting performance
    if (this.metrics.averageProcessingTime > 1000) {
      console.warn('📊 High compression processing time detected - consider optimizing');
    }
  }

  /**
   * Get comprehensive compression report
   */
  getCompressionReport(): {
    summary: {
      totalImages: number;
      totalSpaceSaved: string;
      averageCompressionRatio: number;
      averageProcessingTime: number;
    };
    byType: Record<string, CompressionTypeMetrics>;
    performance: {
      recentCompressionRatio: number;
      recentProcessingTime: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    recommendations: string[];
  } {
    const recentPerformance = this.metrics.performanceOverTime.slice(-10);
    const recentCompressionRatio = recentPerformance.length > 0 
      ? recentPerformance.reduce((sum, p) => sum + p.compressionRatio, 0) / recentPerformance.length
      : 0;
    const recentProcessingTime = recentPerformance.length > 0
      ? recentPerformance.reduce((sum, p) => sum + p.processingTime, 0) / recentPerformance.length
      : 0;
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentPerformance.length >= 5) {
      const firstHalf = recentPerformance.slice(0, Math.floor(recentPerformance.length / 2));
      const secondHalf = recentPerformance.slice(Math.floor(recentPerformance.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, p) => sum + p.compressionRatio, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, p) => sum + p.compressionRatio, 0) / secondHalf.length;
      
      if (secondAvg < firstAvg * 0.95) trend = 'improving';
      else if (secondAvg > firstAvg * 1.05) trend = 'declining';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (this.metrics.averageProcessingTime > 2000) {
      recommendations.push('Consider reducing compression quality for faster processing');
    }
    
    if (this.metrics.averageCompressionRatio > 0.8) {
      recommendations.push('Compression ratio is high - consider using more aggressive compression');
    }
    
    if (this.metrics.totalSpaceSaved < 1000000) { // < 1MB
      recommendations.push('Space savings are minimal - consider if compression is necessary');
    }
    
    if (trend === 'declining') {
      recommendations.push('Compression performance is declining - check for memory issues');
    }
    
    return {
      summary: {
        totalImages: this.metrics.totalImages,
        totalSpaceSaved: this.formatBytes(this.metrics.totalSpaceSaved),
        averageCompressionRatio: this.metrics.averageCompressionRatio,
        averageProcessingTime: this.metrics.averageProcessingTime,
      },
      byType: this.metrics.compressionByType,
      performance: {
        recentCompressionRatio,
        recentProcessingTime,
        trend,
      },
      recommendations,
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Log compression report
   */
  logCompressionReport(): void {
    const report = this.getCompressionReport();
    
    console.log('\n📊 Compression Performance Report');
    console.log('=' .repeat(50));
    console.log(`Total Images: ${report.summary.totalImages}`);
    console.log(`Total Space Saved: ${report.summary.totalSpaceSaved}`);
    console.log(`Average Compression Ratio: ${(report.summary.averageCompressionRatio * 100).toFixed(1)}%`);
    console.log(`Average Processing Time: ${report.summary.averageProcessingTime.toFixed(0)}ms`);
    
    console.log('\n📈 Performance by Type:');
    Object.entries(report.byType).forEach(([type, metrics]) => {
      console.log(`${type}: ${metrics.count} images, ${(metrics.averageCompressionRatio * 100).toFixed(1)}% ratio, ${metrics.averageProcessingTime.toFixed(0)}ms avg`);
    });
    
    console.log('\n📊 Recent Performance:');
    console.log(`Recent Compression Ratio: ${(report.performance.recentCompressionRatio * 100).toFixed(1)}%`);
    console.log(`Recent Processing Time: ${report.performance.recentProcessingTime.toFixed(0)}ms`);
    console.log(`Trend: ${report.performance.trend}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
  }

  /**
   * Clear all compression metrics
   */
  clearMetrics(): void {
    this.metrics = {
      totalImages: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      totalSpaceSaved: 0,
      averageProcessingTime: 0,
      compressionByType: {},
      performanceOverTime: [],
    };
    this.events = [];
    console.log('📊 Compression metrics cleared');
  }

  /**
   * Get compression statistics
   */
  getCompressionStats(): CompressionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent compression events
   */
  getRecentEvents(limit: number = 20): CompressionEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Check if compression is performing well
   */
  isCompressionHealthy(): boolean {
    const report = this.getCompressionReport();
    
    return (
      report.summary.averageProcessingTime < 2000 && // < 2 seconds
      report.summary.averageCompressionRatio < 0.8 && // < 80% of original
      report.performance.trend !== 'declining'
    );
  }
}

export const compressionMonitor = CompressionMonitor.getInstance();
export default compressionMonitor;
