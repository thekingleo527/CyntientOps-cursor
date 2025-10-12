/**
 * 🔄 Real-Time Sync Service
 * Mirrors: CyntientOps/Services/RealTime/RealTimeSyncService.swift
 * Purpose: Real-time synchronization of operational data across all clients
 */

import { OperationalDataManager } from '../OperationalDataManager';
import { WebSocketManager } from '@cyntientops/realtime-sync';
import { DatabaseManager } from '@cyntientops/database';
import { Logger } from './LoggingService';

export interface SyncEvent {
  id: string;
  type:
    | 'task_completed'
    | 'task_updated'
    | 'worker_status'
    | 'building_update'
    | 'inventory_change'
    | 'analytics_update';
  timestamp: Date;
  data: any;
  workerId?: string;
  buildingId?: string;
}

export interface RealTimeSyncConfig {
  enableRealTimeSync: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export class RealTimeSyncService {
  private static instance: RealTimeSyncService;
  private operationalData: OperationalDataManager;
  private webSocketManager: WebSocketManager;
  private database: DatabaseManager;
  private config: RealTimeSyncConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private eventListeners: Map<string, ((event: SyncEvent) => void)[]> = new Map();
  private completedTaskIds: Set<string> = new Set();
  private lastWorkerSnapshots: Map<string, string> = new Map();
  private lastBuildingSnapshots: Map<string, string> = new Map();
  private lastInventorySnapshot: Map<string, string> = new Map();
  private lastAnalyticsSnapshot: string | null = null;

  private constructor(
    operationalData: OperationalDataManager,
    webSocketManager: WebSocketManager,
    database: DatabaseManager,
    config: RealTimeSyncConfig
  ) {
    this.operationalData = operationalData;
    this.webSocketManager = webSocketManager;
    this.database = database;
    this.config = config;
  }

  public static getInstance(
    operationalData: OperationalDataManager,
    webSocketManager: WebSocketManager,
    database: DatabaseManager,
    config?: Partial<RealTimeSyncConfig>
  ): RealTimeSyncService {
    if (!RealTimeSyncService.instance) {
      const defaultConfig: RealTimeSyncConfig = {
        enableRealTimeSync: true,
        syncInterval: 30000, // 30 seconds
        maxRetries: 3,
        retryDelay: 5000, // 5 seconds
        ...config
      };
      RealTimeSyncService.instance = new RealTimeSyncService(
        operationalData,
        webSocketManager,
        database,
        defaultConfig
      );
    }
    return RealTimeSyncService.instance;
  }

  // MARK: - Connection Management

  public async start(): Promise<void> {
    if (!this.config.enableRealTimeSync) {
      Logger.debug('🔄 Real-time sync disabled', undefined, 'RealTimeSyncService');
      return;
    }

    try {
      await this.webSocketManager.connect();
      this.isConnected = true;
      this.setupEventHandlers();
      this.startPeriodicSync();
      Logger.debug('✅ Real-time sync started', undefined, 'RealTimeSyncService');
    } catch (error) {
      Logger.error('❌ Failed to start real-time sync:', undefined, 'RealTimeSyncService');
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.isConnected) {
      await this.webSocketManager.disconnect();
      this.isConnected = false;
    }

    Logger.debug('🔄 Real-time sync stopped', undefined, 'RealTimeSyncService');
  }

  // MARK: - Event Handling

  private setupEventHandlers(): void {
    this.webSocketManager.on('task_completed', (data: any) => {
      this.handleTaskCompleted(data);
    });

    this.webSocketManager.on('task_updated', (data: any) => {
      this.handleTaskUpdated(data);
    });

    this.webSocketManager.on('worker_status', (data: any) => {
      this.handleWorkerStatus(data);
    });

    this.webSocketManager.on('building_update', (data: any) => {
      this.handleBuildingUpdate(data);
    });

    this.webSocketManager.on('inventory_change', (data: any) => {
      this.handleInventoryChange(data);
    });

    this.webSocketManager.on('analytics_update', (data: any) => {
      this.handleAnalyticsUpdate(data);
    });
  }

  private handleTaskCompleted(data: any): void {
    const event: SyncEvent = {
      id: `task_completed_${data.taskId}_${Date.now()}`,
      type: 'task_completed',
      timestamp: new Date(),
      data,
      workerId: data.workerId,
      buildingId: data.buildingId
    };

    this.emitEvent(event);
    Logger.debug('📋 Task completed:', undefined, 'RealTimeSyncService');
  }

  private handleTaskUpdated(data: any): void {
    const event: SyncEvent = {
      id: `task_updated_${data.taskId}_${Date.now()}`,
      type: 'task_updated',
      timestamp: new Date(),
      data,
      workerId: data.workerId,
      buildingId: data.buildingId
    };

    this.emitEvent(event);
    Logger.debug('📋 Task updated:', undefined, 'RealTimeSyncService');
  }

  private handleWorkerStatus(data: any): void {
    const event: SyncEvent = {
      id: `worker_status_${data.workerId}_${Date.now()}`,
      type: 'worker_status',
      timestamp: new Date(),
      data,
      workerId: data.workerId
    };

    this.emitEvent(event);
    Logger.debug('👷 Worker status updated:', undefined, 'RealTimeSyncService');
  }

  private handleBuildingUpdate(data: any): void {
    const event: SyncEvent = {
      id: `building_update_${data.buildingId}_${Date.now()}`,
      type: 'building_update',
      timestamp: new Date(),
      data,
      buildingId: data.buildingId
    };

    this.emitEvent(event);
    Logger.debug('🏢 Building updated:', undefined, 'RealTimeSyncService');
  }

  private handleInventoryChange(data: any): void {
    const event: SyncEvent = {
      id: `inventory_change_${data.buildingId}_${Date.now()}`,
      type: 'inventory_change',
      timestamp: new Date(),
      data,
      buildingId: data.buildingId
    };

    this.emitEvent(event);
    Logger.debug('📦 Inventory changed:', undefined, 'RealTimeSyncService');
  }

  private handleAnalyticsUpdate(data: any): void {
    const event: SyncEvent = {
      id: `analytics_update_${Date.now()}`,
      type: 'analytics_update',
      timestamp: new Date(),
      data,
    };

    this.emitEvent(event);
    Logger.debug('📈 Analytics update received:', undefined, 'RealTimeSyncService');
  }

  // MARK: - Event Emission

  public on(eventType: string, callback: (event: SyncEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  public off(eventType: string, callback: (event: SyncEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: SyncEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          Logger.error('❌ Error in event listener:', undefined, 'RealTimeSyncService');
        }
      });
    }
  }

