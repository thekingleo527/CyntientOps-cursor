/**
 * 🌤️ Weather Triggered Task Manager
 * Mirrors: CyntientOps/Services/Weather/WeatherTriggeredTaskManager.swift (517+ lines)
 * Purpose: Advanced weather-based task automation and scheduling
 * Features: Weather condition monitoring, task rescheduling, emergency protocols, predictive analytics
 */

import { EventEmitter } from 'events';
import { WeatherSnapshot, WeatherForecast, WeatherAlert } from '@cyntientops/domain-schema';
import { OperationalDataTaskAssignment, TaskCategory, TaskPriority } from '@cyntientops/domain-schema';
import { ServiceContainer } from '../ServiceContainer';
import { WeatherAPIClient } from '@cyntientops/api-clients';
import { Logger } from './LoggingService';

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
  category: TaskCategory;
  priority: TaskPriority;
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

export interface WeatherRiskAssessment {
  overallRisk: RiskLevel;
  weatherRisk: RiskLevel;
  safetyRisk: RiskLevel;
  operationalRisk: RiskLevel;
  financialRisk: RiskLevel;
  risks: WeatherRisk[];
  mitigations: WeatherMitigation[];
  emergencyProtocols: EmergencyProtocol[];
}

export interface WeatherRisk {
  id: string;
  type: RiskType;
  severity: RiskSeverity;
  probability: number;
  impact: string;
  description: string;
  affectedTasks: string[];
  mitigationActions: string[];
}

export interface WeatherMitigation {
  id: string;
  riskId: string;
  action: string;
  description: string;
  cost: number;
  effectiveness: number;
  implementationTime: number;
  resources: string[];
}

export interface EmergencyProtocol {
  id: string;
  triggerCondition: WeatherCondition;
  protocol: string;
  description: string;
  actions: EmergencyAction[];
  contacts: EmergencyContact[];
  escalationLevel: number;
}

export interface EmergencyAction {
  id: string;
  action: string;
  description: string;
  priority: number;
  estimatedTime: number;
  responsibleParty: string;
  resources: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  escalationLevel: number;
  available24x7: boolean;
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

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskType {
  SAFETY = 'safety',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  ENVIRONMENTAL = 'environmental',
  REPUTATIONAL = 'reputational',
}

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
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

export class WeatherTriggeredTaskManager extends EventEmitter {
  private container: ServiceContainer;
  private weatherAPI: WeatherAPIClient;
  private activeTasks: Map<string, WeatherTriggeredTask> = new Map();
  private weatherConditions: Map<string, WeatherCondition> = new Map();
  private emergencyProtocols: Map<string, EmergencyProtocol> = new Map();
  private notificationQueue: WeatherNotification[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 300000; // 5 minutes

  constructor(container: ServiceContainer) {
    super();
    this.container = container;
    this.weatherAPI = new WeatherAPIClient(
      process.env.WEATHER_API_KEY || '',
      40.7128, // NYC latitude
      -74.0060  // NYC longitude
    );
    
    this.initializeWeatherConditions();
    this.initializeEmergencyProtocols();
  }

  // MARK: - Initialization

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
      {
        type: WeatherConditionType.WIND_SPEED,
        severity: WeatherSeverity.HIGH,
        threshold: 25,
        unit: 'mph',
        description: 'High winds affecting outdoor work',
        impact: WeatherImpact.MAJOR,
        duration: 6,
        probability: 75,
      },
      {
        type: WeatherConditionType.TEMPERATURE,
        severity: WeatherSeverity.EXTREME,
        threshold: 95,
        unit: '°F',
        description: 'Extreme heat requiring safety measures',
        impact: WeatherImpact.SEVERE,
        duration: 8,
        probability: 80,
      },
      {
        type: WeatherConditionType.TEMPERATURE,
        severity: WeatherSeverity.EXTREME,
        threshold: 20,
        unit: '°F',
        description: 'Extreme cold requiring safety measures',
        impact: WeatherImpact.SEVERE,
        duration: 12,
        probability: 70,
      },
    ];

    conditions.forEach(condition => {
      this.weatherConditions.set(condition.type, condition);
    });
  }

