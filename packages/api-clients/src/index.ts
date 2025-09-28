/**
 * @cyntientops/api-clients
 * 
 * NYC API clients and external service integrations
 * Mirrors Swift API service architecture
 */

// NYC API Clients
export { DSNYAPIClient } from './nyc/DSNYAPIClient';
export { HPDAPIClient } from './nyc/HPDAPIClient';
export { DOBAPIClient } from './nyc/DOBAPIClient';

// Weather API Client
export { WeatherAPIClient } from './weather/WeatherAPIClient';

// API Client Types
export type { DSNYCollectionSchedule, DSNYRouteInfo } from './nyc/DSNYAPIClient';
export type { HPDViolationDetails, HPDComplianceSummary, HPDInspectionResult } from './nyc/HPDAPIClient';
export type { DOBPermitDetails, DOBInspectionDetails, DOBComplianceSummary, DOBWorkType } from './nyc/DOBAPIClient';
export type { WeatherForecast, WeatherAlert, TaskWeatherAdjustment } from './weather/WeatherAPIClient';

// API Configuration
export interface APIConfiguration {
  dsnyApiKey: string;
  hpdApiKey: string;
  dobApiKey: string;
  weatherApiKey: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
}

// API Client Manager
export class APIClientManager {
  private static instance: APIClientManager;
  
  public readonly dsny: DSNYAPIClient;
  public readonly hpd: HPDAPIClient;
  public readonly dob: DOBAPIClient;
  public readonly weather: WeatherAPIClient;

  private constructor(config: APIConfiguration) {
    this.dsny = new DSNYAPIClient(config.dsnyApiKey);
    this.hpd = new HPDAPIClient(config.hpdApiKey);
    this.dob = new DOBAPIClient(config.dobApiKey);
    this.weather = new WeatherAPIClient(
      config.weatherApiKey,
      config.weatherLatitude,
      config.weatherLongitude
    );
  }

  public static getInstance(config?: APIConfiguration): APIClientManager {
    if (!APIClientManager.instance) {
      if (!config) {
        throw new Error('APIConfiguration required for first initialization');
      }
      APIClientManager.instance = new APIClientManager(config);
    }
    return APIClientManager.instance;
  }

  /**
   * Initialize all API clients
   */
  public async initialize(): Promise<void> {
    console.log('🔗 Initializing API clients...');
    
    // Test all API connections
    const healthChecks = await Promise.allSettled([
      this.dsny.getHealthStatus(),
      this.hpd.getHealthStatus(),
      this.dob.getHealthStatus(),
      this.weather.getHealthStatus()
    ]);

    const results = healthChecks.map((result, index) => {
      const apiNames = ['DSNY', 'HPD', 'DOB', 'Weather'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${apiNames[index]} API: ${result.value.isHealthy ? 'Healthy' : 'Unhealthy'}`);
        return { api: apiNames[index], healthy: result.value.isHealthy };
      } else {
        console.log(`❌ ${apiNames[index]} API: Error`);
        return { api: apiNames[index], healthy: false };
      }
    });

    const healthyAPIs = results.filter(r => r.healthy).length;
    console.log(`📊 API Health: ${healthyAPIs}/${results.length} APIs healthy`);
  }

  /**
   * Get overall API health status
   */
  public async getHealthStatus(): Promise<{
    overall: boolean;
    apis: Array<{
      name: string;
      healthy: boolean;
      responseTime: number;
    }>;
  }> {
    const healthChecks = await Promise.allSettled([
      this.dsny.getHealthStatus(),
      this.hpd.getHealthStatus(),
      this.dob.getHealthStatus(),
      this.weather.getHealthStatus()
    ]);

    const apiNames = ['DSNY', 'HPD', 'DOB', 'Weather'];
    const apis = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          name: apiNames[index],
          healthy: result.value.isHealthy,
          responseTime: result.value.responseTime
        };
      } else {
        return {
          name: apiNames[index],
          healthy: false,
          responseTime: 0
        };
      }
    });

    const overall = apis.every(api => api.healthy);

    return {
      overall,
      apis
    };
  }

  /**
   * Get compliance alerts from all NYC APIs
   */
  public async getComplianceAlerts(buildings: Array<{ id: string; address: string }>): Promise<{
    hpd: any[];
    dob: any[];
    total: number;
    critical: number;
  }> {
    const [hpdAlerts, dobAlerts] = await Promise.allSettled([
      this.hpd.getComplianceAlerts(buildings),
      this.dob.getPermitAlerts(buildings)
    ]);

    const hpd = hpdAlerts.status === 'fulfilled' ? hpdAlerts.value : [];
    const dob = dobAlerts.status === 'fulfilled' ? dobAlerts.value : [];

    const allAlerts = [...hpd, ...dob];
    const critical = allAlerts.filter(alert => alert.alertType === 'critical').length;

    return {
      hpd,
      dob,
      total: allAlerts.length,
      critical
    };
  }

  /**
   * Get collection reminders from DSNY
   */
  public async getCollectionReminders(buildings: Array<{ id: string; address: string }>): Promise<any[]> {
    try {
      return await this.dsny.getCollectionReminders(buildings);
    } catch (error) {
      console.error('Error getting collection reminders:', error);
      return [];
    }
  }

  /**
   * Get weather impact for tasks
   */
  public async getWeatherImpactForTasks(
    tasks: Array<{ id: string; schedule: Date; type: string }>
  ): Promise<any> {
    try {
      return await this.weather.getWeatherImpactSummary(tasks);
    } catch (error) {
      console.error('Error getting weather impact:', error);
      return {
        totalTasks: tasks.length,
        affectedTasks: 0,
        rescheduledTasks: 0,
        highRiskTasks: 0,
        recommendations: []
      };
    }
  }
}

// Default export
export default APIClientManager;
