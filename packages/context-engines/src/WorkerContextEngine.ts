/**
 * 👷 Worker Context Engine
 * Mirrors: CyntientOps/Services/Intelligence/WorkerContextEngine.swift
 * Purpose: Real-time worker context management with intelligence integration
 */

import { 
  WorkerProfile, 
  NamedCoordinate, 
  ContextualTask, 
  TaskProgress,
  UserRole,
  WorkerID 
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';
import { DatabaseManager } from '@cyntientops/database';

export interface WorkerContext {
  profile: WorkerProfile;
  currentBuilding?: NamedCoordinate;
  assignedBuildings: NamedCoordinate[];
  portfolioBuildings: NamedCoordinate[];
}

export interface OperationalStatus {
  clockInStatus: {
    isClockedIn: boolean;
    building?: NamedCoordinate;
  };
  hasPendingScenario: boolean;
  lastRefreshTime?: Date;
}

export interface ContextUIState {
  isLoading: boolean;
  lastError?: Error;
  errorMessage?: string;
}

export interface TaskContext {
  todaysTasks: ContextualTask[];
  taskProgress?: TaskProgress;
}

export class WorkerContextEngine {
  private static instance: WorkerContextEngine;
  
  // MARK: - Optimized Context State
  public workerContext?: WorkerContext;
  public operationalStatus: OperationalStatus = {
    clockInStatus: { isClockedIn: false },
    hasPendingScenario: false
  };
  public uiState: ContextUIState = { isLoading: false };
  public taskContext: TaskContext = { todaysTasks: [] };
  
  // MARK: - Private Properties
  private refreshInterval: number = 300000; // 5 minutes
  private refreshTimer?: NodeJS.Timeout;
  private serviceContainer?: ServiceContainer;
  private database?: DatabaseManager;
  
  // Event listeners
  private contextUpdateListeners: ((context: WorkerContext) => void)[] = [];
  private statusUpdateListeners: ((status: OperationalStatus) => void)[] = [];
  private taskUpdateListeners: ((tasks: ContextualTask[]) => void)[] = [];
  
  private constructor() {
    this.setupPeriodicUpdates();
    this.setupNotificationObservers();
  }
  
  public static getInstance(): WorkerContextEngine {
    if (!WorkerContextEngine.instance) {
      WorkerContextEngine.instance = new WorkerContextEngine();
    }
    return WorkerContextEngine.instance;
  }
  
  // MARK: - Service Configuration
  public configure(serviceContainer: ServiceContainer): void {
    this.serviceContainer = serviceContainer;
    this.database = serviceContainer.database;
  }
  
  // MARK: - Main Context Loading
  public async loadContext(workerId: WorkerID): Promise<void> {
    if (this.uiState.isLoading) return;
    
    this.uiState.isLoading = true;
    this.uiState.lastError = undefined;
    this.uiState.errorMessage = undefined;
    
    try {
      console.log('🔄 Loading worker context for:', workerId);
      
      // Load worker profile
      const profile = await this.loadWorkerProfile(workerId);
      if (!profile) {
        throw new Error(`Worker profile not found for ID: ${workerId}`);
      }
      
      // Load building assignments
      const assignedBuildings = await this.loadAssignedBuildings(workerId);
      const portfolioBuildings = await this.loadPortfolioBuildings(workerId);
      
      // Load current building (if clocked in)
      const currentBuilding = await this.loadCurrentBuilding(workerId);
      
      // Create worker context
      this.workerContext = {
        profile,
        currentBuilding,
        assignedBuildings,
        portfolioBuildings
      };
      
      // Load operational status
      await this.loadOperationalStatus(workerId);
      
      // Load today's tasks
      await this.loadTodaysTasks(workerId);
      
      this.operationalStatus.lastRefreshTime = new Date();
      
      // Notify listeners
      this.notifyContextUpdateListeners();
      this.notifyStatusUpdateListeners();
      this.notifyTaskUpdateListeners();
      
      console.log('✅ Worker context loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to load worker context:', error);
      this.uiState.lastError = error as Error;
      this.uiState.errorMessage = (error as Error).message;
    } finally {
      this.uiState.isLoading = false;
    }
  }
  
  // MARK: - Context Data Loading
  
  private async loadWorkerProfile(workerId: WorkerID): Promise<WorkerProfile | null> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      const query = `
        SELECT * FROM workers 
        WHERE id = ? AND isActive = 1
      `;
      
      const rows = await this.database.query(query, [workerId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
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
      };
      
    } catch (error) {
      console.error('❌ Failed to load worker profile:', error);
      return null;
    }
  }
  
  private async loadAssignedBuildings(workerId: WorkerID): Promise<NamedCoordinate[]> {
    try {
      if (!this.database) {
        return [];
      }
      
      const query = `
        SELECT b.id, b.name, b.address, b.latitude, b.longitude
        FROM buildings b
        INNER JOIN worker_building_assignments wba ON b.id = wba.buildingId
        WHERE wba.workerId = ? AND wba.assignmentType = 'assigned'
        ORDER BY b.name
      `;
      
      const rows = await this.database.query(query, [workerId]);
      
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude
      }));
      
    } catch (error) {
      console.error('❌ Failed to load assigned buildings:', error);
      return [];
    }
  }
  
  private async loadPortfolioBuildings(workerId: WorkerID): Promise<NamedCoordinate[]> {
    try {
      if (!this.database) {
        return [];
      }
      
      const query = `
        SELECT b.id, b.name, b.address, b.latitude, b.longitude
        FROM buildings b
        INNER JOIN worker_building_assignments wba ON b.id = wba.buildingId
        WHERE wba.workerId = ? AND wba.assignmentType = 'coverage'
        ORDER BY b.name
      `;
      
      const rows = await this.database.query(query, [workerId]);
      
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude
      }));
      
    } catch (error) {
      console.error('❌ Failed to load portfolio buildings:', error);
      return [];
    }
  }
  
  private async loadCurrentBuilding(workerId: WorkerID): Promise<NamedCoordinate | undefined> {
    try {
      if (!this.database) {
        return undefined;
      }
      
      const query = `
        SELECT b.id, b.name, b.address, b.latitude, b.longitude
        FROM buildings b
        INNER JOIN clock_sessions cs ON b.id = cs.buildingId
        WHERE cs.workerId = ? AND cs.status = 'clockedIn'
        ORDER BY cs.clockInTime DESC
        LIMIT 1
      `;
      
      const rows = await this.database.query(query, [workerId]);
      
      if (rows.length === 0) {
        return undefined;
      }
      
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude
      };
      
    } catch (error) {
      console.error('❌ Failed to load current building:', error);
      return undefined;
    }
  }
  
  private async loadOperationalStatus(workerId: WorkerID): Promise<void> {
    try {
      if (!this.database) {
        return;
      }
      
      // Check clock-in status
      const clockQuery = `
        SELECT cs.*, b.name as buildingName, b.latitude, b.longitude
        FROM clock_sessions cs
        LEFT JOIN buildings b ON cs.buildingId = b.id
        WHERE cs.workerId = ? AND cs.status = 'clockedIn'
        ORDER BY cs.clockInTime DESC
        LIMIT 1
      `;
      
      const clockRows = await this.database.query(clockQuery, [workerId]);
      
      if (clockRows.length > 0) {
        const clockSession = clockRows[0];
        this.operationalStatus.clockInStatus = {
          isClockedIn: true,
          building: {
            id: clockSession.buildingId,
            name: clockSession.buildingName,
            address: building?.address || 'Address not available',
            latitude: clockSession.latitude,
            longitude: clockSession.longitude
          }
        };
      } else {
        this.operationalStatus.clockInStatus = { isClockedIn: false };
      }
      
      // Check for pending scenarios
      const scenarioQuery = `
        SELECT COUNT(*) as count
        FROM ai_scenarios
        WHERE workerId = ? AND status = 'pending'
      `;
      
      const scenarioRows = await this.database.query(scenarioQuery, [workerId]);
      this.operationalStatus.hasPendingScenario = (scenarioRows[0]?.count || 0) > 0;
      
    } catch (error) {
      console.error('❌ Failed to load operational status:', error);
    }
  }
  
  private async loadTodaysTasks(workerId: WorkerID): Promise<void> {
    try {
      if (!this.database) {
        return;
      }
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const query = `
        SELECT t.*, b.name as buildingName, b.address as buildingAddress
        FROM tasks t
        LEFT JOIN buildings b ON t.buildingId = b.id
        WHERE t.assignedWorkerId = ? 
        AND t.scheduledDate >= ? 
        AND t.scheduledDate < ?
        ORDER BY t.scheduledDate ASC
      `;
      
      const rows = await this.database.query(query, [workerId, startOfDay.toISOString(), endOfDay.toISOString()]);
      
      this.taskContext.todaysTasks = rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        buildingId: row.buildingId,
        buildingName: row.buildingName,
        buildingAddress: row.buildingAddress,
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
      
      // Calculate task progress
      const totalTasks = this.taskContext.todaysTasks.length;
      const completedTasks = this.taskContext.todaysTasks.filter(task => task.status === 'completed').length;
      
      this.taskContext.taskProgress = {
        total: totalTasks,
        completed: completedTasks,
        inProgress: this.taskContext.todaysTasks.filter(task => task.status === 'in_progress').length,
        pending: this.taskContext.todaysTasks.filter(task => task.status === 'pending').length,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      };
      
    } catch (error) {
      console.error('❌ Failed to load today\'s tasks:', error);
    }
  }
  
  // MARK: - Event Listeners
  
  public addContextUpdateListener(listener: (context: WorkerContext) => void): void {
    this.contextUpdateListeners.push(listener);
  }
  
  public removeContextUpdateListener(listener: (context: WorkerContext) => void): void {
    const index = this.contextUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.contextUpdateListeners.splice(index, 1);
    }
  }
  
  public addStatusUpdateListener(listener: (status: OperationalStatus) => void): void {
    this.statusUpdateListeners.push(listener);
  }
  
  public removeStatusUpdateListener(listener: (status: OperationalStatus) => void): void {
    const index = this.statusUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.statusUpdateListeners.splice(index, 1);
    }
  }
  
  public addTaskUpdateListener(listener: (tasks: ContextualTask[]) => void): void {
    this.taskUpdateListeners.push(listener);
  }
  
  public removeTaskUpdateListener(listener: (tasks: ContextualTask[]) => void): void {
    const index = this.taskUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.taskUpdateListeners.splice(index, 1);
    }
  }
  
  private notifyContextUpdateListeners(): void {
    if (this.workerContext) {
      this.contextUpdateListeners.forEach(listener => {
        try {
          listener(this.workerContext!);
        } catch (error) {
          console.error('Error in context update listener:', error);
        }
      });
    }
  }
  
  private notifyStatusUpdateListeners(): void {
    this.statusUpdateListeners.forEach(listener => {
      try {
        listener(this.operationalStatus);
      } catch (error) {
        console.error('Error in status update listener:', error);
      }
    });
  }
  
  private notifyTaskUpdateListeners(): void {
    this.taskUpdateListeners.forEach(listener => {
      try {
        listener(this.taskContext.todaysTasks);
      } catch (error) {
        console.error('Error in task update listener:', error);
      }
    });
  }
  
  // MARK: - Periodic Updates
  
  private setupPeriodicUpdates(): void {
    this.refreshTimer = setInterval(() => {
      if (this.workerContext) {
        this.loadContext(this.workerContext.profile.id);
      }
    }, this.refreshInterval);
  }
  
  private setupNotificationObservers(): void {
    // Setup notification observers for real-time updates
    console.log('📡 Setting up notification observers');
    
    // Subscribe to real-time updates
    if (this.serviceContainer?.realTimeOrchestrator) {
      this.serviceContainer.realTimeOrchestrator.subscribe('worker-updates', (update: any) => {
        if (update.workerId === this.workerId) {
          this.refreshData();
        }
      });
    }
  }
  
  // MARK: - Public Methods
  
  public async refreshContext(): Promise<void> {
    if (this.workerContext) {
      await this.loadContext(this.workerContext.profile.id);
    }
  }
  
  public async updateTaskStatus(taskId: string, status: string): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      const query = `
        UPDATE tasks 
        SET status = ?, updatedAt = ?
        WHERE id = ?
      `;
      
      await this.database.execute(query, [status, new Date().toISOString(), taskId]);
      
      // Refresh tasks
      if (this.workerContext) {
        await this.loadTodaysTasks(this.workerContext.profile.id);
        this.notifyTaskUpdateListeners();
      }
      
      console.log('✅ Task status updated:', taskId, status);
      
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
    }
  }
  
  public getCurrentWorker(): WorkerProfile | undefined {
    return this.workerContext?.profile;
  }
  
  public getCurrentBuilding(): NamedCoordinate | undefined {
    return this.operationalStatus.clockInStatus.building;
  }
  
  public isClockedIn(): boolean {
    return this.operationalStatus.clockInStatus.isClockedIn;
  }
  
  public getTodaysTasks(): ContextualTask[] {
    return this.taskContext.todaysTasks;
  }
  
  public getTaskProgress(): TaskProgress | undefined {
    return this.taskContext.taskProgress;
  }
  
  public cleanup(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    
    this.contextUpdateListeners = [];
    this.statusUpdateListeners = [];
    this.taskUpdateListeners = [];
  }
}
