/**
 * 🌤️ Comprehensive Weather Manager
 * Consolidates WeatherTaskManager and WeatherTriggeredTaskManager functionality
 * Purpose: Weather-based task adjustments, automation, and outdoor work risk assessment
 */

import EventEmitter from 'eventemitter3';
import { WeatherAPIClient, WeatherForecast, WeatherAlert } from '@cyntientops/api-clients';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataTaskAssignment, WorkerProfile, WeatherSnapshot } from '@cyntientops/domain-schema';

// MARK: - Core Interfaces

export interface WeatherRiskAssessment {
  taskId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: string[];
  recommendations: string[];
  adjustedSchedule?: Date;
  alternativeTasks?: string[];
  safetyRequirements?: string[];
}

export interface OutdoorWorkConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  visibility: number;
  uvIndex: number;
  airQuality: number;
  safetyScore: number; // 0-100
}

export interface WeatherTaskAdjustment {
  taskId: string;
  originalSchedule: Date;
  adjustedSchedule?: Date;
  adjustmentReason: string;
  weatherConditions: OutdoorWorkConditions;
  riskAssessment: WeatherRiskAssessment;
  workerNotification: boolean;
  clientNotification: boolean;
}

// MARK: - Weather Automation Interfaces

export interface WeatherTriggeredTask {
  id: string;
  originalTask: OperationalDataTaskAssignment;
  weatherCondition: WeatherCondition;
  triggerType: WeatherTriggerType;
  priority: WeatherTriggerPriority;
  status: WeatherTriggerStatus;
  scheduledTime: Date;
  estimatedDuration: number;
  weatherDependencies: WeatherDependency[];
  alternativeTasks: AlternativeTask[];
  completionCriteria: CompletionCriteria;
  riskAssessment: WeatherRiskAssessment;
  notifications: WeatherNotification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeatherCondition {
  type: WeatherConditionType;
  severity: WeatherSeverity;
  threshold: number;
  unit: string;
  description: string;
  impact: WeatherImpact;
  duration: number; // hours
  probability: number; // 0-100%
}

export interface WeatherDependency {
  condition: WeatherCondition;
  required: boolean;
  impact: 'blocking' | 'delaying' | 'modifying' | 'enhancing';
  alternativeAction?: string;
}

export interface AlternativeTask {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  weatherConditions: WeatherCondition[];
  prerequisites: string[];
  resources: string[];
}

export interface CompletionCriteria {
  weatherConditions: WeatherCondition[];
  safetyRequirements: SafetyRequirement[];
  qualityStandards: QualityStandard[];
  documentationRequired: boolean;
  photoEvidenceRequired: boolean;
  supervisorApprovalRequired: boolean;
}

export interface SafetyRequirement {
  id: string;
  requirement: string;
  description: string;
  mandatory: boolean;
  weatherConditions: WeatherCondition[];
  equipment: string[];
  training: string[];
}

export interface QualityStandard {
  id: string;
  standard: string;
  description: string;
  criteria: string[];
  weatherConditions: WeatherCondition[];
  inspectionRequired: boolean;
  documentationRequired: boolean;
}

export interface WeatherNotification {
  id: string;
  type: NotificationType;
  recipient: string;
  message: string;
  priority: NotificationPriority;
  scheduledTime: Date;
  sentTime?: Date;
  status: NotificationStatus;
  deliveryMethod: DeliveryMethod;
}

// MARK: - Enums

export enum WeatherTriggerType {
  SNOW_REMOVAL = 'snow_removal',
  ICE_TREATMENT = 'ice_treatment',
  RAIN_DELAY = 'rain_delay',
  HIGH_WIND = 'high_wind',
  EXTREME_HEAT = 'extreme_heat',
  EXTREME_COLD = 'extreme_cold',
  STORM_PREPARATION = 'storm_preparation',
  FLOOD_PREVENTION = 'flood_prevention',
  WIND_DAMAGE_ASSESSMENT = 'wind_damage_assessment',
  HEAT_STRESS_PREVENTION = 'heat_stress_prevention',
  COLD_STRESS_PREVENTION = 'cold_stress_prevention',
  EMERGENCY_RESPONSE = 'emergency_response',
}

export enum WeatherConditionType {
  TEMPERATURE = 'temperature',
  PRECIPITATION = 'precipitation',
  WIND_SPEED = 'wind_speed',
  WIND_GUST = 'wind_gust',
  HUMIDITY = 'humidity',
  VISIBILITY = 'visibility',
  PRESSURE = 'pressure',
  SNOW_DEPTH = 'snow_depth',
  ICE_ACCUMULATION = 'ice_accumulation',
  RAIN_INTENSITY = 'rain_intensity',
  LIGHTNING = 'lightning',
  HAIL = 'hail',
  FOG = 'fog',
  DUST = 'dust',
  SMOKE = 'smoke',
}

export enum WeatherSeverity {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
  CRITICAL = 'critical',
}

export enum WeatherImpact {
  NONE = 'none',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe',
  CATASTROPHIC = 'catastrophic',
}

export enum WeatherTriggerPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum WeatherTriggerStatus {
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  FAILED = 'failed',
}

export enum NotificationType {
  WEATHER_ALERT = 'weather_alert',
  TASK_RESCHEDULE = 'task_reschedule',
  SAFETY_WARNING = 'safety_warning',
  EMERGENCY_NOTIFICATION = 'emergency_notification',
  COMPLETION_REMINDER = 'completion_reminder',
  RISK_ALERT = 'risk_alert',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DeliveryMethod {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  PHONE = 'phone',
  IN_APP = 'in_app',
}

// MARK: - Main Weather Manager Class

export class WeatherManager extends EventEmitter {
  private static instance: WeatherManager;
  private weatherClient: WeatherAPIClient;
  private dbManager: DatabaseManager;
  private activeTasks: Map<string, WeatherTriggeredTask> = new Map();
  private weatherConditions: Map<string, WeatherCondition> = new Map();
  private adjustmentHistory: Map<string, WeatherTaskAdjustment[]> = new Map();
  private notificationQueue: WeatherNotification[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 300000; // 5 minutes

  private constructor(weatherClient: WeatherAPIClient, dbManager: DatabaseManager) {
    super();
    this.weatherClient = weatherClient;
    this.dbManager = dbManager;
    this.initializeWeatherConditions();
  }

  public static getInstance(weatherClient?: WeatherAPIClient, dbManager?: DatabaseManager): WeatherManager {
    if (!WeatherManager.instance) {
      if (!weatherClient || !dbManager) {
        throw new Error('WeatherClient and DatabaseManager are required for first initialization');
      }
      WeatherManager.instance = new WeatherManager(weatherClient, dbManager);
    }
    return WeatherManager.instance;
  }

  // MARK: - Weather Condition Assessment

  /**
   * Assess outdoor work conditions for a task
   */
  public assessOutdoorWorkConditions(forecast: WeatherForecast): OutdoorWorkConditions {
    const temp = forecast.temperature;
    const humidity = forecast.humidity || 50;
    const windSpeed = forecast.windSpeed || 0;
    const precipitation = forecast.precipitation || 0;
    const visibility = forecast.visibility || 10;
    const uvIndex = forecast.uvIndex || 0;
    const airQuality = forecast.airQuality || 50;

    // Calculate safety score (0-100)
    let safetyScore = 100;
    
    // Temperature penalties
    if (temp < 32 || temp > 95) safetyScore -= 30;
    else if (temp < 40 || temp > 85) safetyScore -= 15;
    
    // Wind penalties
    if (windSpeed > 25) safetyScore -= 25;
    else if (windSpeed > 15) safetyScore -= 10;
    
    // Precipitation penalties
    if (precipitation > 0.5) safetyScore -= 40;
    else if (precipitation > 0.1) safetyScore -= 20;
    
    // Visibility penalties
    if (visibility < 1) safetyScore -= 50;
    else if (visibility < 3) safetyScore -= 25;
    
    // UV index penalties
    if (uvIndex > 8) safetyScore -= 20;
    else if (uvIndex > 6) safetyScore -= 10;

    return {
      temperature: temp,
      humidity,
      windSpeed,
      precipitation,
      visibility,
      uvIndex,
      airQuality,
      safetyScore: Math.max(0, safetyScore)
    };
  }

  /**
   * Assess weather impact on a specific task
   */
  public async assessWeatherImpact(
    task: OperationalDataTaskAssignment,
    worker: WorkerProfile,
    building: any
  ): Promise<WeatherTaskAdjustment> {
    try {
      const forecast = await this.weatherClient.getWeatherForecast(
        building.latitude,
        building.longitude
      );
      const conditions = this.assessOutdoorWorkConditions(forecast[0]);
      const riskAssessment = this.generateRiskAssessment(task, conditions);
      
      const adjustment: WeatherTaskAdjustment = {
        taskId: task.taskName,
        originalSchedule: new Date(),
        adjustedSchedule: riskAssessment.adjustedSchedule,
        adjustmentReason: this.generateAdjustmentReason(conditions, riskAssessment),
        weatherConditions: conditions,
        riskAssessment,
        workerNotification: riskAssessment.riskLevel !== 'low',
        clientNotification: riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'extreme'
      };

      // Store adjustment
      await this.dbManager.insert('weather_adjustments', {
        task_id: task.taskName,
        original_schedule: adjustment.originalSchedule.toISOString(),
        adjusted_schedule: adjustment.adjustedSchedule?.toISOString(),
        adjustment_reason: adjustment.adjustmentReason,
        weather_conditions: JSON.stringify(conditions),
        risk_assessment: JSON.stringify(riskAssessment),
        worker_notification: adjustment.workerNotification,
        client_notification: adjustment.clientNotification,
        created_at: new Date().toISOString()
      });

      return adjustment;
    } catch (error) {
      console.error('Failed to assess weather impact:', error);
      throw error;
    }
  }

  /**
   * Get weather-based equipment recommendations
   */
  public async getWeatherEquipmentRecommendations(weather?: WeatherForecast | WeatherSnapshot): Promise<{
    equipment: string[];
    tasks: string[];
    recommendations: string[];
  }> {
    const currentOrForecast = weather || await this.weatherClient.getCurrentWeather();
    const recommendations: string[] = [];
    const equipment: string[] = [];
    const tasks: string[] = [];

    // Temperature assessment
    const temp = 'temperature' in currentOrForecast ? 
      (typeof currentOrForecast.temperature === 'number' ? currentOrForecast.temperature : currentOrForecast.temperature.average) : 
      (currentOrForecast as WeatherSnapshot).temperature;

    // Precipitation assessment
    const isRaining = currentOrForecast.precipitation > 0.1;
    const isFreezing = temp < 32;

    if (isRaining) {
      recommendations.push('Deploy rain mats at building entrances.');
      equipment.push('Rain Mats');
      tasks.push('Deploy rain mats');
      
      recommendations.push('Inspect and clear building drains to prevent blockages.');
      equipment.push('Drain Snake');
      tasks.push('Check drains before rain');
    } else if (currentOrForecast.precipitation === 0 && currentOrForecast.weatherCode === 0) {
      recommendations.push('Remove any deployed rain mats to prevent tripping hazards.');
      equipment.push('Rain Mats');
      tasks.push('Remove rain mats after rain');
      
      recommendations.push('Clear curbs and gutters of debris accumulated from previous rains.');
      equipment.push('Broom, Shovel');
      tasks.push('Clear curbs');
    }

    if (isFreezing) {
      recommendations.push('Apply de-icing agents to sidewalks and entrances.');
      equipment.push('De-icing Salt');
      tasks.push('Apply de-icer');
    }

    return { equipment, tasks, recommendations };
  }

  // MARK: - Weather Monitoring and Automation

  async startWeatherMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Weather monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🌤️ Starting weather monitoring...');

    // Initial weather check
    await this.checkWeatherConditions();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.checkWeatherConditions();
    }, this.MONITORING_INTERVAL);

