/**
 * @cyntientops/managers
 * 
 * WeatherTriggeredTaskManager - Weather-Based Task Automation
 * Based on SwiftUI WeatherTriggeredTaskManager.swift (517 lines)
 * Features: Weather monitoring, automatic task creation, 15 trigger conditions, 23 task templates
 */

import { DatabaseManager } from '@cyntientops/database';
import { WeatherSnapshot } from '@cyntientops/domain-schema';

// Global type declarations
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout;
      unref(): Timeout;
    }
  }
}

// Types
export interface WeatherTrigger {
  id: string;
  name: string;
  condition: WeatherCondition;
  threshold: number;
  unit: string;
  isActive: boolean;
  taskTemplate: TaskTemplate;
  buildings: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WeatherCondition {
  type: 'temperature' | 'humidity' | 'precipitation' | 'wind' | 'pressure' | 'visibility';
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value?: number;
  minValue?: number;
  maxValue?: number;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  skillLevel: 'Basic' | 'Intermediate' | 'Advanced';
  estimatedDuration: number;
  requiresPhoto: boolean;
  weatherDependent: boolean;
  buildingSpecific: boolean;
}

export interface WeatherTask {
  id: string;
  title: string;
  description: string;
  buildingId: string;
  assignedWorkerId: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  dueDate: Date;
  weatherTriggerId: string;
  weatherConditions: WeatherSnapshot;
}

export interface WeatherMonitoringState {
  isMonitoring: boolean;
  lastUpdate: Date;
  activeTriggers: WeatherTrigger[];
  recentTasks: WeatherTask[];
  errorCount: number;
}

export class WeatherTriggeredTaskManager {
  private db: DatabaseManager;
  private monitoringState: WeatherMonitoringState;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private weatherUpdateInterval: NodeJS.Timeout | null = null;

  // 15 Trigger Conditions
  private readonly TRIGGER_CONDITIONS = {
    RAIN_EXPECTED: {
      id: 'rain_expected',
      name: 'Rain Expected',
      condition: { type: 'precipitation', operator: 'greater_than', value: 50 },
      unit: '%',
      taskTemplate: 'rain_preparation',
    },
    RAIN_ENDED: {
      id: 'rain_ended',
      name: 'Rain Ended',
      condition: { type: 'precipitation', operator: 'less_than', value: 10 },
      unit: '%',
      taskTemplate: 'post_rain_inspection',
    },
    WIND_WARNING: {
      id: 'wind_warning',
      name: 'High Wind Warning',
      condition: { type: 'wind', operator: 'greater_than', value: 25 },
      unit: 'mph',
      taskTemplate: 'wind_safety_check',
    },
    FREEZE_WARNING: {
      id: 'freeze_warning',
      name: 'Freeze Warning',
      condition: { type: 'temperature', operator: 'less_than', value: 32 },
      unit: '°F',
      taskTemplate: 'freeze_protection',
    },
    HEAT_WAVE: {
      id: 'heat_wave',
      name: 'Heat Wave',
      condition: { type: 'temperature', operator: 'greater_than', value: 90 },
      unit: '°F',
      taskTemplate: 'heat_safety_check',
    },
    SNOW_EXPECTED: {
      id: 'snow_expected',
      name: 'Snow Expected',
      condition: { type: 'precipitation', operator: 'greater_than', value: 2 },
      unit: 'inches',
      taskTemplate: 'snow_preparation',
    },
    STORM_WARNING: {
      id: 'storm_warning',
      name: 'Storm Warning',
      condition: { type: 'wind', operator: 'greater_than', value: 40 },
      unit: 'mph',
      taskTemplate: 'storm_preparation',
    },
    HIGH_HUMIDITY: {
      id: 'high_humidity',
      name: 'High Humidity',
      condition: { type: 'humidity', operator: 'greater_than', value: 80 },
      unit: '%',
      taskTemplate: 'humidity_control',
    },
    LOW_PRESSURE: {
      id: 'low_pressure',
      name: 'Low Pressure System',
      condition: { type: 'pressure', operator: 'less_than', value: 29.5 },
      unit: 'inHg',
      taskTemplate: 'pressure_system_check',
    },
    POOR_VISIBILITY: {
      id: 'poor_visibility',
      name: 'Poor Visibility',
      condition: { type: 'visibility', operator: 'less_than', value: 1 },
      unit: 'miles',
      taskTemplate: 'visibility_safety',
    },
    EXTREME_COLD: {
      id: 'extreme_cold',
      name: 'Extreme Cold',
      condition: { type: 'temperature', operator: 'less_than', value: 20 },
      unit: '°F',
      taskTemplate: 'extreme_cold_protection',
    },
    EXTREME_HEAT: {
      id: 'extreme_heat',
      name: 'Extreme Heat',
      condition: { type: 'temperature', operator: 'greater_than', value: 100 },
      unit: '°F',
      taskTemplate: 'extreme_heat_safety',
    },
    FOG_WARNING: {
      id: 'fog_warning',
      name: 'Fog Warning',
      condition: { type: 'visibility', operator: 'less_than', value: 0.5 },
      unit: 'miles',
      taskTemplate: 'fog_safety_check',
    },
    THUNDERSTORM: {
      id: 'thunderstorm',
      name: 'Thunderstorm',
      condition: { type: 'precipitation', operator: 'greater_than', value: 75 },
      unit: '%',
      taskTemplate: 'thunderstorm_safety',
    },
    SEVERE_WEATHER: {
      id: 'severe_weather',
      name: 'Severe Weather',
      condition: { type: 'wind', operator: 'greater_than', value: 50 },
      unit: 'mph',
      taskTemplate: 'severe_weather_protocol',
    },
  };

