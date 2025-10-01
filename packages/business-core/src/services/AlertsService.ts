/**
 * 🚨 Alerts Service
 * Manages critical alerts and notifications
 */

import { OperationalDataService } from './OperationalDataService';
import { BuildingService } from './BuildingService';
import { WorkerService } from './WorkerService';
import { TaskService } from './TaskService';

export interface CriticalAlert {
  id: string;
  type: 'compliance' | 'safety' | 'maintenance' | 'violation' | 'task_overdue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  buildingId?: string;
  workerId?: string;
  taskId?: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class AlertsService {
  private static instance: AlertsService;
  private operationalDataService: OperationalDataService;
  private buildingService: BuildingService;
  private workerService: WorkerService;
  private taskService: TaskService;
  private alerts: CriticalAlert[] = [];

  private constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
    this.buildingService = new BuildingService();
    this.workerService = new WorkerService();
    this.taskService = new TaskService();
    this.initializeAlerts();
  }

  public static getInstance(): AlertsService {
    if (!AlertsService.instance) {
      AlertsService.instance = new AlertsService();
    }
    return AlertsService.instance;
  }

  /**
   * Initialize alerts based on current data
   */
  private initializeAlerts(): void {
    this.alerts = [];
    
    // Check for compliance violations
    this.checkComplianceAlerts();
    
    // Check for overdue tasks
    this.checkOverdueTasks();
    
    // Check for safety issues
    this.checkSafetyAlerts();
    
    // Check for maintenance needs
    this.checkMaintenanceAlerts();
  }

  /**
   * Get all critical alerts
   */
  public async getCriticalAlerts(): Promise<CriticalAlert[]> {
    // Refresh alerts
    this.initializeAlerts();
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get alerts by severity
   */
  public getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): CriticalAlert[] {
    return this.alerts.filter(alert => alert.severity === severity && !alert.resolved);
  }

  /**
   * Get alerts for a specific building
   */
  public getAlertsForBuilding(buildingId: string): CriticalAlert[] {
    return this.alerts.filter(alert => 
      alert.buildingId === buildingId && !alert.resolved
    );
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Check for compliance violations
   */
  private checkComplianceAlerts(): void {
    const buildings = this.buildingService.getAllBuildings();
    
    buildings.forEach(building => {
      // Check for low compliance scores
      if (building.compliance_score < 0.7) {
        this.alerts.push({
          id: `compliance-${building.id}`,
          type: 'compliance',
          severity: building.compliance_score < 0.5 ? 'critical' : 'high',
          title: `Low Compliance Score - ${building.name}`,
          description: `Building ${building.name} has a compliance score of ${(building.compliance_score * 100).toFixed(1)}%. Immediate attention required.`,
          buildingId: building.id,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }
      
      // Check for outstanding violations (if we have real violation data)
      if (building.dsnyViolations && building.dsnyViolations.outstanding > 1000) {
        this.alerts.push({
          id: `violation-${building.id}`,
          type: 'violation',
          severity: building.dsnyViolations.outstanding > 5000 ? 'critical' : 'high',
          title: `Outstanding Fines - ${building.name}`,
          description: `Building ${building.name} has $${building.dsnyViolations.outstanding.toLocaleString()} in outstanding DSNY fines.`,
          buildingId: building.id,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }
    });
  }

  /**
   * Check for overdue tasks
   */
  private checkOverdueTasks(): void {
    const tasks = this.taskService.getAllTasks();
    const now = new Date();
    
    tasks.forEach(task => {
      // Check if task is overdue based on estimated duration and start time
      if (!task.isCompleted && task.estimatedDuration) {
        // For routine tasks, check if they should have been completed by now
        const startTime = new Date();
        startTime.setHours(task.startHour || 6, 0, 0, 0);
        const estimatedEndTime = new Date(startTime.getTime() + (task.estimatedDuration * 60 * 1000));
        const hoursOverdue = (now.getTime() - estimatedEndTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursOverdue > 0) {
          this.alerts.push({
            id: `overdue-${task.id}`,
            type: 'task_overdue',
            severity: hoursOverdue > 24 ? 'high' : 'medium',
            title: `Overdue Task - ${task.title}`,
            description: `Task "${task.title}" is ${Math.round(hoursOverdue)} hours overdue.`,
            buildingId: task.buildingId,
            workerId: task.workerId,
            taskId: task.id,
            createdAt: new Date(),
            acknowledged: false,
            resolved: false
          });
        }
      }
    });
  }

  /**
   * Check for safety issues
   */
  private checkSafetyAlerts(): void {
    const buildings = this.buildingService.getAllBuildings();
    
    buildings.forEach(building => {
      // Check for buildings with critical violations
      if (building.dsnyViolations && building.dsnyViolations.defaulted > 0) {
        this.alerts.push({
          id: `safety-${building.id}`,
          type: 'safety',
          severity: 'critical',
          title: `Defaulted Violations - ${building.name}`,
          description: `Building ${building.name} has ${building.dsnyViolations.defaulted} defaulted violations requiring immediate attention.`,
          buildingId: building.id,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }
    });
  }

  /**
   * Check for maintenance needs
   */
  private checkMaintenanceAlerts(): void {
    const buildings = this.buildingService.getAllBuildings();
    
    buildings.forEach(building => {
      // Check for buildings with high permit activity (indicating ongoing work)
      if (building.dobPermits && building.dobPermits.active > 10) {
        this.alerts.push({
          id: `maintenance-${building.id}`,
          type: 'maintenance',
          severity: 'medium',
          title: `High Permit Activity - ${building.name}`,
          description: `Building ${building.name} has ${building.dobPermits.active} active permits. Monitor for completion.`,
          buildingId: building.id,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }
    });
  }

  /**
   * Create a new alert
   */
  public createAlert(alert: Omit<CriticalAlert, 'id' | 'createdAt' | 'acknowledged' | 'resolved'>): CriticalAlert {
    const newAlert: CriticalAlert = {
      ...alert,
      id: `${alert.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.push(newAlert);
    return newAlert;
  }

  /**
   * Get alert statistics
   */
  public getAlertStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    acknowledged: number;
    resolved: number;
  } {
    const total = this.alerts.length;
    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const acknowledged = this.alerts.filter(alert => alert.acknowledged).length;
    const resolved = this.alerts.filter(alert => alert.resolved).length;
    
    return {
      total,
      bySeverity,
      byType,
      acknowledged,
      resolved
    };
  }
}
