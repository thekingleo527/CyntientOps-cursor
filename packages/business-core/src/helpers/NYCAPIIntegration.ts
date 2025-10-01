/**
 * 🏙️ NYC API Integration Helpers
 * Utilities for testing and integrating NYC Open Data APIs
 * HPD, DOB, DSNY, FDNY, etc.
 */

import { Logger } from '../services/LoggingService';

export interface APITestResult {
  api: string;
  success: boolean;
  latency: number;
  recordCount?: number;
  error?: string;
  sampleData?: any;
}

export interface NYCAPIConfig {
  hpdApiKey?: string;
  dobApiKey?: string;
  dobSubscriberKey?: string;
  dsnyApiKey?: string;
  weatherApiKey?: string;
}

export class NYCAPIIntegration {
  private static instance: NYCAPIIntegration;
  private config: NYCAPIConfig = {};

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): NYCAPIIntegration {
    if (!NYCAPIIntegration.instance) {
      NYCAPIIntegration.instance = new NYCAPIIntegration();
    }
    return NYCAPIIntegration.instance;
  }

  /**
   * Load API keys from environment
   * NOTE: NYC Open Data APIs are PUBLIC - keys are optional
   * Without keys: ~1000 requests/day (shared pool)
   * With keys: 1000 requests/hour per app
   */
  private loadConfig() {
    this.config = {
      hpdApiKey: process.env.HPD_API_KEY,
      dobApiKey: process.env.DOB_API_KEY,
      dobSubscriberKey: process.env.DOB_SUBSCRIBER_KEY,
      dsnyApiKey: process.env.DSNY_API_KEY,
      weatherApiKey: process.env.WEATHER_API_KEY,
    };

    const hasAnyKey = !!(this.config.hpdApiKey || this.config.dobApiKey || this.config.dsnyApiKey);

    if (!hasAnyKey) {
      Logger.warn('NYC API keys not configured - using public access (lower rate limits)', {
        message: 'APIs will work but with ~1000 requests/day limit',
        docs: 'https://dev.socrata.com/docs/app-tokens.html'
      }, 'NYCAPIIntegration');
    }

    Logger.debug('NYC API configuration loaded', {
      hasHPD: !!this.config.hpdApiKey,
      hasDOB: !!this.config.dobApiKey,
      hasDSNY: !!this.config.dsnyApiKey,
      hasWeather: !!this.config.weatherApiKey,
      usingPublicAccess: !hasAnyKey,
    }, 'NYCAPIIntegration');
  }

  /**
   * Test HPD Violations API
   * Works with or without API key (public access)
   */
  async testHPDAPI(buildingId?: string): Promise<APITestResult> {
    const startTime = Date.now();

    try {
      const testBin = buildingId || '1001026'; // Test with a known BIN
      const url = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?bin=${testBin}&$limit=10`;

      const headers: Record<string, string> = {};
      if (this.config.hpdApiKey) {
        headers['X-App-Token'] = this.config.hpdApiKey;
      }

      const response = await fetch(url, { headers });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      Logger.info('HPD API test successful', {
        latency,
        recordCount: data.length,
      }, 'NYCAPIIntegration');

      return {
        api: 'HPD',
        success: true,
        latency,
        recordCount: data.length,
        sampleData: data[0],
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      Logger.error('HPD API test failed', error, 'NYCAPIIntegration');

      return {
        api: 'HPD',
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test DOB Violations API
   * Works with or without API key (public access)
   */
  async testDOBAPI(buildingId?: string): Promise<APITestResult> {
    const startTime = Date.now();

    try {
      const testBin = buildingId || '1001026';
      const url = `https://data.cityofnewyork.us/resource/3h2n-5cm9.json?bin=${testBin}&$limit=10`;

      const headers: Record<string, string> = {};
      if (this.config.dobApiKey) {
        headers['X-App-Token'] = this.config.dobApiKey;
      }

      const response = await fetch(url, { headers });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      Logger.info('DOB API test successful', {
        latency,
        recordCount: data.length,
      }, 'NYCAPIIntegration');

      return {
        api: 'DOB',
        success: true,
        latency,
        recordCount: data.length,
        sampleData: data[0],
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      Logger.error('DOB API test failed', error, 'NYCAPIIntegration');

      return {
        api: 'DOB',
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test DSNY Collection Schedule API
   * Works with or without API key (public access)
   */
  async testDSNYAPI(address?: string): Promise<APITestResult> {
    const startTime = Date.now();

    try {
      const testAddress = address || '120 Broadway, New York, NY';
      // Using DSNY Collection Schedule dataset
      const url = `https://data.cityofnewyork.us/resource/8rma-fjni.json?$limit=10`;

      const headers: Record<string, string> = {};
      if (this.config.dsnyApiKey) {
        headers['X-App-Token'] = this.config.dsnyApiKey;
      }

      const response = await fetch(url, { headers });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      Logger.info('DSNY API test successful', {
        latency,
        recordCount: data.length,
      }, 'NYCAPIIntegration');

      return {
        api: 'DSNY',
        success: true,
        latency,
        recordCount: data.length,
        sampleData: data[0],
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      Logger.error('DSNY API test failed', error, 'NYCAPIIntegration');

      return {
        api: 'DSNY',
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test all APIs and return comprehensive report
   */
  async testAllAPIs(buildingId?: string): Promise<APITestResult[]> {
    Logger.info('Testing all NYC APIs', { buildingId }, 'NYCAPIIntegration');

    const results = await Promise.all([
      this.testHPDAPI(buildingId),
      this.testDOBAPI(buildingId),
      this.testDSNYAPI(),
    ]);

    const successCount = results.filter((r) => r.success).length;
    const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);
    const avgLatency = totalLatency / results.length;

    Logger.info('NYC API test summary', {
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      avgLatency,
    }, 'NYCAPIIntegration');

    return results;
  }

  /**
   * Get API configuration status
   */
  getConfigStatus(): Record<string, boolean> {
    return {
      HPD: !!this.config.hpdApiKey,
      DOB: !!(this.config.dobApiKey && this.config.dobSubscriberKey),
      DSNY: !!this.config.dsnyApiKey,
      Weather: !!this.config.weatherApiKey,
    };
  }

  /**
   * Fetch violations for a building (production use)
   * Works with or without API key (public access)
   */
  async fetchBuildingViolations(
    buildingId: string,
    options?: {
      limit?: number;
      openOnly?: boolean;
    }
  ): Promise<{ data: any[]; error?: string }> {
    try {
      let url = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?bin=${buildingId}`;

      if (options?.limit) {
        url += `&$limit=${options.limit}`;
      }

      if (options?.openOnly) {
        url += `&violationstatus=Open`;
      }

      const headers: Record<string, string> = {};
      if (this.config.hpdApiKey) {
        headers['X-App-Token'] = this.config.hpdApiKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      Logger.info('Fetched violations', { buildingId, count: data.length }, 'NYCAPIIntegration');

      return { data };
    } catch (error) {
      Logger.error('Failed to fetch violations', error, 'NYCAPIIntegration');
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton
export const nycAPI = NYCAPIIntegration.getInstance();
