/**
 * 🏙️ NYC Service
 * Comprehensive NYC API integration wrapper
 */

import { BuildingService } from './BuildingService';
import { NYCAPIService, DSNYViolationsService, PropertyValueService } from '@cyntientops/api-clients';
import { Logger } from './LoggingService';

export class NYCService {
  private static instance: NYCService;
  private buildingService: BuildingService;
  private nycAPIService: NYCAPIService;
  private dsnyViolationsService: DSNYViolationsService;
  private propertyValueService: PropertyValueService;

  private constructor() {
    this.buildingService = new BuildingService();
    this.nycAPIService = new NYCAPIService();
    this.dsnyViolationsService = new DSNYViolationsService();
    this.propertyValueService = new PropertyValueService();
  }

  public static getInstance(): NYCService {
    if (!NYCService.instance) {
      NYCService.instance = new NYCService();
    }
    return NYCService.instance;
  }

  /**
   * Get HPD violations for a building
   */
  public async getHPDViolations(buildingId: string): Promise<any[]> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }
    
    try {
      return await this.nycAPIService.getHPDViolations(building.bbl);
    } catch (error) {
      console.error(`Failed to fetch HPD violations for building ${buildingId}:`, error);
      return [];
    }
  }

  /**
   * Get DOB permits for a building
   */
  public async getDOBPermits(buildingId: string): Promise<any[]> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }
    
    try {
      return await this.nycAPIService.getDOBPermits(building.bin);
    } catch (error) {
      console.error(`Failed to fetch DOB permits for building ${buildingId}:`, error);
      return [];
    }
  }

  /**
   * Get DSNY violations for a building
   */
  public async getDSNYViolations(buildingId: string): Promise<any> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }
    
    try {
      return await this.dsnyViolationsService.getViolationsForAddress(building.address);
    } catch (error) {
      console.error(`Failed to fetch DSNY violations for building ${buildingId}:`, error);
      return { isEmpty: true, summons: [] };
    }
  }

  /**
   * Get property value for a building
   */
  public async getPropertyValue(buildingId: string): Promise<any> {
    try {
      return await this.propertyValueService.getBuildingPropertyValue(buildingId);
    } catch (error) {
      console.error(`Failed to fetch property value for building ${buildingId}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive building data from all NYC APIs
   */
  public async getComprehensiveBuildingData(buildingId: string): Promise<any> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }
    
    try {
      return await this.nycAPIService.getBuildingComplianceData(
        building.bbl, 
        building.bin, 
        building.address
      );
    } catch (error) {
      console.error(`Failed to fetch comprehensive data for building ${buildingId}:`, error);
      return {
        bbl: building.bbl,
        violations: [],
        permits: [],
        emissions: [],
        dsnyViolations: { isEmpty: true, summons: [] },
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get LL97 emissions data for a building
   */
  public async getLL97Emissions(buildingId: string): Promise<any[]> {
    const building = this.buildingService.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }
    
    try {
      return await this.nycAPIService.getLL97Emissions(building.bbl);
    } catch (error) {
      console.error(`Failed to fetch LL97 emissions for building ${buildingId}:`, error);
      return [];
    }
  }

  /**
   * Get all NYC data for multiple buildings
   */
  public async getPortfolioNYCData(buildingIds: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    for (const buildingId of buildingIds) {
      try {
        const data = await this.getComprehensiveBuildingData(buildingId);
        results.set(buildingId, data);
      } catch (error) {
        console.error(`Failed to fetch NYC data for building ${buildingId}:`, error);
        results.set(buildingId, null);
      }
    }
    
    return results;
  }

  /**
   * Get NYC data summary for portfolio
   */
  public async getPortfolioNYCSummary(): Promise<{
    totalViolations: number;
    totalOutstandingFines: number;
    totalActivePermits: number;
    buildingsWithIssues: number;
    lastUpdated: Date;
  }> {
    const buildings = this.buildingService.getAllBuildings();
    const buildingIds = buildings.map(b => b.id);
    const portfolioData = await this.getPortfolioNYCData(buildingIds);
    
    let totalViolations = 0;
    let totalOutstandingFines = 0;
    let totalActivePermits = 0;
    let buildingsWithIssues = 0;
    
    for (const [buildingId, data] of portfolioData) {
      if (data) {
        totalViolations += data.violations.length;
        totalActivePermits += data.permits.length;
        
        if (data.dsnyViolations && !data.dsnyViolations.isEmpty) {
          const outstandingFines = data.dsnyViolations.summons.reduce((sum: number, s: any) => {
            return sum + (parseFloat(s.balance_due) || 0);
          }, 0);
          totalOutstandingFines += outstandingFines;
        }
        
        if (data.violations.length > 0 || (data.dsnyViolations && !data.dsnyViolations.isEmpty)) {
          buildingsWithIssues++;
        }
      }
    }
    
    return {
      totalViolations,
      totalOutstandingFines,
      totalActivePermits,
      buildingsWithIssues,
      lastUpdated: new Date()
    };
  }
}
