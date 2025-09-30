/**
 * 📊 Analytics Types
 * Mirrors: CyntientOps/Core/Types/AnalyticsTypes.swift
 * Purpose: Complete analytics and performance metrics system
 */

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
  IMPROVING = 'improving',
  DECLINING = 'declining',
  UNKNOWN = 'unknown'
}

export enum KPITrend {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

export enum KPIPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum InsightPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TimeFrame {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export enum MetricType {
  EFFICIENCY = 'efficiency',
  PRODUCTIVITY = 'productivity',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  COSTS = 'costs'
}

export enum ComparisonPeriod {
  PREVIOUS_PERIOD = 'previous_period',
  YEAR_OVER_YEAR = 'year_over_year',
  INDUSTRY_BENCHMARK = 'industry_benchmark'
}

export enum Department {
  ALL = 'all',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  CLEANING = 'cleaning',
  INSPECTION = 'inspection'
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: KPITrend;
  department: string;
  priority: KPIPriority;
  description?: string;
  lastUpdated: Date;
  historicalData?: KPIDataPoint[];
}

export interface KPIDataPoint {
  date: Date;
  value: number;
  target: number;
}

export interface DepartmentMetric {
  id: string;
  name: string;
  efficiency: number;
  quality: number;
  utilization: number;
  cost: number;
  workerCount: number;
  taskCount: number;
  completionRate: number;
  averageResponseTime: number;
}

export interface BuildingPerformance {
  id: string;
  name: string;
  address: string;
  efficiency: number;
  quality: number;
  compliance: number;
  costPerSqFt: number;
  taskCount: number;
  completionRate: number;
  averageResponseTime: number;
  lastInspection: Date;
  criticalIssues: number;
}

export interface PerformanceInsight {
  id: string;
  title: string;
  description: string;
  priority: InsightPriority;
  impact: string;
  recommendation: string;
  category: string;
  confidence: number;
  estimatedSavings?: number;
  implementationEffort: 'low' | 'medium' | 'high';
  timeToImplement: string;
}

export interface PerformanceData {
  overallScore: number;
  efficiency: number;
  quality: number;
  costControl: number;
  compliance: number;
  efficiencyTrend: TrendDirection;
  qualityTrend: TrendDirection;
  costTrend: TrendDirection;
  complianceTrend: TrendDirection;
  kpiMetrics: KPIMetric[];
  departmentMetrics: DepartmentMetric[];
  buildingPerformances: BuildingPerformance[];
  aiInsights: PerformanceInsight[];
  lastUpdated: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AnalyticsFilter {
  timeframe?: TimeFrame;
  metricType?: MetricType;
  department?: Department;
  buildingIds?: string[];
  workerIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercent: number;
  trend: TrendDirection;
  forecast?: {
    nextPeriod: number;
    confidence: number;
  };
  seasonality?: {
    pattern: string;
    impact: number;
  };
}

export interface BenchmarkComparison {
  metric: string;
  currentValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
  gap: number;
  opportunity: string;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'performance' | 'compliance' | 'financial' | 'operations' | 'executive';
  generatedDate: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    overallScore: number;
    keyMetrics: Record<string, number>;
    trends: TrendAnalysis[];
    insights: PerformanceInsight[];
  };
  sections: AnalyticsReportSection[];
  filePath?: string;
  isGenerated: boolean;
}

export interface AnalyticsReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'summary' | 'insights';
  data: any;
  charts?: ChartData[];
  tables?: TableData[];
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: any[];
  xAxis: string;
  yAxis: string;
  colors?: string[];
}

export interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: any[][];
  summary?: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
}

export interface WorkerPerformance {
  workerId: string;
  workerName: string;
  department: string;
  efficiency: number;
  quality: number;
  productivity: number;
  attendance: number;
  taskCount: number;
  completionRate: number;
  averageResponseTime: number;
  customerSatisfaction?: number;
  lastUpdated: Date;
}

export interface BuildingAnalytics {
  buildingId: string;
  buildingName: string;
  address: string;
  metrics: {
    efficiency: number;
    quality: number;
    compliance: number;
    costPerSqFt: number;
    utilization: number;
  };
  trends: {
    efficiency: TrendAnalysis;
    quality: TrendAnalysis;
    compliance: TrendAnalysis;
    costs: TrendAnalysis;
  };
  insights: PerformanceInsight[];
  lastUpdated: Date;
}

export interface PortfolioAnalytics {
  portfolioId: string;
  portfolioName: string;
  overallScore: number;
  buildingCount: number;
  activeBuildings: number;
  totalWorkers: number;
  activeWorkers: number;
  totalTasks: number;
  completedTasks: number;
  criticalIssues: number;
  complianceRate: number;
  averageEfficiency: number;
  averageQuality: number;
  totalCost: number;
  costPerBuilding: number;
  trends: TrendAnalysis[];
  topPerformers: {
    buildings: BuildingPerformance[];
    workers: WorkerPerformance[];
    departments: DepartmentMetric[];
  };
  bottomPerformers: {
    buildings: BuildingPerformance[];
    workers: WorkerPerformance[];
    departments: DepartmentMetric[];
  };
  insights: PerformanceInsight[];
  lastUpdated: Date;
}

export interface AnalyticsDashboard {
  id: string;
  title: string;
  widgets: AnalyticsWidget[];
  layout: {
    columns: number;
    rows: number;
  };
  filters: AnalyticsFilter;
  lastUpdated: Date;
  isDefault: boolean;
}

export interface AnalyticsWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'insight' | 'summary';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  data: any;
  refreshInterval?: number;
  isVisible: boolean;
}

export interface AnalyticsService {
  // Data Loading
  loadPerformanceData(filter?: AnalyticsFilter): Promise<PerformanceData>;
  loadKPIMetrics(filter?: AnalyticsFilter): Promise<KPIMetric[]>;
  loadDepartmentMetrics(filter?: AnalyticsFilter): Promise<DepartmentMetric[]>;
  loadBuildingPerformances(filter?: AnalyticsFilter): Promise<BuildingPerformance[]>;
  loadWorkerPerformances(filter?: AnalyticsFilter): Promise<WorkerPerformance[]>;
  loadPortfolioAnalytics(portfolioId: string): Promise<PortfolioAnalytics>;
  
  // Analytics
  calculateTrends(metric: string, data: any[]): Promise<TrendAnalysis>;
  compareToBenchmark(metric: string, value: number): Promise<BenchmarkComparison>;
  generateInsights(data: PerformanceData): Promise<PerformanceInsight[]>;
  forecastMetrics(metric: string, historicalData: any[]): Promise<any>;
  
  // Reporting
  generateReport(type: string, filter: AnalyticsFilter): Promise<AnalyticsReport>;
  exportReport(reportId: string, format: 'pdf' | 'csv' | 'excel'): Promise<string>;
  scheduleReport(reportId: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<void>;
  
  // Dashboards
  createDashboard(title: string, widgets: AnalyticsWidget[]): Promise<AnalyticsDashboard>;
  updateDashboard(dashboardId: string, widgets: AnalyticsWidget[]): Promise<void>;
  deleteDashboard(dashboardId: string): Promise<void>;
  getDashboards(): Promise<AnalyticsDashboard[]>;
  
  // Real-time Updates
  subscribeToMetrics(callback: (update: any) => void): () => void;
  subscribeToKPIs(callback: (update: KPIMetric) => void): () => void;
}

