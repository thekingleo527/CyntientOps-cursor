/**
 * 🌤️ Weather Task Manager
 * Mirrors: CyntientOps/Managers/WeatherTaskManager.swift
 * Purpose: Weather-based task adjustments and outdoor work risk assessment
 */

import { WeatherAPIClient, WeatherForecast, WeatherAlert } from '@cyntientops/api-clients';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataTaskAssignment, WorkerProfile } from '@cyntientops/domain-schema';

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

export class WeatherTaskManager {
  private static instance: WeatherTaskManager;
  private weatherClient: WeatherAPIClient;
  private dbManager: DatabaseManager;
  private adjustmentHistory: Map<string, WeatherTaskAdjustment[]> = new Map();

  private constructor(weatherClient: WeatherAPIClient, dbManager: DatabaseManager) {
    this.weatherClient = weatherClient;
    this.dbManager = dbManager;
  }

  public static getInstance(weatherClient: WeatherAPIClient, dbManager: DatabaseManager): WeatherTaskManager {
    if (!WeatherTaskManager.instance) {
      WeatherTaskManager.instance = new WeatherTaskManager(weatherClient, dbManager);
    }
    return WeatherTaskManager.instance;
  }

  /**
   * Assess weather risk for outdoor tasks
   */
  public async assessWeatherRiskForTasks(tasks: OperationalDataTaskAssignment[]): Promise<WeatherRiskAssessment[]> {
    const assessments: WeatherRiskAssessment[] = [];

    for (const task of tasks) {
      if (this.isOutdoorTask(task)) {
        const assessment = await this.assessTaskWeatherRisk(task);
        assessments.push(assessment);
      }
    }

    return assessments;
  }

  /**
   * Get weather-adjusted task schedule
   */
  public async getWeatherAdjustedSchedule(
    task: OperationalDataTaskAssignment,
    worker: WorkerProfile,
    building: any
  ): Promise<WeatherTaskAdjustment> {
    try {
      // Get weather forecast for task location and time
      const forecast = await this.weatherClient.getWeatherForecast(
        building.latitude,
        building.longitude,
        task.scheduled_date ? new Date(task.scheduled_date) : new Date()
      );

      // Assess outdoor work conditions
      const conditions = this.assessOutdoorWorkConditions(forecast);
      
      // Perform risk assessment
      const riskAssessment = await this.assessTaskWeatherRisk(task, conditions);

      // Determine if schedule adjustment is needed
      const adjustment = this.determineScheduleAdjustment(task, riskAssessment, conditions);

      // Store adjustment in database
      await this.storeWeatherAdjustment(adjustment);

      return adjustment;
    } catch (error) {
      console.error('Failed to get weather-adjusted schedule:', error);
      throw error;
    }
  }

  /**
   * Check if task is outdoor work
   */
  private isOutdoorTask(task: OperationalDataTaskAssignment): boolean {
    const outdoorKeywords = [
      'outdoor', 'exterior', 'sidewalk', 'street', 'roof', 'balcony',
      'garden', 'landscaping', 'cleaning', 'maintenance', 'inspection',
      'delivery', 'pickup', 'sanitation', 'trash', 'recycling'
    ];

    const taskText = `${task.name} ${task.description || ''}`.toLowerCase();
    return outdoorKeywords.some(keyword => taskText.includes(keyword));
  }

  /**
   * Assess outdoor work conditions from weather forecast
   */
  private assessOutdoorWorkConditions(forecast: WeatherForecast): OutdoorWorkConditions {
    const current = forecast.current;
    
    // Calculate safety score based on multiple factors
    let safetyScore = 100;

    // Temperature impact (optimal range: 15-25°C)
    if (current.temperature < 0 || current.temperature > 35) {
      safetyScore -= 30;
    } else if (current.temperature < 5 || current.temperature > 30) {
      safetyScore -= 15;
    }

    // Precipitation impact
    if (current.precipitation > 5) {
      safetyScore -= 25;
    } else if (current.precipitation > 1) {
      safetyScore -= 10;
    }

    // Wind impact
    if (current.windSpeed > 15) {
      safetyScore -= 20;
    } else if (current.windSpeed > 10) {
      safetyScore -= 10;
    }

    // Visibility impact
    if (current.visibility < 1000) {
      safetyScore -= 20;
    } else if (current.visibility < 5000) {
      safetyScore -= 10;
    }

    // UV Index impact
    if (current.uvIndex > 8) {
      safetyScore -= 15;
    } else if (current.uvIndex > 6) {
      safetyScore -= 5;
    }

    // Air quality impact
    if (current.airQuality > 150) {
      safetyScore -= 20;
    } else if (current.airQuality > 100) {
      safetyScore -= 10;
    }

    return {
      temperature: current.temperature,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      precipitation: current.precipitation,
      visibility: current.visibility,
      uvIndex: current.uvIndex,
      airQuality: current.airQuality,
      safetyScore: Math.max(0, safetyScore),
    };
  }