    this.emit('weatherMonitoringStarted');
  }

  async stopWeatherMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🌤️ Weather monitoring stopped');
    this.emit('weatherMonitoringStopped');
  }

  private async checkWeatherConditions(): Promise<void> {
    try {
      const currentWeather = await this.weatherClient.getCurrentWeather();
      const forecast = await this.weatherClient.getWeatherForecast(7);
      const alerts = await this.weatherClient.getWeatherAlerts();

      // Check for weather-triggered tasks
      await this.evaluateWeatherTriggers(currentWeather, forecast, alerts);

      // Check for emergency conditions
      await this.checkEmergencyConditions(currentWeather, alerts);

      // Update active tasks
      await this.updateActiveTasks(currentWeather);

      this.emit('weatherConditionsChecked', {
        current: currentWeather,
        forecast,
        alerts,
        activeTasks: this.activeTasks.size,
      });
    } catch (error) {
      console.error('Failed to check weather conditions:', error);
      this.emit('weatherCheckFailed', error);
    }
  }

  // MARK: - Helper Methods

  private initializeWeatherConditions(): void {
    const conditions: WeatherCondition[] = [
      {
        type: WeatherConditionType.SNOW_DEPTH,
        severity: WeatherSeverity.MODERATE,
        threshold: 2,
        unit: 'inches',
        description: 'Snow accumulation requiring removal',
        impact: WeatherImpact.MODERATE,
        duration: 8,
        probability: 85,
      },
      {
        type: WeatherConditionType.ICE_ACCUMULATION,
        severity: WeatherSeverity.HIGH,
        threshold: 0.25,
        unit: 'inches',
        description: 'Ice accumulation requiring treatment',
        impact: WeatherImpact.MAJOR,
        duration: 4,
        probability: 70,
      },
      {
        type: WeatherConditionType.RAIN_INTENSITY,
        severity: WeatherSeverity.HIGH,
        threshold: 0.5,
        unit: 'inches/hour',
        description: 'Heavy rain requiring task postponement',
        impact: WeatherImpact.MODERATE,
        duration: 2,
        probability: 60,
      },
    ];

    conditions.forEach(condition => {
      this.weatherConditions.set(condition.type, condition);
    });
  }

  private generateRiskAssessment(task: OperationalDataTaskAssignment, conditions: OutdoorWorkConditions): WeatherRiskAssessment {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';

    // Temperature risks
    if (conditions.temperature < 32) {
      riskFactors.push('Freezing temperatures');
      recommendations.push('Provide warm clothing and heated break areas');
      riskLevel = 'high';
    } else if (conditions.temperature > 95) {
      riskFactors.push('Extreme heat');
      recommendations.push('Provide cooling stations and frequent breaks');
      riskLevel = 'high';
    }

    // Wind risks
    if (conditions.windSpeed > 25) {
      riskFactors.push('High winds');
      recommendations.push('Postpone outdoor work and secure equipment');
      riskLevel = riskLevel === 'high' ? 'extreme' : 'medium';
    }

    // Precipitation risks
    if (conditions.precipitation > 0.5) {
      riskFactors.push('Heavy precipitation');
      recommendations.push('Postpone outdoor tasks and ensure proper drainage');
      riskLevel = riskLevel === 'extreme' ? 'extreme' : 'high';
    }

    // Visibility risks
    if (conditions.visibility < 3) {
      riskFactors.push('Poor visibility');
      recommendations.push('Use high-visibility equipment and reduce work speed');
      riskLevel = riskLevel === 'extreme' ? 'extreme' : 'medium';
    }

    // Safety score assessment
    if (conditions.safetyScore < 30) {
      riskLevel = 'extreme';
    } else if (conditions.safetyScore < 50) {
      riskLevel = riskLevel === 'extreme' ? 'extreme' : 'high';
    } else if (conditions.safetyScore < 70) {
      riskLevel = riskLevel === 'extreme' || riskLevel === 'high' ? riskLevel : 'medium';
    }

    return {
      taskId: task.taskName,
      riskLevel,
      riskFactors,
      recommendations,
      adjustedSchedule: riskLevel === 'extreme' || riskLevel === 'high' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
      alternativeTasks: riskLevel !== 'low' ? ['Indoor maintenance', 'Equipment inspection', 'Documentation tasks'] : undefined,
      safetyRequirements: riskLevel !== 'low' ? ['Safety briefing', 'Weather monitoring', 'Emergency protocols'] : undefined
    };
  }

  private generateAdjustmentReason(conditions: OutdoorWorkConditions, riskAssessment: WeatherRiskAssessment): string {
    if (riskAssessment.riskLevel === 'extreme') {
      return 'Extreme weather conditions require task postponement for safety';
    } else if (riskAssessment.riskLevel === 'high') {
      return 'High-risk weather conditions require additional safety measures';
    } else if (riskAssessment.riskLevel === 'medium') {
      return 'Moderate weather conditions require caution and monitoring';
    }
    return 'Weather conditions are acceptable for outdoor work';
  }

  private async evaluateWeatherTriggers(
    currentWeather: WeatherSnapshot,
    forecast: WeatherForecast[],
    alerts: WeatherAlert[]
  ): Promise<void> {
    // Implementation for weather trigger evaluation
    // This would evaluate tasks and create weather-triggered tasks as needed
  }

  private async checkEmergencyConditions(
    currentWeather: WeatherSnapshot,
    alerts: WeatherAlert[]
  ): Promise<void> {
    const emergencyAlerts = alerts.filter(alert => 
      alert.severity === 'extreme' || alert.severity === 'high'
    );

    if (emergencyAlerts.length > 0) {
      this.emit('emergencyWeatherAlert', emergencyAlerts);
    }
  }

  private async updateActiveTasks(currentWeather: WeatherSnapshot): Promise<void> {
    // Update active weather-triggered tasks based on current conditions
    for (const task of this.activeTasks.values()) {
      if (task.status === WeatherTriggerStatus.ACTIVE || 
          task.status === WeatherTriggerStatus.IN_PROGRESS) {
        // Update task status based on weather conditions
        this.emit('taskStatusUpdated', task);
      }
    }
  }

  // MARK: - Public API Methods

  public async getWeatherAdjustments(taskId: string): Promise<WeatherTaskAdjustment[]> {
    try {
      const adjustments = await this.dbManager.getAll('weather_adjustments', { task_id: taskId });
      return adjustments.map(adj => ({
        taskId: adj.task_id,
        originalSchedule: new Date(adj.original_schedule),
        adjustedSchedule: adj.adjusted_schedule ? new Date(adj.adjusted_schedule) : undefined,
        adjustmentReason: adj.adjustment_reason,
        weatherConditions: JSON.parse(adj.weather_conditions),
        riskAssessment: JSON.parse(adj.risk_assessment),
        workerNotification: adj.worker_notification,
        clientNotification: adj.client_notification,
      }));
    } catch (error) {
      console.error('Failed to get weather adjustments:', error);
      return [];
    }
  }

  public async getWeatherAlertsForTasks(tasks: OperationalDataTaskAssignment[]): Promise<WeatherAlert[]> {
    try {
      const outdoorTasks = tasks.filter(task => this.isOutdoorTask(task));
      if (outdoorTasks.length === 0) return [];

      const alerts = await this.weatherClient.getWeatherAlerts();
      
      return alerts.filter(alert => 
        alert.severity === 'high' || 
        alert.severity === 'extreme' ||
        alert.type.includes('storm') ||
        alert.type.includes('heat') ||
        alert.type.includes('cold')
      );
    } catch (error) {
      console.error('Failed to get weather alerts:', error);
      return [];
    }
  }

  private isOutdoorTask(task: OperationalDataTaskAssignment): boolean {
    const outdoorKeywords = [
      'sidewalk', 'curb', 'trash', 'garbage', 'outdoor', 'exterior',
      'landscaping', 'parking', 'roof', 'drainage', 'hose', 'sweep',
      'sanitation', 'maintenance', 'cleaning'
    ];
    
    return outdoorKeywords.some(keyword => 
      task.taskName.toLowerCase().includes(keyword) ||
      task.category.toLowerCase().includes(keyword)
    );
  }

  public async getActiveWeatherTasks(): Promise<WeatherTriggeredTask[]> {
    return Array.from(this.activeTasks.values());
  }

  public async getWeatherTaskById(id: string): Promise<WeatherTriggeredTask | null> {
    return this.activeTasks.get(id) || null;
  }

  public async completeWeatherTask(taskId: string, completionData: any): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = WeatherTriggerStatus.COMPLETED;
    task.updatedAt = new Date();

    this.emit('weatherTaskCompleted', { task, completionData });
    return true;
  }

  public async cancelWeatherTask(taskId: string, reason: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = WeatherTriggerStatus.CANCELLED;
    task.updatedAt = new Date();

    this.emit('weatherTaskCancelled', { task, reason });
    return true;
  }

  public async cleanup(): Promise<void> {
    await this.stopWeatherMonitoring();
    this.activeTasks.clear();
    this.notificationQueue = [];
    this.removeAllListeners();
  }
}

// Export singleton instance
export const weatherManager = WeatherManager.getInstance();
