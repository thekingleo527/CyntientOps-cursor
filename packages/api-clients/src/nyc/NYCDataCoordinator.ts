// packages/api-clients/src/nyc/NYCDataCoordinator.ts

import { 
  NYCComplianceData, 
  ComplianceSummary, 
  CollectionScheduleSummary,
  DSNYRoute 
} from './NYCDataModels';
import { nycAPIService } from './NYCAPIService';
import { nycComplianceService } from './NYCComplianceService';

export interface BuildingNYCData {
  buildingId: string;
  buildingName: string;
  address: string;
  bbl: string;
  bin: string;
  complianceData: NYCComplianceData;
  complianceSummary: ComplianceSummary;
  collectionSchedule: CollectionScheduleSummary;
  lastUpdated: Date;
}

export interface NYCDataCoordinatorConfig {
  cacheTimeout: number; // milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export class NYCDataCoordinator {
  private apiService = nycAPIService;
  private complianceService = nycComplianceService;
  private config: NYCDataCoordinatorConfig;
  private dataCache: Map<string, BuildingNYCData> = new Map();
  private loadingPromises: Map<string, Promise<BuildingNYCData>> = new Map();

  constructor(config?: Partial<NYCDataCoordinatorConfig>) {
    this.config = {
      cacheTimeout: 300000, // 5 minutes
      batchSize: 10,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  // Load NYC data for a single building
  async loadBuildingNYCData(
    buildingId: string, 
    buildingName: string, 
    address: string
  ): Promise<BuildingNYCData> {
    // Check if already loading
    const loadingPromise = this.loadingPromises.get(buildingId);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Check cache
    const cached = this.dataCache.get(buildingId);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.config.cacheTimeout) {
      return cached;
    }

    // Start loading
    const loadingPromise_ = this.loadBuildingData(buildingId, buildingName, address);
    this.loadingPromises.set(buildingId, loadingPromise_);

    try {
      const result = await loadingPromise_;
      this.dataCache.set(buildingId, result);
      return result;
    } finally {
      this.loadingPromises.delete(buildingId);
    }
  }

  // Load NYC data for multiple buildings
  async loadMultipleBuildingsNYCData(
    buildings: Array<{ id: string; name: string; address: string }>
  ): Promise<BuildingNYCData[]> {
    const results: BuildingNYCData[] = [];
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < buildings.length; i += this.config.batchSize) {
      const batch = buildings.slice(i, i + this.config.batchSize);
      const batchPromises = batch.map(building => 
        this.loadBuildingNYCData(building.id, building.name, building.address)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + this.config.batchSize < buildings.length) {
        await this.delay(this.config.retryDelay);
      }
    }

    return results;
  }

  // Get compliance alerts for all buildings
  async getComplianceAlerts(buildingIds: string[]): Promise<{
    critical: BuildingNYCData[];
    warning: BuildingNYCData[];
    info: BuildingNYCData[];
  }> {
    const critical: BuildingNYCData[] = [];
    const warning: BuildingNYCData[] = [];
    const info: BuildingNYCData[] = [];

    try {
      // Get all building data
      const buildings = buildingIds.map(id => ({
        id,
        name: `Building ${id}`,
        address: `Address ${id}`,
      }));

      const buildingData = await this.loadMultipleBuildingsNYCData(buildings);

      // Categorize by compliance status
      buildingData.forEach(data => {
        if (data.complianceSummary.complianceStatus === 'critical') {
          critical.push(data);
        } else if (data.complianceSummary.complianceStatus === 'warning') {
          warning.push(data);
        } else {
          info.push(data);
        }
      });

      return { critical, warning, info };
    } catch (error) {
      console.error('Failed to get compliance alerts:', error);
      throw error;
    }
  }

  // Get collection schedules for all buildings
  async getCollectionSchedules(buildingIds: string[]): Promise<CollectionScheduleSummary[]> {
    try {
      const buildings = buildingIds.map(id => ({
        id,
        name: `Building ${id}`,
        address: `Address ${id}`,
      }));

      const buildingData = await this.loadMultipleBuildingsNYCData(buildings);
      return buildingData.map(data => data.collectionSchedule);
    } catch (error) {
      console.error('Failed to get collection schedules:', error);
      throw error;
    }
  }

