/**
 * 📊 COMPLIANCE MONITORING DASHBOARD
 * Purpose: Automated compliance monitoring dashboard with real-time updates
 * Features: Live data visualization, alert management, trend analysis
 * Last Updated: October 4, 2025
 */

import { EventEmitter } from '../utils/EventEmitter';
import { ServiceContainer } from '../ServiceContainer';
import { LiveComplianceDataService, LiveComplianceData } from './LiveComplianceDataService';
import { RealTimeComplianceService } from './RealTimeComplianceService';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { NotificationManager } from '@cyntientops/managers';

export interface ComplianceDashboardData {
  timestamp: Date;
  buildings: Map<string, LiveComplianceData>;
  portfolioMetrics: {
    totalBuildings: number;
    averageScore: number;
    criticalBuildings: number;
    totalViolations: number;
    totalFines: number;
    lastUpdate: Date;
  };
  alerts: Array<{
    id: string;
    buildingId: string;
    buildingName: string;
    type: 'critical_score' | 'new_violation' | 'overdue_inspection' | 'emergency';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>;
  trends: {
    scoreTrend: 'improving' | 'declining' | 'stable';
    violationTrend: 'increasing' | 'decreasing' | 'stable';
    complianceTrend: 'improving' | 'declining' | 'stable';
  };
}

export interface DashboardConfig {
  refreshInterval: number;
  alertThresholds: {
    criticalScore: number;
    highViolations: number;
    overdueInspection: number;
  };
  buildings: Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export class ComplianceMonitoringDashboard extends EventEmitter {
  private container: ServiceContainer;
  private liveDataService: LiveComplianceDataService;
  private realTimeService: RealTimeComplianceService;
  private webSocketManager: WebSocketManager;
  private notificationManager: NotificationManager;
  private config: DashboardConfig;
  private dashboardData: ComplianceDashboardData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(container: ServiceContainer, config: DashboardConfig) {
    super();
    this.container = container;
    this.liveDataService = new LiveComplianceDataService(container, {
      refreshInterval: config.refreshInterval,
      maxRetries: 3,
      timeout: 10000,
      buildings: config.buildings
    });
    this.realTimeService = new RealTimeComplianceService(container, {
      pollingInterval: config.refreshInterval,
      webSocketEnabled: true,
      pushNotificationsEnabled: true,
      buildingIds: config.buildings.map(b => b.id),
      apiRateLimit: 100
    });
    this.webSocketManager = container.webSocket;
    this.notificationManager = container.notifications;
    this.config = config;
    
    this.setupEventListeners();
  }

  /**
   * Start the compliance monitoring dashboard
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Compliance monitoring dashboard already running');
      return;
    }

    console.log('🚀 Starting compliance monitoring dashboard...');
    this.isRunning = true;

    // Start live data service
    await this.liveDataService.startLiveRefresh();
    
    // Start real-time compliance service
    await this.realTimeService.startMonitoring();

    // Start dashboard refresh
    this.refreshTimer = setInterval(async () => {
      await this.refreshDashboard();
    }, this.config.refreshInterval);

    // Initial dashboard refresh
    await this.refreshDashboard();

    console.log('✅ Compliance monitoring dashboard started');
  }

  /**
   * Stop the compliance monitoring dashboard
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.liveDataService.stopLiveRefresh();
    this.realTimeService.stopMonitoring();
    
    this.isRunning = false;
    console.log('🛑 Compliance monitoring dashboard stopped');
  }

  /**
   * Refresh dashboard data
   */
  private async refreshDashboard(): Promise<void> {
    try {
      console.log('📊 Refreshing compliance monitoring dashboard...');
      
      const allData = this.liveDataService.getAllLatestData();
      const portfolioMetrics = this.calculatePortfolioMetrics(allData);
      const alerts = await this.generateAlerts(allData);
      const trends = this.calculateTrends(allData);
      
      this.dashboardData = {
        timestamp: new Date(),
        buildings: allData,
        portfolioMetrics,
        alerts,
        trends
      };

      // Emit dashboard update
      this.emit('dashboardUpdated', this.dashboardData);
      
      // Send WebSocket update
      await this.sendDashboardUpdate();
      
      console.log('✅ Compliance monitoring dashboard refreshed');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
    }
  }

  /**
   * Calculate portfolio metrics
   */
  private calculatePortfolioMetrics(buildings: Map<string, LiveComplianceData>): any {
    const buildingArray = Array.from(buildings.values());
    
    if (buildingArray.length === 0) {
      return {
        totalBuildings: 0,
        averageScore: 0,
        criticalBuildings: 0,
        totalViolations: 0,
        totalFines: 0,
        lastUpdate: new Date()
      };
    }

    const totalBuildings = buildingArray.length;
    const averageScore = buildingArray.reduce((sum, b) => sum + b.compliance.score, 0) / totalBuildings;
    const criticalBuildings = buildingArray.filter(b => b.compliance.score < 50).length;
    const totalViolations = buildingArray.reduce((sum, b) => sum + b.compliance.totalViolations, 0);
    const totalFines = buildingArray.reduce((sum, b) => sum + b.compliance.outstandingFines, 0);

    return {
      totalBuildings,
      averageScore: Math.round(averageScore * 100) / 100,
      criticalBuildings,
      totalViolations,
      totalFines,
      lastUpdate: new Date()
    };
  }

  /**
   * Generate alerts
   */
  private async generateAlerts(buildings: Map<string, LiveComplianceData>): Promise<any[]> {
    const alerts: any[] = [];
    
    for (const [buildingId, data] of buildings) {
      // Critical score alert
      if (data.compliance.score < this.config.alertThresholds.criticalScore) {
        alerts.push({
          id: `critical_score_${buildingId}_${Date.now()}`,
          buildingId,
          buildingName: data.buildingName,
          type: 'critical_score',
          severity: 'critical',
          message: `Critical compliance score: ${data.compliance.score}%`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // High violations alert
      if (data.compliance.totalViolations > this.config.alertThresholds.highViolations) {
        alerts.push({
          id: `high_violations_${buildingId}_${Date.now()}`,
          buildingId,
          buildingName: data.buildingName,
          type: 'new_violation',
          severity: 'high',
          message: `High violation count: ${data.compliance.totalViolations} violations`,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      // Overdue inspection alert
      if (data.hpd.lastInspection && this.isOverdueInspection(data.hpd.lastInspection)) {
        alerts.push({
          id: `overdue_inspection_${buildingId}_${Date.now()}`,
          buildingId,
          buildingName: data.buildingName,
          type: 'overdue_inspection',
          severity: 'medium',
          message: `Overdue HPD inspection: ${data.hpd.lastInspection.toDateString()}`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate trends
   */
  private calculateTrends(buildings: Map<string, LiveComplianceData>): any {
    const buildingArray = Array.from(buildings.values());
    
    if (buildingArray.length === 0) {
      return {
        scoreTrend: 'stable',
        violationTrend: 'stable',
        complianceTrend: 'stable'
      };
    }

    const improvingBuildings = buildingArray.filter(b => b.compliance.trend === 'improving').length;
    const decliningBuildings = buildingArray.filter(b => b.compliance.trend === 'declining').length;
    
    let scoreTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (improvingBuildings > decliningBuildings) scoreTrend = 'improving';
    else if (decliningBuildings > improvingBuildings) scoreTrend = 'declining';

    const totalViolations = buildingArray.reduce((sum, b) => sum + b.compliance.totalViolations, 0);
    const averageViolations = totalViolations / buildingArray.length;
    
    let violationTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (averageViolations > 10) violationTrend = 'increasing';
    else if (averageViolations < 5) violationTrend = 'decreasing';

    return {
      scoreTrend,
      violationTrend,
      complianceTrend: scoreTrend
    };
  }

  /**
   * Check if inspection is overdue
   */
  private isOverdueInspection(lastInspection: Date): boolean {
    const daysSinceInspection = (Date.now() - lastInspection.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceInspection > this.config.alertThresholds.overdueInspection;
  }

  /**
   * Send dashboard update via WebSocket
   */
  private async sendDashboardUpdate(): Promise<void> {
    try {
      if (!this.dashboardData) return;

      const message = {
        id: `dashboard_update_${Date.now()}`,
        type: 'broadcast' as const,
        event: 'compliance_dashboard_update',
        data: this.dashboardData,
        timestamp: new Date()
      };
      
      await this.webSocketManager.broadcast(JSON.stringify(message), 'dashboard');
    } catch (error) {
      console.error('❌ Error sending dashboard update:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.liveDataService.on('dataUpdated', (data: LiveComplianceData) => {
      console.log('📡 Live compliance data updated:', data.buildingName);
      this.emit('buildingUpdated', data);
    });

    this.realTimeService.on('complianceUpdate', (update: any) => {
      console.log('📡 Real-time compliance update:', update);
      this.emit('complianceUpdate', update);
    });

    this.webSocketManager.on('compliance_dashboard_update', (data: ComplianceDashboardData) => {
      console.log('📡 Received dashboard update:', data);
      this.emit('dashboardUpdated', data);
    });
  }

  /**
   * Get current dashboard data
   */
  getDashboardData(): ComplianceDashboardData | null {
    return this.dashboardData;
  }

  /**
   * Get building data
   */
  getBuildingData(buildingId: string): LiveComplianceData | null {
    return this.liveDataService.getLatestData(buildingId);
  }

  /**
   * Force refresh building data
   */
  async forceRefreshBuilding(buildingId: string): Promise<LiveComplianceData | null> {
    return await this.liveDataService.forceRefresh(buildingId);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    if (this.dashboardData) {
      const alert = this.dashboardData.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        this.emit('alertAcknowledged', alert);
      }
    }
  }

  /**
   * Get dashboard health status
   */
  getHealthStatus(): {
    isRunning: boolean;
    lastUpdate: Date | null;
    totalBuildings: number;
    criticalBuildings: number;
    activeAlerts: number;
  } {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.dashboardData?.timestamp || null,
      totalBuildings: this.dashboardData?.portfolioMetrics.totalBuildings || 0,
      criticalBuildings: this.dashboardData?.portfolioMetrics.criticalBuildings || 0,
      activeAlerts: this.dashboardData?.alerts.filter(a => !a.acknowledged).length || 0
    };
  }
}
