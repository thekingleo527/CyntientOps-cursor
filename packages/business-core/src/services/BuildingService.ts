
// Mock types to replace cross-package imports
export interface HPDViolation {
  id: string;
  buildingId: string;
  description: string;
  status: string;
  date: string;
}

export interface DOBPermit {
  id: string;
  buildingId: string;
  type: string;
  status: string;
  date: string;
}

export interface DSNYRoute {
  id: string;
  buildingId: string;
  route: string;
  schedule: string;
}

export interface LL97Emission {
  id: string;
  buildingId: string;
  emissions: number;
  year: number;
}

export class APIClientManager {
  static getInstance() { return new APIClientManager(); }
  async getData() { return null; }
}

export class NYCAPIService {
  static getInstance() { return new NYCAPIService(); }
  async getViolations() { return []; }
  async getPermits() { return []; }
}

export class DSNYViolationsService {
  static getInstance() { return new DSNYViolationsService(); }
  async getViolations() { return []; }
}

export class PropertyValueService {
  static getInstance() { return new PropertyValueService(); }
  async getPropertyValue() { return null; }
}

/**
 * 🏢 BuildingService
 * Mirrors: CyntientOps/Services/Building/BuildingService.swift
 * Purpose: Building management, compliance tracking, and metrics
 */

import { OperationalDataService } from './OperationalDataService';
import { WorkerService } from './WorkerService';
import { CanonicalIDs } from '@cyntientops/domain-schema';
import { BuildingMetrics, HPDViolation, DOBPermit, DSNYRoute } from '@cyntientops/domain-schema';

export interface BuildingComplianceStatus {
  buildingId: string;
  overallScore: number;
  hpdViolations: number;
  dobPermits: number;
  dsnyCompliance: boolean;
  lastInspection: Date | null;
  nextInspection: Date | null;
  criticalIssues: number;
}

export interface BuildingMaintenanceSchedule {
  buildingId: string;
  scheduledTasks: Array<{
    taskId: string;
    taskName: string;
    scheduledDate: Date;
    assignedWorker: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedDuration: number;
  }>;
  overdueTasks: number;
  upcomingTasks: number;
}

// // import { APIClientManager } from '@cyntientops/api-clients'; // Disabled for TypeScript compatibility
import { Logger } from './LoggingService';

// APIClientManager is already declared above

export class BuildingService {
  private operationalDataService: OperationalDataService;
  private workerService: WorkerService;
  private buildingMetrics: Map<string, BuildingMetrics> = new Map();
  private apiClients?: APIClientManager;

  constructor(apiClients?: APIClientManager) {
    this.operationalDataService = OperationalDataService.getInstance();
    this.workerService = new WorkerService();
    this.apiClients = apiClients;
  }

  /**
   * Get all buildings
   */
  public getBuildings(): any[] {
    return this.operationalDataService.getBuildings();
  }

  /**
   * Get all buildings (alias for compatibility)
   */
  public getAllBuildings(): any[] {
    return this.getBuildings();
  }

  /**
   * Get building by ID
   */
  public getBuildingById(buildingId: string): any | undefined {
    return this.operationalDataService.getBuildingById(buildingId);
  }

  /**
   * Get buildings by client
   */
  public getBuildingsByClient(clientId: string): any[] {
    return this.getBuildings().filter(building => building.client_id === clientId);
  }

  /**
   * Get buildings in a specific borough
   */
  public getBuildingsByBorough(borough: string): any[] {
    return this.getBuildings().filter(building => 
      building.borough?.toLowerCase() === borough.toLowerCase()
    );
  }

  /**
   * Get building metrics
   */
  public getBuildingMetrics(buildingId: string): BuildingMetrics {
    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }

    // Check if we have cached metrics
    const cached = this.buildingMetrics.get(buildingId);
    if (cached) {
      return cached;
    }