  /**
   * Assess weather risk for a specific task
   */
  private async assessTaskWeatherRisk(
    task: OperationalDataTaskAssignment,
    conditions?: OutdoorWorkConditions
  ): Promise<WeatherRiskAssessment> {
    if (!conditions) {
      // Get current conditions if not provided
      const forecast = await this.weatherClient.getCurrentWeather(40.7128, -74.0060); // NYC coordinates
      conditions = this.assessOutdoorWorkConditions(forecast);
    }

    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';

    // Assess risk factors
    if (conditions.temperature < 0) {
      riskFactors.push('Freezing temperatures');
      recommendations.push('Wear thermal protection, use anti-slip equipment');
      riskLevel = 'high';
    } else if (conditions.temperature > 35) {
      riskFactors.push('Extreme heat');
      recommendations.push('Take frequent breaks, stay hydrated, work in shade');
      riskLevel = 'high';
    }

    if (conditions.precipitation > 5) {
      riskFactors.push('Heavy precipitation');
      recommendations.push('Use waterproof equipment, consider postponing');
      riskLevel = riskLevel === 'high' ? 'extreme' : 'high';
    }

    if (conditions.windSpeed > 15) {
      riskFactors.push('Strong winds');
      recommendations.push('Secure loose items, avoid working at height');
      riskLevel = riskLevel === 'high' ? 'extreme' : 'medium';
    }

    if (conditions.visibility < 1000) {
      riskFactors.push('Poor visibility');
      recommendations.push('Use high-visibility clothing, work with partner');
      riskLevel = riskLevel === 'high' ? 'extreme' : 'medium';
    }

    if (conditions.uvIndex > 8) {
      riskFactors.push('High UV exposure');
      recommendations.push('Use sunscreen, wear protective clothing');
      riskLevel = riskLevel === 'high' ? 'extreme' : 'medium';
    }

    if (conditions.airQuality > 150) {
      riskFactors.push('Poor air quality');
      recommendations.push('Use respiratory protection, limit exposure time');
      riskLevel = riskLevel === 'high' ? 'extreme' : 'medium';
    }

    // Determine overall risk level
    if (conditions.safetyScore < 30) {
      riskLevel = 'extreme';
    } else if (conditions.safetyScore < 50) {
      riskLevel = 'high';
    } else if (conditions.safetyScore < 70) {
      riskLevel = 'medium';
    }

    // Add general recommendations based on risk level
    if (riskLevel === 'extreme') {
      recommendations.push('Consider postponing task to safer conditions');
    } else if (riskLevel === 'high') {
      recommendations.push('Implement additional safety measures');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor conditions closely');
    }

    return {
      taskId: task.id,
      riskLevel,
      riskFactors,
      recommendations,
      safetyRequirements: this.getSafetyRequirements(riskLevel, conditions),
    };
  }

