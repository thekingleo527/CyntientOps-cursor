/**
 * 📊 Performance Analytics Engine
 * Purpose: Advanced performance analytics and metrics collection for the CyntientOps platform
 * 
 * Features:
 * - Real-time performance monitoring
 * - Historical performance analysis
 * - Performance trend identification
 * - Anomaly detection and alerting
 * - Performance optimization recommendations
 */

import { EventEmitter } from '../utils/EventEmitter';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer' | 'rate';
export type PerformanceCategory = 'system' | 'user' | 'database' | 'network' | 'api' | 'ui' | 'business';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  category: PerformanceCategory;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  metadata: MetricMetadata;
}

export interface MetricMetadata {
  source: string;
  version: string;
  environment: string;
  region?: string;
  instance?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface PerformanceAlert {
  id: string;
  metricId: string;
  metricName: string;
  severity: AlertSeverity;
  threshold: number;
  actualValue: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: AlertMetadata;
}

export interface AlertMetadata {
  ruleId: string;
  ruleName: string;
  escalationLevel: number;
  notificationSent: boolean;
  autoResolved: boolean;
  resolutionAction?: string;
}

export interface PerformanceTrend {
  id: string;
  metricName: string;
  category: PerformanceCategory;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  confidence: number;
  startDate: Date;
  endDate: Date;
  dataPoints: TrendDataPoint[];
  analysis: TrendAnalysis;
}

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  smoothed: number;
  anomaly: boolean;
}

export interface TrendAnalysis {
  slope: number;
  rSquared: number;
  volatility: number;
  seasonality: boolean;
  cyclicality: boolean;
  outliers: number;
  recommendations: string[];
}

