/**
 * 🔮 Predictive Analytics Service
 * Purpose: Advanced predictive analytics and forecasting for the CyntientOps platform
 * 
 * Features:
 * - Time series forecasting
 * - Anomaly detection and prediction
 * - Capacity planning and resource optimization
 * - Risk assessment and mitigation
 * - Performance prediction and optimization
 */

import { EventEmitter } from 'events';

export type PredictionType = 'forecast' | 'anomaly' | 'capacity' | 'risk' | 'performance' | 'trend';
export type PredictionModel = 'linear' | 'exponential' | 'seasonal' | 'arima' | 'lstm' | 'ensemble';
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very-high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Prediction {
  id: string;
  type: PredictionType;
  model: PredictionModel;
  target: string;
  metric: string;
  value: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  timestamp: Date;
  predictionDate: Date;
  horizon: number; // days
  metadata: PredictionMetadata;
}

export interface PredictionMetadata {
  source: string;
  version: string;
  modelVersion: string;
  trainingDataSize: number;
  lastTrainingDate: Date;
  accuracy: number;
  features: string[];
  parameters: Record<string, any>;
}

export interface TimeSeriesData {
  id: string;
  metric: string;
  timestamps: Date[];
  values: number[];
  metadata: TimeSeriesMetadata;
}

export interface TimeSeriesMetadata {
  frequency: 'minute' | 'hour' | 'day' | 'week' | 'month';
  seasonality: boolean;
  trend: boolean;
  stationarity: boolean;
  missingValues: number;
  outliers: number;
}

export interface Forecast {
  id: string;
  metric: string;
  model: PredictionModel;
  predictions: ForecastPoint[];
  confidence: number;
  accuracy: number;
  horizon: number;
  generatedAt: Date;
  metadata: ForecastMetadata;
}

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastMetadata {
  modelParameters: Record<string, any>;
  trainingPeriod: { start: Date; end: Date };
  validationPeriod: { start: Date; end: Date };
  performance: ModelPerformance;
}

export interface ModelPerformance {
  mse: number;
  mae: number;
  mape: number;
  r2: number;
  accuracy: number;
}

export interface AnomalyPrediction {
  id: string;
  metric: string;
  predictedAnomaly: boolean;
  probability: number;
  expectedValue: number;
  actualValue?: number;
  deviation: number;
  timestamp: Date;
  predictionDate: Date;
  severity: RiskLevel;
  metadata: AnomalyMetadata;
}

export interface AnomalyMetadata {
  model: string;
  threshold: number;
  features: string[];
  context: Record<string, any>;
  explanation: string;
}

export interface CapacityPrediction {
  id: string;
  resource: string;
  currentUsage: number;
  predictedUsage: number;
  capacityLimit: number;
  utilizationForecast: number[];
  bottleneckDate?: Date;
  recommendations: CapacityRecommendation[];
  timestamp: Date;
  horizon: number;
  metadata: CapacityMetadata;
}

export interface CapacityRecommendation {
  type: 'scale-up' | 'scale-out' | 'optimize' | 'monitor';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
  cost: number;
  timeline: string;
  implementation: string[];
}

export interface CapacityMetadata {
  resourceType: 'cpu' | 'memory' | 'storage' | 'network' | 'database';
  currentCapacity: number;
  growthRate: number;
  seasonality: boolean;
  historicalData: number[];
}

export interface RiskAssessment {
  id: string;
  riskType: string;
  riskLevel: RiskLevel;
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  factors: RiskFactor[];
  mitigation: RiskMitigation[];
  timestamp: Date;
  horizon: number;
  metadata: RiskMetadata;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: number;
}

export interface RiskMitigation {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effectiveness: number;
  cost: number;
  timeline: string;
  implementation: string[];
}

export interface RiskMetadata {
  assessmentModel: string;
  historicalIncidents: number;
  lastIncident: Date;
  industryBenchmark: number;
  context: Record<string, any>;
}

