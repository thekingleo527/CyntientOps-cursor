/**
 * 🗑️ DSNY API Client
 * Mirrors: CyntientOps/Services/NYC/DSNYAPIService.swift
 * Purpose: NYC Department of Sanitation collection schedules and routes
 */

import axios, { AxiosInstance } from 'axios';
import { DSNYRoute } from '@cyntientops/domain-schema';

export interface DSNYCollectionSchedule {
  buildingId: string;
  address: string;
  districtSection: string;
  refuseDays: string[];
  recyclingDays: string[];
  organicsDays: string[];
  bulkDays: string[];
  nextCollection: {
    refuse: Date | null;
    recycling: Date | null;
    organics: Date | null;
    bulk: Date | null;
  };
}

export interface DSNYRouteInfo {
  routeId: string;
  districtSection: string;
  collectionDays: string[];
  collectionType: 'refuse' | 'recycling' | 'organics' | 'bulk';
  estimatedTime: string;
}

export class DSNYAPIClient {
  private apiKey: string;
  private baseURL: string = 'https://data.cityofnewyork.us/resource';
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Public datasets do not require tokens; include only if present to raise limits
    if (this.apiKey) headers['X-App-Token'] = this.apiKey;
    this.client = axios.create({ baseURL: this.baseURL, headers, timeout: 10000 });
  }

  /**
   * Get collection schedule for a building address
   */
  public async getCollectionSchedule(address: string): Promise<DSNYCollectionSchedule | null> {
    try {
      const response = await this.client.get('/dsny-collection-schedules.json', {
        params: {
          address: address,
          $limit: 1
        }
      });

      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        return this.transformCollectionSchedule(data, address);
      }

      return null;
    } catch (error) {
      console.error('Error fetching DSNY collection schedule:', error);
      throw new Error('Failed to fetch collection schedule');
    }
  }

  /**
   * Get collection schedule by building ID
   */
  public async getCollectionScheduleByBuildingId(buildingId: string, address: string): Promise<DSNYCollectionSchedule | null> {
    const schedule = await this.getCollectionSchedule(address);
    if (schedule) {
      schedule.buildingId = buildingId;
    }
    return schedule;
  }

  /**
   * Get route information for a district section
   */
  public async getRouteInfo(districtSection: string): Promise<DSNYRouteInfo[]> {
    try {
      const response = await this.client.get('/dsny-routes.json', {
        params: {
          district_section: districtSection,
          $limit: 10
        }
      });

      return response.data.map((route: any) => this.transformRouteInfo(route));
    } catch (error) {
      console.error('Error fetching DSNY route info:', error);
      throw new Error('Failed to fetch route information');
    }
  }

  /**
   * Get next collection dates for a building
   */
  public async getNextCollectionDates(address: string): Promise<{
    refuse: Date | null;
    recycling: Date | null;
    organics: Date | null;
    bulk: Date | null;
  }> {
    const schedule = await this.getCollectionSchedule(address);
    if (!schedule) {
      return {
        refuse: null,
        recycling: null,
        organics: null,
        bulk: null
      };
    }

    return schedule.nextCollection;
  }

  /**
   * Check if collection is scheduled for today
   */
  public async isCollectionToday(address: string, collectionType: 'refuse' | 'recycling' | 'organics' | 'bulk'): Promise<boolean> {
    const schedule = await this.getCollectionSchedule(address);
    if (!schedule) return false;

    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    switch (collectionType) {
      case 'refuse':
        return schedule.refuseDays.includes(dayName);
      case 'recycling':
        return schedule.recyclingDays.includes(dayName);
      case 'organics':
        return schedule.organicsDays.includes(dayName);
      case 'bulk':
        return schedule.bulkDays.includes(dayName);
      default:
        return false;
    }
  }

  /**
   * Get collection reminders for all buildings
   */
  public async getCollectionReminders(buildings: Array<{ id: string; address: string }>): Promise<Array<{
    buildingId: string;
    address: string;
    collectionType: string;
    collectionDate: Date;
    isToday: boolean;
  }>> {
    const reminders: Array<{
      buildingId: string;
      address: string;
      collectionType: string;
      collectionDate: Date;
      isToday: boolean;
    }> = [];

    for (const building of buildings) {
      try {
        const schedule = await this.getCollectionSchedule(building.address);
        if (schedule) {
          const today = new Date();
          const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

          // Check each collection type
          const collectionTypes = [
            { type: 'refuse', days: schedule.refuseDays },
            { type: 'recycling', days: schedule.recyclingDays },
            { type: 'organics', days: schedule.organicsDays },
            { type: 'bulk', days: schedule.bulkDays }
          ];

          collectionTypes.forEach(({ type, days }) => {
            if (days.includes(dayName)) {
              reminders.push({
                buildingId: building.id,
                address: building.address,
                collectionType: type,
                collectionDate: today,
                isToday: true
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error getting collection reminder for ${building.address}:`, error);
      }
    }

    return reminders;
  }

  /**
   * Transform raw API data to DSNYCollectionSchedule
   */
  private transformCollectionSchedule(data: any, address: string): DSNYCollectionSchedule {
    const today = new Date();
    
    return {
      buildingId: '', // Will be set by caller
      address,
      districtSection: data.district_section || '',
      refuseDays: this.parseCollectionDays(data.refuse_days),
      recyclingDays: this.parseCollectionDays(data.recycling_days),
      organicsDays: this.parseCollectionDays(data.organics_days),
      bulkDays: this.parseCollectionDays(data.bulk_days),
      nextCollection: {
        refuse: this.calculateNextCollection(data.refuse_days, today),
        recycling: this.calculateNextCollection(data.recycling_days, today),
        organics: this.calculateNextCollection(data.organics_days, today),
        bulk: this.calculateNextCollection(data.bulk_days, today)
      }
    };
  }

  /**
   * Transform raw API data to DSNYRouteInfo
   */
  private transformRouteInfo(data: any): DSNYRouteInfo {
    return {
      routeId: data.route_id || '',
      districtSection: data.district_section || '',
      collectionDays: this.parseCollectionDays(data.collection_days),
      collectionType: data.collection_type || 'refuse',
      estimatedTime: data.estimated_time || 'Morning'
    };
  }

  /**
   * Parse collection days string to array
   */
  private parseCollectionDays(daysString: string): string[] {
    if (!daysString) return [];
    
    return daysString.split(',').map(day => day.trim());
  }

  /**
   * Calculate next collection date
   */
  private calculateNextCollection(collectionDays: string, fromDate: Date): Date | null {
    if (!collectionDays) return null;

    const days = this.parseCollectionDays(collectionDays);
    if (days.length === 0) return null;

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const today = new Date(fromDate);
    const currentDay = today.getDay();

    // Find the next collection day
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkDay = checkDate.getDay();
      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });

      if (days.includes(dayName)) {
        return checkDate;
      }
    }

    return null;
  }

  /**
   * Create DSNYRoute from collection schedule
   */
  public createDSNYRoute(schedule: DSNYCollectionSchedule): DSNYRoute {
    return {
      routeId: `route-${schedule.buildingId}`,
      buildingId: schedule.buildingId,
      districtSection: schedule.districtSection,
      refuseDays: schedule.refuseDays.join(','),
      recyclingDays: schedule.recyclingDays.join(','),
      organicsDays: schedule.organicsDays.join(','),
      bulkDays: schedule.bulkDays.join(',')
    };
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
      await this.client.get('/dsny-collection-schedules.json', {
        params: { $limit: 1 }
      });
      
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