  // 23 Task Templates
  private readonly TASK_TEMPLATES = {
    rain_preparation: {
      id: 'rain_preparation',
      title: 'Rain Preparation Check',
      description: 'Inspect and prepare building for incoming rain',
      category: 'Weather Response',
      skillLevel: 'Basic',
      estimatedDuration: 30,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    post_rain_inspection: {
      id: 'post_rain_inspection',
      title: 'Post-Rain Inspection',
      description: 'Check for water damage and drainage issues after rain',
      category: 'Weather Response',
      skillLevel: 'Basic',
      estimatedDuration: 45,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    wind_safety_check: {
      id: 'wind_safety_check',
      title: 'Wind Safety Check',
      description: 'Secure loose items and check for wind damage',
      category: 'Safety',
      skillLevel: 'Basic',
      estimatedDuration: 20,
      requiresPhoto: false,
      weatherDependent: true,
      buildingSpecific: true,
    },
    freeze_protection: {
      id: 'freeze_protection',
      title: 'Freeze Protection Check',
      description: 'Check pipes and heating systems for freeze protection',
      category: 'Maintenance',
      skillLevel: 'Intermediate',
      estimatedDuration: 60,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    heat_safety_check: {
      id: 'heat_safety_check',
      title: 'Heat Safety Check',
      description: 'Check cooling systems and heat safety measures',
      category: 'Safety',
      skillLevel: 'Basic',
      estimatedDuration: 30,
      requiresPhoto: false,
      weatherDependent: true,
      buildingSpecific: true,
    },
    snow_preparation: {
      id: 'snow_preparation',
      title: 'Snow Preparation',
      description: 'Prepare building and equipment for snow conditions',
      category: 'Weather Response',
      skillLevel: 'Basic',
      estimatedDuration: 45,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    storm_preparation: {
      id: 'storm_preparation',
      title: 'Storm Preparation',
      description: 'Secure building and equipment for incoming storm',
      category: 'Safety',
      skillLevel: 'Intermediate',
      estimatedDuration: 90,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    humidity_control: {
      id: 'humidity_control',
      title: 'Humidity Control Check',
      description: 'Check and adjust humidity control systems',
      category: 'Maintenance',
      skillLevel: 'Intermediate',
      estimatedDuration: 30,
      requiresPhoto: false,
      weatherDependent: true,
      buildingSpecific: true,
    },
    pressure_system_check: {
      id: 'pressure_system_check',
      title: 'Pressure System Check',
      description: 'Check building pressure systems during low pressure',
      category: 'Maintenance',
      skillLevel: 'Advanced',
      estimatedDuration: 60,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    visibility_safety: {
      id: 'visibility_safety',
      title: 'Visibility Safety Check',
      description: 'Check lighting and safety systems for poor visibility',
      category: 'Safety',
      skillLevel: 'Basic',
      estimatedDuration: 20,
      requiresPhoto: false,
      weatherDependent: true,
      buildingSpecific: true,
    },
    extreme_cold_protection: {
      id: 'extreme_cold_protection',
      title: 'Extreme Cold Protection',
      description: 'Implement extreme cold protection measures',
      category: 'Safety',
      skillLevel: 'Advanced',
      estimatedDuration: 120,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    extreme_heat_safety: {
      id: 'extreme_heat_safety',
      title: 'Extreme Heat Safety',
      description: 'Implement extreme heat safety measures',
      category: 'Safety',
      skillLevel: 'Advanced',
      estimatedDuration: 90,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    fog_safety_check: {
      id: 'fog_safety_check',
      title: 'Fog Safety Check',
      description: 'Check safety systems and lighting for fog conditions',
      category: 'Safety',
      skillLevel: 'Basic',
      estimatedDuration: 25,
      requiresPhoto: false,
      weatherDependent: true,
      buildingSpecific: true,
    },
    thunderstorm_safety: {
      id: 'thunderstorm_safety',
      title: 'Thunderstorm Safety',
      description: 'Implement thunderstorm safety protocols',
      category: 'Safety',
      skillLevel: 'Intermediate',
      estimatedDuration: 60,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
    severe_weather_protocol: {
      id: 'severe_weather_protocol',
      title: 'Severe Weather Protocol',
      description: 'Implement severe weather emergency protocols',
      category: 'Emergency',
      skillLevel: 'Advanced',
      estimatedDuration: 180,
      requiresPhoto: true,
      weatherDependent: true,
      buildingSpecific: true,
    },
  };

  constructor(db: DatabaseManager) {
    this.db = db;
    this.monitoringState = {
      isMonitoring: false,
      lastUpdate: new Date(),
      activeTriggers: [],
      recentTasks: [],
      errorCount: 0,
    };
  }

  /**
   * Start weather monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringState.isMonitoring) return;

    console.log('[WeatherTriggeredTaskManager] Starting weather monitoring');
    
    this.monitoringState.isMonitoring = true;
    
    // Load active triggers from database
    await this.loadActiveTriggers();
    
    // Start monitoring interval (check every 5 minutes)
    this.monitoringInterval = setInterval(async () => {
      await this.checkWeatherConditions();
    }, 5 * 60 * 1000);
    
    // Start weather update interval (update every 15 minutes)
    this.weatherUpdateInterval = setInterval(async () => {
      await this.updateWeatherData();
    }, 15 * 60 * 1000);
    
    // Initial check
    await this.checkWeatherConditions();
  }

  /**
   * Stop weather monitoring
   */
  async stopMonitoring(): Promise<void> {
    console.log('[WeatherTriggeredTaskManager] Stopping weather monitoring');
    
    this.monitoringState.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.weatherUpdateInterval) {
      clearInterval(this.weatherUpdateInterval);
      this.weatherUpdateInterval = null;
    }
  }

  /**
   * Load active triggers from database
   */
  private async loadActiveTriggers(): Promise<void> {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM weather_triggers WHERE is_active = 1',
        []
      );

      this.monitoringState.activeTriggers = [];
      
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        const trigger: WeatherTrigger = {
          id: row.id,
          name: row.name,
          condition: JSON.parse(row.condition),
          threshold: row.threshold,
          unit: row.unit,
          isActive: row.is_active === 1,
          taskTemplate: this.TASK_TEMPLATES[row.task_template_id],
          buildings: JSON.parse(row.buildings),
          priority: row.priority,
        };
        
        this.monitoringState.activeTriggers.push(trigger);
      }
      
      console.log(`[WeatherTriggeredTaskManager] Loaded ${this.monitoringState.activeTriggers.length} active triggers`);
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to load triggers:', error);
      this.monitoringState.errorCount++;
    }
  }

  /**
   * Check weather conditions against triggers
   */
  private async checkWeatherConditions(): Promise<void> {
    try {
      // Get current weather data
      const weatherData = await this.getCurrentWeatherData();
      
      if (!weatherData) {
        console.warn('[WeatherTriggeredTaskManager] No weather data available');
        return;
      }

      // Check each active trigger
      for (const trigger of this.monitoringState.activeTriggers) {
        if (await this.evaluateTrigger(trigger, weatherData)) {
          await this.createWeatherTask(trigger, weatherData);
        }
      }
      
      this.monitoringState.lastUpdate = new Date();
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to check weather conditions:', error);
      this.monitoringState.errorCount++;
    }
  }

  /**
   * Evaluate if a trigger condition is met
   */
  private async evaluateTrigger(trigger: WeatherTrigger, weatherData: WeatherSnapshot): Promise<boolean> {
    const { condition } = trigger;
    let currentValue: number;

    // Get current weather value
    switch (condition.type) {
      case 'temperature':
        currentValue = weatherData.temperature;
        break;
      case 'humidity':
        currentValue = weatherData.humidity;
        break;
      case 'precipitation':
        currentValue = weatherData.precipitationProbability;
        break;
      case 'wind':
        currentValue = weatherData.windSpeed;
        break;
      case 'pressure':
        currentValue = weatherData.pressure;
        break;
      case 'visibility':
        currentValue = weatherData.visibility;
        break;
      default:
        return false;
    }

    // Evaluate condition
    switch (condition.operator) {
      case 'greater_than':
        return currentValue > (condition.value || 0);
      case 'less_than':
        return currentValue < (condition.value || 0);
      case 'equals':
        return Math.abs(currentValue - (condition.value || 0)) < 0.1;
      case 'between':
        return currentValue >= (condition.minValue || 0) && currentValue <= (condition.maxValue || 0);
      default:
        return false;
    }
  }

  /**
   * Create weather-triggered task
   */
  private async createWeatherTask(trigger: WeatherTrigger, _weatherData: WeatherSnapshot): Promise<void> {
    try {
      // Check if task already exists for this trigger today
      const today = new Date().toISOString().split('T')[0];
      const existingTask = await this.db.executeSql(
        'SELECT * FROM weather_tasks WHERE weather_trigger_id = ? AND DATE(created_at) = ?',
        [trigger.id, today]
      );

      if (existingTask.rows.length > 0) {
        console.log(`[WeatherTriggeredTaskManager] Task already exists for trigger ${trigger.id} today`);
        return;
      }

      // Create task for each building
      for (const buildingId of trigger.buildings) {
        const taskId = `weather_${Date.now()}_${trigger.id}_${buildingId}`;
        const dueDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

        const weatherTask: WeatherTask = {
          id: taskId,
          title: trigger.taskTemplate.title,
          description: `${trigger.taskTemplate.description} - Triggered by ${trigger.name}`,
          buildingId,
          assignedWorkerId: await this.getAvailableWorker(buildingId),
          category: trigger.taskTemplate.category,
          priority: trigger.priority,
          status: 'pending',
          createdAt: new Date(),
          dueDate,
          weatherTriggerId: trigger.id,
          weatherConditions: weatherData,
        };

        // Save to database
        await this.db.executeSql(
          `INSERT INTO weather_tasks (
            id, title, description, building_id, assigned_worker_id,
            category, priority, status, created_at, due_date,
            weather_trigger_id, weather_conditions
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            weatherTask.id,
            weatherTask.title,
            weatherTask.description,
            weatherTask.buildingId,
            weatherTask.assignedWorkerId,
            weatherTask.category,
            weatherTask.priority,
            weatherTask.status,
            weatherTask.createdAt.toISOString(),
            weatherTask.dueDate.toISOString(),
            weatherTask.weatherTriggerId,
            JSON.stringify(weatherTask.weatherConditions),
          ]
        );

        // Add to recent tasks
        this.monitoringState.recentTasks.unshift(weatherTask);
        if (this.monitoringState.recentTasks.length > 50) {
          this.monitoringState.recentTasks = this.monitoringState.recentTasks.slice(0, 50);
        }

        console.log(`[WeatherTriggeredTaskManager] Created weather task: ${weatherTask.title} for building ${buildingId}`);
      }
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to create weather task:', error);
      this.monitoringState.errorCount++;
    }
  }

  /**
   * Get available worker for building
   */
  private async getAvailableWorker(buildingId: string): Promise<string> {
    try {
      const result = await this.db.executeSql(
        'SELECT id FROM workers WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1',
        []
      );

      if (result.rows.length > 0) {
        return result.rows.item(0).id;
      }

      // Fallback to first active worker
      const fallbackResult = await this.db.executeSql(
        'SELECT id FROM workers WHERE is_active = 1 LIMIT 1',
        []
      );

      return fallbackResult.rows.length > 0 ? fallbackResult.rows.item(0).id : '1';
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to get available worker:', error);
      return '1'; // Default fallback
    }
  }

  /**
   * Get current weather data (mock implementation)
   */
  private async getCurrentWeatherData(): Promise<WeatherSnapshot | null> {
    // In a real implementation, this would fetch from a weather API
    return {
      temperature: 72,
      humidity: 65,
      precipitationProbability: 30,
      windSpeed: 12,
      pressure: 30.1,
      visibility: 10,
      condition: 'partly_cloudy',
      timestamp: new Date(),
    };
  }

  /**
   * Update weather data
   */
  private async updateWeatherData(): Promise<void> {
    try {
      const weatherData = await this.getCurrentWeatherData();
      if (weatherData) {
        // Store weather data in database
        await this.db.executeSql(
          `INSERT INTO weather_snapshots (
            temperature, humidity, precipitation_probability, wind_speed,
            pressure, visibility, condition, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            weatherData.temperature,
            weatherData.humidity,
            weatherData.precipitationProbability,
            weatherData.windSpeed,
            weatherData.pressure,
            weatherData.visibility,
            weatherData.condition,
            weatherData.timestamp.toISOString(),
          ]
        );
      }
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to update weather data:', error);
    }
  }

  /**
   * Get monitoring state
   */
  getMonitoringState(): WeatherMonitoringState {
    return { ...this.monitoringState };
  }

  /**
   * Get recent weather tasks
   */
  async getRecentWeatherTasks(limit: number = 20): Promise<WeatherTask[]> {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM weather_tasks ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      const tasks: WeatherTask[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        tasks.push({
          id: row.id,
          title: row.title,
          description: row.description,
          buildingId: row.building_id,
          assignedWorkerId: row.assigned_worker_id,
          category: row.category,
          priority: row.priority,
          status: row.status,
          createdAt: new Date(row.created_at),
          dueDate: new Date(row.due_date),
          weatherTriggerId: row.weather_trigger_id,
          weatherConditions: JSON.parse(row.weather_conditions),
        });
      }

      return tasks;
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to get recent weather tasks:', error);
      return [];
    }
  }

  /**
   * Add weather trigger
   */
  async addWeatherTrigger(trigger: Omit<WeatherTrigger, 'id'>): Promise<string> {
    const triggerId = `trigger_${Date.now()}`;
    
    try {
      await this.db.executeSql(
        `INSERT INTO weather_triggers (
          id, name, condition, threshold, unit, is_active,
          task_template_id, buildings, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          triggerId,
          trigger.name,
          JSON.stringify(trigger.condition),
          trigger.threshold,
          trigger.unit,
          trigger.isActive ? 1 : 0,
          trigger.taskTemplate.id,
          JSON.stringify(trigger.buildings),
          trigger.priority,
        ]
      );

      // Reload active triggers
      await this.loadActiveTriggers();
      
      return triggerId;
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to add weather trigger:', error);
      throw error;
    }
  }

  /**
   * Remove weather trigger
   */
  async removeWeatherTrigger(triggerId: string): Promise<void> {
    try {
      await this.db.executeSql(
        'UPDATE weather_triggers SET is_active = 0 WHERE id = ?',
        [triggerId]
      );

      // Reload active triggers
      await this.loadActiveTriggers();
    } catch (error) {
      console.error('[WeatherTriggeredTaskManager] Failed to remove weather trigger:', error);
      throw error;
    }
  }
}

export default WeatherTriggeredTaskManager;
