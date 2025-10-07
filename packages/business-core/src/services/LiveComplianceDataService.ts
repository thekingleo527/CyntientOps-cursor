/**
 * 🔴 LIVE COMPLIANCE DATA SERVICE
 * Purpose: Pull the absolute most updated compliance data for each location
 * Features: Real-time API polling, live data streaming, immediate updates
 * Last Updated: October 4, 2025
 */

import { EventEmitter } from '../utils/EventEmitter';
import { ServiceContainer } from '../ServiceContainer';
import { NYCService } from './NYCService';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { NotificationManager } from '@cyntientops/managers';

export interface LiveComplianceData {
  buildingId: string;
  buildingName: string;
  address: string;
  lastUpdated: Date;
  dataSource: 'live_api' | 'cached' | 'streaming';
  
  // HPD Data
  hpd: {
    violations: number;
    criticalViolations: number;
    recentViolations: Array<{
      id: string;
      type: string;
      description: string;
      dateFound: Date;
      severity: 'critical' | 'high' | 'medium' | 'low';
      status: 'open' | 'resolved' | 'pending';
      penaltyAmount: number;
    }>;
    lastInspection: Date | null;
    nextInspection: Date | null;
  };
  
  // DOB Data
  dob: {
    violations: number;
    activePermits: number;
    expiredPermits: number;
    recentViolations: Array<{
      id: string;
      type: string;
      description: string;
      dateFound: Date;
      status: 'open' | 'resolved' | 'pending';
    }>;
    lastInspection: Date | null;
    nextInspection: Date | null;
  };
  
  // DSNY Data
  dsny: {
    violations: number;
    recentViolations: Array<{
      id: string;
      type: string;
      description: string;
      dateFound: Date;
      penaltyAmount: number;
      status: 'open' | 'resolved' | 'pending';
    }>;
    nextCollection: Date | null;
    collectionSchedule: string[];
  };
  
  // Overall Compliance
  compliance: {
    score: number;
    status: 'critical' | 'warning' | 'good' | 'excellent';
    totalViolations: number;
    outstandingFines: number;
    lastScoreUpdate: Date;
    trend: 'improving' | 'declining' | 'stable';
  };
  
  // Emergency Data
  emergency: {
    hasActiveEmergency: boolean;
    emergencyType: string | null;
    emergencyDate: Date | null;
    emergencyStatus: string | null;
  };
}

export interface LiveDataConfig {
  refreshInterval: number; // milliseconds
  maxRetries: number;
  timeout: number;
  buildings: Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export class LiveComplianceDataService extends EventEmitter {
  private container: ServiceContainer;
  private nycService: NYCService;
  private webSocketManager: WebSocketManager;
  private notificationManager: NotificationManager;
  private config: LiveDataConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private lastData: Map<string, LiveComplianceData> = new Map();
  private retryCount: Map<string, number> = new Map();

  constructor(container: ServiceContainer, config: LiveDataConfig) {
    super();
    this.container = container;
    this.nycService = container.nyc;
    this.webSocketManager = container.webSocket;
    this.notificationManager = container.notifications;
    this.config = config;
    
    this.setupWebSocketListeners();
  }

  /**
   * Start live data refresh
   */
  async startLiveRefresh(): Promise<void> {
    if (this.isRefreshing) {
      console.log('🔄 Live compliance data refresh already running');
      return;
    }

    console.log('🔴 Starting live compliance data refresh...');
    this.isRefreshing = true;

    // Start immediate refresh
    await this.refreshAllData();

    // Set up regular refresh
    this.refreshTimer = setInterval(async () => {
      await this.refreshAllData();
    }, this.config.refreshInterval);

    console.log('✅ Live compliance data refresh started');
  }

  /**
   * Stop live data refresh
   */
  stopLiveRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.isRefreshing = false;
    console.log('🛑 Live compliance data refresh stopped');
  }

