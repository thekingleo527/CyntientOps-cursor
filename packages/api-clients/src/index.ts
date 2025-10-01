/**
 * @cyntientops/api-clients
 * 
 * NYC API clients and external service integrations
 * Mirrors Swift API service architecture
 */

// NYC API Services
export { NYCAPIService, nycAPIService } from './nyc/NYCAPIService';
export { NYCComplianceService, nycComplianceService } from './nyc/NYCComplianceService';
export { NYCDataCoordinator, nycDataCoordinator } from './nyc/NYCDataCoordinator';
export { FDNYAPIClient, fdnyAPIClient } from './nyc/FDNYAPIClient';
export { Complaints311APIClient, complaints311APIClient } from './nyc/Complaints311APIClient';
export { DOFAPIClient, dofAPIClient } from './nyc/DOFAPIClient';

// Weather API Client
export { WeatherAPIClient } from './weather/WeatherAPIClient';

// QuickBooks API Client
export { QuickBooksAPIClient, DEFAULT_QUICKBOOKS_CREDENTIALS } from './quickbooks/QuickBooksAPIClient';

// Property Value Service
export { PropertyValueService, propertyValueService } from './property/PropertyValueService';

// NYC API Types
export type { 
  HPDViolation, 
  DOBPermit, 
  DSNYRoute, 
  LL97Emission,
  NYCComplianceData,
  ComplianceSummary,
  CollectionScheduleSummary,
  // BuildingNYCData - commented out until implemented
} from './nyc/NYCDataModels';

// DSNY Violations Service
export { 
  DSNYViolationsService, 
  dsnyViolationsService,
  normalizeNYCAddress,
  fetchDSNYSummonsByAddress,
  generateDemoDSNYData
} from './nyc/DSNYViolationsService';
export type { 
  NormalizedAddress, 
  DSNYSummons, 
  DSNYViolationsResult 
} from './nyc/DSNYViolationsService';
export type { WeatherForecast, WeatherAlert, TaskWeatherAdjustment } from './weather/WeatherAPIClient';
export type { QuickBooksCredentials, QuickBooksEmployee, QuickBooksTimeEntry, QuickBooksPayrollData } from './quickbooks/QuickBooksAPIClient';
export type { BuildingPropertyValue, PropertyValueUpdateResult } from './property/PropertyValueService';

// API Configuration
export interface APIConfiguration {
  dsnyApiKey: string;
  hpdApiKey: string;
  dobApiKey: string;
  weatherApiKey: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  quickBooksCredentials?: any; // QuickBooksCredentials
}

// Import actual API clients
import { HPDAPIClient } from './nyc/HPDAPIClient';
import { DOBAPIClient } from './nyc/DOBAPIClient';
import { DSNYAPIClient } from './nyc/DSNYAPIClient';
import { WeatherAPIClient } from './weather/WeatherAPIClient';
import { QuickBooksAPIClient } from './quickbooks/QuickBooksAPIClient';

// API Client Manager
export class APIClientManager {
  private static instance: APIClientManager;

  public readonly nyc: NYCAPIService;
  public readonly nycCompliance: NYCComplianceService;
  public readonly nycCoordinator: NYCDataCoordinator;
  public readonly hpd: HPDAPIClient;
  public readonly dob: DOBAPIClient;
  public readonly dsny: DSNYAPIClient;
  public readonly weather: WeatherAPIClient;
  public readonly quickBooks?: QuickBooksAPIClient;

  private constructor(config: APIConfiguration) {
    // Initialize real API clients
    this.nyc = nycAPIService;
    this.nycCompliance = nycComplianceService;
    this.nycCoordinator = nycDataCoordinator;
    this.hpd = new HPDAPIClient(config.hpdApiKey);
    this.dob = new DOBAPIClient(config.dobApiKey);
    this.dsny = new DSNYAPIClient(config.dsnyApiKey);
    this.weather = new WeatherAPIClient(
      config.weatherApiKey,
      config.weatherLatitude,
      config.weatherLongitude
    );

    if (config.quickBooksCredentials) {
      this.quickBooks = new QuickBooksAPIClient(config.quickBooksCredentials);
    }
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
      this.testNYCAPIs(),
      this.weather.getHealthStatus()
    ]);

    const results = healthChecks.map((result, index) => {
      const apiNames = ['NYC APIs', 'Weather'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${apiNames[index]}: ${result.value.isHealthy ? 'Healthy' : 'Unhealthy'}`);
        return { api: apiNames[index], healthy: result.value.isHealthy };
      } else {
        console.log(`❌ ${apiNames[index]}: Error`);
        return { api: apiNames[index], healthy: false };
      }
    });

    const healthyAPIs = results.filter(r => r.healthy).length;
    console.log(`📊 API Health: ${healthyAPIs}/${results.length} API groups healthy`);
  }

  /**
   * Test NYC APIs health
   */
  private async testNYCAPIs(): Promise<{ isHealthy: boolean; responseTime: number }> {
    const startTime = Date.now();
    try {
      // Test with a sample building ID
      const testBbl = '1001234001';
      await this.nyc.getHPDViolations(testBbl);
      const responseTime = Date.now() - startTime;
      return { isHealthy: true, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { isHealthy: false, responseTime };
    }
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
      this.testNYCAPIs(),
      this.weather.getHealthStatus()
    ]);

    const apiNames = ['NYC APIs', 'Weather'];
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
    critical: any[];
    warning: any[];
    info: any[];
    total: number;
    criticalCount: number;
  }> {
    try {
      const buildingIds = buildings.map(b => b.id);
      const alerts = await this.nycCoordinator.getComplianceAlerts(buildingIds);
      
      const allAlerts = [...alerts.critical, ...alerts.warning, ...alerts.info];
      
      return {
        critical: alerts.critical,
        warning: alerts.warning,
        info: alerts.info,
        total: allAlerts.length,
        criticalCount: alerts.critical.length
      };
    } catch (error) {
      console.error('Error getting compliance alerts:', error);
      return {
        critical: [],
        warning: [],
        info: [],
        total: 0,
        criticalCount: 0
      };
    }
  }

  /**
   * Get collection reminders from DSNY
   */
  public async getCollectionReminders(buildings: Array<{ id: string; address: string }>): Promise<any[]> {
    try {
      const buildingIds = buildings.map(b => b.id);
      const schedules = await this.nycCoordinator.getCollectionSchedules(buildingIds);
      return schedules;
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