    // Generate new metrics
    const metrics = this.operationalDataService.getBuildingMetrics(buildingId);
    this.buildingMetrics.set(buildingId, metrics);
    return metrics;
  }

  /**
   * Get building compliance status
   */
  public async getBuildingComplianceStatus(buildingId: string): Promise<BuildingComplianceStatus> {
    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }

    const building = this.getBuildingById(buildingId);
    if (!building) {
      throw new Error('Building not found');
    }

    const metrics = this.getBuildingMetrics(buildingId);
    const tasks = this.operationalDataService.getTasksForBuilding(buildingId);
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date() > new Date(task.dueDate) && task.status !== 'Completed';
    });

    let hpdViolations = 0;
    let dobPermits = 0;
    let dsnyCompliance = false;

    if (this.apiClients) {
      try {
        const [violations, permits, dsny] = await Promise.all([
          this.getHPDViolations(buildingId),
          this.getDOBPermits(buildingId),
          this.getDSNYCompliance(buildingId)
        ]);

        hpdViolations = violations;
        dobPermits = permits;
        dsnyCompliance = dsny;
      } catch (error) {
        Logger.error('Failed to load compliance data for building:', undefined, 'BuildingService');
      }
    }

    return {
      buildingId,
      overallScore: building.compliance_score || 0.85,
      hpdViolations,
      dobPermits,
      dsnyCompliance,
      lastInspection: building.lastInspection ? new Date(building.lastInspection) : null,
      nextInspection: building.nextInspection ? new Date(building.nextInspection) : null,
      criticalIssues: overdueTasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length
    };
  }

  /**
   * Get building maintenance schedule
   */
  public getBuildingMaintenanceSchedule(buildingId: string): BuildingMaintenanceSchedule {
    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }

    const tasks = this.operationalDataService.getTasksForBuilding(buildingId);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const scheduledTasks = tasks.map(task => ({
      taskId: task.id,
      taskName: task.title,
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : now,
      assignedWorker: task.assignedWorker,
      priority: this.mapTaskPriority(task.priority || 'medium'),
      estimatedDuration: task.estimatedDuration || 60
    }));

    const overdueTasks = scheduledTasks.filter(task => 
      task.scheduledDate < now && task.priority !== 'low'
    ).length;

    const upcomingTasks = scheduledTasks.filter(task => 
      task.scheduledDate >= now && task.scheduledDate <= oneWeekFromNow
    ).length;

    return {
      buildingId,
      scheduledTasks,
      overdueTasks,
      upcomingTasks
    };
  }

  /**
   * Get workers assigned to building
   */
  public getWorkersForBuilding(buildingId: string): any[] {
    return this.workerService.getWorkersForBuilding(buildingId);
  }

  /**
   * Get active workers at building (currently clocked in)
   */
  public getActiveWorkersAtBuilding(buildingId: string): any[] {
    const workers = this.getWorkersForBuilding(buildingId);
    return workers.filter(worker => 
      worker.isClockedIn && worker.currentBuildingId === buildingId
    );
  }

  /**
   * Get building tasks
   */
  public getBuildingTasks(buildingId: string): any[] {
    return this.operationalDataService.getTasksForBuilding(buildingId);
  }

  /**
   * Get overdue tasks for building
   */
  public getOverdueTasks(buildingId: string): any[] {
    const tasks = this.getBuildingTasks(buildingId);
    const now = new Date();
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now && task.status !== 'Completed';
    });
  }

  /**
   * Get urgent tasks for building
   */
  public getUrgentTasks(buildingId: string): any[] {
    const tasks = this.getBuildingTasks(buildingId);
    return tasks.filter(task => 
      task.priority === 'high' || task.priority === 'urgent' || task.priority === 'critical'
    );
  }

  /**
   * Get building performance summary
   */
  public async getBuildingPerformanceSummary(buildingId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    urgentTasks: number;
    completionRate: number;
    averageTaskTime: number;
    activeWorkers: number;
    complianceScore: number;
  }> {
    const tasks = this.getBuildingTasks(buildingId);
    const metrics = this.getBuildingMetrics(buildingId);
    const overdueTasks = this.getOverdueTasks(buildingId);
    const urgentTasks = this.getUrgentTasks(buildingId);
    const activeWorkers = this.getActiveWorkersAtBuilding(buildingId).length;
    const compliance = await this.getBuildingComplianceStatus(buildingId);

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'Completed').length,
      overdueTasks: overdueTasks.length,
      urgentTasks: urgentTasks.length,
      completionRate: metrics.completionRate,
      averageTaskTime: metrics.averageTaskTime,
      activeWorkers,
      complianceScore: compliance.overallScore
    };
  }

  /**
   * Get buildings by compliance score range
   */
  public getBuildingsByComplianceScore(minScore: number, maxScore: number = 1.0): any[] {
    return this.getBuildings().filter(building => {
      const score = building.compliance_score || 0.85;
      return score >= minScore && score <= maxScore;
    });
  }

  /**
   * Get buildings needing attention (low compliance or many overdue tasks)
   */
  public async getBuildingsNeedingAttention(): Promise<Array<{
    building: any;
    issues: string[];
    priority: 'low' | 'medium' | 'high';
  }>> {
    const buildings = this.getBuildings();
    const buildingsWithIssues: Array<{
      building: any;
      issues: string[];
      priority: 'low' | 'medium' | 'high';
    }> = [];

    for (const building of buildings) {
      const issues: string[] = [];
      const compliance = await this.getBuildingComplianceStatus(building.id);
      const overdueTasks = this.getOverdueTasks(building.id);
      const urgentTasks = this.getUrgentTasks(building.id);

      if (compliance.overallScore < 0.8) {
        issues.push('Low compliance score');
      }

      if (overdueTasks.length > 5) {
        issues.push(`${overdueTasks.length} overdue tasks`);
      }

      if (urgentTasks.length > 0) {
        issues.push(`${urgentTasks.length} urgent tasks`);
      }

      if (compliance.criticalIssues > 0) {
        issues.push(`${compliance.criticalIssues} critical issues`);
      }

      if (issues.length > 0) {
        let priority: 'low' | 'medium' | 'high' = 'low';
        
        if (compliance.overallScore < 0.7 || urgentTasks.length > 0 || compliance.criticalIssues > 0) {
          priority = 'high';
        } else if (compliance.overallScore < 0.8 || overdueTasks.length > 3) {
          priority = 'medium';
        }

        buildingsWithIssues.push({
          building,
          issues,
          priority
        });
      }
    }

    // Sort by priority (high first)
    return buildingsWithIssues.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get building statistics
   */
  public getBuildingStatistics(): {
    totalBuildings: number;
    activeBuildings: number;
    averageComplianceScore: number;
    buildingsWithIssues: number;
    totalOverdueTasks: number;
    totalUrgentTasks: number;
  } {
    const buildings = this.getBuildings();
    const activeBuildings = buildings.filter(b => b.isActive).length;
    
    let totalComplianceScore = 0;
    let buildingsWithIssues = 0;
    let totalOverdueTasks = 0;
    let totalUrgentTasks = 0;

    buildings.forEach(building => {
      const compliance = building.compliance_score || 0.85;
      totalComplianceScore += compliance;

      const overdueTasks = this.getOverdueTasks(building.id);
      const urgentTasks = this.getUrgentTasks(building.id);

      totalOverdueTasks += overdueTasks.length;
      totalUrgentTasks += urgentTasks.length;

      if (compliance < 0.8 || overdueTasks.length > 0 || urgentTasks.length > 0) {
        buildingsWithIssues++;
      }
    });

    return {
      totalBuildings: buildings.length,
      activeBuildings,
      averageComplianceScore: buildings.length > 0 ? totalComplianceScore / buildings.length : 0,
      buildingsWithIssues,
      totalOverdueTasks,
      totalUrgentTasks
    };
  }

  /**
   * Map task priority to our priority enum
   */
  private mapTaskPriority(priority: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'critical':
      case 'emergency':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
      case 'normal':
        return 'medium';
      case 'low':
      default:
        return 'low';
    }
  }

  /**
   * Refresh building metrics cache
   */
  public refreshBuildingMetrics(buildingId: string): void {
    this.buildingMetrics.delete(buildingId);
    this.getBuildingMetrics(buildingId);
  }

  /**
   * Refresh all building metrics
   */
  public refreshAllBuildingMetrics(): void {
    this.buildingMetrics.clear();
    const buildings = this.getBuildings();
    buildings.forEach(building => {
      this.getBuildingMetrics(building.id);
    });
  }

  /**
   * Get HPD violations for a building
   */
  private async getHPDViolations(buildingId: string): Promise<number> {
    if (!this.apiClients) {
      Logger.warn('API clients not initialized, returning 0 violations', undefined, 'BuildingService');
      return 0;
    }

    try {
      const violations = await this.apiClients.hpd.getViolationsForBuilding(buildingId, '');
      return violations.filter(v => v.isActive).length;
    } catch (error) {
      Logger.error('Failed to get HPD violations:', undefined, 'BuildingService');
      return 0;
    }
  }

  /**
   * Get DOB permits for a building
   */
  private async getDOBPermits(buildingId: string): Promise<number> {
    if (!this.apiClients) {
      Logger.warn('API clients not initialized, returning 0 permits', undefined, 'BuildingService');
      return 0;
    }

    try {
      const permits = await this.apiClients.dob.getPermitsForBuilding(buildingId);
      return permits.length;
    } catch (error) {
      Logger.error('Failed to get DOB permits:', undefined, 'BuildingService');
      return 0;
    }
  }

  /**
   * Get DSNY compliance status for a building
   */
  private async getDSNYCompliance(buildingId: string): Promise<boolean> {
    if (!this.apiClients) {
      Logger.warn('API clients not initialized, returning false', undefined, 'BuildingService');
      return false;
    }

    try {
      const violations = await this.apiClients.dsny.getViolationsForBuilding(buildingId);
      return violations.length === 0;
    } catch (error) {
      Logger.error('Failed to get DSNY compliance:', undefined, 'BuildingService');
      return false;
    }
  }

  /**
   * Get DSNY collection schedule for a building
   */
  public getDSNYSchedule(buildingId: string): {
    collectionDays: string[];
    setOutWorker: string | null;
    setOutTime: string | null;
    bringInWorker: string | null;
    bringInTime: string | null;
    nextCollection: Date | null;
    hasBinSetOut: boolean;
  } {
    // Get all routines for this building
    const routines = this.operationalDataService.getTasksForBuilding(buildingId);

    // Find DSNY-related tasks
    const dsnyTasks = routines.filter(task =>
      task.category === 'Sanitation' &&
      (task.title.includes('DSNY') || task.title.includes('Bin') || task.title.includes('Trash'))
    );

    // Extract set-out and bring-in tasks
    const setOutTasks = dsnyTasks.filter(task => task.title.includes('Set Out'));
    const bringInTasks = dsnyTasks.filter(task => task.title.includes('Bring In'));

    // Get collection days from tasks
    const collectionDays: string[] = [];
    dsnyTasks.forEach(task => {
      if (task.daysOfWeek) {
        const days = task.daysOfWeek.split(',');
        days.forEach(day => {
          if (!collectionDays.includes(day.trim())) {
            collectionDays.push(day.trim());
          }
        });
      }
    });

    // Get workers and times
    const setOutWorker = setOutTasks[0]?.assignedWorker || null;
    const setOutTime = setOutTasks[0]?.startHour ? this.formatHour(setOutTasks[0].startHour) : null;
    const bringInWorker = bringInTasks[0]?.assignedWorker || null;
    const bringInTime = bringInTasks[0]?.startHour ? this.formatHour(bringInTasks[0].startHour) : null;

    // Calculate next collection date
    const nextCollection = this.getNextCollectionDate(collectionDays);

    // Check if building has bin set-out (from building data)
    const building = this.getBuildingById(buildingId);
    const hasBinSetOut = building?.garbageBinSetOut || false;

    return {
      collectionDays,
      setOutWorker,
      setOutTime,
      bringInWorker,
      bringInTime,
      nextCollection,
      hasBinSetOut
    };
  }

  /**
   * Get next collection date based on collection days
   */
  private getNextCollectionDate(collectionDays: string[]): Date | null {
    if (collectionDays.length === 0) return null;

    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const today = new Date();
    const currentDay = today.getDay();

    // Convert collection days to day numbers
    const collectionDayNumbers = collectionDays
      .map(day => dayMap[day.trim()])
      .filter(num => num !== undefined)
      .sort((a, b) => a - b);

    // Find next collection day
    let nextDay = collectionDayNumbers.find(day => day > currentDay);

    // If no day found this week, use first day of next week
    if (nextDay === undefined) {
      nextDay = collectionDayNumbers[0];
    }

    // Calculate date
    const daysUntilCollection = nextDay <= currentDay
      ? (7 - currentDay + nextDay)
      : (nextDay - currentDay);

    const nextCollection = new Date(today);
    nextCollection.setDate(today.getDate() + daysUntilCollection);
    nextCollection.setHours(8, 0, 0, 0); // Default collection time 8 AM

    return nextCollection;
  }

  /**
   * Format hour to 12-hour format
   */
  private formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }
}