  private initializeEmergencyProtocols(): void {
    const protocols: EmergencyProtocol[] = [
      {
        id: 'blizzard_protocol',
        triggerCondition: {
          type: WeatherConditionType.SNOW_DEPTH,
          severity: WeatherSeverity.EXTREME,
          threshold: 12,
          unit: 'inches',
          description: 'Blizzard conditions',
          impact: WeatherImpact.CATASTROPHIC,
          duration: 24,
          probability: 90,
        },
        protocol: 'Blizzard Emergency Protocol',
        description: 'Emergency response for blizzard conditions',
        actions: [
          {
            id: 'evacuate_workers',
            action: 'Evacuate all outdoor workers',
            description: 'Immediately evacuate all workers from outdoor locations',
            priority: 1,
            estimatedTime: 30,
            responsibleParty: 'Site Supervisor',
            resources: ['Emergency vehicles', 'Communication devices'],
          },
          {
            id: 'secure_equipment',
            action: 'Secure all equipment',
            description: 'Secure and protect all equipment from weather damage',
            priority: 2,
            estimatedTime: 60,
            responsibleParty: 'Equipment Manager',
            resources: ['Tarps', 'Tie-downs', 'Storage facilities'],
          },
        ],
        contacts: [
          {
            id: 'emergency_contact_1',
            name: 'Emergency Response Team',
            role: 'Emergency Coordinator',
            phone: '+1-555-EMERGENCY',
            email: 'emergency@cyntientops.com',
            escalationLevel: 1,
            available24x7: true,
          },
        ],
        escalationLevel: 1,
      },
    ];

    protocols.forEach(protocol => {
      this.emergencyProtocols.set(protocol.id, protocol);
      this.emit('emergencyProtocolInitialized', protocol);
    });
  }

  // MARK: - Weather Monitoring

