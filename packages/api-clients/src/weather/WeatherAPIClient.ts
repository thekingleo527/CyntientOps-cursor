/**
 * 🌤️ Weather API Client
 * Mirrors: CyntientOps/Services/Weather/WeatherService.swift
 * Purpose: Weather data for task scheduling and outdoor work adjustments
 */

import axios, { AxiosInstance } from 'axios';
import { WeatherSnapshot, OutdoorWorkRisk } from '@cyntientops/domain-schema';

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
  private apiKey: string;
  private baseURL: string = 'https://api.openweathermap.org/data/2.5';
  private client: AxiosInstance;
  private latitude: number = 40.7128; // NYC default
  private longitude: number = -74.0060; // NYC default

  constructor(apiKey: string, latitude?: number, longitude?: number) {
    this.apiKey = apiKey;
    if (latitude) this.latitude = latitude;
    if (longitude) this.longitude = longitude;
    
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
      const response = await this.client.get('/weather', {
        params: {
          lat: this.latitude,
          lon: this.longitude,
          appid: this.apiKey,
          units: 'imperial'
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
          lat: this.latitude,
          lon: this.longitude,
          appid: this.apiKey,
          units: 'imperial'
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
    try {
      // Note: OpenWeatherMap doesn't have alerts in free tier
      // This would typically integrate with National Weather Service API
      // For now, return empty array or mock data
      return [];
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      return [];
    }
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
    const isOutdoorTask = this.isOutdoorTask(taskType);
    
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
        
        alternativeTasks = this.getAlternativeTasks(taskType);
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
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  /**
   * Transform current weather API response
   */
  private transformCurrentWeather(data: any): WeatherSnapshot {
    return {
      timestamp: new Date(),
      temperature: Math.round(data.main.temp),
      weatherCode: data.weather[0].id,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      outdoorWorkRisk: this.calculateOutdoorWorkRisk(data)
    };
  }

  /**
   * Transform forecast API response
   */
  private transformForecast(data: any): WeatherForecast[] {
    const dailyForecasts: { [key: string]: any[] } = {};
    
    // Group forecasts by day
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = [];
      }
      dailyForecasts[dateKey].push(item);
    });

    // Create daily summaries
    return Object.entries(dailyForecasts).map(([dateKey, items]) => {
      const temperatures = items.map(item => item.main.temp);
      const weatherCodes = items.map(item => item.weather[0].id);
      const windSpeeds = items.map(item => item.wind.speed);
      const humidities = items.map(item => item.main.humidity);
      const precipitations = items.map(item => item.rain?.['3h'] || item.snow?.['3h'] || 0);

      return {
        date: new Date(dateKey),
        temperature: {
          min: Math.round(Math.min(...temperatures)),
          max: Math.round(Math.max(...temperatures)),
          average: Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length)
        },
        weatherCode: weatherCodes[0], // Use first weather code of the day
        description: items[0].weather[0].description,
        windSpeed: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length),
        humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
        precipitation: {
          probability: Math.round(items.reduce((sum, item) => sum + (item.pop || 0), 0) / items.length * 100),
          amount: Math.round(precipitations.reduce((a, b) => a + b, 0) * 10) / 10
        },
        outdoorWorkRisk: this.calculateOutdoorWorkRisk(items[0]),
        recommendations: this.getWeatherRecommendations(items[0])
      };
    });
  }

  /**
   * Calculate outdoor work risk from weather data
   */
  private calculateOutdoorWorkRisk(weatherData: any): OutdoorWorkRisk {
    const temperature = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;
    const weatherCode = weatherData.weather[0].id;
    const precipitation = weatherData.rain?.['3h'] || weatherData.snow?.['3h'] || 0;

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
    const temp = 'temperature' in weather ? weather.temperature.average : weather.temperature;
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
   * Check if task type is outdoor work
   */
  private isOutdoorTask(taskType: string): boolean {
    const outdoorTasks = [
      'sidewalk', 'curb', 'trash', 'garbage', 'outdoor', 'exterior',
      'landscaping', 'parking', 'roof', 'drainage', 'hose', 'sweep'
    ];
    
    return outdoorTasks.some(keyword => 
      taskType.toLowerCase().includes(keyword)
    );
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
   * Get alternative tasks for weather-affected tasks
   */
  private getAlternativeTasks(taskType: string): string[] {
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