export interface PerformancePrediction {
  id: string;
  metric: string;
  currentPerformance: number;
  predictedPerformance: number;
  performanceTrend: 'improving' | 'degrading' | 'stable';
  optimizationPotential: number;
  recommendations: PerformanceRecommendation[];
  timestamp: Date;
  horizon: number;
  metadata: PerformanceMetadata;
}

export interface PerformanceRecommendation {
  type: 'optimization' | 'scaling' | 'configuration' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImprovement: number;
  effort: 'low' | 'medium' | 'high';
  cost: number;
  timeline: string;
  implementation: string[];
}

export interface PerformanceMetadata {
  baseline: number;
  target: number;
  historicalTrend: number[];
  seasonality: boolean;
  optimizationHistory: number[];
}

export interface PredictiveConfig {
  models: ModelConfig[];
  forecasting: ForecastingConfig;
  anomalyDetection: AnomalyConfig;
  capacityPlanning: CapacityConfig;
  riskAssessment: RiskConfig;
  performance: PerformanceConfig;
}

export interface ModelConfig {
  name: string;
  type: PredictionModel;
  enabled: boolean;
  parameters: Record<string, any>;
  trainingSchedule: string;
  retrainingThreshold: number;
}

export interface ForecastingConfig {
  enabled: boolean;
  defaultHorizon: number;
  maxHorizon: number;
  confidenceLevel: number;
  seasonalityDetection: boolean;
  trendDetection: boolean;
}

export interface AnomalyConfig {
  enabled: boolean;
  sensitivity: number;
  threshold: number;
  windowSize: number;
  minSamples: number;
  autoAlert: boolean;
}

export interface CapacityConfig {
  enabled: boolean;
  warningThreshold: number;
  criticalThreshold: number;
  planningHorizon: number;
  growthRate: number;
  seasonality: boolean;
}

export interface RiskConfig {
  enabled: boolean;
  assessmentFrequency: string;
  riskThresholds: Record<RiskLevel, number>;
  mitigationEnabled: boolean;
  alertThreshold: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  optimizationThreshold: number;
  improvementTarget: number;
  monitoringInterval: number;
  autoOptimization: boolean;
}

export interface PredictiveState {
  predictions: Map<string, Prediction>;
  forecasts: Map<string, Forecast>;
  anomalies: Map<string, AnomalyPrediction>;
  capacity: Map<string, CapacityPrediction>;
  risks: Map<string, RiskAssessment>;
  performance: Map<string, PerformancePrediction>;
  config: PredictiveConfig;
  isProcessing: boolean;
  lastUpdate: Date;
}

export class PredictiveAnalyticsService extends EventEmitter {
  private state: PredictiveState;
  private processingTimer: NodeJS.Timeout | null = null;
  private modelTrainer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.state = {
      predictions: new Map(),
      forecasts: new Map(),
      anomalies: new Map(),
      capacity: new Map(),
      risks: new Map(),
      performance: new Map(),
      config: {
        models: [
          {
            name: 'linear-regression',
            type: 'linear',
            enabled: true,
            parameters: { learningRate: 0.01, iterations: 1000 },
            trainingSchedule: '0 0 * * *', // Daily at midnight
            retrainingThreshold: 0.1
          },
          {
            name: 'lstm-network',
            type: 'lstm',
            enabled: true,
            parameters: { layers: 2, neurons: 50, epochs: 100 },
            trainingSchedule: '0 0 * * 0', // Weekly on Sunday
            retrainingThreshold: 0.05
          }
        ],
        forecasting: {
          enabled: true,
          defaultHorizon: 7,
          maxHorizon: 30,
          confidenceLevel: 0.95,
          seasonalityDetection: true,
          trendDetection: true
        },
        anomalyDetection: {
          enabled: true,
          sensitivity: 0.8,
          threshold: 0.05,
          windowSize: 24,
          minSamples: 100,
          autoAlert: true
        },
        capacityPlanning: {
          enabled: true,
          warningThreshold: 0.7,
          criticalThreshold: 0.9,
          planningHorizon: 30,
          growthRate: 0.1,
          seasonality: true
        },
        riskAssessment: {
          enabled: true,
          assessmentFrequency: 'daily',
          riskThresholds: {
            low: 0.3,
            medium: 0.5,
            high: 0.7,
            critical: 0.9
          },
          mitigationEnabled: true,
          alertThreshold: 0.7
        },
        performance: {
          enabled: true,
          optimizationThreshold: 0.8,
          improvementTarget: 0.2,
          monitoringInterval: 3600000, // 1 hour
          autoOptimization: false
        }
      },
      isProcessing: false,
      lastUpdate: new Date()
    };

