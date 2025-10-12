/**
 * 🏗️ OperationalDataService
 * Mirrors: CyntientOps/Managers/System/OperationalDataManager.swift
 * Purpose: Central data management for all operational data
 */

import { workers, buildings, clients, routines, validateDataIntegrity } from '@cyntientops/data-seed';
import { CanonicalIDs, validateTaskAssignment } from '@cyntientops/domain-schema';
import { WorkerProfile, BuildingMetrics, ContextualTask, TaskStatus } from '@cyntientops/domain-schema';
import { Logger } from './LoggingService';

export interface OperationalDataState {
  workers: WorkerProfile[];
  buildings: any[];
  clients: any[];
  routines: any[];
  isLoaded: boolean;
  lastUpdated: Date;
}

export class OperationalDataService {
  private static instance: OperationalDataService;
  private state: OperationalDataState;
  private listeners: Set<(state: OperationalDataState) => void> = new Set();

  private constructor() {
    this.state = {
      workers: [],
      buildings: [],
      clients: [],
      routines: [],
      isLoaded: false,
      lastUpdated: new Date()
    };
  }

  public static getInstance(): OperationalDataService {
    if (!OperationalDataService.instance) {
      OperationalDataService.instance = new OperationalDataService();
    }
    return OperationalDataService.instance;
  }

  /**
   * Ensure operational data is loaded before use
   */
  public async initialize(): Promise<void> {
    if (this.state.isLoaded) {
      return;
    }

    await this.loadOperationalData();
  }

  /**
   * Initialize operational data - mirrors Swift loadOperationalData()
   */
  public async loadOperationalData(): Promise<void> {
    try {
      // Validate data integrity first
      const validation = validateDataIntegrity();
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      // Load and transform data
      this.state.workers = this.transformWorkersData(workers);
      this.state.buildings = buildings;
      this.state.clients = clients;
      this.state.routines = routines;
      this.state.isLoaded = true;
      this.state.lastUpdated = new Date();

      this.notifyListeners();
      Logger.debug('✅ Operational data loaded successfully', undefined, 'OperationalDataService');
    } catch (error) {
      Logger.error('❌ Failed to load operational data:', undefined, 'OperationalDataService');
      throw error;
    }
  }

  /**
   * Transform raw worker data to WorkerProfile format
   */
  private transformWorkersData(rawWorkers: any[]): WorkerProfile[] {
    return rawWorkers.map(worker => ({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role as any,
      skills: worker.skills ? worker.skills.split(', ') : [],
      certifications: worker.certifications || [],
      hireDate: worker.hireDate ? new Date(worker.hireDate) : undefined,
      isActive: worker.isActive,
      assignedBuildingIds: worker.assignedBuildings || [],
      status: worker.status as any,
      isClockedIn: false,
      createdAt: worker.created_at ? new Date(worker.created_at) : new Date(),
      updatedAt: worker.updated_at ? new Date(worker.updated_at) : new Date()
    }));
  }

  /**
   * Get all workers
   */
  public getWorkers(): WorkerProfile[] {
    return this.state.workers;
  }

  /**
   * Get worker by ID
   */
  public getWorkerById(id: string): WorkerProfile | undefined {
    if (!CanonicalIDs.Workers.isValidWorkerId(id)) {
      throw new Error(`Invalid worker ID: ${id}`);
    }
    return this.state.workers.find(w => w.id === id);
  }

  /**
   * Get all buildings
   */
  public getBuildings(): any[] {
    return this.state.buildings;
  }

  /**
   * Get building by ID
   */
  public getBuildingById(id: string): any | undefined {
    if (!CanonicalIDs.Buildings.isValidBuildingId(id)) {
      // Fallback: attempt normalized name/address match for resilience
      const resolved = this.getBuildingByName(id);
      if (resolved) return resolved;
      throw new Error(`Invalid building identifier: ${id}`);
    }
    return this.state.buildings.find(b => b.id === id);
  }

