/**
 * 🏗️ OperationalDataService
 * Mirrors: CyntientOps/Managers/System/OperationalDataManager.swift
 * Purpose: Central data management for all operational data
 */

import { workers, buildings, clients, routines, validateDataIntegrity } from '@cyntientops/data-seed';
import { CanonicalIDs, validateTaskAssignment } from '@cyntientops/domain-schema';
import { WorkerProfile, BuildingMetrics, ContextualTask, TaskStatus } from '@cyntientops/domain-schema';
import { Logger } from './LoggingService';
import { DatabaseManager } from '@cyntientops/database';
import { SupabaseService } from './SupabaseService';

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
  private database?: DatabaseManager;
  private supabaseService?: SupabaseService;

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
   * Configure data sources for operational data.
   * Must be called before initialize() when database/supabase access is required.
   */
  public configure(database: DatabaseManager, supabaseService?: SupabaseService): void {
    this.database = database;
    this.supabaseService = supabaseService;
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
      let workerRows: any[] = [];
      let buildingRows: any[] = [];
      let clientRows: any[] = [];
      let routineRows: any[] = [];
      let dataSource: 'database' | 'supabase' | 'seed' = 'seed';

      if (this.database) {
        try {
          workerRows = await this.database.getWorkers();
          buildingRows = await this.database.getBuildings();
          clientRows = await this.database.getClients();
          routineRows = await this.database.getRoutines();

          if (workerRows.length || buildingRows.length || clientRows.length || routineRows.length) {
            dataSource = 'database';
          }
        } catch (error) {
          Logger.warn('🔄 Operational data load from SQLite failed', error, 'OperationalDataService');
        }
      }

      if ((workerRows.length === 0 || buildingRows.length === 0 || routineRows.length === 0) && this.supabaseService) {
        try {
          const workersResult = await this.supabaseService.select<any>('workers', '*', { is_active: 1 });
          if (workersResult.data) workerRows = workersResult.data;

          const buildingsResult = await this.supabaseService.select<any>('buildings', '*', { is_active: 1 });
          if (buildingsResult.data) buildingRows = buildingsResult.data;

          const clientsResult = await this.supabaseService.select<any>('clients');
          if (clientsResult.data) clientRows = clientsResult.data;

          const routinesResult = await this.supabaseService.select<any>('routines', '*', { is_active: 1 });
          if (routinesResult.data) routineRows = routinesResult.data;

          if (workerRows.length && buildingRows.length && routineRows.length) {
            dataSource = 'supabase';
          }
        } catch (error) {
          Logger.warn('🔄 Operational data load from Supabase failed', error, 'OperationalDataService');
        }
      }

      if (workerRows.length === 0 || buildingRows.length === 0 || clientRows.length === 0 || routineRows.length === 0) {
        const validation = validateDataIntegrity();
        if (!validation.isValid) {
          throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
        }
        workerRows = workers;
        buildingRows = buildings;
        clientRows = clients;
        routineRows = routines;
        dataSource = 'seed';
      }

      const transformedWorkers =
        dataSource === 'seed'
          ? this.transformWorkersData(workerRows)
          : this.transformDatabaseWorkers(workerRows);

      const transformedBuildings =
        dataSource === 'seed'
          ? buildingRows
          : this.transformDatabaseBuildings(buildingRows);

      const transformedClients =
        dataSource === 'seed'
          ? clientRows
          : this.transformDatabaseClients(clientRows);

      const transformedRoutines =
        dataSource === 'seed'
          ? routineRows
          : this.transformDatabaseRoutines(transformedBuildings, transformedWorkers, routineRows);

      this.state.workers = transformedWorkers;
      this.state.buildings = transformedBuildings;
      this.state.clients = transformedClients;
      this.state.routines = transformedRoutines;
      this.state.isLoaded = true;
      this.state.lastUpdated = new Date();

      this.assignWorkerBuildingRelationships();

      this.notifyListeners();
      Logger.debug(`✅ Operational data loaded successfully (${dataSource})`, undefined, 'OperationalDataService');
    } catch (error) {
      Logger.error('❌ Failed to load operational data:', error, 'OperationalDataService');
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

  private transformDatabaseWorkers(rows: any[]): WorkerProfile[] {
    return rows.map((row) => {
      const skills = this.parseSkills(row.skills);
      return {
        id: String(row.id),
        name: row.name,
        email: row.email ?? '',
        phone: row.phone ?? undefined,
        role: (row.role ?? 'worker') as any,
        skills,
        certifications: this.parseCertifications(row.certifications),
        hireDate: row.created_at ? new Date(row.created_at) : undefined,
        isActive: row.is_active === 1 || row.is_active === true,
        assignedBuildingIds: [],
        status: (row.status ?? 'Available') as any,
        isClockedIn: false,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      } as WorkerProfile;
    });
  }

  private transformDatabaseBuildings(rows: any[]): any[] {
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      address: row.address ?? '',
      latitude: Number.isFinite(row.latitude) ? Number(row.latitude) : 40.7589,
      longitude: Number.isFinite(row.longitude) ? Number(row.longitude) : -73.9851,
      imageAssetName: row.image_asset_name ?? null,
      number_of_units: row.number_of_units ?? row.units ?? null,
      year_built: row.year_built ?? null,
      square_footage: row.square_footage ?? null,
      management_company: row.management_company ?? null,
      primary_contact: row.primary_contact ?? null,
      contact_phone: row.contact_phone ?? null,
      contact_email: row.contact_email ?? null,
      is_active: row.is_active ?? 1,
      normalized_name: row.normalized_name ?? null,
      aliases: row.aliases ?? null,
      borough: row.borough ?? null,
      compliance_score: row.compliance_score ?? 0,
      client_id: row.client_id ? String(row.client_id) : null,
      special_notes: row.special_notes ?? null,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
    }));
  }

  private transformDatabaseClients(rows: any[]): any[] {
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      contact_person: row.contact_person ?? row.name,
      email: row.email ?? row.contact_email ?? null,
      phone: row.phone ?? null,
      address: row.address ?? null,
      is_active: row.is_active ?? 1,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
    }));
  }

  private transformDatabaseRoutines(
    buildings: any[],
    workers: WorkerProfile[],
    rows: any[]
  ): any[] {
    const buildingMap = new Map<string, any>(
      buildings.map((building) => [String(building.id), building])
    );
    const workerMap = new Map<string, WorkerProfile>(
      workers.map((worker) => [String(worker.id), worker])
    );

    return rows.map((row) => {
      const buildingId = String(row.building_id);
      const workerId = row.assigned_worker_id ? String(row.assigned_worker_id) : '';
      const scheduleDays = this.parseScheduleDays(row.schedule_days);
      const startHour = this.parseTimeToHour(row.start_time);
      const estimatedDuration = row.estimated_duration ?? 60;
      const endHour =
        startHour !== null ? Math.min(23, startHour + Math.ceil(estimatedDuration / 60)) : undefined;

      return {
        id: String(row.id),
        title: row.name ?? `Routine ${row.id}`,
        description: row.description ?? '',
        building: buildingMap.get(buildingId)?.name ?? row.building_name ?? buildingId,
        buildingId,
        assignedWorker: workerMap.get(workerId)?.name ?? row.worker_name ?? workerId,
        workerId,
        category: row.schedule_type ?? 'Operations',
        skillLevel: 'Intermediate',
        recurrence: row.schedule_type ?? 'weekly',
        startHour: startHour ?? undefined,
        endHour,
        daysOfWeek: scheduleDays.join(','),
        estimatedDuration,
        requiresPhoto: Boolean(row.requires_photo),
        status: row.last_completed ? 'Completed' : ('Pending' as TaskStatus),
        dueDate: row.next_due ?? null,
        lastCompletionDate: row.last_completed ?? null,
      };
    });
  }

  private parseSkills(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((entry) => String(entry).trim()).filter(Boolean);
        }
      } catch {
        // fall through to comma parsing
      }
      return trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    return [];
  }

  private parseCertifications(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((entry) => String(entry).trim()).filter(Boolean);
        }
      } catch {
        return trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private parseScheduleDays(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((day) => String(day).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((day) => String(day).trim()).filter(Boolean);
        }
      } catch {
        return trimmed.split(',').map((day) => day.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private parseTimeToHour(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const match = value.match(/(\d{1,2})(?::(\d{2}))?/);
      if (match) {
        const hour = parseInt(match[1], 10);
        if (!Number.isNaN(hour)) {
          return hour;
        }
      }
    }
    return null;
  }

  private assignWorkerBuildingRelationships(): void {
    const assignments = new Map<string, Set<string>>();

    for (const routine of this.state.routines) {
      const workerId = routine.workerId ? String(routine.workerId) : null;
      const buildingId = routine.buildingId ? String(routine.buildingId) : null;
      if (!workerId || !buildingId) continue;

      const set = assignments.get(workerId) ?? new Set<string>();
      set.add(buildingId);
      assignments.set(workerId, set);
    }

    this.state.workers = this.state.workers.map((worker) => {
      const buildingIds = assignments.get(worker.id);
      if (!buildingIds || buildingIds.size === 0) {
        return worker;
      }

      const combined = new Set<string>(worker.assignedBuildingIds ?? []);
      buildingIds.forEach((id) => combined.add(id));
      worker.assignedBuildingIds = Array.from(combined);
      return worker;
    });
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
