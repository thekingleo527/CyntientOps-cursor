// packages/api-clients/src/nyc/NYCAPIService.ts

import { 
  HPDViolation, 
  DOBPermit, 
  DSNYRoute, 
  LL97Emission,
  DSNYViolation,
  NYCComplianceData 
} from './NYCDataModels';
import { dsnyViolationsService, DSNYViolationsResult } from './DSNYViolationsService';

export interface APIConfig {
  baseURL: string;
  timeout: number;
  rateLimitDelay: number;
}

export interface APIEndpoint {
  url: string;
  cacheKey: string;
  method: 'GET' | 'POST';
}

// Simple in-memory cache to avoid circular dependency
interface SimpleCache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
}

class InMemoryCache implements SimpleCache {
  private cache = new Map<string, { value: any; expires: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set<T>(key: string, value: T, ttl: number = 300000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }
}

export class NYCAPIService {
  private config: APIConfig;
  private cacheManager: SimpleCache;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestHistory: Array<{timestamp: number, endpoint: string}> = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly MAX_REQUESTS_PER_HOUR = 1000;

  // API keys from environment variables
  private readonly API_KEYS = {
    DSNY_API_TOKEN: process.env.DSNY_API_TOKEN || '',
    HPD_API_KEY: process.env.HPD_API_KEY || '',
    HPD_API_SECRET: process.env.HPD_API_SECRET || '',
    DOB_SUBSCRIBER_KEY: process.env.DOB_SUBSCRIBER_KEY || '',
    DOB_ACCESS_TOKEN: process.env.DOB_ACCESS_TOKEN || '',
  };

  private readonly API_CONFIG = {
    DSNY: {
      baseURL: "https://data.cityofnewyork.us/resource",
      timeout: 30000,
      rateLimitDelay: 1000, // 1 second between calls
    },
    HPD: {
      baseURL: "https://data.cityofnewyork.us/resource",
      timeout: 30000,
      rateLimitDelay: 3600,
    },
    DOB: {
      baseURL: "https://data.cityofnewyork.us/resource",
      timeout: 30000,
      rateLimitDelay: 3600,
    },
    LL97: {
      baseURL: "https://data.cityofnewyork.us/resource",
      timeout: 30000,
      rateLimitDelay: 3600,
    },
  };

  constructor(cacheManager?: SimpleCache) {
    this.config = {
      baseURL: "https://data.cityofnewyork.us/resource",
      timeout: 30000,
      rateLimitDelay: 1000,
    };
    this.cacheManager = cacheManager || new InMemoryCache();
  }

  // Input validation methods
  private validateBIN(bin: string): boolean {
    return /^\d{7}$/.test(bin);
  }

  private validateBBL(bbl: string): boolean {
    return /^\d{10}$/.test(bbl);
  }

  private validateAddress(address: string): boolean {
    return address && address.length >= 5 && address.length <= 200;
  }

