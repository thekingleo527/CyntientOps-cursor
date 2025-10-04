/**
 * 🔄 Real-Time Compliance Service
 * Purpose: Get the most recent compliance updates for buildings
 * Features: Real-time polling, WebSocket notifications, push alerts
 * Last Updated: October 4, 2025
 */

import { EventEmitter } from 'events';
import { ServiceContainer } from '../ServiceContainer';
import { NYCService } from './NYCService';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { NotificationManager } from '@cyntientops/managers';

export interface ComplianceUpdate {
  buildingId: string;
  buildingName: string;
  address: string;
  updateType: 'violation_added' | 'violation_resolved' | 'inspection_scheduled' | 'compliance_score_changed';
  timestamp: Date;
  details: {
    violationId?: string;
    violationType?: 'HPD' | 'DOB' | 'DSNY';
    severity?: 'critical' | 'high' | 'medium' | 'low';
    description?: string;
    penaltyAmount?: number;
    inspectorName?: string;
    inspectionDate?: Date;
    oldScore?: number;
    newScore?: number;
  };
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface RealTimeComplianceConfig {
  pollingInterval: number; // milliseconds
  webSocketEnabled: boolean;
  pushNotificationsEnabled: boolean;
  buildingIds: string[];
  apiRateLimit: number; // requests per minute
}

export class RealTimeComplianceService extends EventEmitter {
  private container: ServiceContainer;
  private nycService: NYCService;
  private webSocketManager: WebSocketManager;
  private notificationManager: NotificationManager;
  private config: RealTimeComplianceConfig;
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastUpdateTimes: Map<string, Date> = new Map();
  private isPolling = false;

  constructor(container: ServiceContainer, config: RealTimeComplianceConfig) {
    super();
    this.container = container;
    this.nycService = container.nyc;
    this.webSocketManager = container.webSocket;
    this.notificationManager = container.notifications;
    this.config = config;
    
    this.setupWebSocketListeners();
    this.initializeLastUpdateTimes();
  }

  /**
   * Start real-time compliance monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isPolling) {
      console.log('Real-time compliance monitoring already running');
      return;
    }

    console.log('🔄 Starting real-time compliance monitoring...');
    this.isPolling = true;

    // Start polling immediately
    await this.pollComplianceUpdates();

    // Set up regular polling
    this.pollingTimer = setInterval(async () => {
      await this.pollComplianceUpdates();
    }, this.config.pollingInterval);

    // Enable WebSocket notifications if configured
    if (this.config.webSocketEnabled) {
      await this.setupWebSocketNotifications();
    }

    console.log('✅ Real-time compliance monitoring started');
  }

  /**
   * Stop real-time compliance monitoring
   */
  stopMonitoring(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling = false;
    console.log('🛑 Real-time compliance monitoring stopped');
  }