  /**
   * Get building by (fuzzy) name with alias normalization
   */
  public getBuildingByName(name: string): any | undefined {
    const normalize = (val?: string) => (val || '')
      .toLowerCase()
      .replace(/street\b/g, 'st')
      .replace(/avenue\b/g, 'ave')
      .replace(/\bwest\b/g, 'w')
      .replace(/\beast\b/g, 'e')
      .replace(/[.,#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .sort()
      .join(' ');

    const key = normalize(name);
    for (const b of this.state.buildings) {
      if (normalize(b.name) === key) return b;
      if (normalize((b as any).normalized_name) === key) return b;
      if (normalize(b.address) === key) return b;
    }
    return undefined;
  }

  /**
   * Get all clients
   */
  public getClients(): any[] {
    return this.state.clients;
  }

  /**
   * Get client by ID
   */
  public getClientById(id: string): any | undefined {
    return this.state.clients.find(c => c.id === id);
  }

  /**
   * Get all routines/tasks
   */
  public getRoutines(): any[] {
    return this.state.routines;
  }

  /**
   * Get tasks for a specific worker
   */
  public getTasksForWorker(workerId: string): any[] {
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }
    return this.state.routines.filter(r => r.workerId === workerId);
  }

  /**
   * Get tasks for a specific building
   */
  public getTasksForBuilding(buildingId: string): any[] {
    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }
    return this.state.routines.filter(r => r.buildingId === buildingId);
  }

  /**
   * Get today's tasks for a worker
   */
  public getTodaysTasksForWorker(workerId: string): any[] {
    const workerTasks = this.getTasksForWorker(workerId);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return workerTasks.filter(task => {
      if (!task.daysOfWeek) return false;
      
      const taskDays = task.daysOfWeek.split(',').map((day: string) => {
        const dayMap: Record<string, number> = {
          'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
          'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        return dayMap[day.trim()];
      });
      
      return taskDays.includes(dayOfWeek);
    });
  }

  /**
   * Get building metrics - mirrors Swift getBuildingMetrics()
   */
  public getBuildingMetrics(buildingId: string): BuildingMetrics {
    const building = this.getBuildingById(buildingId);
    if (!building) {
      throw new Error(`Building not found: ${buildingId}`);
    }

    const buildingTasks = this.getTasksForBuilding(buildingId);
    const completedTasks = buildingTasks.filter(t => t.status === 'Completed').length;
    const totalTasks = buildingTasks.length;
    const overdueTasks = buildingTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date() > new Date(t.dueDate) && t.status !== 'Completed';
    }).length;

    return {
      id: `metrics-${buildingId}`,
      buildingId,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      averageTaskTime: 3600, // Default 1 hour
      overdueTasks,
      totalTasks,
      activeWorkers: this.state.workers.filter(w => 
        w.assignedBuildingIds.includes(buildingId) && w.isClockedIn
      ).length,
      isCompliant: building.compliance_score > 0.8,
      overallScore: building.compliance_score || 0.85,
      lastUpdated: new Date(),
      pendingTasks: buildingTasks.filter(t => t.status === 'Pending').length,
      urgentTasksCount: buildingTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
      hasWorkerOnSite: this.state.workers.some(w => 
        w.assignedBuildingIds.includes(buildingId) && w.isClockedIn
      ),
      maintenanceEfficiency: 0.85,
      weeklyCompletionTrend: 0,
      criticalIssues: 0
    };
  }

  /**
   * Validate task assignment
   */
  public validateTaskAssignment(workerId: string, buildingId: string): boolean {
    const validation = validateTaskAssignment(workerId, buildingId);
    return validation.isValid;
  }

  /**
   * Get current state
   */
  public getState(): OperationalDataState {
    return { ...this.state };
  }

  /**
   * Check if data is loaded
   */
  public isDataLoaded(): boolean {
    return this.state.isLoaded;
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(listener: (state: OperationalDataState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        Logger.error('Error in state listener:', undefined, 'OperationalDataService');
      }
    });
  }

  /**
   * Get data summary - mirrors Swift getDataSummary()
   */
  public getDataSummary() {
    return {
      workers: this.state.workers.length,
      buildings: this.state.buildings.length,
      clients: this.state.clients.length,
      routines: this.state.routines.length,
      isHealthy: this.state.isLoaded,
      lastUpdated: this.state.lastUpdated
    };
  }
}
