/**
 * 🌤️ Weather API Client
 * Mirrors: CyntientOps/Services/Weather/WeatherService.swift
 * Purpose: Weather data for task scheduling and outdoor work adjustments
 */

import axios, { AxiosInstance } from 'axios';
// Define types locally to avoid module resolution issues
export type WeatherSnapshot = {
  timestamp: Date;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  description: string;
  outdoorWorkRisk: OutdoorWorkRisk;
};

export type OutdoorWorkRisk = 'low' | 'medium' | 'high' | 'extreme';

// Mock services to avoid module resolution issues
interface MockTask {
  id: string;
  title: string;
  category?: string;
}

interface MockInventoryItem {
  id: string;
  name: string;
  category?: string;
}

class MockOperationalDataManager {
  static getInstance() { return new MockOperationalDataManager(); }
  async getAllTasks(): Promise<MockTask[]> { 
    return [
      { id: '1', title: 'Sidewalk Cleaning', category: 'outdoor' },
      { id: '2', title: 'Indoor Maintenance', category: 'indoor' },
      { id: '3', title: 'Drain Inspection', category: 'outdoor' },
      { id: '4', title: 'Equipment Check', category: 'maintenance' }
    ]; 
  }
}

class MockInventoryService {
  static getInstance() { return new MockInventoryService(); }
  async getAvailableItems(): Promise<MockInventoryItem[]> { 
    return [
      { id: '1', name: 'Rain Mats', category: 'cleaning' },
      { id: '2', name: 'Drain Covers', category: 'maintenance' },
      { id: '3', name: 'Safety Equipment', category: 'safety' }
    ]; 
  }
}

class MockTaskService {
  static getInstance() { return new MockTaskService(); }
}

class MockBuildingService {
  static getInstance() { return new MockBuildingService(); }
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  weatherCode: number;
  description: string;
  windSpeed: number;
  humidity: number;
  precipitation: {
    probability: number;
    amount: number;
  };
  outdoorWorkRisk: OutdoorWorkRisk;
  recommendations: string[];
}

export interface WeatherAlert {
  type: 'severe' | 'warning' | 'advisory' | 'watch';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
  outdoorWorkImpact: 'none' | 'limited' | 'restricted' | 'prohibited';
}

export interface TaskWeatherAdjustment {
  taskId: string;
  originalSchedule: Date;
  adjustedSchedule: Date | null;
  adjustmentReason: string;
  weatherImpact: 'none' | 'minor' | 'moderate' | 'major';
  alternativeTasks: string[];
  safetyRecommendations: string[];
}

export class WeatherAPIClient {
  private baseURL: string = 'https://api.open-meteo.com/v1';
  private client: AxiosInstance;
  private latitude: number = 40.7128; // NYC default
  private longitude: number = -74.0060; // NYC default
  private operationalData: MockOperationalDataManager;
  private inventoryService: MockInventoryService;
  private taskService: MockTaskService;
  private buildingService: MockBuildingService;

  constructor(
    latitude?: number, 
    longitude?: number, 
    operationalData?: MockOperationalDataManager,
    inventoryService?: MockInventoryService,
    taskService?: MockTaskService,
    buildingService?: MockBuildingService
  ) {
    // OpenMeteo doesn't require an API key
    if (latitude) this.latitude = latitude;
    if (longitude) this.longitude = longitude;
    this.operationalData = operationalData || MockOperationalDataManager.getInstance();
    this.inventoryService = inventoryService || MockInventoryService.getInstance();
    this.taskService = taskService || MockTaskService.getInstance();
    this.buildingService = buildingService || MockBuildingService.getInstance();
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }

  /**
   * Get current weather conditions
   */
  public async getCurrentWeather(): Promise<WeatherSnapshot> {
    try {
      const response = await this.client.get('/forecast', {
        params: {
          latitude: this.latitude,
          longitude: this.longitude,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
          timezone: 'America/New_York'
        }
      });

      const data = response.data;
      return this.transformCurrentWeather(data);
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error('Failed to fetch current weather');
    }
  }