  /**
   * Poll for compliance updates from NYC APIs
   */
  private async pollComplianceUpdates(): Promise<void> {
    try {
      console.log('🔍 Polling for compliance updates...');
      
      for (const buildingId of this.config.buildingIds) {
        await this.checkBuildingCompliance(buildingId);
        
        // Respect rate limits
        await this.delay(1000 / (this.config.apiRateLimit / 60));
      }
    } catch (error) {
      console.error('❌ Error polling compliance updates:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check compliance for a specific building
   */
  private async checkBuildingCompliance(buildingId: string): Promise<void> {
    try {
      // Get building data
      const building = await this.getBuildingData(buildingId);
      if (!building) return;

      // Check for new HPD violations
      await this.checkHPDViolations(buildingId, building.address);
      
      // Check for new DOB violations
      await this.checkDOBViolations(buildingId, building.bin);
      
      // Check for new DSNY violations
      await this.checkDSNYViolations(buildingId, building.address);
      
      // Check for compliance score changes
      await this.checkComplianceScore(buildingId);
      
    } catch (error) {
      console.error(`❌ Error checking compliance for building ${buildingId}:`, error);
    }
  }

  /**
   * Check for new HPD violations
   */
  private async checkHPDViolations(buildingId: string, address: string): Promise<void> {
    try {
      const violations = await this.nycService.getHPDViolations(buildingId);
      const lastUpdate = this.lastUpdateTimes.get(`${buildingId}_hpd`);
      
      if (lastUpdate) {
        const newViolations = violations.filter(v => 
        new Date(v.inspectiondate) > lastUpdate
      );
        
        for (const violation of newViolations) {
          const update: ComplianceUpdate = {
            buildingId,
            buildingName: await this.getBuildingName(buildingId),
            address,
            updateType: 'violation_added',
            timestamp: new Date(),
            details: {
              violationId: violation.violationid,
              violationType: 'HPD',
              severity: this.getViolationSeverity(violation.violationclass),
              description: violation.novdescription,
              penaltyAmount: 0,
              inspectorName: 'Unknown'
            },
            priority: this.getViolationPriority(violation.violationclass)
          };
          
          await this.processComplianceUpdate(update);
        }
      }
      
      this.lastUpdateTimes.set(`${buildingId}_hpd`, new Date());
    } catch (error) {
      console.error(`❌ Error checking HPD violations for building ${buildingId}:`, error);
    }
  }

  /**
   * Check for new DOB violations
   */
  private async checkDOBViolations(buildingId: string, bin: string): Promise<void> {
    try {
      const permits = await this.nycService.getDOBPermits(bin);
      const lastUpdate = this.lastUpdateTimes.get(`${buildingId}_dob`);
      
      if (lastUpdate) {
        const newViolations = permits.filter(p => 
          p.job_status === 'Violation' && new Date(p.latest_action_date) > lastUpdate
        );
        
        for (const violation of newViolations) {
          const update: ComplianceUpdate = {
            buildingId,
            buildingName: await this.getBuildingName(buildingId),
            address: await this.getBuildingAddress(buildingId),
            updateType: 'violation_added',
            timestamp: new Date(),
            details: {
              violationId: violation.job_filing_number,
              violationType: 'DOB',
              severity: 'high',
              description: violation.job_type,
              penaltyAmount: 0
            },
            priority: 'high'
          };
          
          await this.processComplianceUpdate(update);
        }
      }
      
      this.lastUpdateTimes.set(`${buildingId}_dob`, new Date());
    } catch (error) {
      console.error(`❌ Error checking DOB violations for building ${buildingId}:`, error);
    }
  }

  /**
   * Check for new DSNY violations
   */
  private async checkDSNYViolations(buildingId: string, address: string): Promise<void> {
    try {
      const violations = await this.nycService.getDSNYViolations(address);
      const lastUpdate = this.lastUpdateTimes.get(`${buildingId}_dsny`);
      
      if (lastUpdate) {
        const newViolations = violations.filter((v: any) => 
          new Date(v.violation_date) > lastUpdate
        );
        
        for (const violation of newViolations) {
          const update: ComplianceUpdate = {
            buildingId,
            buildingName: await this.getBuildingName(buildingId),
            address,
            updateType: 'violation_added',
            timestamp: new Date(),
            details: {
              violationId: violation.ticket_number,
              violationType: 'DSNY',
              severity: 'medium',
              description: 'DSNY Violation',
              penaltyAmount: parseFloat(violation.balance_due || '0')
            },
            priority: 'medium'
          };
          
          await this.processComplianceUpdate(update);
        }
      }
      
      this.lastUpdateTimes.set(`${buildingId}_dsny`, new Date());
    } catch (error) {
      console.error(`❌ Error checking DSNY violations for building ${buildingId}:`, error);
    }
  }

  /**
   * Check for compliance score changes
   */
  private async checkComplianceScore(buildingId: string): Promise<void> {
    try {
      const currentScore = await this.calculateComplianceScore(buildingId);
      const lastScore = this.lastUpdateTimes.get(`${buildingId}_score`);
      
      if (lastScore && currentScore !== Number(lastScore)) {
        const update: ComplianceUpdate = {
          buildingId,
          buildingName: await this.getBuildingName(buildingId),
          address: await this.getBuildingAddress(buildingId),
          updateType: 'compliance_score_changed',
          timestamp: new Date(),
          details: {
            oldScore: Number(lastScore),
            newScore: currentScore
          },
          priority: currentScore < 50 ? 'urgent' : 'medium'
        };
        
        await this.processComplianceUpdate(update);
      }
      
      this.lastUpdateTimes.set(`${buildingId}_score`, new Date(currentScore));
    } catch (error) {
      console.error(`❌ Error checking compliance score for building ${buildingId}:`, error);
    }
  }

  /**
   * Process a compliance update
   */
  private async processComplianceUpdate(update: ComplianceUpdate): Promise<void> {
    console.log('📢 New compliance update:', update);
    
    // Emit event
    this.emit('complianceUpdate', update);
    
    // Send WebSocket notification
    if (this.config.webSocketEnabled) {
      await this.sendWebSocketNotification(update);
    }
    
    // Send push notification
    if (this.config.pushNotificationsEnabled) {
      await this.sendPushNotification(update);
    }
  }

  /**
   * Send WebSocket notification
   */
  private async sendWebSocketNotification(update: ComplianceUpdate): Promise<void> {
    try {
      const message = {
        id: `compliance_${update.buildingId}_${Date.now()}`,
        type: 'broadcast' as const,
        event: 'compliance_update',
        data: update,
        timestamp: new Date(),
        buildingId: update.buildingId
      };
      
      await this.webSocketManager.broadcast(JSON.stringify(message), 'compliance');
    } catch (error) {
      console.error('❌ Error sending WebSocket notification:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(update: ComplianceUpdate): Promise<void> {
    try {
      const title = this.getNotificationTitle(update);
      const body = this.getNotificationBody(update);
      
      await this.notificationManager.sendPushNotification('system', {
        title,
        body,
        type: 'task_assigned',
        priority: update.priority === 'urgent' ? 'high' : update.priority,
        data: {
          buildingId: update.buildingId,
          updateType: update.updateType,
          priority: update.priority
        }
      });
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  /**
   * Setup WebSocket listeners
   */
  private setupWebSocketListeners(): void {
    this.webSocketManager.on('compliance_update', (update: ComplianceUpdate) => {
      console.log('📡 Received WebSocket compliance update:', update);
      this.emit('complianceUpdate', update);
    });
  }

  /**
   * Setup WebSocket notifications
   */
  private async setupWebSocketNotifications(): Promise<void> {
    try {
      await this.webSocketManager.connect();
      console.log('🔌 WebSocket connected for compliance notifications');
    } catch (error) {
      console.error('❌ Error connecting WebSocket:', error);
    }
  }

  /**
   * Initialize last update times
   */
  private initializeLastUpdateTimes(): void {
    const now = new Date();
    for (const buildingId of this.config.buildingIds) {
      this.lastUpdateTimes.set(`${buildingId}_hpd`, now);
      this.lastUpdateTimes.set(`${buildingId}_dob`, now);
      this.lastUpdateTimes.set(`${buildingId}_dsny`, now);
      this.lastUpdateTimes.set(`${buildingId}_score`, now);
    }
  }

  /**
   * Get building data
   */
  private async getBuildingData(buildingId: string): Promise<any> {
    // Implementation would fetch from database or API
    return {
      id: buildingId,
      address: '68 Perry Street, New York, NY 10014',
      bin: '1001234'
    };
  }

  /**
   * Get building name
   */
  private async getBuildingName(buildingId: string): Promise<string> {
    return '68 Perry Street';
  }

  /**
   * Get building address
   */
  private async getBuildingAddress(buildingId: string): Promise<string> {
    return '68 Perry Street, New York, NY 10014';
  }

  /**
   * Calculate compliance score
   */
  private async calculateComplianceScore(buildingId: string): Promise<number> {
    // Implementation would calculate based on current violations
    return 45; // Current score for 68 Perry Street
  }

  /**
   * Get violation severity
   */
  private getViolationSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Get violation priority
   */
  private getViolationPriority(severity: string): 'urgent' | 'high' | 'medium' | 'low' {
    switch (severity.toLowerCase()) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(update: ComplianceUpdate): string {
    switch (update.updateType) {
      case 'violation_added':
        return `New ${update.details.violationType} Violation`;
      case 'violation_resolved':
        return `Violation Resolved`;
      case 'inspection_scheduled':
        return `Inspection Scheduled`;
      case 'compliance_score_changed':
        return `Compliance Score Updated`;
      default:
        return `Compliance Update`;
    }
  }

  /**
   * Get notification body
   */
  private getNotificationBody(update: ComplianceUpdate): string {
    switch (update.updateType) {
      case 'violation_added':
        return `${update.buildingName}: New ${update.details.violationType} violation - ${update.details.description}`;
      case 'violation_resolved':
        return `${update.buildingName}: Violation resolved`;
      case 'inspection_scheduled':
        return `${update.buildingName}: Inspection scheduled for ${update.details.inspectionDate}`;
      case 'compliance_score_changed':
        return `${update.buildingName}: Compliance score changed from ${update.details.oldScore} to ${update.details.newScore}`;
      default:
        return `${update.buildingName}: Compliance update`;
    }
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