  // Get upcoming collection dates
  async getUpcomingCollections(buildingIds: string[], days: number = 7): Promise<{
    regular: Array<{ buildingId: string; date: Date; day: string }>;
    recycling: Array<{ buildingId: string; date: Date; day: string }>;
    organics: Array<{ buildingId: string; date: Date; day: string }>;
    bulk: Array<{ buildingId: string; date: Date; day: string }>;
  }> {
    try {
      const schedules = await this.getCollectionSchedules(buildingIds);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      const regular: Array<{ buildingId: string; date: Date; day: string }> = [];
      const recycling: Array<{ buildingId: string; date: Date; day: string }> = [];
      const organics: Array<{ buildingId: string; date: Date; day: string }> = [];
      const bulk: Array<{ buildingId: string; date: Date; day: string }> = [];

      schedules.forEach((schedule, index) => {
        const buildingId = buildingIds[index];
        
        if (schedule.nextCollectionDate <= cutoffDate) {
          regular.push({
            buildingId,
            date: schedule.nextCollectionDate,
            day: schedule.regularCollectionDay,
          });
        }

        if (schedule.nextRecyclingDate <= cutoffDate) {
          recycling.push({
            buildingId,
            date: schedule.nextRecyclingDate,
            day: schedule.recyclingDay,
          });
        }

        if (schedule.nextOrganicsDate <= cutoffDate) {
          organics.push({
            buildingId,
            date: schedule.nextOrganicsDate,
            day: schedule.organicsDay,
          });
        }

        if (schedule.nextBulkPickupDate <= cutoffDate) {
          bulk.push({
            buildingId,
            date: schedule.nextBulkPickupDate,
            day: schedule.bulkPickupDay,
          });
        }
      });

      // Sort by date
      const sortByDate = (a: any, b: any) => a.date.getTime() - b.date.getTime();
      regular.sort(sortByDate);
      recycling.sort(sortByDate);
      organics.sort(sortByDate);
      bulk.sort(sortByDate);

      return { regular, recycling, organics, bulk };
    } catch (error) {
      console.error('Failed to get upcoming collections:', error);
      throw error;
    }
  }

  // Refresh data for a specific building
  async refreshBuildingData(buildingId: string): Promise<BuildingNYCData> {
    // Remove from cache to force refresh
    this.dataCache.delete(buildingId);
    
    // Get building info (would normally come from database)
    const buildingName = `Building ${buildingId}`;
    const address = `Address ${buildingId}`;
    
    return this.loadBuildingNYCData(buildingId, buildingName, address);
  }

  // Refresh all cached data
  async refreshAllData(): Promise<void> {
    this.dataCache.clear();
    this.loadingPromises.clear();
  }

  // Get cache statistics
  getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const keys = Array.from(this.dataCache.keys());
    const entries = Array.from(this.dataCache.values());
    
    const timestamps = entries.map(entry => entry.lastUpdated.getTime());
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);

    return {
      size: this.dataCache.size,
      keys,
      oldestEntry: entries.length > 0 ? new Date(oldestTimestamp) : null,
      newestEntry: entries.length > 0 ? new Date(newestTimestamp) : null,
    };
  }

  // Private method to load building data with retry logic
  private async loadBuildingData(
    buildingId: string, 
    buildingName: string, 
    address: string
  ): Promise<BuildingNYCData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const bbl = this.apiService.extractBBL(buildingId);
        const bin = this.apiService.extractBIN(buildingId);

        // Load all data in parallel
        const [complianceData, complianceSummary, collectionSchedule] = await Promise.all([
          this.apiService.getBuildingComplianceData(bbl),
          this.complianceService.generateComplianceSummary(bbl, buildingId, buildingName, address),
          this.apiService.getCollectionScheduleSummary(bin, buildingName, address),
        ]);

        return {
          buildingId,
          buildingName,
          address,
          bbl,
          bin,
          complianceData,
          complianceSummary,
          collectionSchedule,
          lastUpdated: new Date(),
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed for building ${buildingId}:`, error);
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error(`Failed to load data for building ${buildingId} after ${this.config.retryAttempts} attempts`);
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const nycDataCoordinator = new NYCDataCoordinator();