  async startWeatherMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      Logger.debug('Weather monitoring already active', undefined, 'WeatherTriggeredTaskManager');
      return;
    }

    this.isMonitoring = true;
    Logger.debug('🌤️ Starting weather monitoring...', undefined, 'WeatherTriggeredTaskManager');

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

    Logger.debug('🌤️ Weather monitoring stopped', undefined, 'WeatherTriggeredTaskManager');
    this.emit('weatherMonitoringStopped');
  }

  private async checkWeatherConditions(): Promise<void> {
    try {
      const currentWeather = await this.weatherAPI.getCurrentWeather();
      const forecast = await this.weatherAPI.getWeatherForecast(7);
      const alerts = await this.weatherAPI.getWeatherAlerts();

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
      Logger.error('Failed to check weather conditions:', undefined, 'WeatherTriggeredTaskManager');
      this.emit('weatherCheckFailed', error);
    }
  }

  // MARK: - Weather Trigger Evaluation

  private async evaluateWeatherTriggers(
    currentWeather: WeatherSnapshot,
    forecast: WeatherForecast[],
    alerts: WeatherAlert[]
  ): Promise<void> {
    const pendingTasks = await this.getPendingTasks();
    
    for (const task of pendingTasks) {
      const weatherTrigger = await this.evaluateTaskForWeatherTrigger(task, currentWeather, forecast, alerts);
      
      if (weatherTrigger) {
        await this.createWeatherTriggeredTask(task, weatherTrigger);
      }
    }
  }

  private async evaluateTaskForWeatherTrigger(
    task: OperationalDataTaskAssignment,
    currentWeather: WeatherSnapshot,
    forecast: WeatherForecast[],
    alerts: WeatherAlert[]
  ): Promise<WeatherTriggerType | null> {
    // Evaluate based on task category and weather conditions
    switch (task.category) {
      case TaskCategory.SNOW_REMOVAL:
        if (currentWeather.condition === 'snow' || this.hasSnowInForecast(forecast)) {
          return WeatherTriggerType.SNOW_REMOVAL;
        }
        break;
      
      case TaskCategory.ICE_TREATMENT:
        if (currentWeather.temperature < 32 && this.hasPrecipitation(forecast)) {
          return WeatherTriggerType.ICE_TREATMENT;
        }
        break;
      
      case TaskCategory.OUTDOOR_MAINTENANCE:
        if (this.hasHighWinds(forecast) || this.hasHeavyRain(forecast)) {
          return WeatherTriggerType.RAIN_DELAY;
        }
        break;
      
      case TaskCategory.HEATING_MAINTENANCE:
        if (currentWeather.temperature < 20) {
          return WeatherTriggerType.EXTREME_COLD;
        }
        break;
      
      case TaskCategory.COOLING_MAINTENANCE:
        if (currentWeather.temperature > 95) {
          return WeatherTriggerType.EXTREME_HEAT;
        }
        break;
    }

    // Check for emergency conditions
    if (this.hasEmergencyAlerts(alerts)) {
      return WeatherTriggerType.EMERGENCY_RESPONSE;
    }

    return null;
  }

  private hasSnowInForecast(forecast: WeatherForecast[]): boolean {
    return forecast.some(day => 
      day.condition.includes('snow') || 
      day.condition.includes('blizzard') ||
      day.snowDepth > 0
    );
  }

  private hasPrecipitation(forecast: WeatherForecast[]): boolean {
    return forecast.some(day => 
      day.condition.includes('rain') || 
      day.condition.includes('snow') ||
      day.precipitation > 0
    );
  }

  private hasHighWinds(forecast: WeatherForecast[]): boolean {
    return forecast.some(day => day.windSpeed > 25);
  }

  private hasHeavyRain(forecast: WeatherForecast[]): boolean {
    return forecast.some(day => 
      day.condition.includes('rain') && 
      day.precipitation > 0.5
    );
  }

  private hasEmergencyAlerts(alerts: WeatherAlert[]): boolean {
    return alerts.some(alert => 
      alert.severity === 'extreme' || 
      alert.severity === 'severe'
    );
  }

  // MARK: - Weather Triggered Task Creation

  private async createWeatherTriggeredTask(
    originalTask: OperationalDataTaskAssignment,
    triggerType: WeatherTriggerType
  ): Promise<WeatherTriggeredTask> {
    const weatherCondition = this.getWeatherConditionForTrigger(triggerType);
    const riskAssessment = await this.assessWeatherRisk(originalTask, weatherCondition);
    const completionCriteria = this.generateCompletionCriteria(triggerType);
    const alternativeTasks = this.generateAlternativeTasks(originalTask, triggerType);

    const weatherTriggeredTask: WeatherTriggeredTask = {
      id: `weather_trigger_${Date.now()}_${originalTask.id}`,
      originalTask,
      weatherCondition,
      triggerType,
      priority: this.getPriorityForTrigger(triggerType),
      status: WeatherTriggerStatus.SCHEDULED,
      scheduledTime: new Date(),
      estimatedDuration: this.getEstimatedDuration(triggerType),
      weatherDependencies: this.getWeatherDependencies(triggerType),
      alternativeTasks,
      completionCriteria,
      riskAssessment,
      notifications: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeTasks.set(weatherTriggeredTask.id, weatherTriggeredTask);
    
    // Schedule notifications
    await this.scheduleNotifications(weatherTriggeredTask);
    
    this.emit('weatherTriggeredTaskCreated', weatherTriggeredTask);
    
    return weatherTriggeredTask;
  }

  private getWeatherConditionForTrigger(triggerType: WeatherTriggerType): WeatherCondition {
    const conditionMap: Record<WeatherTriggerType, WeatherConditionType> = {
      [WeatherTriggerType.SNOW_REMOVAL]: WeatherConditionType.SNOW_DEPTH,
      [WeatherTriggerType.ICE_TREATMENT]: WeatherConditionType.ICE_ACCUMULATION,
      [WeatherTriggerType.RAIN_DELAY]: WeatherConditionType.RAIN_INTENSITY,
      [WeatherTriggerType.HIGH_WIND]: WeatherConditionType.WIND_SPEED,
      [WeatherTriggerType.EXTREME_HEAT]: WeatherConditionType.TEMPERATURE,
      [WeatherTriggerType.EXTREME_COLD]: WeatherConditionType.TEMPERATURE,
      [WeatherTriggerType.STORM_PREPARATION]: WeatherConditionType.PRECIPITATION,
      [WeatherTriggerType.FLOOD_PREVENTION]: WeatherConditionType.RAIN_INTENSITY,
      [WeatherTriggerType.WIND_DAMAGE_ASSESSMENT]: WeatherConditionType.WIND_SPEED,
      [WeatherTriggerType.HEAT_STRESS_PREVENTION]: WeatherConditionType.TEMPERATURE,
      [WeatherTriggerType.COLD_STRESS_PREVENTION]: WeatherConditionType.TEMPERATURE,
      [WeatherTriggerType.EMERGENCY_RESPONSE]: WeatherConditionType.PRECIPITATION,
    };

    const conditionType = conditionMap[triggerType];
    return this.weatherConditions.get(conditionType) || this.createDefaultCondition(conditionType);
  }

  private createDefaultCondition(type: WeatherConditionType): WeatherCondition {
    return {
      type,
      severity: WeatherSeverity.MODERATE,
      threshold: 0,
      unit: '',
      description: 'Weather condition detected',
      impact: WeatherImpact.MODERATE,
      duration: 4,
      probability: 50,
    };
  }

  private async assessWeatherRisk(
    task: OperationalDataTaskAssignment,
    weatherCondition: WeatherCondition
  ): Promise<WeatherRiskAssessment> {
    const risks: WeatherRisk[] = [];
    const mitigations: WeatherMitigation[] = [];

    // Assess safety risks
    if (weatherCondition.severity === WeatherSeverity.EXTREME || 
        weatherCondition.severity === WeatherSeverity.CRITICAL) {
      risks.push({
        id: `safety_risk_${Date.now()}`,
        type: RiskType.SAFETY,
        severity: RiskSeverity.HIGH,
        probability: 80,
        impact: 'Worker safety at risk due to extreme weather conditions',
        description: 'Extreme weather conditions pose significant safety risks to workers',
        affectedTasks: [task.id],
        mitigationActions: [
          'Provide appropriate safety equipment',
          'Implement buddy system',
          'Establish emergency communication protocols',
        ],
      });
    }

    // Assess operational risks
    if (weatherCondition.impact === WeatherImpact.MAJOR || 
        weatherCondition.impact === WeatherImpact.SEVERE) {
      risks.push({
        id: `operational_risk_${Date.now()}`,
        type: RiskType.OPERATIONAL,
        severity: RiskSeverity.MEDIUM,
        probability: 70,
        impact: 'Task completion may be delayed or compromised',
        description: 'Weather conditions may affect task completion quality and timing',
        affectedTasks: [task.id],
        mitigationActions: [
          'Reschedule non-critical tasks',
          'Implement alternative work methods',
          'Increase supervision and quality checks',
        ],
      });
    }

    const overallRisk = this.calculateOverallRisk(risks);

    return {
      overallRisk,
      weatherRisk: this.calculateWeatherRisk(weatherCondition),
      safetyRisk: this.calculateSafetyRisk(risks),
      operationalRisk: this.calculateOperationalRisk(risks),
      financialRisk: this.calculateFinancialRisk(risks),
      risks,
      mitigations,
      emergencyProtocols: Array.from(this.emergencyProtocols.values()),
    };
  }

  private calculateOverallRisk(risks: WeatherRisk[]): RiskLevel {
    if (risks.some(risk => risk.severity === RiskSeverity.CRITICAL)) {
      return RiskLevel.CRITICAL;
    }
    if (risks.some(risk => risk.severity === RiskSeverity.HIGH)) {
      return RiskLevel.HIGH;
    }
    if (risks.some(risk => risk.severity === RiskSeverity.MEDIUM)) {
      return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
  }

  private calculateWeatherRisk(condition: WeatherCondition): RiskLevel {
    switch (condition.severity) {
      case WeatherSeverity.CRITICAL:
        return RiskLevel.CRITICAL;
      case WeatherSeverity.EXTREME:
        return RiskLevel.HIGH;
      case WeatherSeverity.HIGH:
        return RiskLevel.MEDIUM;
      default:
        return RiskLevel.LOW;
    }
  }

  private calculateSafetyRisk(risks: WeatherRisk[]): RiskLevel {
    const safetyRisks = risks.filter(risk => risk.type === RiskType.SAFETY);
    return this.calculateOverallRisk(safetyRisks);
  }

  private calculateOperationalRisk(risks: WeatherRisk[]): RiskLevel {
    const operationalRisks = risks.filter(risk => risk.type === RiskType.OPERATIONAL);
    return this.calculateOverallRisk(operationalRisks);
  }

  private calculateFinancialRisk(risks: WeatherRisk[]): RiskLevel {
    const financialRisks = risks.filter(risk => risk.type === RiskType.FINANCIAL);
    return this.calculateOverallRisk(financialRisks);
  }

  private generateCompletionCriteria(triggerType: WeatherTriggerType): CompletionCriteria {
    const criteria: CompletionCriteria = {
      weatherConditions: [],
      safetyRequirements: [],
      qualityStandards: [],
      documentationRequired: true,
      photoEvidenceRequired: true,
      supervisorApprovalRequired: triggerType === WeatherTriggerType.EMERGENCY_RESPONSE,
    };

    // Add specific criteria based on trigger type
    switch (triggerType) {
      case WeatherTriggerType.SNOW_REMOVAL:
        criteria.safetyRequirements.push({
          id: 'snow_removal_safety',
          requirement: 'Proper snow removal equipment and safety gear',
          description: 'Workers must have appropriate snow removal equipment and safety gear',
          mandatory: true,
          weatherConditions: [],
          equipment: ['Snow shovels', 'Ice melt', 'Safety vests', 'Non-slip boots'],
          training: ['Snow removal safety', 'Cold weather safety'],
        });
        break;
      
      case WeatherTriggerType.EMERGENCY_RESPONSE:
        criteria.supervisorApprovalRequired = true;
        criteria.documentationRequired = true;
        criteria.photoEvidenceRequired = true;
        break;
    }

    return criteria;
  }

  private generateAlternativeTasks(
    originalTask: OperationalDataTaskAssignment,
    triggerType: WeatherTriggerType
  ): AlternativeTask[] {
    const alternatives: AlternativeTask[] = [];

    switch (triggerType) {
      case WeatherTriggerType.RAIN_DELAY:
        alternatives.push({
          id: `indoor_alternative_${Date.now()}`,
          name: 'Indoor Maintenance Tasks',
          description: 'Perform indoor maintenance tasks while waiting for weather to clear',
          category: TaskCategory.INDOOR_MAINTENANCE,
          priority: TaskPriority.MEDIUM,
          estimatedDuration: originalTask.estimated_duration,
          weatherConditions: [],
          prerequisites: ['Indoor access', 'Maintenance tools'],
          resources: ['Maintenance staff', 'Indoor equipment'],
        });
        break;
    }

    return alternatives;
  }

  private getPriorityForTrigger(triggerType: WeatherTriggerType): WeatherTriggerPriority {
    const priorityMap: Record<WeatherTriggerType, WeatherTriggerPriority> = {
      [WeatherTriggerType.EMERGENCY_RESPONSE]: WeatherTriggerPriority.EMERGENCY,
      [WeatherTriggerType.SNOW_REMOVAL]: WeatherTriggerPriority.HIGH,
      [WeatherTriggerType.ICE_TREATMENT]: WeatherTriggerPriority.HIGH,
      [WeatherTriggerType.STORM_PREPARATION]: WeatherTriggerPriority.HIGH,
      [WeatherTriggerType.FLOOD_PREVENTION]: WeatherTriggerPriority.HIGH,
      [WeatherTriggerType.EXTREME_HEAT]: WeatherTriggerPriority.MEDIUM,
      [WeatherTriggerType.EXTREME_COLD]: WeatherTriggerPriority.MEDIUM,
      [WeatherTriggerType.HIGH_WIND]: WeatherTriggerPriority.MEDIUM,
      [WeatherTriggerType.RAIN_DELAY]: WeatherTriggerPriority.LOW,
      [WeatherTriggerType.WIND_DAMAGE_ASSESSMENT]: WeatherTriggerPriority.MEDIUM,
      [WeatherTriggerType.HEAT_STRESS_PREVENTION]: WeatherTriggerPriority.MEDIUM,
      [WeatherTriggerType.COLD_STRESS_PREVENTION]: WeatherTriggerPriority.MEDIUM,
    };

    return priorityMap[triggerType] || WeatherTriggerPriority.MEDIUM;
  }

  private getEstimatedDuration(triggerType: WeatherTriggerType): number {
    const durationMap: Record<WeatherTriggerType, number> = {
      [WeatherTriggerType.SNOW_REMOVAL]: 240, // 4 hours
      [WeatherTriggerType.ICE_TREATMENT]: 120, // 2 hours
      [WeatherTriggerType.RAIN_DELAY]: 60, // 1 hour
      [WeatherTriggerType.HIGH_WIND]: 180, // 3 hours
      [WeatherTriggerType.EXTREME_HEAT]: 480, // 8 hours
      [WeatherTriggerType.EXTREME_COLD]: 480, // 8 hours
      [WeatherTriggerType.STORM_PREPARATION]: 360, // 6 hours
      [WeatherTriggerType.FLOOD_PREVENTION]: 300, // 5 hours
      [WeatherTriggerType.WIND_DAMAGE_ASSESSMENT]: 120, // 2 hours
      [WeatherTriggerType.HEAT_STRESS_PREVENTION]: 240, // 4 hours
      [WeatherTriggerType.COLD_STRESS_PREVENTION]: 240, // 4 hours
      [WeatherTriggerType.EMERGENCY_RESPONSE]: 1440, // 24 hours
    };

    return durationMap[triggerType] || 120; // Default 2 hours
  }

  private getWeatherDependencies(triggerType: WeatherTriggerType): WeatherDependency[] {
    const dependencies: WeatherDependency[] = [];

    switch (triggerType) {
      case WeatherTriggerType.SNOW_REMOVAL:
        dependencies.push({
          condition: {
            type: WeatherConditionType.SNOW_DEPTH,
            severity: WeatherSeverity.MODERATE,
            threshold: 2,
            unit: 'inches',
            description: 'Minimum snow depth for removal',
            impact: WeatherImpact.MODERATE,
            duration: 4,
            probability: 80,
          },
          required: true,
          impact: 'blocking',
        });
        break;
    }

    return dependencies;
  }

  // MARK: - Notification Management

  private async scheduleNotifications(task: WeatherTriggeredTask): Promise<void> {
    const notifications: WeatherNotification[] = [];

    // Immediate notification
    notifications.push({
      id: `notification_${task.id}_immediate`,
      type: NotificationType.WEATHER_ALERT,
      recipient: 'all_workers',
      message: `Weather-triggered task created: ${task.originalTask.title}`,
      priority: task.priority === WeatherTriggerPriority.EMERGENCY ? 
        NotificationPriority.CRITICAL : NotificationPriority.HIGH,
      scheduledTime: new Date(),
      status: NotificationStatus.PENDING,
      deliveryMethod: DeliveryMethod.PUSH,
    });

    // Pre-task notification
    const preTaskTime = new Date(task.scheduledTime.getTime() - 30 * 60 * 1000); // 30 minutes before
    notifications.push({
      id: `notification_${task.id}_pre_task`,
      type: NotificationType.COMPLETION_REMINDER,
      recipient: 'assigned_workers',
      message: `Weather-triggered task starting soon: ${task.originalTask.title}`,
      priority: NotificationPriority.MEDIUM,
      scheduledTime: preTaskTime,
      status: NotificationStatus.PENDING,
      deliveryMethod: DeliveryMethod.IN_APP,
    });

    task.notifications = notifications;
    this.notificationQueue.push(...notifications);

    this.emit('notificationsScheduled', notifications);
  }

  // MARK: - Emergency Management

  private async checkEmergencyConditions(
    currentWeather: WeatherSnapshot,
    alerts: WeatherAlert[]
  ): Promise<void> {
    const emergencyAlerts = alerts.filter(alert => 
      alert.severity === 'extreme' || alert.severity === 'severe'
    );

    if (emergencyAlerts.length > 0) {
      await this.activateEmergencyProtocols(emergencyAlerts);
    }
  }

  private async activateEmergencyProtocols(alerts: WeatherAlert[]): Promise<void> {
    for (const alert of alerts) {
      const protocol = this.findMatchingEmergencyProtocol(alert);
      
      if (protocol) {
        await this.executeEmergencyProtocol(protocol, alert);
      }
    }
  }

  private findMatchingEmergencyProtocol(alert: WeatherAlert): EmergencyProtocol | null {
    for (const protocol of this.emergencyProtocols.values()) {
      if (this.isProtocolTriggered(protocol, alert)) {
        return protocol;
      }
    }
    return null;
  }

  private isProtocolTriggered(protocol: EmergencyProtocol, alert: WeatherAlert): boolean {
    // Simple matching logic - in production, this would be more sophisticated
    return protocol.triggerCondition.severity === WeatherSeverity.EXTREME ||
           protocol.triggerCondition.severity === WeatherSeverity.CRITICAL;
  }

  private async executeEmergencyProtocol(
    protocol: EmergencyProtocol,
    alert: WeatherAlert
  ): Promise<void> {
    console.log(`🚨 Executing emergency protocol: ${protocol.protocol}`);
    
    // Execute emergency actions
    for (const action of protocol.actions) {
      await this.executeEmergencyAction(action);
    }

    // Notify emergency contacts
    for (const contact of protocol.contacts) {
      await this.notifyEmergencyContact(contact, protocol, alert);
    }

    this.emit('emergencyProtocolExecuted', { protocol, alert });
  }

  private async executeEmergencyAction(action: EmergencyAction): Promise<void> {
    console.log(`🚨 Executing emergency action: ${action.action}`);
    
    // In production, this would integrate with task management system
    // For now, we'll just log the action
    this.emit('emergencyActionExecuted', action);
  }

  private async notifyEmergencyContact(
    contact: EmergencyContact,
    protocol: EmergencyProtocol,
    alert: WeatherAlert
  ): Promise<void> {
    const message = `EMERGENCY ALERT: ${protocol.protocol} - ${alert.description}`;
    
    const notification: WeatherNotification = {
      id: `emergency_notification_${Date.now()}`,
      type: NotificationType.EMERGENCY_NOTIFICATION,
      recipient: contact.name,
      message,
      priority: NotificationPriority.CRITICAL,
      scheduledTime: new Date(),
      status: NotificationStatus.PENDING,
      deliveryMethod: DeliveryMethod.PHONE,
    };

    this.notificationQueue.push(notification);
    this.emit('emergencyContactNotified', { contact, notification });
  }

  // MARK: - Task Management

  private async getPendingTasks(): Promise<OperationalDataTaskAssignment[]> {
    // In production, this would query the task service
    // For now, return empty array
    return [];
  }

  private async updateActiveTasks(currentWeather: WeatherSnapshot): Promise<void> {
    for (const task of this.activeTasks.values()) {
      if (task.status === WeatherTriggerStatus.ACTIVE || 
          task.status === WeatherTriggerStatus.IN_PROGRESS) {
        await this.updateTaskStatus(task, currentWeather);
      }
    }
  }

  private async updateTaskStatus(
    task: WeatherTriggeredTask,
    currentWeather: WeatherSnapshot
  ): Promise<void> {
    // Check if weather conditions have changed
    const conditionsMet = this.checkWeatherConditionsMet(task, currentWeather);
    
    if (conditionsMet && task.status === WeatherTriggerStatus.ACTIVE) {
      task.status = WeatherTriggerStatus.IN_PROGRESS;
      task.updatedAt = new Date();
      
      this.emit('taskStatusUpdated', task);
    }
  }

  private checkWeatherConditionsMet(
    task: WeatherTriggeredTask,
    currentWeather: WeatherSnapshot
  ): boolean {
    // Simple condition checking - in production, this would be more sophisticated
    return true; // Placeholder
  }

  // MARK: - Public API

  async getActiveWeatherTasks(): Promise<WeatherTriggeredTask[]> {
    return Array.from(this.activeTasks.values());
  }

  async getWeatherTaskById(id: string): Promise<WeatherTriggeredTask | null> {
    return this.activeTasks.get(id) || null;
  }

  async completeWeatherTask(
    taskId: string,
    completionData: any
  ): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = WeatherTriggerStatus.COMPLETED;
    task.updatedAt = new Date();

    this.emit('weatherTaskCompleted', { task, completionData });
    return true;
  }

  async cancelWeatherTask(taskId: string, reason: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = WeatherTriggerStatus.CANCELLED;
    task.updatedAt = new Date();

    this.emit('weatherTaskCancelled', { task, reason });
    return true;
  }

  async getWeatherRiskAssessment(taskId: string): Promise<WeatherRiskAssessment | null> {
    const task = this.activeTasks.get(taskId);
    return task?.riskAssessment || null;
  }

  async getEmergencyProtocols(): Promise<EmergencyProtocol[]> {
    return Array.from(this.emergencyProtocols.values());
  }

  async getPendingNotifications(): Promise<WeatherNotification[]> {
    return this.notificationQueue.filter(notification => 
      notification.status === NotificationStatus.PENDING
    );
  }

  // MARK: - Cleanup

  async cleanup(): Promise<void> {
    await this.stopWeatherMonitoring();
    this.activeTasks.clear();
    this.notificationQueue = [];
    this.removeAllListeners();
  }
}

export const weatherTriggeredTaskManager = new WeatherTriggeredTaskManager(
  new ServiceContainer({
    enableIntelligence: true,
    enableWeatherIntegration: true,
  })
);