  private sanitizeInput(input: string): string {
    return input.replace(/[<>"'&]/g, '');
  }

  // Rate limiting methods
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter(req => req.timestamp > oneHourAgo);

    // Check minute limit
    const recentRequests = this.requestHistory.filter(req => req.timestamp > oneMinuteAgo);
    if (recentRequests.length >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded: Too many requests per minute');
    }

    // Check hour limit
    if (this.requestHistory.length >= this.MAX_REQUESTS_PER_HOUR) {
      throw new Error('Rate limit exceeded: Too many requests per hour');
    }

    // Add current request to history
    this.requestHistory.push({ timestamp: now, endpoint: 'api_call' });
  }

  // Generic fetch method with caching, rate limiting, and validation
  async fetch<T>(endpoint: APIEndpoint): Promise<T> {
    // Validate endpoint
    if (!endpoint.url || !endpoint.cacheKey) {
      throw new Error('Invalid endpoint configuration');
    }

    // Check rate limits
    await this.checkRateLimit();

    // Check cache first
    const cached = await this.cacheManager.get<T>(endpoint.cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limiting delay
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.rateLimitDelay) {
      await this.delay(this.config.rateLimitDelay - timeSinceLastRequest);
    }

    try {
      // Validate URL
      const url = new URL(endpoint.url);
      if (!url.protocol.startsWith('https:')) {
        throw new Error('Only HTTPS URLs are allowed');
      }

      // Create a timeout signal for React Native compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'CyntientOps/1.0',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      // Cache the result
      await this.cacheManager.set(endpoint.cacheKey, data, 300000); // 5 minute cache

      this.lastRequestTime = Date.now();
      this.requestCount++;
      return data;
    } catch (error) {
      console.error('NYC API fetch error:', error);
      throw error;
    }
  }

  // DSNY Collection Schedule API (public dataset; no token required)
  async getDSNYCollectionSchedule(bin: string): Promise<DSNYRoute> {
    if (!this.validateBIN(bin)) {
      throw new Error('Invalid BIN format');
    }

    const sanitizedBin = this.sanitizeInput(bin);
    const endpoint: APIEndpoint = {
      // ebb7-mvp5 is the DSNY collection schedule dataset; adjust field names as needed
      url: `${this.API_CONFIG.DSNY.baseURL}/ebb7-mvp5.json?$where=bin='${sanitizedBin}'&$limit=1`,
      cacheKey: `dsny_${sanitizedBin}`,
      method: 'GET',
    };

    const result = await this.fetch<DSNYRoute[]>(endpoint);
    return result[0] || {} as DSNYRoute;
  }

  // HPD Violations API
  async getHPDViolations(bbl: string): Promise<HPDViolation[]> {
    if (!this.validateBBL(bbl)) {
      throw new Error('Invalid BBL format');
    }

    const sanitizedBBL = this.sanitizeInput(bbl);
    const endpoint: APIEndpoint = {
      url: `${this.API_CONFIG.HPD.baseURL}/wvxf-dwi5.json?$where=bbl='${sanitizedBBL}'&$limit=100`,
      cacheKey: `hpd_violations_${sanitizedBBL}`,
      method: 'GET',
    };

    return this.fetch<HPDViolation[]>(endpoint);
  }

  // DOB Permits API
  async getDOBPermits(bin: string): Promise<DOBPermit[]> {
    const endpoint: APIEndpoint = {
      url: `${this.API_CONFIG.DOB.baseURL}/ipu4-2q9a.json?$where=bin__='${bin}'&$limit=100`,
      cacheKey: `dob_permits_${bin}`,
      method: 'GET',
    };

    return this.fetch<DOBPermit[]>(endpoint);
  }

  // LL97 Emissions API (public dataset)
  async getLL97Emissions(bbl: string): Promise<LL97Emission[]> {
    const endpoint: APIEndpoint = {
      // 8vys-2eex is the LL97 emissions dataset id
      url: `${this.API_CONFIG.LL97.baseURL}/8vys-2eex.json?$where=bbl='${bbl}'`,
      cacheKey: `ll97_emissions_${bbl}`,
      method: 'GET',
    };

    return this.fetch<LL97Emission[]>(endpoint);
  }

  // DSNY Violations API (Sanitation Tickets)
  async getDSNYViolations(address: string): Promise<DSNYViolation[]> {
    const endpoint: APIEndpoint = {
      url: `${this.API_CONFIG.DSNY.baseURL}/rf9i-y2ch.json?$where=violation_location_street_name like '%${encodeURIComponent(address)}%'&$limit=100&$order=violation_date DESC`,
      cacheKey: `dsny_violations_${address}`,
      method: 'GET',
    };

    return this.fetch<DSNYViolation[]>(endpoint);
  }

  // Get DSNY violations by house number and street
  async getDSNYViolationsByAddress(houseNumber: string, streetName: string): Promise<DSNYViolation[]> {
    const endpoint: APIEndpoint = {
      url: `${this.API_CONFIG.DSNY.baseURL}/rf9i-y2ch.json?$where=violation_location_house='${houseNumber}' AND violation_location_street_name like '%${encodeURIComponent(streetName)}%'&$limit=100&$order=violation_date DESC`,
      cacheKey: `dsny_violations_${houseNumber}_${streetName}`,
      method: 'GET',
    };

    return this.fetch<DSNYViolation[]>(endpoint);
  }


  // Get comprehensive compliance data for a building
  async getBuildingComplianceData(bbl: string, bin: string, address?: string): Promise<NYCComplianceData> {
    try {
      const promises: [
        Promise<HPDViolation[]>,
        Promise<DOBPermit[]>,
        Promise<LL97Emission[]>,
        Promise<DSNYViolation[]>
      ] = [
        this.getHPDViolations(bbl),
        this.getDOBPermits(bin),
        this.getLL97Emissions(bbl),
        address ? this.getDSNYViolations(address) : Promise.resolve([])
      ];

      const [violations, permits, emissions, dsnyViolations] = await Promise.all(promises);

      return {
        bbl,
        violations,
        permits,
        emissions,
        dsnyViolations,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch compliance data for BBL:', bbl, error);
      throw error;
    }
  }

  // Extract BIN from internal building ID (mapping from Swift)
  extractBIN(buildingId: string): string {
    const binMap: Record<string, string> = {
      '1': '1001234', // 12 West 18th Street
      '3': '1001235', // 135 West 17th Street
      '4': '1001236', // 104 Franklin Street
      '5': '1001237', // 138 West 17th Street
      '6': '1001238', // 68 Perry Street
      '7': '1001239', // 112 West 18th Street
      '8': '1001240', // 41 Elizabeth Street
      '9': '1001241', // 117 West 17th Street
      '10': '1001242', // 131 Perry Street
      '11': '1001243', // 123 1st Avenue
      '13': '1001244', // 136 West 17th Street
      '14': '1001245', // Rubin Museum
      '15': '1001246', // 133 East 15th Street
      '16': '1001247', // Stuyvesant Cove Park
      '17': '1001248', // 178 Spring Street
      '18': '1001249', // 36 Walker Street
      '19': '1001250', // 115 7th Avenue
      '21': '1001251', // 148 Chambers Street
    };

    return binMap[buildingId] || '';
  }

  // Extract BBL from internal building ID (mapping from Swift)
  extractBBL(buildingId: string): string {
    const bblMap: Record<string, string> = {
      '1': '1001234001', // 12 West 18th Street
      '3': '1001235001', // 135 West 17th Street
      '4': '1001236001', // 104 Franklin Street
      '5': '1001237001', // 138 West 17th Street
      '6': '1001238001', // 68 Perry Street
      '7': '1001239001', // 112 West 18th Street
      '8': '1001240001', // 41 Elizabeth Street
      '9': '1001241001', // 117 West 17th Street
      '10': '1001242001', // 131 Perry Street
      '11': '1001243001', // 123 1st Avenue
      '13': '1001244001', // 136 West 17th Street
      '14': '1001245001', // Rubin Museum
      '15': '1001246001', // 133 East 15th Street
      '16': '1001247001', // Stuyvesant Cove Park
      '17': '1001248001', // 178 Spring Street
      '18': '1001249001', // 36 Walker Street
      '19': '1001250001', // 115 7th Avenue
      '21': '1001251001', // 148 Chambers Street
    };

    return bblMap[buildingId] || '';
  }

  // Extract district (default MN05 from Swift)
  extractDistrict(buildingId: string): string {
    return 'MN05'; // Manhattan Community District 5
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  // Get DSNY collection schedule for multiple buildings
  async getMultipleDSNYSchedules(bins: string[]): Promise<DSNYRoute[]> {
    const promises = bins.map(bin => this.getDSNYCollectionSchedule(bin));
    return Promise.all(promises);
  }

  // Get HPD violations with filters
  async getHPDViolationsWithFilters(filters: {
    bbl?: string;
    status?: string;
    violationClass?: string;
    limit?: number;
  }): Promise<HPDViolation[]> {
    let query = '';
    const conditions: string[] = [];

    if (filters.bbl) conditions.push(`bbl='${filters.bbl}'`);
    if (filters.status) conditions.push(`currentstatus='${filters.status}'`);
    if (filters.violationClass) conditions.push(`violationclass='${filters.violationClass}'`);

    if (conditions.length > 0) {
      query = `?$where=${conditions.join(' AND ')}`;
    }

    if (filters.limit) {
      query += query ? '&' : '?';
      query += `$limit=${filters.limit}`;
    }

    const endpoint: APIEndpoint = {
      url: `${this.API_CONFIG.HPD.baseURL}/hpd-violations.json${query}`,
      cacheKey: `hpd_violations_filtered_${JSON.stringify(filters)}`,
      method: 'GET',
    };

    return this.fetch<HPDViolation[]>(endpoint);
  }

  // Get DOB permits with filters
  async getDOBPermitsWithFilters(filters: {
    bbl?: string;
    jobType?: string;
    jobStatus?: string;
    limit?: number;
  }): Promise<DOBPermit[]> {
    let query = '';
    const conditions: string[] = [];

    if (filters.bbl) conditions.push(`bbl='${filters.bbl}'`);
    if (filters.jobType) conditions.push(`job_type='${filters.jobType}'`);
    if (filters.jobStatus) conditions.push(`job_status='${filters.jobStatus}'`);

    if (conditions.length > 0) {
      query = `?$where=${conditions.join(' AND ')}`;
    }

    if (filters.limit) {
      query += query ? '&' : '?';
      query += `$limit=${filters.limit}`;
    }

    const endpoint: APIEndpoint = {
      url: `${this.API_CONFIG.DOB.baseURL}/dob-permits.json${query}`,
      cacheKey: `dob_permits_filtered_${JSON.stringify(filters)}`,
      method: 'GET',
    };

    return this.fetch<DOBPermit[]>(endpoint);
  }

  // Get building compliance summary
  async getBuildingComplianceSummary(bbl: string): Promise<{
    totalViolations: number;
    openViolations: number;
    criticalViolations: number;
    recentPermits: number;
    activePermits: number;
    complianceStatus: 'compliant' | 'warning' | 'critical';
  }> {
    try {
      const [violations, permits] = await Promise.all([
        this.getHPDViolations(bbl),
        this.getDOBPermits(bbl),
      ]);

      const openViolations = violations.filter(v => 
        v.currentstatus === 'OPEN' || v.currentstatus === 'ACTIVE'
      ).length;

      const criticalViolations = violations.filter(v => 
        v.violationclass === 'A' || v.violationclass === 'B'
      ).length;

      const activePermits = permits.filter(p => 
        p.job_status === 'ACTIVE' || p.job_status === 'IN PROGRESS'
      ).length;

      const recentPermits = permits.filter(p => {
        const permitDate = new Date(p.job_status_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return permitDate > thirtyDaysAgo;
      }).length;

      let complianceStatus: 'compliant' | 'warning' | 'critical' = 'compliant';
      if (criticalViolations > 0) {
        complianceStatus = 'critical';
      } else if (openViolations > 5 || criticalViolations > 0) {
        complianceStatus = 'warning';
      }

      return {
        totalViolations: violations.length,
        openViolations,
        criticalViolations,
        recentPermits,
        activePermits,
        complianceStatus,
      };
    } catch (error) {
      console.error('Failed to get compliance summary for BBL:', bbl, error);
      throw error;
    }
  }

  // Get collection schedule summary for building
  async getCollectionScheduleSummary(bin: string, buildingName: string, address: string): Promise<{
    regularCollectionDay: string;
    recyclingDay: string;
    organicsDay: string;
    bulkPickupDay: string;
    nextCollectionDate: Date;
    nextRecyclingDate: Date;
    nextOrganicsDate: Date;
    nextBulkPickupDate: Date;
  }> {
    try {
      const schedule = await this.getDSNYCollectionSchedule(bin);
      
      // Calculate next collection dates (simplified - would need actual calendar logic)
      const today = new Date();
      const nextCollectionDate = new Date(today);
      const nextRecyclingDate = new Date(today);
      const nextOrganicsDate = new Date(today);
      const nextBulkPickupDate = new Date(today);

      // Add days based on collection day (simplified logic)
      const dayMap: Record<string, number> = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
        'Friday': 5, 'Saturday': 6, 'Sunday': 0
      };

      const collectionDay = dayMap[schedule.collection_day] || 1;
      const recyclingDay = dayMap[schedule.recycling_day] || 1;
      const organicsDay = dayMap[schedule.organics_day] || 1;
      const bulkDay = dayMap[schedule.bulk_pickup_day] || 1;

      // Calculate next occurrence of each day
      const daysUntilCollection = (collectionDay - today.getDay() + 7) % 7;
      const daysUntilRecycling = (recyclingDay - today.getDay() + 7) % 7;
      const daysUntilOrganics = (organicsDay - today.getDay() + 7) % 7;
      const daysUntilBulk = (bulkDay - today.getDay() + 7) % 7;

      nextCollectionDate.setDate(today.getDate() + (daysUntilCollection || 7));
      nextRecyclingDate.setDate(today.getDate() + (daysUntilRecycling || 7));
      nextOrganicsDate.setDate(today.getDate() + (daysUntilOrganics || 7));
      nextBulkPickupDate.setDate(today.getDate() + (daysUntilBulk || 7));

      return {
        regularCollectionDay: schedule.collection_day || 'Monday',
        recyclingDay: schedule.recycling_day || 'Monday',
        organicsDay: schedule.organics_day || 'Monday',
        bulkPickupDay: schedule.bulk_pickup_day || 'Monday',
        nextCollectionDate,
        nextRecyclingDate,
        nextOrganicsDate,
        nextBulkPickupDate,
      };
    } catch (error) {
      console.error('Failed to get collection schedule summary for BIN:', bin, error);
      throw error;
    }
  }
}

// Export singleton instance with default in-memory cache
export const nycAPIService = new NYCAPIService();
