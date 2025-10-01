/**
 * 👑 Admin Context Engine
 * Mirrors: CyntientOps/Services/Intelligence/AdminContextEngine.swift
 * Purpose: System-wide monitoring, analytics, and management
 */

import { 
  WorkerProfile, 
  NamedCoordinate, 
  ContextualTask, 
  ComplianceIssue,
  AdminAlert,
  IntelligenceInsight,
  StrategicRecommendation,
  PortfolioIntelligence,
  DashboardSyncStatus,
  UserRole 
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';
import { DatabaseManager } from '@cyntientops/database';

export interface AdminMetrics {
  totalActiveWorkers: number;
  totalBuildings: number;
  todaysTasksCompleted: number;
  todaysTasksTotal: number;
  overallCompletionRate: number;
}

export interface WorkerPerformanceMetrics {
  workerId: string;
  workerName: string;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  averageTaskTime: number;
  onTimeRate: number;
  lastActiveDate: Date;
}

export interface BuildingPerformanceMetrics {
  buildingId: string;
  buildingName: string;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  complianceScore: number;
  lastInspectionDate?: Date;
  criticalIssues: number;
}

export interface ComplianceOverview {
  overallScore: number;
  criticalViolations: number;
  pendingInspections: number;
}

export class AdminContextEngine {
  private static instance: AdminContextEngine;
  
  // MARK: - Published Properties for Admin Dashboard
  public totalActiveWorkers: number = 0;
  public totalBuildings: number = 0;
  public todaysTasksCompleted: number = 0;
  public todaysTasksTotal: number = 0;
  public overallCompletionRate: number = 0;
  
  // Worker Management
  public allWorkers: WorkerProfile[] = [];
  public activeWorkers: WorkerProfile[] = [];
  public workersNeedingAttention: WorkerProfile[] = [];
  public workerPerformanceMetrics: Map<string, WorkerPerformanceMetrics> = new Map();
  
  // Building Management
  public allBuildings: NamedCoordinate[] = [];
  public buildingsWithIssues: NamedCoordinate[] = [];
  public buildingMetrics: Map<string, BuildingPerformanceMetrics> = new Map();
  public buildingPerformanceMap: Map<string, number> = new Map();
  
  // Task Management
  public allTasks: ContextualTask[] = [];
  public overdueTasks: ContextualTask[] = [];
  public urgentTasks: ContextualTask[] = [];
  public tasksByBuilding: Map<string, ContextualTask[]> = new Map();
  public tasksByWorker: Map<string, ContextualTask[]> = new Map();
  
  // Compliance & Alerts
  public complianceOverview: ComplianceOverview = {
    overallScore: 0.85,
    criticalViolations: 0,
    pendingInspections: 0
  };
  public criticalIssues: ComplianceIssue[] = [];
  public adminAlerts: AdminAlert[] = [];
  
  // Intelligence & Insights
  public intelligenceInsights: IntelligenceInsight[] = [];
  public operationalRecommendations: StrategicRecommendation[] = [];
  public portfolioIntelligence?: PortfolioIntelligence;
  
  // Real-time Status
  public syncStatus: DashboardSyncStatus = 'synced';
  public lastRefreshTime: Date = new Date();
  public isLoading: boolean = false;
  public errorMessage?: string;
  
  // MARK: - Private Properties
  private refreshTimer?: NodeJS.Timeout;
  private refreshInterval: number = 30000; // 30 seconds for admin
  private serviceContainer?: ServiceContainer;
  private database?: DatabaseManager;
  
  // Event listeners
  private metricsUpdateListeners: ((metrics: AdminMetrics) => void)[] = [];
  private workerUpdateListeners: ((workers: WorkerProfile[]) => void)[] = [];
  private buildingUpdateListeners: ((buildings: NamedCoordinate[]) => void)[] = [];
  private taskUpdateListeners: ((tasks: ContextualTask[]) => void)[] = [];
  private complianceUpdateListeners: ((issues: ComplianceIssue[]) => void)[] = [];
  private alertUpdateListeners: ((alerts: AdminAlert[]) => void)[] = [];
  
  private constructor() {
    this.setupPeriodicRefresh();
  }
  
  public static getInstance(): AdminContextEngine {
    if (!AdminContextEngine.instance) {
      AdminContextEngine.instance = new AdminContextEngine();
    }
    return AdminContextEngine.instance;
  }
  
  // MARK: - Service Configuration
  public configure(serviceContainer: ServiceContainer): void {
    this.serviceContainer = serviceContainer;
    this.database = serviceContainer.database;
  }
  
  // MARK: - Initialization
  public async initialize(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.errorMessage = undefined;
    
    try {
      console.log('👑 Initializing AdminContextEngine...');
      
      // Load all data in parallel
      await Promise.all([
        this.loadWorkerData(),
        this.loadBuildingData(),
        this.loadTaskData(),
        this.loadComplianceData(),
        this.loadIntelligenceData()
      ]);
      
      // Calculate metrics
      this.calculateMetrics();
      
      this.lastRefreshTime = new Date();
      this.syncStatus = 'synced';
      
      // Notify all listeners
      this.notifyAllListeners();
      
      console.log('✅ AdminContextEngine initialized successfully');
      
    } catch (error) {
      console.error('❌ AdminContextEngine initialization failed:', error);
      this.errorMessage = (error as Error).message;
      this.syncStatus = 'error';
    } finally {
      this.isLoading = false;
    }
  }
  
  // MARK: - Data Loading Methods
  
  private async loadWorkerData(): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      // Load all workers
      const workerQuery = `
        SELECT * FROM workers 
        WHERE isActive = 1
        ORDER BY name
      `;
      
      const workerRows = await this.database.query(workerQuery);
      
      this.allWorkers = workerRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role as UserRole,
        skills: row.skills ? JSON.parse(row.skills) : [],
        certifications: row.certifications ? JSON.parse(row.certifications) : [],
        isActive: Boolean(row.isActive),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
      
      // Filter active workers (clocked in or recently active)
      const activeWorkerQuery = `
        SELECT DISTINCT w.*
        FROM workers w
        LEFT JOIN clock_sessions cs ON w.id = cs.workerId
        WHERE w.isActive = 1
        AND (cs.status = 'clockedIn' 
             OR cs.clockInTime > datetime('now', '-24 hours'))
        ORDER BY w.name
      `;
      
      const activeWorkerRows = await this.database.query(activeWorkerQuery);
      
      this.activeWorkers = activeWorkerRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role as UserRole,
        skills: row.skills ? JSON.parse(row.skills) : [],
        certifications: row.certifications ? JSON.parse(row.certifications) : [],
        isActive: Boolean(row.isActive),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
      
      // Load worker performance metrics
      await this.loadWorkerPerformanceMetrics();
      
      // Identify workers needing attention
      this.identifyWorkersNeedingAttention();
      
    } catch (error) {
      console.error('❌ Failed to load worker data:', error);
    }
  }
  
  private async loadWorkerPerformanceMetrics(): Promise<void> {
    try {
      if (!this.database) {
        return;
      }
      
      for (const worker of this.allWorkers) {
        const metricsQuery = `
          SELECT 
            COUNT(*) as totalTasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
            AVG(CASE WHEN status = 'completed' THEN actualDuration ELSE NULL END) as avgTaskTime,
            SUM(CASE WHEN status = 'completed' AND completedAt <= dueDate THEN 1 ELSE 0 END) as onTimeTasks
          FROM tasks 
          WHERE assignedWorkerId = ? 
          AND scheduledDate >= date('now', '-30 days')
        `;
        
        const metricsRows = await this.database.query(metricsQuery, [worker.id]);
        const metrics = metricsRows[0];
        
        const totalTasks = metrics.totalTasks || 0;
        const completedTasks = metrics.completedTasks || 0;
        const onTimeTasks = metrics.onTimeTasks || 0;
        
        this.workerPerformanceMetrics.set(worker.id, {
          workerId: worker.id,
          workerName: worker.name,
          tasksCompleted: completedTasks,
          tasksTotal: totalTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          averageTaskTime: metrics.avgTaskTime || 0,
          onTimeRate: completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0,
          lastActiveDate: worker.updatedAt
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to load worker performance metrics:', error);
    }
  }
  
  private async loadBuildingData(): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      const buildingQuery = `
        SELECT id, name, address, latitude, longitude
        FROM buildings
        ORDER BY name
      `;
      
      const buildingRows = await this.database.query(buildingQuery);
      
      this.allBuildings = buildingRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude
      }));
      
      // Load building performance metrics
      await this.loadBuildingPerformanceMetrics();
      
      // Identify buildings with issues
      this.identifyBuildingsWithIssues();
      
    } catch (error) {
      console.error('❌ Failed to load building data:', error);
    }
  }
  
  private async loadBuildingPerformanceMetrics(): Promise<void> {
    try {
      if (!this.database) {
        return;
      }
      
      for (const building of this.allBuildings) {
        const metricsQuery = `
          SELECT 
            COUNT(*) as totalTasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks
          FROM tasks 
          WHERE buildingId = ? 
          AND scheduledDate >= date('now', '-30 days')
        `;
        
        const metricsRows = await this.database.query(metricsQuery, [building.id]);
        const metrics = metricsRows[0];
        
        const totalTasks = metrics.totalTasks || 0;
        const completedTasks = metrics.completedTasks || 0;
        
        // Get compliance score
        const complianceQuery = `
          SELECT COUNT(*) as criticalIssues
          FROM compliance_issues
          WHERE buildingId = ? AND severity = 'critical' AND status != 'resolved'
        `;
        
        const complianceRows = await this.database.query(complianceQuery, [building.id]);
        const criticalIssues = complianceRows[0]?.criticalIssues || 0;
        
        this.buildingMetrics.set(building.id, {
          buildingId: building.id,
          buildingName: building.name,
          tasksCompleted: completedTasks,
          tasksTotal: totalTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          complianceScore: Math.max(0, 100 - (criticalIssues * 10)), // Simple scoring
          criticalIssues
        });
        
        this.buildingPerformanceMap.set(building.id, totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
      }
      
    } catch (error) {
      console.error('❌ Failed to load building performance metrics:', error);
    }
  }
  
  private async loadTaskData(): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // Load today's tasks
      const taskQuery = `
        SELECT t.*, b.name as buildingName, w.name as workerName
        FROM tasks t
        LEFT JOIN buildings b ON t.buildingId = b.id
        LEFT JOIN workers w ON t.assignedWorkerId = w.id
        WHERE t.scheduledDate >= ? AND t.scheduledDate < ?
        ORDER BY t.scheduledDate ASC
      `;
      
      const taskRows = await this.database.query(taskQuery, [startOfDay.toISOString(), endOfDay.toISOString()]);
      
      this.allTasks = taskRows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        buildingId: row.buildingId,
        buildingName: row.buildingName,
        buildingAddress: building?.address || 'Address not available',
        assignedWorkerId: row.assignedWorkerId,
        scheduledDate: new Date(row.scheduledDate),
        dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
        status: row.status,
        priority: row.priority,
        category: row.category,
        estimatedDuration: row.estimatedDuration,
        actualDuration: row.actualDuration,
        notes: row.notes,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
      
      // Categorize tasks
      this.overdueTasks = this.allTasks.filter(task => 
        task.dueDate && new Date() > task.dueDate && task.status !== 'completed'
      );
      
      this.urgentTasks = this.allTasks.filter(task => 
        task.priority === 'high' || task.priority === 'critical'
      );
      
      // Group tasks by building and worker
      this.tasksByBuilding.clear();
      this.tasksByWorker.clear();
      
      this.allTasks.forEach(task => {
        // Group by building
        if (!this.tasksByBuilding.has(task.buildingId)) {
          this.tasksByBuilding.set(task.buildingId, []);
        }
        this.tasksByBuilding.get(task.buildingId)!.push(task);
        
        // Group by worker
        if (task.assignedWorkerId) {
          if (!this.tasksByWorker.has(task.assignedWorkerId)) {
            this.tasksByWorker.set(task.assignedWorkerId, []);
          }
          this.tasksByWorker.get(task.assignedWorkerId)!.push(task);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to load task data:', error);
    }
  }
  
  private async loadComplianceData(): Promise<void> {
    try {
      if (!this.serviceContainer?.compliance) {
        console.log('⚠️ Compliance service not available');
        return;
      }
      
      // Load compliance overview
      this.complianceOverview = await this.serviceContainer.compliance.getComplianceOverview();
      
      // Load critical issues
      const allIssues = await this.serviceContainer.compliance.getAllComplianceIssues();
      this.criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
      
      // Generate admin alerts from compliance issues
      this.generateAdminAlerts();
      
    } catch (error) {
      console.error('❌ Failed to load compliance data:', error);
    }
  }
  
  private async loadIntelligenceData(): Promise<void> {
    try {
      if (!this.serviceContainer?.intelligence) {
        console.log('⚠️ Intelligence service not available');
        return;
      }
      
      const intelligence = await this.serviceContainer.intelligence;
      
      // Load intelligence insights
      this.intelligenceInsights = await intelligence.getInsights();
      
      // Load operational recommendations
      this.operationalRecommendations = await intelligence.getRecommendations();
      
      // Load portfolio intelligence
      this.portfolioIntelligence = await intelligence.getPortfolioIntelligence();
      
    } catch (error) {
      console.error('❌ Failed to load intelligence data:', error);
    }
  }
  
  // MARK: - Helper Methods
  
  private calculateMetrics(): void {
    this.totalActiveWorkers = this.activeWorkers.length;
    this.totalBuildings = this.allBuildings.length;
    this.todaysTasksCompleted = this.allTasks.filter(task => task.status === 'completed').length;
    this.todaysTasksTotal = this.allTasks.length;
    this.overallCompletionRate = this.todaysTasksTotal > 0 ? 
      (this.todaysTasksCompleted / this.todaysTasksTotal) * 100 : 0;
  }
  
  private identifyWorkersNeedingAttention(): void {
    this.workersNeedingAttention = this.allWorkers.filter(worker => {
      const metrics = this.workerPerformanceMetrics.get(worker.id);
      if (!metrics) return false;
      
      // Workers with low completion rate, overdue tasks, or no recent activity
      return metrics.completionRate < 70 || 
             metrics.onTimeRate < 80 ||
             (Date.now() - metrics.lastActiveDate.getTime()) > 7 * 24 * 60 * 60 * 1000; // 7 days
    });
  }
  
  private identifyBuildingsWithIssues(): void {
    this.buildingsWithIssues = this.allBuildings.filter(building => {
      const metrics = this.buildingMetrics.get(building.id);
      if (!metrics) return false;
      
      // Buildings with low completion rate, critical compliance issues, or overdue tasks
      return metrics.completionRate < 70 || 
             metrics.criticalIssues > 0 ||
             this.overdueTasks.some(task => task.buildingId === building.id);
    });
  }
  
  private generateAdminAlerts(): void {
    this.adminAlerts = [];
    
    // Generate alerts from critical issues
    this.criticalIssues.forEach(issue => {
      this.adminAlerts.push({
        id: `compliance_${issue.id}`,
        title: `Critical Compliance Issue: ${issue.title}`,
        message: issue.description,
        severity: 'critical',
        buildingId: issue.buildingId,
        buildingName: issue.buildingName,
        timestamp: issue.createdAt,
        type: 'compliance',
        isRead: false
      });
    });
    
    // Generate alerts from overdue tasks
    this.overdueTasks.forEach(task => {
      this.adminAlerts.push({
        id: `overdue_${task.id}`,
        title: `Overdue Task: ${task.title}`,
        message: `Task is overdue at ${task.buildingName}`,
        severity: 'high',
        buildingId: task.buildingId,
        buildingName: task.buildingName,
        timestamp: task.dueDate || task.scheduledDate,
        type: 'task',
        isRead: false
      });
    });
    
    // Generate alerts from workers needing attention
    this.workersNeedingAttention.forEach(worker => {
      this.adminAlerts.push({
        id: `worker_${worker.id}`,
        title: `Worker Needs Attention: ${worker.name}`,
        message: 'Worker has low performance metrics or overdue tasks',
        severity: 'medium',
        buildingId: '',
        buildingName: '',
        timestamp: new Date(),
        type: 'worker',
        isRead: false
      });
    });
  }
  
  // MARK: - Event Listeners
  
  public addMetricsUpdateListener(listener: (metrics: AdminMetrics) => void): void {
    this.metricsUpdateListeners.push(listener);
  }
  
  public addWorkerUpdateListener(listener: (workers: WorkerProfile[]) => void): void {
    this.workerUpdateListeners.push(listener);
  }
  
  public addBuildingUpdateListener(listener: (buildings: NamedCoordinate[]) => void): void {
    this.buildingUpdateListeners.push(listener);
  }
  
  public addTaskUpdateListener(listener: (tasks: ContextualTask[]) => void): void {
    this.taskUpdateListeners.push(listener);
  }
  
  public addComplianceUpdateListener(listener: (issues: ComplianceIssue[]) => void): void {
    this.complianceUpdateListeners.push(listener);
  }
  
  public addAlertUpdateListener(listener: (alerts: AdminAlert[]) => void): void {
    this.alertUpdateListeners.push(listener);
  }
  
  private notifyAllListeners(): void {
    // Notify metrics listeners
    const metrics: AdminMetrics = {
      totalActiveWorkers: this.totalActiveWorkers,
      totalBuildings: this.totalBuildings,
      todaysTasksCompleted: this.todaysTasksCompleted,
      todaysTasksTotal: this.todaysTasksTotal,
      overallCompletionRate: this.overallCompletionRate
    };
    
    this.metricsUpdateListeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in metrics update listener:', error);
      }
    });
    
    // Notify other listeners
    this.workerUpdateListeners.forEach(listener => {
      try {
        listener(this.allWorkers);
      } catch (error) {
        console.error('Error in worker update listener:', error);
      }
    });
    
    this.buildingUpdateListeners.forEach(listener => {
      try {
        listener(this.allBuildings);
      } catch (error) {
        console.error('Error in building update listener:', error);
      }
    });
    
    this.taskUpdateListeners.forEach(listener => {
      try {
        listener(this.allTasks);
      } catch (error) {
        console.error('Error in task update listener:', error);
      }
    });
    
    this.complianceUpdateListeners.forEach(listener => {
      try {
        listener(this.criticalIssues);
      } catch (error) {
        console.error('Error in compliance update listener:', error);
      }
    });
    
    this.alertUpdateListeners.forEach(listener => {
      try {
        listener(this.adminAlerts);
      } catch (error) {
        console.error('Error in alert update listener:', error);
      }
    });
  }
  
  // MARK: - Periodic Refresh
  
  private setupPeriodicRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.initialize();
    }, this.refreshInterval);
  }
  
  // MARK: - Public Methods
  
  public async refresh(): Promise<void> {
    await this.initialize();
  }
  
  public getWorkerMetrics(workerId: string): WorkerPerformanceMetrics | undefined {
    return this.workerPerformanceMetrics.get(workerId);
  }
  
  public getBuildingMetrics(buildingId: string): BuildingPerformanceMetrics | undefined {
    return this.buildingMetrics.get(buildingId);
  }
  
  public getTasksForBuilding(buildingId: string): ContextualTask[] {
    return this.tasksByBuilding.get(buildingId) || [];
  }
  
  public getTasksForWorker(workerId: string): ContextualTask[] {
    return this.tasksByWorker.get(workerId) || [];
  }
  
  public getUnreadAlerts(): AdminAlert[] {
    return this.adminAlerts.filter(alert => !alert.isRead);
  }
  
  public markAlertAsRead(alertId: string): void {
    const alert = this.adminAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }
  
  public cleanup(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    
    this.metricsUpdateListeners = [];
    this.workerUpdateListeners = [];
    this.buildingUpdateListeners = [];
    this.taskUpdateListeners = [];
    this.complianceUpdateListeners = [];
    this.alertUpdateListeners = [];
  }
}