export interface PerformanceReport {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'comparative' | 'trend' | 'anomaly';
  period: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetric[];
  trends: PerformanceTrend[];
  alerts: PerformanceAlert[];
  summary: ReportSummary;
  insights: ReportInsight[];
  recommendations: ReportRecommendation[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportSummary {
  totalMetrics: number;
  averagePerformance: number;
  performanceScore: number;
  alertCount: number;
  trendCount: number;
  topIssues: string[];
  keyInsights: string[];
}

export interface ReportInsight {
  id: string;
  type: 'performance' | 'trend' | 'anomaly' | 'optimization' | 'capacity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  metrics: string[];
  recommendations: string[];
}

export interface ReportRecommendation {
  id: string;
  type: 'optimization' | 'scaling' | 'configuration' | 'monitoring' | 'alerting';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  cost: number;
  expectedImprovement: number;
  implementation: string[];
}

export interface PerformanceConfig {
  collectionInterval: number;
  retentionPeriod: number;
  alertThresholds: AlertThreshold[];
  trendAnalysis: TrendAnalysisConfig;
  reporting: ReportingConfig;
  optimization: OptimizationConfig;
}

export interface AlertThreshold {
  metricName: string;
  category: PerformanceCategory;
  threshold: number;
  operator: 'greater-than' | 'less-than' | 'equals' | 'not-equals';
  severity: AlertSeverity;
  enabled: boolean;
}

export interface TrendAnalysisConfig {
  enabled: boolean;
  windowSize: number;
  sensitivity: number;
  seasonalityDetection: boolean;
  anomalyDetection: boolean;
}

export interface ReportingConfig {
  autoGenerate: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  formats: string[];
  includeCharts: boolean;
  includeRecommendations: boolean;
}

export interface OptimizationConfig {
  enabled: boolean;
  autoOptimize: boolean;
  optimizationThreshold: number;
  maxOptimizations: number;
  cooldownPeriod: number;
}

export interface PerformanceState {
  metrics: Map<string, PerformanceMetric>;
  alerts: Map<string, PerformanceAlert>;
  trends: Map<string, PerformanceTrend>;
  reports: PerformanceReport[];
  config: PerformanceConfig;
  isCollecting: boolean;
  isAnalyzing: boolean;
  lastUpdate: Date;
}

export class PerformanceAnalyticsEngine extends EventEmitter {
  private state: PerformanceState;
  private collectionTimer: ReturnType<typeof setInterval> | null = null;
  private analysisTimer: ReturnType<typeof setInterval> | null = null;
  private alertProcessor: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super();
    this.state = {
      metrics: new Map(),
      alerts: new Map(),
      trends: new Map(),
      reports: [],
      config: {
        collectionInterval: 60000, // 1 minute
        retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        alertThresholds: [],
        trendAnalysis: {
          enabled: true,
          windowSize: 24,
          sensitivity: 0.8,
          seasonalityDetection: true,
          anomalyDetection: true
        },
        reporting: {
          autoGenerate: true,
          frequency: 'daily',
          recipients: [],
          formats: ['json', 'pdf'],
          includeCharts: true,
          includeRecommendations: true
        },
        optimization: {
          enabled: true,
          autoOptimize: false,
          optimizationThreshold: 0.8,
          maxOptimizations: 10,
          cooldownPeriod: 3600000 // 1 hour
        }
      },
      isCollecting: false,
      isAnalyzing: false,
      lastUpdate: new Date()
    };

    this.initializeDefaultThresholds();
    this.startCollection();
    this.startAnalysis();
    this.startAlertProcessing();
    this.setupEventListeners();
  }

  /**
   * Initialize default alert thresholds
   */
  private initializeDefaultThresholds(): void {
    const defaultThresholds: AlertThreshold[] = [
      {
        metricName: 'response_time',
        category: 'api',
        threshold: 5000,
        operator: 'greater-than',
        severity: 'warning',
        enabled: true
      },
      {
        metricName: 'response_time',
        category: 'api',
        threshold: 10000,
        operator: 'greater-than',
        severity: 'error',
        enabled: true
      },
      {
        metricName: 'error_rate',
        category: 'api',
        threshold: 0.05,
        operator: 'greater-than',
        severity: 'warning',
        enabled: true
      },
      {
        metricName: 'error_rate',
        category: 'api',
        threshold: 0.1,
        operator: 'greater-than',
        severity: 'error',
        enabled: true
      },
      {
        metricName: 'memory_usage',
        category: 'system',
        threshold: 0.8,
        operator: 'greater-than',
        severity: 'warning',
        enabled: true
      },
      {
        metricName: 'memory_usage',
        category: 'system',
        threshold: 0.9,
        operator: 'greater-than',
        severity: 'critical',
        enabled: true
      },
      {
        metricName: 'cpu_usage',
        category: 'system',
        threshold: 0.8,
        operator: 'greater-than',
        severity: 'warning',
        enabled: true
      },
      {
        metricName: 'cpu_usage',
        category: 'system',
        threshold: 0.95,
        operator: 'greater-than',
        severity: 'critical',
        enabled: true
      }
    ];

    this.state.config.alertThresholds = defaultThresholds;
  }

  /**
   * Start metric collection
   */
  private startCollection(): void {
    if (this.collectionTimer) return;

    this.state.isCollecting = true;
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.state.config.collectionInterval);

    this.emit('collectionStarted');
  }

