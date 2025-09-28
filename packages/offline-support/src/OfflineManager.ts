/**
 * 📱 Offline Manager
 * Mirrors: CyntientOps/Services/Offline/OfflineManager.swift
 * Purpose: Offline-first architecture with sync queues and conflict resolution
 */

import { DatabaseManager } from '@cyntientops/database';
import { CommandChainManager } from '@cyntientops/command-chains';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: any;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  retryCount: number;
  maxRetries: number;
  error?: string;
  conflictResolution?: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  serverVersion?: any;
  clientVersion?: any;
}

export interface SyncQueue {
  id: string;
  name: string;
  operations: SyncOperation[];
  status: 'idle' | 'syncing' | 'paused' | 'error';
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncInterval: number; // milliseconds
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoSync: boolean;
  conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  lastChecked: Date;
}

export interface OfflineConfig {
  enableOfflineMode: boolean;
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
  conflictResolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  maxQueueSize: number;
  enableConflictResolution: boolean;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private databaseManager: DatabaseManager;
  private commandChainManager: CommandChainManager;
  private syncQueues: Map<string, SyncQueue> = new Map();
  private operations: Map<string, SyncOperation> = new Map();
  private networkStatus: NetworkStatus;
  private config: OfflineConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();

  private constructor(
    databaseManager: DatabaseManager,
    commandChainManager: CommandChainManager
  ) {
    this.databaseManager = databaseManager;
    this.commandChainManager = commandChainManager;
    
    this.networkStatus = {
      isOnline: true,
      connectionType: 'wifi',
      quality: 'excellent',
      lastChecked: new Date()
    };
    
    this.config = {
      enableOfflineMode: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000,
      conflictResolution: 'merge',
      autoSync: true,
      syncOnWifiOnly: false,
      maxQueueSize: 1000,
      enableConflictResolution: true
    };
    
    this.initializeSyncQueues();
    this.startNetworkMonitoring();
  }