  /**
   * Get weather forecast for the next 5 days
   */
  public async getWeatherForecast(): Promise<WeatherForecast[]> {
    try {
      const response = await this.client.get('/forecast', {
        params: {
          latitude: this.latitude,
          longitude: this.longitude,
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max',
          timezone: 'America/New_York',
          forecast_days: 5
        }
      });

      return this.transformForecast(response.data);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  /**
   * Get weather for a specific date
   */
  public async getWeatherForDate(date: Date): Promise<WeatherForecast | null> {
    const forecast = await this.getWeatherForecast();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return forecast.find(day => {
      const forecastDate = new Date(day.date);
      forecastDate.setHours(0, 0, 0, 0);
      return forecastDate.getTime() === targetDate.getTime();
    }) || null;
  }

  /**
   * Get outdoor work risk assessment
   */
  public async getOutdoorWorkRisk(date?: Date): Promise<{
    risk: OutdoorWorkRisk;
    factors: string[];
    recommendations: string[];
    isSafeForWork: boolean;
  }> {
    const weather = date 
      ? await this.getWeatherForDate(date)
      : await this.getCurrentWeather();

    if (!weather) {
      throw new Error('Unable to get weather data');
    }

    return this.assessOutdoorWorkRisk(weather);
  }

  /**
   * Get weather alerts for the area
   */
  public async getWeatherAlerts(): Promise<WeatherAlert[]> {
    // Note: OpenWeatherMap doesn't have alerts in free tier
    // This would typically integrate with National Weather Service API
    // For now, return empty array or mock data
    return [];
  }

  /**
   * Adjust task schedule based on weather
   */
  public async adjustTaskForWeather(
    taskId: string, 
    originalSchedule: Date, 
    taskType: string
  ): Promise<TaskWeatherAdjustment> {
    const weather = await this.getWeatherForDate(originalSchedule);
    
    if (!weather) {
      return {
        taskId,
        originalSchedule,
        adjustedSchedule: null,
        adjustmentReason: 'Unable to get weather data',
        weatherImpact: 'none',
        alternativeTasks: [],
        safetyRecommendations: []
      };
    }

    const riskAssessment = this.assessOutdoorWorkRisk(weather);
    const isOutdoorTask = await this.isOutdoorTask(taskType);
    
    let adjustedSchedule: Date | null = null;
    let adjustmentReason = '';
    let weatherImpact: 'none' | 'minor' | 'moderate' | 'major' = 'none';
    let alternativeTasks: string[] = [];
    let safetyRecommendations: string[] = [];

    if (isOutdoorTask) {
      if (riskAssessment.risk === 'extreme' || riskAssessment.risk === 'high') {
        // Find next suitable day
        const forecast = await this.getWeatherForecast();
        const nextSuitableDay = this.findNextSuitableDay(forecast, originalSchedule);
        
        if (nextSuitableDay) {
          adjustedSchedule = nextSuitableDay;
          adjustmentReason = `Weather conditions unsafe: ${weather.description}`;
          weatherImpact = 'major';
        } else {
          adjustmentReason = 'No suitable weather conditions in forecast';
          weatherImpact = 'major';
        }
        
        alternativeTasks = await this.getAlternativeTasks(taskType);
        safetyRecommendations = riskAssessment.recommendations;
      } else if (riskAssessment.risk === 'medium') {
        adjustedSchedule = originalSchedule; // Keep same day but with precautions
        adjustmentReason = `Weather conditions require extra precautions: ${weather.description}`;
        weatherImpact = 'moderate';
        safetyRecommendations = riskAssessment.recommendations;
      } else {
        weatherImpact = 'minor';
        safetyRecommendations = riskAssessment.recommendations;
      }
    }

    return {
      taskId,
      originalSchedule,
      adjustedSchedule,
      adjustmentReason,
      weatherImpact,
      alternativeTasks,
      safetyRecommendations
    };
  }

  /**
   * Get weather impact summary for multiple tasks
   */
  public async getWeatherImpactSummary(
    tasks: Array<{ id: string; schedule: Date; type: string }>
  ): Promise<{
    totalTasks: number;
    affectedTasks: number;
    rescheduledTasks: number;
    highRiskTasks: number;
    recommendations: string[];
  }> {
    let affectedTasks = 0;
    let rescheduledTasks = 0;
    let highRiskTasks = 0;
    const recommendations: string[] = [];

    for (const task of tasks) {
      const adjustment = await this.adjustTaskForWeather(task.id, task.schedule, task.type);
      
      if (adjustment.weatherImpact !== 'none') {
        affectedTasks++;
      }
      
      if (adjustment.adjustedSchedule) {
        rescheduledTasks++;
      }
      
      if (adjustment.weatherImpact === 'major') {
        highRiskTasks++;
      }
      
      recommendations.push(...adjustment.safetyRecommendations);
    }

    return {
      totalTasks: tasks.length,
      affectedTasks,
      rescheduledTasks,
      highRiskTasks,
      recommendations: Array.from(new Set(recommendations)) // Remove duplicates
    };
  }

  /**
   * Transform current weather API response
   */
  private transformCurrentWeather(data: any): WeatherSnapshot {
    const current = data.current;
    return {
      timestamp: new Date(),
      temperature: Math.round(current.temperature_2m),
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      description: this.getWeatherDescription(current.weather_code),
      outdoorWorkRisk: this.calculateOutdoorWorkRisk(current)
    };
  }

  /**
   * Transform forecast API response
   */
  private transformForecast(data: any): WeatherForecast[] {
    const daily = data.daily;
    const forecasts: WeatherForecast[] = [];
    
    // OpenMeteo returns daily data arrays
    for (let i = 0; i < daily.time.length; i++) {
      const date = new Date(daily.time[i]);
      const maxTemp = daily.temperature_2m_max[i];
      const minTemp = daily.temperature_2m_min[i];
      const weatherCode = daily.weather_code[i];
      const windSpeed = daily.wind_speed_10m_max[i];
      const precipitation = daily.precipitation_sum[i] || 0;
      
      forecasts.push({
        date,
        temperature: {
          min: Math.round(minTemp),
          max: Math.round(maxTemp),
          average: Math.round((maxTemp + minTemp) / 2)
        },
        weatherCode,
        description: this.getWeatherDescription(weatherCode),
        windSpeed,
        humidity: 70, // OpenMeteo doesn't provide daily humidity in free tier
        precipitation: {
          probability: precipitation > 0 ? 60 : 20, // Estimate based on precipitation amount
          amount: precipitation
        },
        outdoorWorkRisk: this.calculateOutdoorWorkRisk({
          weather_code: weatherCode,
          wind_speed_10m: windSpeed,
          precipitation_sum: precipitation
        }),
        recommendations: this.generateWeatherRecommendations(weatherCode, windSpeed, precipitation)
      });
    }
    
    return forecasts;
  }

  /**
   * Get weather description from OpenMeteo weather code
   */
  private getWeatherDescription(weatherCode: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    
    return descriptions[weatherCode] || 'Unknown';
  }

  /**
   * Generate weather recommendations based on conditions
   */
  private generateWeatherRecommendations(weatherCode: number, windSpeed: number, precipitation: number): string[] {
    const recommendations: string[] = [];
    
    // Weather code recommendations
    if (weatherCode >= 61 && weatherCode <= 67) {
      recommendations.push('Avoid outdoor work during rain');
      recommendations.push('Use waterproof equipment if work is necessary');
    }
    
    if (weatherCode >= 71 && weatherCode <= 77) {
      recommendations.push('Avoid outdoor work during snow');
      recommendations.push('Clear snow from work areas first');
    }
    
    if (weatherCode >= 80 && weatherCode <= 82) {
      recommendations.push('Monitor for sudden weather changes');
      recommendations.push('Have shelter available');
    }
    
    if (weatherCode >= 95 && weatherCode <= 99) {
      recommendations.push('Postpone outdoor work during thunderstorms');
      recommendations.push('Seek immediate shelter if caught outside');
    }
    
    // Wind speed recommendations
    if (windSpeed > 15) {
      recommendations.push('Secure loose materials and equipment');
      recommendations.push('Be cautious with ladders and elevated work');
    }
    
    if (windSpeed > 25) {
      recommendations.push('Consider postponing outdoor work');
      recommendations.push('Avoid working at heights');
    }
    
    // Precipitation recommendations
    if (precipitation > 0.1) {
      recommendations.push('Use non-slip footwear');
      recommendations.push('Ensure proper drainage in work areas');
    }
    
    if (precipitation > 0.5) {
      recommendations.push('Consider rescheduling outdoor tasks');
      recommendations.push('Use appropriate rain gear');
    }
    
    return recommendations.length > 0 ? recommendations : ['Weather conditions are suitable for outdoor work'];
  }

  /**
   * Calculate outdoor work risk from weather data
   */
  private calculateOutdoorWorkRisk(weatherData: any): OutdoorWorkRisk {
    // Handle both OpenMeteo and legacy formats
    const temperature = weatherData.temperature_2m || weatherData.main?.temp || 20;
    const windSpeed = weatherData.wind_speed_10m || weatherData.wind?.speed || 0;
    const weatherCode = weatherData.weather_code || weatherData.weather?.[0]?.id || 0;
    const precipitation = weatherData.precipitation_sum || weatherData.rain?.['3h'] || weatherData.snow?.['3h'] || 0;

    // Extreme conditions
    if (temperature < 20 || temperature > 95 || windSpeed > 25 || precipitation > 0.5) {
      return 'extreme';
    }

    // High risk conditions
    if (temperature < 32 || temperature > 85 || windSpeed > 15 || precipitation > 0.1) {
      return 'high';
    }

    // Medium risk conditions
    if (temperature < 40 || temperature > 75 || windSpeed > 10 || weatherCode >= 500) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Assess outdoor work risk with detailed analysis
   */
  private assessOutdoorWorkRisk(weather: WeatherForecast | WeatherSnapshot): {
    risk: OutdoorWorkRisk;
    factors: string[];
    recommendations: string[];
    isSafeForWork: boolean;
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let risk: OutdoorWorkRisk = 'low';

    // Temperature assessment
    const temp = 'temperature' in weather ? 
      (typeof weather.temperature === 'number' ? weather.temperature : weather.temperature.average) : 
      (weather as WeatherSnapshot).temperature;
    if (temp < 20) {
      factors.push('Extreme cold');
      recommendations.push('Avoid outdoor work due to extreme cold');
      risk = 'extreme';
    } else if (temp < 32) {
      factors.push('Freezing temperatures');
      recommendations.push('Use cold weather gear and limit exposure time');
      risk = risk === 'low' ? 'high' : risk;
    } else if (temp > 95) {
      factors.push('Extreme heat');
      recommendations.push('Avoid outdoor work due to extreme heat');
      risk = 'extreme';
    } else if (temp > 85) {
      factors.push('High temperatures');
      recommendations.push('Stay hydrated and take frequent breaks');
      risk = risk === 'low' ? 'high' : risk;
    }

    // Wind assessment
    if (weather.windSpeed > 25) {
      factors.push('High winds');
      recommendations.push('Avoid outdoor work due to dangerous winds');
      risk = 'extreme';
    } else if (weather.windSpeed > 15) {
      factors.push('Strong winds');
      recommendations.push('Secure loose items and use extra caution');
      risk = risk === 'low' ? 'high' : risk;
    }

    // Precipitation assessment
    if ('precipitation' in weather) {
      if (weather.precipitation.amount > 0.5) {
        factors.push('Heavy precipitation');
        recommendations.push('Postpone outdoor work due to heavy rain/snow');
        risk = 'extreme';
      } else if (weather.precipitation.amount > 0.1) {
        factors.push('Light precipitation');
        recommendations.push('Use appropriate rain gear');
        risk = risk === 'low' ? 'medium' : risk;
      }
    }

    // Weather code assessment
    if (weather.weatherCode >= 200 && weather.weatherCode < 300) {
      factors.push('Thunderstorms');
      recommendations.push('Avoid outdoor work during thunderstorms');
      risk = 'extreme';
    } else if (weather.weatherCode >= 500 && weather.weatherCode < 600) {
      factors.push('Rain');
      recommendations.push('Use rain gear and non-slip footwear');
      risk = risk === 'low' ? 'medium' : risk;
    } else if (weather.weatherCode >= 600 && weather.weatherCode < 700) {
      factors.push('Snow');
      recommendations.push('Use appropriate winter gear and clear work areas');
      risk = risk === 'low' ? 'high' : risk;
    }

    return {
      risk,
      factors,
      recommendations,
      isSafeForWork: risk === 'low' || risk === 'medium'
    };
  }

  /**
   * Check if task type is outdoor work using real operational data
   */
  private async isOutdoorTask(taskType: string): Promise<boolean> {
    try {
      // Get real task categories from operational data
      const allTasks = await this.operationalData.getAllTasks();
      const outdoorTaskCategories = allTasks
        .filter(task => task.category && task.category.toLowerCase().includes('outdoor'))
        .map(task => task.category)
        .filter((category, index, self) => self.indexOf(category) === index)
        .filter((category): category is string => category !== undefined);

      // Check against real outdoor task categories
      const outdoorKeywords = [
        'sidewalk', 'curb', 'trash', 'garbage', 'outdoor', 'exterior',
        'landscaping', 'parking', 'roof', 'drainage', 'hose', 'sweep',
        'sanitation', 'maintenance', 'cleaning'
      ];

      // Combine operational data categories with standard keywords
      const allOutdoorKeywords = [...outdoorKeywords, ...outdoorTaskCategories];
      
      return allOutdoorKeywords.some(keyword => 
        keyword && taskType.toLowerCase().includes(keyword.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to check outdoor task from operational data:', error);
      // Fallback to basic keyword matching
      const outdoorTasks = [
        'sidewalk', 'curb', 'trash', 'garbage', 'outdoor', 'exterior',
        'landscaping', 'parking', 'roof', 'drainage', 'hose', 'sweep'
      ];
      
      return outdoorTasks.some(keyword => 
        taskType.toLowerCase().includes(keyword)
      );
    }
  }

  /**
   * Find next suitable day for outdoor work
   */
  private findNextSuitableDay(forecast: WeatherForecast[], originalDate: Date): Date | null {
    for (const day of forecast) {
      if (day.date > originalDate && day.outdoorWorkRisk === 'low') {
        return day.date;
    }
    }
    return null;
  }

  /**
   * Get alternative tasks for weather-affected tasks using real operational data and inventory
   */
  private async getAlternativeTasks(taskType: string): Promise<string[]> {
    try {
      // Get real indoor tasks from operational data
      const allTasks = await this.operationalData.getAllTasks();
      const indoorTasks = allTasks
        .filter(task => task.category && 
          (task.category.toLowerCase().includes('indoor') || 
           task.category.toLowerCase().includes('maintenance') ||
           task.category.toLowerCase().includes('cleaning')))
        .map(task => task.title)
        .filter((title, index, self) => self.indexOf(title) === index)
        .filter((title): title is string => title !== undefined)
        .slice(0, 3); // Limit to 3 alternatives

      // Get available inventory for indoor tasks
      const availableInventory = await this.inventoryService.getAvailableItems();
      const indoorEquipment = availableInventory
        .filter(item => item.category && 
          (item.category.toLowerCase().includes('cleaning') ||
           item.category.toLowerCase().includes('maintenance') ||
           item.category.toLowerCase().includes('safety')))
        .map(item => `Use ${item.name} for indoor maintenance`)
        .filter((equipment): equipment is string => equipment !== undefined)
        .slice(0, 2);

      const combinedTasks = [...indoorTasks, ...indoorEquipment];
      
      if (combinedTasks.length > 0) {
        return combinedTasks;
      }
    } catch (error) {
      console.error('Failed to get alternative tasks from operational data:', error);
    }

    // Fallback to predefined alternatives
    const alternatives: { [key: string]: string[] } = {
      'sidewalk': ['Indoor cleaning', 'Equipment maintenance', 'Inventory check'],
      'trash': ['Indoor cleaning', 'Equipment maintenance', 'Documentation'],
      'outdoor': ['Indoor cleaning', 'Equipment maintenance', 'Training'],
      'roof': ['Indoor maintenance', 'Equipment check', 'Safety inspection']
    };

    for (const [keyword, tasks] of Object.entries(alternatives)) {
      if (taskType.toLowerCase().includes(keyword)) {
        return tasks;
      }
    }

    return ['Indoor cleaning', 'Equipment maintenance', 'Documentation'];
  }

  /**
   * Get weather recommendations
   */
  private getWeatherRecommendations(weatherData: any): string[] {
    const recommendations: string[] = [];
    const temp = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;
    const weatherCode = weatherData.weather[0].id;

    if (temp < 40) {
      recommendations.push('Dress warmly and use cold weather gear');
    }
    if (temp > 80) {
      recommendations.push('Stay hydrated and take frequent breaks');
    }
    if (windSpeed > 10) {
      recommendations.push('Secure loose items and use extra caution');
    }
    if (weatherCode >= 500) {
      recommendations.push('Use appropriate rain gear');
    }

    return recommendations;
  }

  /**
   * Get weather-based equipment recommendations
   * Focuses on drains, rain mats, and curb clearing based on weather conditions
   */
  public async getWeatherEquipmentRecommendations(weather?: WeatherForecast | WeatherSnapshot): Promise<{
    equipment: string[];
    tasks: string[];
    timing: string[];
    safety: string[];
  }> {
    const currentWeather = weather || await this.getCurrentWeather();
    const recommendations = {
      equipment: [] as string[],
      tasks: [] as string[],
      timing: [] as string[],
      safety: [] as string[]
    };

    // Check for rain conditions
    const isRaining = currentWeather.weatherCode >= 61 && currentWeather.weatherCode <= 67;
    const isHeavyRain = currentWeather.weatherCode >= 65;
    const hasPrecipitation = 'precipitation' in currentWeather ? currentWeather.precipitation.amount > 0 : false;

    // Pre-rain preparations
    if (isRaining || hasPrecipitation) {
      recommendations.equipment.push('Rain mats', 'Drain covers', 'Waterproof gear');
      recommendations.tasks.push('Check all drains before rain', 'Put out rain mats at entrances', 'Clear curbs of debris');
      recommendations.timing.push('Complete before rain starts', 'Monitor weather forecast');
      recommendations.safety.push('Use non-slip footwear', 'Ensure proper drainage');
    }

    // Post-rain cleanup
    if (isRaining || hasPrecipitation) {
      recommendations.equipment.push('Squeegees', 'Mops', 'Drain cleaning tools');
      recommendations.tasks.push('Remove rain mats after rain stops', 'Clear clogged drains', 'Sweep curbs and sidewalks');
      recommendations.timing.push('Complete within 2 hours after rain', 'Check for standing water');
      recommendations.safety.push('Watch for slippery surfaces', 'Check for debris in drains');
    }

    // Heavy rain specific recommendations
    if (isHeavyRain) {
      recommendations.equipment.push('Emergency drain covers', 'Sandbags', 'Water pumps');
      recommendations.tasks.push('Monitor drainage systems', 'Clear major debris from curbs', 'Check for flooding');
      recommendations.timing.push('Immediate action required', 'Continuous monitoring needed');
      recommendations.safety.push('Avoid flooded areas', 'Use proper safety equipment');
    }

    // Wind conditions affecting equipment
    if (currentWeather.windSpeed > 15) {
      recommendations.equipment.push('Sandbags for rain mats', 'Secure drain covers');
      recommendations.tasks.push('Secure all equipment', 'Check for loose debris');
      recommendations.safety.push('Secure loose items', 'Be cautious with equipment');
    }

    // Temperature considerations
    const temp = typeof currentWeather.temperature === 'number' ? 
      currentWeather.temperature : 
      currentWeather.temperature.average;
    if (temp < 32) {
      recommendations.equipment.push('Ice melt', 'Snow shovels', 'Anti-freeze for equipment');
      recommendations.tasks.push('Clear ice from drains', 'Remove snow from curbs', 'Check for frozen pipes');
      recommendations.timing.push('Complete before freezing', 'Monitor for ice formation');
      recommendations.safety.push('Use ice melt on slippery surfaces', 'Wear appropriate cold weather gear');
    }

    return recommendations;
  }

  /**
   * Get API health status
   */
  public async getHealthStatus(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    lastChecked: Date;
  }> {
    const startTime = Date.now();
    
    try {
      await this.getCurrentWeather();
      
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: true,
        responseTime,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }
}