  /**
   * Refresh all building data
   */
  private async refreshAllData(): Promise<void> {
    console.log('🔍 Refreshing live compliance data for all buildings...');
    
    const promises = this.config.buildings.map(async (building) => {
      try {
        await this.refreshBuildingData(building);
      } catch (error) {
        console.error(`❌ Error refreshing data for building ${building.id}:`, error);
        await this.handleRefreshError(building.id, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Live compliance data refresh completed');
  }

  /**
   * Refresh data for a specific building
   */
  private async refreshBuildingData(building: any): Promise<void> {
    console.log(`🔍 Refreshing data for ${building.name}...`);
    
    try {
      // Fetch all compliance data in parallel
      const [hpdData, dobData, dsnyData, emergencyData] = await Promise.all([
        this.fetchHPDData(building),
        this.fetchDOBData(building),
        this.fetchDSNYData(building),
        this.fetchEmergencyData(building)
      ]);

      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(hpdData, dobData, dsnyData);
      
      // Create live compliance data object
      const liveData: LiveComplianceData = {
        buildingId: building.id,
        buildingName: building.name,
        address: building.address,
        lastUpdated: new Date(),
        dataSource: 'live_api',
        
        hpd: hpdData,
        dob: dobData,
        dsny: dsnyData,
        
        compliance: {
          score: complianceScore,
          status: this.getComplianceStatus(complianceScore),
          totalViolations: hpdData.violations + dobData.violations + dsnyData.violations,
          outstandingFines: this.calculateOutstandingFines(hpdData, dobData, dsnyData),
          lastScoreUpdate: new Date(),
          trend: this.calculateTrend(building.id, complianceScore)
        },
        
        emergency: emergencyData
      };

      // Store data
      this.lastData.set(building.id, liveData);
      
      // Emit update event
      this.emit('dataUpdated', liveData);
      
      // Send WebSocket update
      await this.sendWebSocketUpdate(liveData);
      
      // Send push notification if critical
      if (complianceScore < 50) {
        await this.sendCriticalAlert(liveData);
      }
      
      console.log(`✅ Data refreshed for ${building.name} (Score: ${complianceScore})`);
      
    } catch (error) {
      console.error(`❌ Error refreshing data for ${building.name}:`, error);
      throw error;
    }
  }

  /**
   * Fetch HPD data
   */
  private async fetchHPDData(building: any): Promise<any> {
    try {
      const violations = await this.nycService.getHPDViolations(building.bbl);
      
      const recentViolations = violations
        .filter((v: any) => new Date(v.inspectiondate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        .map((v: any) => ({
          id: v.violationid,
          type: v.violationtype,
          description: v.novdescription,
          dateFound: new Date(v.inspectiondate),
          severity: this.getViolationSeverity(v.violationclass),
          status: v.isactive ? 'open' : 'resolved',
          penaltyAmount: 0
        }));

      return {
        violations: violations.filter((v: any) => v.isactive).length,
        criticalViolations: violations.filter((v: any) => v.isactive && v.violationclass === 'A').length,
        recentViolations,
        lastInspection: violations.length > 0 ? new Date(Math.max(...violations.map((v: any) => new Date(v.inspectiondate).getTime()))) : null,
        nextInspection: null // Would need to calculate based on inspection schedule
      };
    } catch (error) {
      console.error(`❌ Error fetching HPD data for ${building.name}:`, error);
      return {
        violations: 0,
        criticalViolations: 0,
        recentViolations: [],
        lastInspection: null,
        nextInspection: null
      };
    }
  }

  /**
   * Fetch DOB data
   */
  private async fetchDOBData(building: any): Promise<any> {
    try {
      const permits = await this.nycService.getDOBPermits(building.bin);
      
      const recentViolations = permits
        .filter((p: any) => p.job_status === 'Violation' && new Date(p.latest_action_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .map((p: any) => ({
          id: p.job_filing_number,
          type: p.job_type,
          description: p.job_description,
          dateFound: new Date(p.latest_action_date),
          status: 'open'
        }));

      return {
        violations: permits.filter((p: any) => p.job_status === 'Violation').length,
        activePermits: permits.filter((p: any) => p.job_status === 'ACTIVE').length,
        expiredPermits: permits.filter((p: any) => p.job_status === 'EXPIRED').length,
        recentViolations,
        lastInspection: permits.length > 0 ? new Date(Math.max(...permits.map((p: any) => new Date(p.latest_action_date).getTime()))) : null,
        nextInspection: null
      };
    } catch (error) {
      console.error(`❌ Error fetching DOB data for ${building.name}:`, error);
      return {
        violations: 0,
        activePermits: 0,
        expiredPermits: 0,
        recentViolations: [],
        lastInspection: null,
        nextInspection: null
      };
    }
  }

  /**
   * Fetch DSNY data
   */
  private async fetchDSNYData(building: any): Promise<any> {
    try {
      const violations = await this.nycService.getDSNYViolations(building.address);
      const schedule = await this.nycService.getDSNYCollectionSchedule(building.bin);
      
      const recentViolations = violations
        .filter((v: any) => new Date(v.violation_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .map((v: any) => ({
          id: v.ticket_number,
          type: v.violation_type,
          description: 'DSNY Violation',
          dateFound: new Date(v.violation_date),
          penaltyAmount: parseFloat(v.balance_due || '0'),
          status: 'open'
        }));

      return {
        violations: violations.length,
        recentViolations,
        nextCollection: schedule.nextCollection?.refuse || null,
        collectionSchedule: schedule.refuseDays || []
      };
    } catch (error) {
      console.error(`❌ Error fetching DSNY data for ${building.name}:`, error);
      return {
        violations: 0,
        recentViolations: [],
        nextCollection: null,
        collectionSchedule: []
      };
    }
  }

  /**
   * Fetch emergency data
   */
  private async fetchEmergencyData(building: any): Promise<any> {
    try {
      // This would integrate with emergency services APIs
      return {
        hasActiveEmergency: false,
        emergencyType: null,
        emergencyDate: null,
        emergencyStatus: null
      };
    } catch (error) {
      console.error(`❌ Error fetching emergency data for ${building.name}:`, error);
      return {
        hasActiveEmergency: false,
        emergencyType: null,
        emergencyDate: null,
        emergencyStatus: null
      };
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(hpdData: any, dobData: any, dsnyData: any): number {
    const totalViolations = hpdData.violations + dobData.violations + dsnyData.violations;
    const criticalViolations = hpdData.criticalViolations;
    
    // Base score calculation
    let score = 100;
    
    // Deduct for violations
    score -= totalViolations * 5;
    score -= criticalViolations * 10;
    
    // Ensure score doesn't go below 0
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get compliance status
   */
  private getComplianceStatus(score: number): 'critical' | 'warning' | 'good' | 'excellent' {
    if (score < 50) return 'critical';
    if (score < 70) return 'warning';
    if (score < 90) return 'good';
    return 'excellent';
  }

  /**
   * Calculate outstanding fines
   */
  private calculateOutstandingFines(hpdData: any, dobData: any, dsnyData: any): number {
    const hpdFines = hpdData.recentViolations.reduce((sum: number, v: any) => sum + (v.penaltyAmount || 0), 0);
    const dsnyFines = dsnyData.recentViolations.reduce((sum: number, v: any) => sum + (v.penaltyAmount || 0), 0);
    return hpdFines + dsnyFines;
  }

  /**
   * Calculate trend
   */
  private calculateTrend(buildingId: string, currentScore: number): 'improving' | 'declining' | 'stable' {
    const lastData = this.lastData.get(buildingId);
    if (!lastData) return 'stable';
    
    const scoreDiff = currentScore - lastData.compliance.score;
    if (scoreDiff > 5) return 'improving';
    if (scoreDiff < -5) return 'declining';
    return 'stable';
  }

  /**
   * Get violation severity
   */
  private getViolationSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity?.toLowerCase()) {
      case 'a': return 'critical';
      case 'b': return 'high';
      case 'c': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Send WebSocket update
   */
  private async sendWebSocketUpdate(data: LiveComplianceData): Promise<void> {
    try {
      const message = {
        id: `live_compliance_${data.buildingId}_${Date.now()}`,
        type: 'broadcast' as const,
        event: 'live_compliance_update',
        data,
        timestamp: new Date(),
        buildingId: data.buildingId
      };
      
      await this.webSocketManager.broadcast(JSON.stringify(message), 'compliance');
    } catch (error) {
      console.error('❌ Error sending WebSocket update:', error);
    }
  }

  /**
   * Send critical alert
   */
  private async sendCriticalAlert(data: LiveComplianceData): Promise<void> {
    try {
      const title = `🚨 CRITICAL: ${data.buildingName}`;
      const body = `Compliance score: ${data.compliance.score}% - ${data.compliance.totalViolations} violations`;
      
      await this.notificationManager.sendPushNotification('system', {
        title,
        body,
        type: 'task_assigned',
        priority: 'high',
        data: {
          buildingId: data.buildingId,
          complianceScore: data.compliance.score,
          totalViolations: data.compliance.totalViolations
        }
      });
    } catch (error) {
      console.error('❌ Error sending critical alert:', error);
    }
  }

  /**
   * Handle refresh error
   */
  private async handleRefreshError(buildingId: string, error: any): Promise<void> {
    const retryCount = this.retryCount.get(buildingId) || 0;
    
    if (retryCount < this.config.maxRetries) {
      this.retryCount.set(buildingId, retryCount + 1);
      console.log(`🔄 Retrying refresh for building ${buildingId} (attempt ${retryCount + 1})`);
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(async () => {
        try {
          const building = this.config.buildings.find(b => b.id === buildingId);
          if (building) {
            await this.refreshBuildingData(building);
          }
        } catch (retryError) {
          console.error(`❌ Retry failed for building ${buildingId}:`, retryError);
        }
      }, delay);
    } else {
      console.error(`❌ Max retries exceeded for building ${buildingId}`);
      this.retryCount.delete(buildingId);
    }
  }

  /**
   * Setup WebSocket listeners
   */
  private setupWebSocketListeners(): void {
    this.webSocketManager.on('live_compliance_update', (data: LiveComplianceData) => {
      console.log('📡 Received live compliance update:', data);
      this.emit('dataUpdated', data);
    });
  }

  /**
   * Get latest data for a building
   */
  getLatestData(buildingId: string): LiveComplianceData | null {
    return this.lastData.get(buildingId) || null;
  }

  /**
   * Get all latest data
   */
  getAllLatestData(): Map<string, LiveComplianceData> {
    return new Map(this.lastData);
  }

  /**
   * Force refresh for a specific building
   */
  async forceRefresh(buildingId: string): Promise<LiveComplianceData | null> {
    const building = this.config.buildings.find(b => b.id === buildingId);
    if (!building) {
      throw new Error(`Building ${buildingId} not found`);
    }

    try {
      await this.refreshBuildingData(building);
      return this.lastData.get(buildingId) || null;
    } catch (error) {
      console.error(`❌ Error force refreshing building ${buildingId}:`, error);
      throw error;
    }
  }
}