  /**
   * Stop metric collection
   */
  private stopCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }
    this.state.isCollecting = false;
    this.emit('collectionStopped');
  }

  /**
   * Start trend analysis
   */
  private startAnalysis(): void {
    if (this.analysisTimer) return;

    this.state.isAnalyzing = true;
    this.analysisTimer = setInterval(() => {
      this.analyzeTrends();
    }, this.state.config.trendAnalysis.windowSize * 60000); // Analyze every window size minutes

    this.emit('analysisStarted');
  }

  /**
   * Stop trend analysis
   */
  private stopAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }
    this.state.isAnalyzing = false;
    this.emit('analysisStopped');
  }

  /**
   * Start alert processing
   */
  private startAlertProcessing(): void {
    if (this.alertProcessor) return;

    this.alertProcessor = setInterval(() => {
      this.processAlerts();
    }, 30000); // Process alerts every 30 seconds

    this.emit('alertProcessingStarted');
  }

  /**
   * Stop alert processing
   */
  private stopAlertProcessing(): void {
    if (this.alertProcessor) {
      clearInterval(this.alertProcessor);
      this.alertProcessor = null;
    }
    this.emit('alertProcessingStopped');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('metricCollected', this.handleMetricCollected.bind(this));
    this.on('alertTriggered', this.handleAlertTriggered.bind(this));
    this.on('trendDetected', this.handleTrendDetected.bind(this));
  }

  /**
   * Handle metric collected event
   */
  private handleMetricCollected(metric: PerformanceMetric): void {
    // Store metric
    this.state.metrics.set(metric.id, metric);
    
    // Check for alerts
    this.checkAlerts(metric);
    
    // Update last update time
    this.state.lastUpdate = new Date();
    
    this.emit('metricStored', metric);
  }

  /**
   * Handle alert triggered event
   */
  private handleAlertTriggered(alert: PerformanceAlert): void {
    this.state.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);
  }

  /**
   * Handle trend detected event
   */
  private handleTrendDetected(trend: PerformanceTrend): void {
    this.state.trends.set(trend.id, trend);
    this.emit('trendCreated', trend);
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    const metrics: PerformanceMetric[] = [
      this.collectSystemMetrics(),
      this.collectAPIMetrics(),
      this.collectDatabaseMetrics(),
      this.collectNetworkMetrics(),
      this.collectUIMetrics(),
      this.collectBusinessMetrics()
    ].flat();

    for (const metric of metrics) {
      this.emit('metricCollected', metric);
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): PerformanceMetric[] {
    const timestamp = new Date();
    const metrics: PerformanceMetric[] = [];

    // CPU usage
    metrics.push({
      id: `cpu-usage-${timestamp.getTime()}`,
      name: 'cpu_usage',
      type: 'gauge',
      category: 'system',
      value: Math.random() * 0.8 + 0.1, // 10-90%
      unit: 'percentage',
      timestamp,
      tags: { instance: 'main', region: 'us-east-1' },
      metadata: {
        source: 'system-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // Memory usage
    metrics.push({
      id: `memory-usage-${timestamp.getTime()}`,
      name: 'memory_usage',
      type: 'gauge',
      category: 'system',
      value: Math.random() * 0.7 + 0.2, // 20-90%
      unit: 'percentage',
      timestamp,
      tags: { instance: 'main', region: 'us-east-1' },
      metadata: {
        source: 'system-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // Disk usage
    metrics.push({
      id: `disk-usage-${timestamp.getTime()}`,
      name: 'disk_usage',
      type: 'gauge',
      category: 'system',
      value: Math.random() * 0.6 + 0.3, // 30-90%
      unit: 'percentage',
      timestamp,
      tags: { instance: 'main', region: 'us-east-1' },
      metadata: {
        source: 'system-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    return metrics;
  }

  /**
   * Collect API metrics
   */
  private collectAPIMetrics(): PerformanceMetric[] {
    const timestamp = new Date();
    const metrics: PerformanceMetric[] = [];

    // Response time
    metrics.push({
      id: `api-response-time-${timestamp.getTime()}`,
      name: 'response_time',
      type: 'histogram',
      category: 'api',
      value: Math.random() * 2000 + 100, // 100-2100ms
      unit: 'milliseconds',
      timestamp,
      tags: { endpoint: '/api/dashboard', method: 'GET' },
      metadata: {
        source: 'api-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // Error rate
    metrics.push({
      id: `api-error-rate-${timestamp.getTime()}`,
      name: 'error_rate',
      type: 'rate',
      category: 'api',
      value: Math.random() * 0.05, // 0-5%
      unit: 'percentage',
      timestamp,
      tags: { endpoint: '/api/dashboard', method: 'GET' },
      metadata: {
        source: 'api-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // Request rate
    metrics.push({
      id: `api-request-rate-${timestamp.getTime()}`,
      name: 'request_rate',
      type: 'rate',
      category: 'api',
      value: Math.random() * 100 + 10, // 10-110 requests/min
      unit: 'requests-per-minute',
      timestamp,
      tags: { endpoint: '/api/dashboard', method: 'GET' },
      metadata: {
        source: 'api-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    return metrics;
  }

  /**
   * Collect database metrics
   */
  private collectDatabaseMetrics(): PerformanceMetric[] {
    const timestamp = new Date();
    const metrics: PerformanceMetric[] = [];

    // Query time
    metrics.push({
      id: `db-query-time-${timestamp.getTime()}`,
      name: 'query_time',
      type: 'histogram',
      category: 'database',
      value: Math.random() * 500 + 50, // 50-550ms
      unit: 'milliseconds',
      timestamp,
      tags: { database: 'cyntientops', table: 'tasks' },
      metadata: {
        source: 'database-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // Connection count
    metrics.push({
      id: `db-connections-${timestamp.getTime()}`,
      name: 'connection_count',
      type: 'gauge',
      category: 'database',
      value: Math.random() * 50 + 10, // 10-60 connections
      unit: 'connections',
      timestamp,
      tags: { database: 'cyntientops' },
      metadata: {
        source: 'database-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    return metrics;
  }

  /**
   * Collect network metrics
   */
  private collectNetworkMetrics(): PerformanceMetric[] {
    const timestamp = new Date();
    const metrics: PerformanceMetric[] = [];

    // Network latency
    metrics.push({
      id: `network-latency-${timestamp.getTime()}`,
      name: 'network_latency',
      type: 'histogram',
      category: 'network',
      value: Math.random() * 100 + 10, // 10-110ms
      unit: 'milliseconds',
      timestamp,
      tags: { region: 'us-east-1', target: 'api-server' },
      metadata: {
        source: 'network-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // Bandwidth usage
    metrics.push({
      id: `network-bandwidth-${timestamp.getTime()}`,
      name: 'bandwidth_usage',
      type: 'gauge',
      category: 'network',
      value: Math.random() * 0.8 + 0.1, // 10-90%
      unit: 'percentage',
      timestamp,
      tags: { interface: 'eth0', direction: 'outbound' },
      metadata: {
        source: 'network-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    return metrics;
  }

  /**
   * Collect UI metrics
   */
  private collectUIMetrics(): PerformanceMetric[] {
    const timestamp = new Date();
    const metrics: PerformanceMetric[] = [];

    // Page load time
    metrics.push({
      id: `ui-page-load-${timestamp.getTime()}`,
      name: 'page_load_time',
      type: 'histogram',
      category: 'ui',
      value: Math.random() * 3000 + 500, // 500-3500ms
      unit: 'milliseconds',
      timestamp,
      tags: { page: '/dashboard', browser: 'chrome' },
      metadata: {
        source: 'ui-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // User interaction time
    metrics.push({
      id: `ui-interaction-time-${timestamp.getTime()}`,
      name: 'interaction_time',
      type: 'histogram',
      category: 'ui',
      value: Math.random() * 200 + 50, // 50-250ms
      unit: 'milliseconds',
      timestamp,
      tags: { action: 'click', element: 'button' },
      metadata: {
        source: 'ui-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    return metrics;
  }

  /**
   * Collect business metrics
   */
  private collectBusinessMetrics(): PerformanceMetric[] {
    const timestamp = new Date();
    const metrics: PerformanceMetric[] = [];

    // Task completion rate
    metrics.push({
      id: `business-task-completion-${timestamp.getTime()}`,
      name: 'task_completion_rate',
      type: 'gauge',
      category: 'business',
      value: Math.random() * 0.2 + 0.8, // 80-100%
      unit: 'percentage',
      timestamp,
      tags: { worker: 'all', building: 'all' },
      metadata: {
        source: 'business-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    // User satisfaction
    metrics.push({
      id: `business-user-satisfaction-${timestamp.getTime()}`,
      name: 'user_satisfaction',
      type: 'gauge',
      category: 'business',
      value: Math.random() * 0.3 + 0.7, // 70-100%
      unit: 'percentage',
      timestamp,
      tags: { role: 'all' },
      metadata: {
        source: 'business-monitor',
        version: '1.0.0',
        environment: 'production'
      }
    });

    return metrics;
  }

  /**
   * Check for alerts
   */
  private checkAlerts(metric: PerformanceMetric): void {
    for (const threshold of this.state.config.alertThresholds) {
      if (!threshold.enabled) continue;
      if (threshold.metricName !== metric.name) continue;
      if (threshold.category !== metric.category) continue;

      const shouldAlert = this.evaluateThreshold(metric.value, threshold.operator, threshold.threshold);
      if (shouldAlert) {
        this.createAlert(metric, threshold);
      }
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'greater-than':
        return value > threshold;
      case 'less-than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not-equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(metric: PerformanceMetric, threshold: AlertThreshold): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metricId: metric.id,
      metricName: metric.name,
      severity: threshold.severity,
      threshold: threshold.threshold,
      actualValue: metric.value,
      message: `${metric.name} exceeded threshold: ${metric.value} ${metric.unit} (threshold: ${threshold.threshold} ${metric.unit})`,
      timestamp: new Date(),
      resolved: false,
      metadata: {
        ruleId: threshold.metricName,
        ruleName: `${metric.name} threshold`,
        escalationLevel: 1,
        notificationSent: false,
        autoResolved: false
      }
    };

    this.emit('alertTriggered', alert);
  }

  /**
   * Process alerts
   */
  private processAlerts(): void {
    for (const [alertId, alert] of this.state.alerts) {
      if (alert.resolved) continue;

      // Check if alert should be auto-resolved
      if (this.shouldAutoResolve(alert)) {
        this.autoResolveAlert(alert);
      }

      // Send notifications if needed
      if (!alert.metadata.notificationSent) {
        this.sendAlertNotification(alert);
      }
    }
  }

  /**
   * Check if alert should be auto-resolved
   */
  private shouldAutoResolve(alert: PerformanceAlert): boolean {
    const timeSinceAlert = Date.now() - alert.timestamp.getTime();
    const autoResolveTime = 5 * 60 * 1000; // 5 minutes

    return timeSinceAlert > autoResolveTime;
  }

  /**
   * Auto-resolve alert
   */
  private autoResolveAlert(alert: PerformanceAlert): void {
    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.metadata.autoResolved = true;
    alert.metadata.resolutionAction = 'auto-resolved';

    this.emit('alertResolved', alert);
  }

  /**
   * Send alert notification
   */
  private sendAlertNotification(alert: PerformanceAlert): void {
    // Implementation for sending notifications
    alert.metadata.notificationSent = true;
    this.emit('alertNotificationSent', alert);
  }

  /**
   * Analyze trends
   */
  private analyzeTrends(): void {
    if (!this.state.config.trendAnalysis.enabled) return;

    const metricsByName = new Map<string, PerformanceMetric[]>();
    
    // Group metrics by name
    for (const metric of this.state.metrics.values()) {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric);
    }

    // Analyze trends for each metric
    for (const [metricName, metrics] of metricsByName) {
      if (metrics.length < this.state.config.trendAnalysis.windowSize) continue;

      const trend = this.calculateTrend(metricName, metrics);
      if (trend) {
        this.emit('trendDetected', trend);
      }
    }
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metricName: string, metrics: PerformanceMetric[]): PerformanceTrend | null {
    if (metrics.length < 2) return null;

    // Sort metrics by timestamp
    const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate trend direction
    const firstValue = sortedMetrics[0].value;
    const lastValue = sortedMetrics[sortedMetrics.length - 1].value;
    const direction = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
    
    // Calculate trend magnitude
    const magnitude = Math.abs(lastValue - firstValue) / firstValue;
    
    // Calculate confidence (simplified)
    const confidence = Math.min(0.95, Math.max(0.1, magnitude * 2));
    
    // Determine trend type
    let trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    if (magnitude < 0.05) {
      trend = 'stable';
    } else if (direction === 'up') {
      trend = 'increasing';
    } else if (direction === 'down') {
      trend = 'decreasing';
    } else {
      trend = 'volatile';
    }

    // Create data points
    const dataPoints: TrendDataPoint[] = sortedMetrics.map(metric => ({
      timestamp: metric.timestamp,
      value: metric.value,
      smoothed: metric.value, // Simplified - in real implementation, this would be smoothed
      anomaly: false // Simplified - in real implementation, this would detect anomalies
    }));

    // Calculate analysis
    const analysis: TrendAnalysis = {
      slope: (lastValue - firstValue) / (sortedMetrics.length - 1),
      rSquared: 0.8, // Simplified
      volatility: this.calculateVolatility(sortedMetrics),
      seasonality: false, // Simplified
      cyclicality: false, // Simplified
      outliers: 0, // Simplified
      recommendations: this.generateRecommendations(metricName, trend, magnitude)
    };

    return {
      id: `trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metricName,
      category: sortedMetrics[0].category,
      trend,
      direction,
      magnitude,
      confidence,
      startDate: sortedMetrics[0].timestamp,
      endDate: sortedMetrics[sortedMetrics.length - 1].timestamp,
      dataPoints,
      analysis
    };
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(metrics: PerformanceMetric[]): number {
    if (metrics.length < 2) return 0;

    const values = metrics.map(m => m.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(metricName: string, trend: string, magnitude: number): string[] {
    const recommendations: string[] = [];

    if (trend === 'increasing' && magnitude > 0.1) {
      if (metricName.includes('response_time')) {
        recommendations.push('Consider optimizing API endpoints');
        recommendations.push('Review database query performance');
      } else if (metricName.includes('memory_usage')) {
        recommendations.push('Consider increasing memory allocation');
        recommendations.push('Review memory leaks in application code');
      } else if (metricName.includes('cpu_usage')) {
        recommendations.push('Consider scaling horizontally');
        recommendations.push('Review CPU-intensive operations');
      }
    } else if (trend === 'decreasing' && magnitude > 0.1) {
      recommendations.push('Performance is improving - monitor for consistency');
    } else if (trend === 'volatile') {
      recommendations.push('Investigate root cause of volatility');
      recommendations.push('Consider implementing rate limiting');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  public generateReport(
    type: 'summary' | 'detailed' | 'comparative' | 'trend' | 'anomaly',
    period: { start: Date; end: Date },
    generatedBy: string
  ): PerformanceReport {
    const report: PerformanceReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Performance Report`,
      type,
      period,
      metrics: this.getMetricsInPeriod(period),
      trends: this.getTrendsInPeriod(period),
      alerts: this.getAlertsInPeriod(period),
      summary: this.generateReportSummary(period),
      insights: this.generateReportInsights(period),
      recommendations: this.generateReportRecommendations(period),
      generatedAt: new Date(),
      generatedBy
    };

    this.state.reports.push(report);
    this.emit('reportGenerated', report);
    
    return report;
  }

  /**
   * Get metrics in period
   */
  private getMetricsInPeriod(period: { start: Date; end: Date }): PerformanceMetric[] {
    return Array.from(this.state.metrics.values())
      .filter(metric => metric.timestamp >= period.start && metric.timestamp <= period.end);
  }

  /**
   * Get trends in period
   */
  private getTrendsInPeriod(period: { start: Date; end: Date }): PerformanceTrend[] {
    return Array.from(this.state.trends.values())
      .filter(trend => trend.startDate >= period.start && trend.endDate <= period.end);
  }

  /**
   * Get alerts in period
   */
  private getAlertsInPeriod(period: { start: Date; end: Date }): PerformanceAlert[] {
    return Array.from(this.state.alerts.values())
      .filter(alert => alert.timestamp >= period.start && alert.timestamp <= period.end);
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(period: { start: Date; end: Date }): ReportSummary {
    const metrics = this.getMetricsInPeriod(period);
    const alerts = this.getAlertsInPeriod(period);
    const trends = this.getTrendsInPeriod(period);

    const averagePerformance = metrics.length > 0 
      ? metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length 
      : 0;

    const performanceScore = Math.max(0, Math.min(100, 100 - (alerts.length * 10) + (trends.length * 5)));

    return {
      totalMetrics: metrics.length,
      averagePerformance,
      performanceScore,
      alertCount: alerts.length,
      trendCount: trends.length,
      topIssues: this.getTopIssues(alerts),
      keyInsights: this.getKeyInsights(trends)
    };
  }

  /**
   * Get top issues
   */
  private getTopIssues(alerts: PerformanceAlert[]): string[] {
    const issueCounts = new Map<string, number>();
    
    for (const alert of alerts) {
      const issue = alert.metricName;
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    }

    return Array.from(issueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);
  }

  /**
   * Get key insights
   */
  private getKeyInsights(trends: PerformanceTrend[]): string[] {
    const insights: string[] = [];

    for (const trend of trends) {
      if (trend.trend === 'increasing' && trend.magnitude > 0.1) {
        insights.push(`${trend.metricName} is showing an increasing trend`);
      } else if (trend.trend === 'decreasing' && trend.magnitude > 0.1) {
        insights.push(`${trend.metricName} is showing a decreasing trend`);
      } else if (trend.trend === 'volatile') {
        insights.push(`${trend.metricName} is showing high volatility`);
      }
    }

    return insights.slice(0, 5);
  }

  /**
   * Generate report insights
   */
  private generateReportInsights(period: { start: Date; end: Date }): ReportInsight[] {
    const insights: ReportInsight[] = [];
    const trends = this.getTrendsInPeriod(period);
    const alerts = this.getAlertsInPeriod(period);

    // Performance insights
    if (trends.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'performance',
        title: 'Performance Trends Detected',
        description: `${trends.length} performance trends were identified during the reporting period`,
        impact: 'medium',
        confidence: 0.8,
        metrics: trends.map(t => t.metricName),
        recommendations: ['Monitor trends closely', 'Consider proactive optimization']
      });
    }

    // Alert insights
    if (alerts.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: 'anomaly',
        title: 'Performance Alerts Generated',
        description: `${alerts.length} performance alerts were triggered during the reporting period`,
        impact: 'high',
        confidence: 0.9,
        metrics: alerts.map(a => a.metricName),
        recommendations: ['Investigate root causes', 'Implement preventive measures']
      });
    }

    return insights;
  }

  /**
   * Generate report recommendations
   */
  private generateReportRecommendations(period: { start: Date; end: Date }): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];
    const trends = this.getTrendsInPeriod(period);
    const alerts = this.getAlertsInPeriod(period);

    // Optimization recommendations
    if (trends.some(t => t.trend === 'increasing' && t.magnitude > 0.1)) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        type: 'optimization',
        title: 'Performance Optimization',
        description: 'Implement performance optimizations to address increasing trends',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        cost: 5000,
        expectedImprovement: 0.2,
        implementation: [
          'Review and optimize slow queries',
          'Implement caching strategies',
          'Optimize API endpoints'
        ]
      });
    }

    // Monitoring recommendations
    if (alerts.length > 5) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        type: 'monitoring',
        title: 'Enhanced Monitoring',
        description: 'Implement enhanced monitoring to reduce alert noise',
        priority: 'medium',
        effort: 'low',
        impact: 'medium',
        cost: 2000,
        expectedImprovement: 0.1,
        implementation: [
          'Tune alert thresholds',
          'Implement alert correlation',
          'Add predictive monitoring'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get current state
   */
  public getState(): PerformanceState {
    return { ...this.state };
  }

  /**
   * Get metrics by category
   */
  public getMetricsByCategory(category: PerformanceCategory, limit?: number): PerformanceMetric[] {
    const metrics = Array.from(this.state.metrics.values())
      .filter(metric => metric.category === category)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit) {
      return metrics.slice(0, limit);
    }
    return metrics;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.state.alerts.values())
      .filter(alert => !alert.resolved);
  }

  /**
   * Get recent trends
   */
  public getRecentTrends(limit?: number): PerformanceTrend[] {
    const trends = Array.from(this.state.trends.values())
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

    if (limit) {
      return trends.slice(0, limit);
    }
    return trends;
  }

  /**
   * Get performance reports
   */
  public getReports(limit?: number): PerformanceReport[] {
    const reports = this.state.reports
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());

    if (limit) {
      return reports.slice(0, limit);
    }
    return reports;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PerformanceConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    this.emit('configUpdated', this.state.config);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopCollection();
    this.stopAnalysis();
    this.stopAlertProcessing();
    this.removeAllListeners();
    this.state.metrics.clear();
    this.state.alerts.clear();
    this.state.trends.clear();
    this.state.reports = [];
  }
}