    this.startProcessing();
    this.startModelTraining();
    this.setupEventListeners();
  }

  /**
   * Start predictive processing
   */
  private startProcessing(): void {
    if (this.processingTimer) return;

    this.state.isProcessing = true;
    this.processingTimer = setInterval(() => {
      this.processPredictions();
    }, 300000); // Process every 5 minutes

    this.emit('processingStarted');
  }

  /**
   * Stop predictive processing
   */
  private stopProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    this.state.isProcessing = false;
    this.emit('processingStopped');
  }

  /**
   * Start model training
   */
  private startModelTraining(): void {
    if (this.modelTrainer) return;

    this.modelTrainer = setInterval(() => {
      this.trainModels();
    }, 86400000); // Train daily

    this.emit('modelTrainingStarted');
  }

  /**
   * Stop model training
   */
  private stopModelTraining(): void {
    if (this.modelTrainer) {
      clearInterval(this.modelTrainer);
      this.modelTrainer = null;
    }
    this.emit('modelTrainingStopped');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('predictionGenerated', this.handlePredictionGenerated.bind(this));
    this.on('forecastGenerated', this.handleForecastGenerated.bind(this));
    this.on('anomalyDetected', this.handleAnomalyDetected.bind(this));
  }

  /**
   * Handle prediction generated event
   */
  private handlePredictionGenerated(prediction: Prediction): void {
    this.state.predictions.set(prediction.id, prediction);
    this.emit('predictionStored', prediction);
  }

  /**
   * Handle forecast generated event
   */
  private handleForecastGenerated(forecast: Forecast): void {
    this.state.forecasts.set(forecast.id, forecast);
    this.emit('forecastStored', forecast);
  }

  /**
   * Handle anomaly detected event
   */
  private handleAnomalyDetected(anomaly: AnomalyPrediction): void {
    this.state.anomalies.set(anomaly.id, anomaly);
    this.emit('anomalyStored', anomaly);
  }

  /**
   * Process predictions
   */
  private processPredictions(): void {
    if (!this.state.isProcessing) return;

    // Generate forecasts
    if (this.state.config.forecasting.enabled) {
      this.generateForecasts();
    }

    // Detect anomalies
    if (this.state.config.anomalyDetection.enabled) {
      this.detectAnomalies();
    }

    // Plan capacity
    if (this.state.config.capacityPlanning.enabled) {
      this.planCapacity();
    }

    // Assess risks
    if (this.state.config.riskAssessment.enabled) {
      this.assessRisks();
    }

    // Predict performance
    if (this.state.config.performance.enabled) {
      this.predictPerformance();
    }

    this.state.lastUpdate = new Date();
  }

  /**
   * Generate forecasts
   */
  private generateForecasts(): void {
    const metrics = ['response_time', 'memory_usage', 'cpu_usage', 'error_rate', 'throughput'];
    
    for (const metric of metrics) {
      const forecast = this.createForecast(metric);
      if (forecast) {
        this.emit('forecastGenerated', forecast);
      }
    }
  }

  /**
   * Create forecast for a metric
   */
  private createForecast(metric: string): Forecast | null {
    // Simulate forecast generation
    const horizon = this.state.config.forecasting.defaultHorizon;
    const predictions: ForecastPoint[] = [];
    
    for (let i = 1; i <= horizon; i++) {
      const timestamp = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const baseValue = Math.random() * 100 + 50;
      const confidence = Math.max(0.5, 1 - (i / horizon) * 0.3);
      
      predictions.push({
        timestamp,
        value: baseValue,
        lowerBound: baseValue * (1 - confidence * 0.2),
        upperBound: baseValue * (1 + confidence * 0.2),
        confidence
      });
    }

    const forecast: Forecast = {
      id: `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric,
      model: 'linear',
      predictions,
      confidence: 0.85,
      accuracy: 0.82,
      horizon,
      generatedAt: new Date(),
      metadata: {
        modelParameters: { learningRate: 0.01, iterations: 1000 },
        trainingPeriod: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        validationPeriod: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        performance: {
          mse: 0.05,
          mae: 0.08,
          mape: 0.12,
          r2: 0.82,
          accuracy: 0.82
        }
      }
    };

    return forecast;
  }

  /**
   * Detect anomalies
   */
  private detectAnomalies(): void {
    const metrics = ['response_time', 'memory_usage', 'cpu_usage', 'error_rate'];
    
    for (const metric of metrics) {
      const anomaly = this.detectAnomaly(metric);
      if (anomaly) {
        this.emit('anomalyDetected', anomaly);
      }
    }
  }

  /**
   * Detect anomaly for a metric
   */
  private detectAnomaly(metric: string): AnomalyPrediction | null {
    // Simulate anomaly detection
    const expectedValue = Math.random() * 100 + 50;
    const actualValue = expectedValue + (Math.random() - 0.5) * 50;
    const deviation = Math.abs(actualValue - expectedValue) / expectedValue;
    
    if (deviation > this.state.config.anomalyDetection.threshold) {
      const probability = Math.min(0.95, deviation * 2);
      const severity = probability > 0.8 ? 'critical' : 
                     probability > 0.6 ? 'high' : 
                     probability > 0.4 ? 'medium' : 'low';

      const anomaly: AnomalyPrediction = {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metric,
        predictedAnomaly: true,
        probability,
        expectedValue,
        actualValue,
        deviation,
        timestamp: new Date(),
        predictionDate: new Date(),
        severity,
        metadata: {
          model: 'isolation-forest',
          threshold: this.state.config.anomalyDetection.threshold,
          features: ['value', 'trend', 'seasonality'],
          context: { metric, timestamp: new Date() },
          explanation: `Anomaly detected in ${metric} with ${(deviation * 100).toFixed(1)}% deviation from expected value`
        }
      };

      return anomaly;
    }

    return null;
  }

  /**
   * Plan capacity
   */
  private planCapacity(): void {
    const resources = ['cpu', 'memory', 'storage', 'network', 'database'];
    
    for (const resource of resources) {
      const capacity = this.planResourceCapacity(resource);
      if (capacity) {
        this.state.capacity.set(capacity.id, capacity);
        this.emit('capacityPlanned', capacity);
      }
    }
  }

  /**
   * Plan capacity for a resource
   */
  private planResourceCapacity(resource: string): CapacityPrediction | null {
    const currentUsage = Math.random() * 0.8 + 0.2; // 20-100%
    const growthRate = this.state.config.capacityPlanning.growthRate;
    const horizon = this.state.config.capacityPlanning.planningHorizon;
    
    const predictedUsage = currentUsage * Math.pow(1 + growthRate, horizon / 30);
    const capacityLimit = 1.0;
    
    const utilizationForecast: number[] = [];
    for (let i = 1; i <= horizon; i++) {
      const utilization = currentUsage * Math.pow(1 + growthRate, i / 30);
      utilizationForecast.push(Math.min(1.0, utilization));
    }

    const bottleneckDate = utilizationForecast.some(u => u > this.state.config.capacityPlanning.criticalThreshold)
      ? new Date(Date.now() + utilizationForecast.findIndex(u => u > this.state.config.capacityPlanning.criticalThreshold) * 24 * 60 * 60 * 1000)
      : undefined;

    const recommendations: CapacityRecommendation[] = [];
    if (predictedUsage > this.state.config.capacityPlanning.criticalThreshold) {
      recommendations.push({
        type: 'scale-up',
        priority: 'critical',
        description: `Scale up ${resource} capacity immediately`,
        impact: 0.8,
        cost: 10000,
        timeline: '1-2 weeks',
        implementation: ['Procure additional hardware', 'Configure scaling policies', 'Update monitoring']
      });
    } else if (predictedUsage > this.state.config.capacityPlanning.warningThreshold) {
      recommendations.push({
        type: 'monitor',
        priority: 'high',
        description: `Monitor ${resource} usage closely`,
        impact: 0.3,
        cost: 1000,
        timeline: '1 week',
        implementation: ['Increase monitoring frequency', 'Set up alerts', 'Prepare scaling plan']
      });
    }

    const capacity: CapacityPrediction = {
      id: `capacity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resource,
      currentUsage,
      predictedUsage,
      capacityLimit,
      utilizationForecast,
      bottleneckDate,
      recommendations,
      timestamp: new Date(),
      horizon,
      metadata: {
        resourceType: resource as any,
        currentCapacity: capacityLimit,
        growthRate,
        seasonality: this.state.config.capacityPlanning.seasonality,
        historicalData: utilizationForecast.slice(0, 7)
      }
    };

    return capacity;
  }

  /**
   * Assess risks
   */
  private assessRisks(): void {
    const riskTypes = ['performance', 'security', 'availability', 'compliance', 'financial'];
    
    for (const riskType of riskTypes) {
      const risk = this.assessRisk(riskType);
      if (risk) {
        this.state.risks.set(risk.id, risk);
        this.emit('riskAssessed', risk);
      }
    }
  }

  /**
   * Assess risk for a type
   */
  private assessRisk(riskType: string): RiskAssessment | null {
    const probability = Math.random();
    const impact = Math.random();
    const riskScore = probability * impact;
    
    const riskLevel = riskScore > 0.7 ? 'critical' :
                     riskScore > 0.5 ? 'high' :
                     riskScore > 0.3 ? 'medium' : 'low';

    const factors: RiskFactor[] = [
      {
        name: 'historical_incidents',
        weight: 0.3,
        value: Math.random(),
        trend: 'stable',
        impact: 0.5
      },
      {
        name: 'system_complexity',
        weight: 0.2,
        value: Math.random(),
        trend: 'increasing',
        impact: 0.7
      },
      {
        name: 'external_dependencies',
        weight: 0.2,
        value: Math.random(),
        trend: 'stable',
        impact: 0.6
      },
      {
        name: 'resource_constraints',
        weight: 0.3,
        value: Math.random(),
        trend: 'increasing',
        impact: 0.8
      }
    ];

    const mitigation: RiskMitigation[] = [];
    if (riskLevel === 'high' || riskLevel === 'critical') {
      mitigation.push({
        action: 'Implement monitoring and alerting',
        priority: 'high',
        effectiveness: 0.7,
        cost: 5000,
        timeline: '2-4 weeks',
        implementation: ['Set up monitoring', 'Configure alerts', 'Create runbooks']
      });
    }

    const risk: RiskAssessment = {
      id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      riskType,
      riskLevel,
      probability,
      impact,
      riskScore,
      description: `${riskType} risk assessment with ${riskLevel} severity`,
      factors,
      mitigation,
      timestamp: new Date(),
      horizon: 30,
      metadata: {
        assessmentModel: 'monte-carlo',
        historicalIncidents: Math.floor(Math.random() * 10),
        lastIncident: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        industryBenchmark: Math.random() * 0.5 + 0.2,
        context: { riskType, timestamp: new Date() }
      }
    };

    return risk;
  }

  /**
   * Predict performance
   */
  private predictPerformance(): void {
    const metrics = ['response_time', 'throughput', 'error_rate', 'availability'];
    
    for (const metric of metrics) {
      const performance = this.predictMetricPerformance(metric);
      if (performance) {
        this.state.performance.set(performance.id, performance);
        this.emit('performancePredicted', performance);
      }
    }
  }

  /**
   * Predict performance for a metric
   */
  private predictMetricPerformance(metric: string): PerformancePrediction | null {
    const currentPerformance = Math.random() * 100 + 50;
    const predictedPerformance = currentPerformance + (Math.random() - 0.5) * 20;
    
    const performanceTrend = predictedPerformance > currentPerformance * 1.05 ? 'improving' :
                           predictedPerformance < currentPerformance * 0.95 ? 'degrading' : 'stable';
    
    const optimizationPotential = Math.random() * 0.3 + 0.1; // 10-40%

    const recommendations: PerformanceRecommendation[] = [];
    if (optimizationPotential > 0.2) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: `Optimize ${metric} performance`,
        expectedImprovement: optimizationPotential,
        effort: 'medium',
        cost: 3000,
        timeline: '2-3 weeks',
        implementation: ['Profile performance', 'Identify bottlenecks', 'Implement optimizations']
      });
    }

    const performance: PerformancePrediction = {
      id: `performance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric,
      currentPerformance,
      predictedPerformance,
      performanceTrend,
      optimizationPotential,
      recommendations,
      timestamp: new Date(),
      horizon: 14,
      metadata: {
        baseline: currentPerformance,
        target: currentPerformance * 1.2,
        historicalTrend: [currentPerformance * 0.9, currentPerformance * 0.95, currentPerformance],
        seasonality: false,
        optimizationHistory: [0.1, 0.15, 0.2]
      }
    };

    return performance;
  }

  /**
   * Train models
   */
  private trainModels(): void {
    for (const model of this.state.config.models) {
      if (model.enabled) {
        this.trainModel(model);
      }
    }
  }

  /**
   * Train a specific model
   */
  private trainModel(model: ModelConfig): void {
    // Simulate model training
    this.emit('modelTrainingStarted', model);
    
    setTimeout(() => {
      this.emit('modelTrainingCompleted', {
        model: model.name,
        accuracy: Math.random() * 0.2 + 0.8, // 80-100%
        trainingTime: Math.random() * 3600 + 300, // 5-65 minutes
        timestamp: new Date()
      });
    }, 1000);
  }

  /**
   * Get predictions by type
   */
  public getPredictionsByType(type: PredictionType, limit?: number): Prediction[] {
    const predictions = Array.from(this.state.predictions.values())
      .filter(p => p.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (limit) {
      return predictions.slice(0, limit);
    }
    return predictions;
  }

  /**
   * Get forecasts for a metric
   */
  public getForecastsForMetric(metric: string, limit?: number): Forecast[] {
    const forecasts = Array.from(this.state.forecasts.values())
      .filter(f => f.metric === metric)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());

    if (limit) {
      return forecasts.slice(0, limit);
    }
    return forecasts;
  }

  /**
   * Get active anomalies
   */
  public getActiveAnomalies(): AnomalyPrediction[] {
    return Array.from(this.state.anomalies.values())
      .filter(a => a.predictedAnomaly)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get capacity predictions
   */
  public getCapacityPredictions(): CapacityPrediction[] {
    return Array.from(this.state.capacity.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get risk assessments
   */
  public getRiskAssessments(riskLevel?: RiskLevel): RiskAssessment[] {
    let risks = Array.from(this.state.risks.values());
    
    if (riskLevel) {
      risks = risks.filter(r => r.riskLevel === riskLevel);
    }
    
    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get performance predictions
   */
  public getPerformancePredictions(): PerformancePrediction[] {
    return Array.from(this.state.performance.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<PredictiveConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    this.emit('configUpdated', this.state.config);
  }

  /**
   * Get current state
   */
  public getState(): PredictiveState {
    return { ...this.state };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopProcessing();
    this.stopModelTraining();
    this.removeAllListeners();
    this.state.predictions.clear();
    this.state.forecasts.clear();
    this.state.anomalies.clear();
    this.state.capacity.clear();
    this.state.risks.clear();
    this.state.performance.clear();
  }
}