  /**
   * Determine if schedule adjustment is needed
   */
  private determineScheduleAdjustment(
    task: OperationalDataTaskAssignment,
    riskAssessment: WeatherRiskAssessment,
    conditions: OutdoorWorkConditions
  ): WeatherTaskAdjustment {
    const originalSchedule = task.scheduled_date ? new Date(task.scheduled_date) : new Date();
    let adjustedSchedule: Date | undefined;
    let adjustmentReason = '';

    // Determine if adjustment is needed based on risk level
    if (riskAssessment.riskLevel === 'extreme') {
      // Postpone by 24 hours
      adjustedSchedule = new Date(originalSchedule.getTime() + 24 * 60 * 60 * 1000);
      adjustmentReason = 'Extreme weather conditions - task postponed for safety';
    } else if (riskAssessment.riskLevel === 'high') {
      // Postpone by 4-8 hours
      const delayHours = conditions.precipitation > 5 ? 8 : 4;
      adjustedSchedule = new Date(originalSchedule.getTime() + delayHours * 60 * 60 * 1000);
      adjustmentReason = 'High weather risk - task delayed for safety';
    } else if (riskAssessment.riskLevel === 'medium') {
      // Minor adjustment or proceed with caution
      if (conditions.temperature > 30 || conditions.temperature < 5) {
        // Adjust to cooler/warmer part of day
        const hour = originalSchedule.getHours();
        if (conditions.temperature > 30 && hour > 10 && hour < 16) {
          // Move to early morning or evening
          adjustedSchedule = new Date(originalSchedule);
          adjustedSchedule.setHours(hour < 12 ? 8 : 18);
          adjustmentReason = 'Task moved to cooler part of day';
        }
      }
    }

    return {
      taskId: task.id,
      originalSchedule,
      adjustedSchedule,
      adjustmentReason: adjustmentReason || 'No adjustment needed',
      weatherConditions: conditions,
      riskAssessment,
      workerNotification: riskAssessment.riskLevel !== 'low',
      clientNotification: riskAssessment.riskLevel === 'extreme' || riskAssessment.riskLevel === 'high',
    };
  }

  /**
   * Get safety requirements based on risk level and conditions
   */
  private getSafetyRequirements(
    riskLevel: string,
    conditions: OutdoorWorkConditions
  ): string[] {
    const requirements: string[] = [];

    // Base requirements
    requirements.push('High-visibility clothing');
    requirements.push('Safety footwear');

    // Weather-specific requirements
    if (conditions.temperature < 5) {
      requirements.push('Thermal protection');
      requirements.push('Anti-slip equipment');
    }

    if (conditions.temperature > 30) {
      requirements.push('Sun protection');
      requirements.push('Hydration supplies');
    }

    if (conditions.precipitation > 1) {
      requirements.push('Waterproof equipment');
    }

    if (conditions.windSpeed > 10) {
      requirements.push('Secure loose items');
    }

    if (conditions.uvIndex > 6) {
      requirements.push('Sunscreen (SPF 30+)');
      requirements.push('UV protection clothing');
    }

    if (conditions.airQuality > 100) {
      requirements.push('Respiratory protection');
    }

    // Risk level specific requirements
    if (riskLevel === 'high' || riskLevel === 'extreme') {
      requirements.push('Work with partner');
      requirements.push('Emergency communication device');
    }

    return requirements;
  }

  /**
   * Store weather adjustment in database
   */
  private async storeWeatherAdjustment(adjustment: WeatherTaskAdjustment): Promise<void> {
    try {
      await this.dbManager.insert('weather_adjustments', {
        id: `weather_${Date.now()}_${adjustment.taskId}`,
        task_id: adjustment.taskId,
        original_schedule: adjustment.originalSchedule.getTime(),
        adjusted_schedule: adjustment.adjustedSchedule?.getTime(),
        adjustment_reason: adjustment.adjustmentReason,
        weather_conditions: JSON.stringify(adjustment.weatherConditions),
        risk_assessment: JSON.stringify(adjustment.riskAssessment),
        worker_notification: adjustment.workerNotification,
        client_notification: adjustment.clientNotification,
        created_at: Date.now(),
      });

      // Store in memory for quick access
      if (!this.adjustmentHistory.has(adjustment.taskId)) {
        this.adjustmentHistory.set(adjustment.taskId, []);
      }
      this.adjustmentHistory.get(adjustment.taskId)!.push(adjustment);

    } catch (error) {
      console.error('Failed to store weather adjustment:', error);
    }
  }

  /**
   * Get weather adjustments for a task
   */
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

  /**
   * Get weather alerts for outdoor tasks
   */
  public async getWeatherAlertsForTasks(tasks: OperationalDataTaskAssignment[]): Promise<WeatherAlert[]> {
    try {
      const outdoorTasks = tasks.filter(task => this.isOutdoorTask(task));
      if (outdoorTasks.length === 0) return [];

      // Get weather alerts for NYC area
      const alerts = await this.weatherClient.getWeatherAlerts(40.7128, -74.0060);
      
      // Filter alerts that affect outdoor work
      return alerts.filter(alert => 
        alert.severity === 'severe' || 
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
}