  public static getInstance(
    databaseManager: DatabaseManager,
    commandChainManager: CommandChainManager
  ): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager(
        databaseManager,
        commandChainManager
      );
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize sync queues for different entity types
   */
  private initializeSyncQueues(): void {
    const entityTypes = ['workers', 'buildings', 'clients', 'tasks', 'photos', 'clock_events'];
    
    entityTypes.forEach(entityType => {
      const queue: SyncQueue = {
        id: `queue_${entityType}`,
        name: `${entityType} Sync Queue`,
        operations: [],
        status: 'idle',
        syncInterval: this.config.syncInterval,
        priority: 'medium',
        autoSync: this.config.autoSync,
        conflictResolution: this.config.conflictResolution
      };
      
      this.syncQueues.set(queue.id, queue);
    });
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring(): void {
    // Simulate network monitoring
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  /**
   * Check network status
   */
  private checkNetworkStatus(): void {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine; // This would be more sophisticated in a real app
    
    if (this.isOnline !== wasOnline) {
      this.networkStatus = {
        isOnline: this.isOnline,
        connectionType: this.isOnline ? 'wifi' : 'unknown',
        quality: this.isOnline ? 'good' : 'poor',
        lastChecked: new Date()
      };
      
      this.notifyNetworkListeners();
      
      if (this.isOnline && this.config.autoSync) {
        this.startAutoSync();
      } else if (!this.isOnline) {
        this.stopAutoSync();
      }
    }
  }

  /**
   * Add operation to sync queue
   */
  public addSyncOperation(
    entityType: string,
    type: 'create' | 'update' | 'delete',
    entityId: string,
    data: any
  ): string {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueId = `queue_${entityType}`;
    
    const operation: SyncOperation = {
      id: operationId,
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };
    
    const queue = this.syncQueues.get(queueId);
    if (!queue) {
      throw new Error(`Sync queue not found: ${queueId}`);
    }
    
    // Check queue size limit
    if (queue.operations.length >= this.config.maxQueueSize) {
      throw new Error(`Sync queue is full: ${queueId}`);
    }
    
    queue.operations.push(operation);
    this.operations.set(operationId, operation);
    
    console.log(`Added sync operation: ${operationId} to queue: ${queueId}`);
    
    // Auto-sync if online and enabled
    if (this.isOnline && this.config.autoSync) {
      this.syncQueue(queueId);
    }
    
    return operationId;
  }

  /**
   * Sync a specific queue
   */
  public async syncQueue(queueId: string): Promise<boolean> {
    const queue = this.syncQueues.get(queueId);
    if (!queue) {
      throw new Error(`Sync queue not found: ${queueId}`);
    }
    
    if (!this.isOnline) {
      console.log(`Cannot sync queue ${queueId}: offline`);
      return false;
    }
    
    if (queue.status === 'syncing') {
      console.log(`Queue ${queueId} is already syncing`);
      return false;
    }
    
    queue.status = 'syncing';
    queue.lastSyncAt = new Date();
    
    try {
      const pendingOperations = queue.operations.filter(op => op.status === 'pending');
      
      for (const operation of pendingOperations) {
        await this.syncOperation(operation);
      }
      
      queue.status = 'idle';
      queue.nextSyncAt = new Date(Date.now() + queue.syncInterval);
      
      console.log(`Successfully synced queue: ${queueId}`);
      return true;
    } catch (error) {
      queue.status = 'error';
      console.error(`Failed to sync queue ${queueId}:`, error);
      return false;
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    operation.status = 'syncing';
    
    try {
      // Simulate API call
      await this.simulateAPICall(operation);
      
      operation.status = 'completed';
      console.log(`Successfully synced operation: ${operation.id}`);
    } catch (error) {
      operation.retryCount++;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (operation.retryCount < operation.maxRetries) {
        operation.status = 'pending';
        // Retry after delay
        setTimeout(() => {
          this.syncOperation(operation);
        }, this.config.retryDelay * operation.retryCount);
      } else {
        operation.status = 'failed';
        console.error(`Operation failed after ${operation.maxRetries} retries: ${operation.id}`);
      }
    }
  }

  /**
   * Simulate API call (would be replaced with actual API calls)
   */
  private async simulateAPICall(operation: SyncOperation): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error');
    }
    
    // Simulate conflict detection
    if (Math.random() < 0.05) {
      operation.status = 'conflict';
      operation.serverVersion = { ...operation.data, version: 2 };
      operation.clientVersion = { ...operation.data, version: 1 };
      
      if (this.config.enableConflictResolution) {
        await this.resolveConflict(operation);
      } else {
        throw new Error('Conflict detected - manual resolution required');
      }
    }
  }

  /**
   * Resolve conflict
   */
  private async resolveConflict(operation: SyncOperation): Promise<void> {
    switch (operation.conflictResolution || this.config.conflictResolution) {
      case 'server_wins':
        operation.data = operation.serverVersion;
        break;
      case 'client_wins':
        operation.data = operation.clientVersion;
        break;
      case 'merge':
        operation.data = this.mergeData(operation.clientVersion, operation.serverVersion);
        break;
      case 'manual':
        throw new Error('Manual conflict resolution required');
    }
    
    operation.status = 'pending';
    operation.retryCount = 0;
  }

  /**
   * Merge data from client and server versions
   */
  private mergeData(clientVersion: any, serverVersion: any): any {
    // Simple merge strategy - in a real app, this would be more sophisticated
    return {
      ...serverVersion,
      ...clientVersion,
      mergedAt: new Date().toISOString()
    };
  }

  /**
   * Start auto-sync
   */
  public startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.config.autoSync) {
        this.syncAllQueues();
      }
    }, this.config.syncInterval);
    
    console.log('Auto-sync started');
  }

  /**
   * Stop auto-sync
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    console.log('Auto-sync stopped');
  }

  /**
   * Sync all queues
   */
  public async syncAllQueues(): Promise<void> {
    if (!this.isOnline) {
      console.log('Cannot sync: offline');
      return;
    }
    
    const queues = Array.from(this.syncQueues.values());
    const syncPromises = queues.map(queue => this.syncQueue(queue.id));
    
    try {
      await Promise.allSettled(syncPromises);
      console.log('Completed sync of all queues');
    } catch (error) {
      console.error('Error syncing queues:', error);
    }
  }

  /**
   * Get sync queue status
   */
  public getSyncQueueStatus(queueId: string): SyncQueue | null {
    return this.syncQueues.get(queueId) || null;
  }

  /**
   * Get all sync queues
   */
  public getAllSyncQueues(): SyncQueue[] {
    return Array.from(this.syncQueues.values());
  }

  /**
   * Get operation status
   */
  public getOperationStatus(operationId: string): SyncOperation | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get pending operations count
   */
  public getPendingOperationsCount(): number {
    return Array.from(this.operations.values()).filter(op => op.status === 'pending').length;
  }

  /**
   * Get network status
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Subscribe to network status changes
   */
  public subscribeToNetworkStatus(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify network status listeners
   */
  private notifyNetworkListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.networkStatus });
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart auto-sync if interval changed
    if (config.syncInterval && this.syncInterval) {
      this.startAutoSync();
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): OfflineConfig {
    return { ...this.config };
  }

  /**
   * Clear completed operations
   */
  public clearCompletedOperations(): number {
    let clearedCount = 0;
    
    this.syncQueues.forEach(queue => {
      const completedOps = queue.operations.filter(op => op.status === 'completed');
      queue.operations = queue.operations.filter(op => op.status !== 'completed');
      
      completedOps.forEach(op => {
        this.operations.delete(op.id);
        clearedCount++;
      });
    });
    
    console.log(`Cleared ${clearedCount} completed operations`);
    return clearedCount;
  }

  /**
   * Get sync statistics
   */
  public getSyncStatistics(): {
    totalQueues: number;
    activeQueues: number;
    totalOperations: number;
    pendingOperations: number;
    completedOperations: number;
    failedOperations: number;
    conflictOperations: number;
    lastSyncAt?: Date;
    nextSyncAt?: Date;
  } {
    const queues = Array.from(this.syncQueues.values());
    const operations = Array.from(this.operations.values());
    
    const lastSyncAt = queues
      .filter(q => q.lastSyncAt)
      .sort((a, b) => (b.lastSyncAt?.getTime() || 0) - (a.lastSyncAt?.getTime() || 0))[0]?.lastSyncAt;
    
    const nextSyncAt = queues
      .filter(q => q.nextSyncAt)
      .sort((a, b) => (a.nextSyncAt?.getTime() || 0) - (b.nextSyncAt?.getTime() || 0))[0]?.nextSyncAt;
    
    return {
      totalQueues: queues.length,
      activeQueues: queues.filter(q => q.status === 'syncing').length,
      totalOperations: operations.length,
      pendingOperations: operations.filter(op => op.status === 'pending').length,
      completedOperations: operations.filter(op => op.status === 'completed').length,
      failedOperations: operations.filter(op => op.status === 'failed').length,
      conflictOperations: operations.filter(op => op.status === 'conflict').length,
      lastSyncAt,
      nextSyncAt
    };
  }

  /**
   * Force sync operation
   */
  public async forceSyncOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return false;
    }
    
    operation.retryCount = 0;
    operation.status = 'pending';
    
    try {
      await this.syncOperation(operation);
      return true;
    } catch (error) {
      console.error(`Failed to force sync operation ${operationId}:`, error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAutoSync();
    this.listeners.clear();
  }
}
