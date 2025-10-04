/**
 * Weather Triggered Task Manager
 * Delegates to WeatherManager for weather-triggered task functionality
 */

import { WeatherManager } from '@cyntientops/managers';

export class WeatherTriggeredTaskManager {
  private weatherManager: WeatherManager;

  constructor(serviceContainer: any, cacheManager: any) {
    // Initialize with weather manager
    this.weatherManager = WeatherManager.getInstance();
  }

  // Delegate methods to WeatherManager
  async getWeatherData(): Promise<any> {
    return this.weatherManager.getCurrentWeather();
  }

  async getWeatherForecast(): Promise<any> {
    return this.weatherManager.getWeatherForecast();
  }

  async getWeatherAlerts(): Promise<any> {
    return this.weatherManager.getWeatherAlerts();
  }

  async assessWeatherImpact(task: any, worker: any, building: any): Promise<any> {
    return this.weatherManager.assessWeatherImpact(task, worker, building);
  }

  async getWeatherEquipmentRecommendations(weather?: any): Promise<any> {
    return this.weatherManager.getWeatherEquipmentRecommendations(weather);
  }

  async startWeatherMonitoring(): Promise<void> {
    return this.weatherManager.startWeatherMonitoring();
  }

  async stopWeatherMonitoring(): Promise<void> {
    return this.weatherManager.stopWeatherMonitoring();
  }

  async getActiveWeatherTasks(): Promise<any[]> {
    return this.weatherManager.getActiveWeatherTasks();
  }

  async getWeatherTaskById(id: string): Promise<any> {
    return this.weatherManager.getWeatherTaskById(id);
  }

  async completeWeatherTask(taskId: string, completionData: any): Promise<boolean> {
    return this.weatherManager.completeWeatherTask(taskId, completionData);
  }

  async cancelWeatherTask(taskId: string, reason: string): Promise<boolean> {
    return this.weatherManager.cancelWeatherTask(taskId, reason);
  }

  async cleanup(): Promise<void> {
    return this.weatherManager.cleanup();
  }
}