  // MARK: - Periodic Sync

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.syncOperationalData();
      } catch (error) {
        Logger.error('❌ Periodic sync failed:', undefined, 'RealTimeSyncService');
      }
    }, this.config.syncInterval);
  }

  private async syncOperationalData(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const tasks = await this.database.getTasks();

      // Sync task completions
      await this.syncTaskCompletions(tasks);
      
      // Sync worker statuses
      await this.syncWorkerStatuses(tasks);
      
      // Sync building updates
      await this.syncBuildingUpdates();
      
      // Sync inventory changes
      await this.syncInventoryChanges();
      await this.broadcastWeeklyAnalytics();

      Logger.debug('🔄 Operational data synced', undefined, 'RealTimeSyncService');
    } catch (error) {
      Logger.error('❌ Failed to sync operational data:', undefined, 'RealTimeSyncService');
    }
  }

  private async syncTaskCompletions(tasks?: any[]): Promise<void> {
    const taskList = tasks ?? await this.database.getTasks();
    if (!Array.isArray(taskList)) {
      return;
    }

    const completedTasks = taskList.filter(task => {
      const status = (task.status || '').toString().toLowerCase();
      return status === 'completed';
    });

    const currentlyCompletedIds = new Set<string>();

    for (const task of completedTasks) {
      const taskId = String(task.id ?? `${task.assigned_building_id}_${task.name ?? task.taskName ?? 'task'}`);
      currentlyCompletedIds.add(taskId);

      if (this.completedTaskIds.has(taskId)) {
        continue;
      }

      this.webSocketManager.broadcast('task_completed', {
        taskId,
        workerId: task.assigned_worker_id ?? task.workerId ?? null,
        buildingId: task.assigned_building_id ?? task.buildingId ?? null,
        completedAt: task.completed_at
          ? new Date(task.completed_at).toISOString()
          : new Date().toISOString(),
        taskName: task.name ?? task.taskName ?? 'Task',
        category: task.category ?? 'operations',
        durationMinutes: task.actual_duration ?? task.estimated_duration ?? null,
      });

      this.completedTaskIds.add(taskId);
    }

    // Remove tasks that are no longer completed so we can rebroadcast when they are completed again
    for (const taskId of Array.from(this.completedTaskIds)) {
      if (!currentlyCompletedIds.has(taskId)) {
        this.completedTaskIds.delete(taskId);
      }
    }
  }

  private async syncWorkerStatuses(tasks?: any[]): Promise<void> {
    const workers = await this.database.getWorkers();
    const taskList = tasks ?? await this.database.getTasks();

    if (!Array.isArray(workers) || !Array.isArray(taskList)) {
      return;
    }

    for (const worker of workers) {
      const workerId = String(worker.id);
      const assignedTasks = taskList.filter(task => (task.assigned_worker_id ?? task.workerId) === workerId);
      const activeTask = assignedTasks.find(task => {
        const status = (task.status || '').toString().toLowerCase();
        return status === 'in progress' || status === 'pending';
      });

      const status =
        worker.status ||
        (activeTask ? (activeTask.status ?? 'In Progress') : 'Available');

      const payload = {
        workerId,
        name: worker.name,
        status,
        lastSeen: new Date().toISOString(),
        currentBuilding: activeTask?.assigned_building_id ?? null,
        activeTask: activeTask?.name ?? null,
        pendingTasks: assignedTasks.filter(task => (task.status || '').toString().toLowerCase() === 'pending').length,
      };

      const snapshot = JSON.stringify(payload);
      if (this.lastWorkerSnapshots.get(workerId) === snapshot) {
        continue;
      }

      this.lastWorkerSnapshots.set(workerId, snapshot);
      this.webSocketManager.broadcast('worker_status', payload);
    }
  }

  private async syncBuildingUpdates(): Promise<void> {
    const buildings = await this.database.getBuildings();

    if (!Array.isArray(buildings)) {
      return;
    }

    for (const building of buildings) {
      const payload = {
        buildingId: building.id,
        name: building.name,
        lastUpdate: building.updated_at || new Date().toISOString(),
        status: building.is_active ? 'active' : 'inactive',
        complianceScore: building.compliance_score ?? null,
        borough: building.borough ?? null,
      };

      const snapshot = JSON.stringify(payload);
      if (this.lastBuildingSnapshots.get(building.id) === snapshot) {
        continue;
      }

      this.lastBuildingSnapshots.set(building.id, snapshot);
      this.webSocketManager.broadcast('building_update', payload);
    }
  }

  private async syncInventoryChanges(): Promise<void> {
    const lowStockItems = await this.database.query(
      `
        SELECT id, name, building_id, current_stock, minimum_stock, category
        FROM inventory_items
        WHERE current_stock <= minimum_stock
      `
    );

    if (!Array.isArray(lowStockItems) || lowStockItems.length === 0) {
      this.lastInventorySnapshot.clear();
      return;
    }

    for (const item of lowStockItems) {
      const buildingId = item.building_id ?? 'unassigned';
      const payload = {
        buildingId,
        timestamp: new Date().toISOString(),
        itemId: item.id,
        name: item.name,
        currentStock: item.current_stock,
        minimumStock: item.minimum_stock,
        category: item.category,
      };

      const snapshotKey = `${buildingId}:${item.id}:${item.current_stock}`;
      if (this.lastInventorySnapshot.get(item.id) === snapshotKey) {
        continue;
      }

      this.lastInventorySnapshot.set(item.id, snapshotKey);
      this.webSocketManager.broadcast('inventory_change', payload);
    }
  }

  private async broadcastWeeklyAnalytics(): Promise<void> {
    const now = new Date();
    const sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sinceIso = sinceDate.toISOString();

    const completions = await this.database.getCompletedTasksSince(sinceIso);
    if (!Array.isArray(completions)) {
      return;
    }

    const byWorkerMap = new Map<
      string,
      { workerId: string; workerName: string; completed: number }
    >();
    const byBuildingMap = new Map<
      string,
      { buildingId: string; buildingName: string; completed: number }
    >();
    const timelineMap = new Map<string, number>();

    completions.forEach((task) => {
      const workerId = String(task.assigned_worker_id ?? task.workerId ?? 'unassigned');
      const workerName = task.worker_name ?? workerId;
      const buildingId = String(task.assigned_building_id ?? task.buildingId ?? 'unassigned');
      const buildingName = task.building_name ?? buildingId;
      const completedAt = task.completed_at ? new Date(task.completed_at) : now;
      const dateKey = completedAt.toISOString().split('T')[0];

      const workerEntry = byWorkerMap.get(workerId) ?? {
        workerId,
        workerName,
        completed: 0,
      };
      workerEntry.completed += 1;
      byWorkerMap.set(workerId, workerEntry);

      const buildingEntry = byBuildingMap.get(buildingId) ?? {
        buildingId,
        buildingName,
        completed: 0,
      };
      buildingEntry.completed += 1;
      byBuildingMap.set(buildingId, buildingEntry);

      timelineMap.set(dateKey, (timelineMap.get(dateKey) ?? 0) + 1);
    });

    const analyticsPayload = {
      since: sinceIso,
      until: now.toISOString(),
      totalCompleted: completions.length,
      byWorker: Array.from(byWorkerMap.values()).sort(
        (a, b) => b.completed - a.completed
      ),
      byBuilding: Array.from(byBuildingMap.values()).sort(
        (a, b) => b.completed - a.completed
      ),
      timeline: Array.from(timelineMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, completed]) => ({ date, completed })),
    };

    const snapshot = JSON.stringify(analyticsPayload);
    if (this.lastAnalyticsSnapshot === snapshot) {
      return;
    }

    this.lastAnalyticsSnapshot = snapshot;

    this.webSocketManager.broadcast('analytics_update', analyticsPayload);
    this.emitEvent({
      id: `analytics_update_${Date.now()}`,
      type: 'analytics_update',
      timestamp: new Date(),
      data: analyticsPayload,
    });
  }

  // MARK: - Public API

  public async broadcastTaskCompletion(taskId: string, workerId: string, buildingId: string): Promise<void> {
    if (!this.isConnected) return;

    this.webSocketManager.broadcast('task_completed', {
      taskId,
      workerId,
      buildingId,
      completedAt: new Date().toISOString()
    });
  }

  public async broadcastWorkerStatus(workerId: string, status: string, buildingId?: string): Promise<void> {
    if (!this.isConnected) return;

    this.webSocketManager.broadcast('worker_status', {
      workerId,
      status,
      buildingId,
      timestamp: new Date().toISOString()
    });
  }

  public async broadcastBuildingUpdate(buildingId: string, updates: any): Promise<void> {
    if (!this.isConnected) return;

    this.webSocketManager.broadcast('building_update', {
      buildingId,
      updates,
      timestamp: new Date().toISOString()
    });
  }

  public isSyncEnabled(): boolean {
    return this.config.enableRealTimeSync && this.isConnected;
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.config.enableRealTimeSync) return 'disconnected';
    return this.isConnected ? 'connected' : 'disconnected';
  }
}
