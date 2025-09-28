/**
 * 🔄 Real-Time Sync Service
 * Mirrors: CyntientOps/Services/RealTime/RealTimeSyncService.swift
 * Purpose: Real-time synchronization of operational data across all clients
 */

import { OperationalDataManager } from '../OperationalDataManager';
import { WebSocketManager } from '@cyntientops/realtime-sync';

export interface SyncEvent {
  id: string;
  type: 'task_completed' | 'task_updated' | 'worker_status' | 'building_update' | 'inventory_change';
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
  private config: RealTimeSyncConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private isConnected = false;
  private eventListeners: Map<string, ((event: SyncEvent) => void)[]> = new Map();

  private constructor(
    operationalData: OperationalDataManager,
    webSocketManager: WebSocketManager,
    config: RealTimeSyncConfig
  ) {
    this.operationalData = operationalData;
    this.webSocketManager = webSocketManager;
    this.config = config;
  }

  public static getInstance(
    operationalData: OperationalDataManager,
    webSocketManager: WebSocketManager,
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
        defaultConfig
      );
    }
    return RealTimeSyncService.instance;
  }

  // MARK: - Connection Management

  public async start(): Promise<void> {
    if (!this.config.enableRealTimeSync) {
      console.log('🔄 Real-time sync disabled');
      return;
    }

    try {
      await this.webSocketManager.connect();
      this.isConnected = true;
      this.setupEventHandlers();
      this.startPeriodicSync();
      console.log('✅ Real-time sync started');
    } catch (error) {
      console.error('❌ Failed to start real-time sync:', error);
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

    console.log('🔄 Real-time sync stopped');
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
    console.log('📋 Task completed:', data.taskId);
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
    console.log('📋 Task updated:', data.taskId);
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
    console.log('👷 Worker status updated:', data.workerId);
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
    console.log('🏢 Building updated:', data.buildingId);
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
    console.log('📦 Inventory changed:', data.buildingId);
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
          console.error('❌ Error in event listener:', error);
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
        console.error('❌ Periodic sync failed:', error);
      }
    }, this.config.syncInterval);
  }

  private async syncOperationalData(): Promise<void> {
    if (!this.isConnected) return;

    try {
      // Sync task completions
      await this.syncTaskCompletions();
      
      // Sync worker statuses
      await this.syncWorkerStatuses();
      
      // Sync building updates
      await this.syncBuildingUpdates();
      
      // Sync inventory changes
      await this.syncInventoryChanges();

      console.log('🔄 Operational data synced');
    } catch (error) {
      console.error('❌ Failed to sync operational data:', error);
    }
  }

  private async syncTaskCompletions(): Promise<void> {
    // Get all completed tasks from operational data
    const completedTasks = this.operationalData.getAllTasks().filter(task => {
      // This would check against a completion status in a real implementation
      return false; // Placeholder
    });

    for (const task of completedTasks) {
      await this.webSocketManager.emit('task_completed', {
        taskId: task.buildingId + '_' + task.taskName,
        workerId: task.workerId,
        buildingId: task.buildingId,
        completedAt: new Date().toISOString(),
        taskName: task.taskName,
        category: task.category
      });
    }
  }

  private async syncWorkerStatuses(): Promise<void> {
    // Get all active workers
    const workers = this.operationalData.getAllWorkers();
    
    for (const worker of workers) {
      await this.webSocketManager.emit('worker_status', {
        workerId: worker.id,
        name: worker.name,
        status: 'active', // This would be determined by current tasks
        lastSeen: new Date().toISOString(),
        currentBuilding: null // This would be determined by current location
      });
    }
  }

  private async syncBuildingUpdates(): Promise<void> {
    // Get all buildings
    const buildings = this.operationalData.getAllBuildings();
    
    for (const building of buildings) {
      await this.webSocketManager.emit('building_update', {
        buildingId: building.id,
        name: building.name,
        lastUpdate: new Date().toISOString(),
        status: 'active'
      });
    }
  }

  private async syncInventoryChanges(): Promise<void> {
    // This would sync inventory changes in a real implementation
    // For now, we'll just emit a placeholder event
    await this.webSocketManager.emit('inventory_change', {
      buildingId: '1',
      timestamp: new Date().toISOString(),
      changes: []
    });
  }

  // MARK: - Public API

  public async broadcastTaskCompletion(taskId: string, workerId: string, buildingId: string): Promise<void> {
    if (!this.isConnected) return;

    await this.webSocketManager.emit('task_completed', {
      taskId,
      workerId,
      buildingId,
      completedAt: new Date().toISOString()
    });
  }

  public async broadcastWorkerStatus(workerId: string, status: string, buildingId?: string): Promise<void> {
    if (!this.isConnected) return;

    await this.webSocketManager.emit('worker_status', {
      workerId,
      status,
      buildingId,
      timestamp: new Date().toISOString()
    });
  }

  public async broadcastBuildingUpdate(buildingId: string, updates: any): Promise<void> {
    if (!this.isConnected) return;

    await this.webSocketManager.emit('building_update', {
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
