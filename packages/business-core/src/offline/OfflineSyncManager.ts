/**
 * 📱 Offline Sync Manager
 * Purpose: Offline-first data synchronization with conflict resolution
 * Mirrors: SwiftUI offline capabilities with enhanced React Native features
 * Features: Queue management, conflict resolution, background sync, and data persistence
 */

import { DatabaseManager } from '@cyntientops/database';
import { ServiceContainer } from '../ServiceContainer';
import { RealTimeCommunicationService } from '../services/RealTimeCommunicationService';
import { UserRole } from '@cyntientops/domain-schema';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'worker' | 'building' | 'clock_in' | 'photo' | 'note';
  entityId: string;
  data: any;
  timestamp: Date;
  userId: string;
  userRole: UserRole;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  error?: string;
  conflictResolution?: 'server_wins' | 'client_wins' | 'merge' | 'manual';
}

export interface SyncConflict {
  id: string;
  operationId: string;
  serverData: any;
  clientData: any;
  conflictType: 'data_mismatch' | 'concurrent_edit' | 'deletion_conflict';
  resolution: 'pending' | 'resolved';
  resolvedData?: any;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface SyncStats {
  totalOperations: number;
  pendingOperations: number;
  completedOperations: number;
  failedOperations: number;
  conflictOperations: number;
  lastSyncTime: Date | null;
  nextSyncTime: Date | null;
  isOnline: boolean;
  syncInProgress: boolean;
}

export interface OfflineConfig {
  enableOfflineMode: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  conflictResolutionStrategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  enableBackgroundSync: boolean;
  enableConflictResolution: boolean;
  maxQueueSize: number;
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private database: DatabaseManager;
  private serviceContainer: ServiceContainer;
  private realTimeService: RealTimeCommunicationService;
  private config: OfflineConfig;
  private syncQueue: SyncOperation[] = [];
  private conflicts: SyncConflict[] = [];
  private isOnline = true;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkListener: any = null;

  private constructor(
    database: DatabaseManager,
    serviceContainer: ServiceContainer,
    realTimeService: RealTimeCommunicationService,
    config: OfflineConfig
  ) {
    this.database = database;
    this.serviceContainer = serviceContainer;
    this.realTimeService = realTimeService;
    this.config = config;
    this.setupNetworkListener();
  }

  public static getInstance(
    database: DatabaseManager,
    serviceContainer: ServiceContainer,
    realTimeService: RealTimeCommunicationService,
    config?: Partial<OfflineConfig>
  ): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      const defaultConfig: OfflineConfig = {
        enableOfflineMode: true,
        syncInterval: 30000, // 30 seconds
        maxRetries: 3,
        conflictResolutionStrategy: 'server_wins',
        enableBackgroundSync: true,
        enableConflictResolution: true,
        maxQueueSize: 1000
      };

      OfflineSyncManager.instance = new OfflineSyncManager(
        database,
        serviceContainer,
        realTimeService,
        { ...defaultConfig, ...config }
      );
    }
    return OfflineSyncManager.instance;
  }

  // MARK: - Initialization

  /**
   * Initialize offline sync manager
   */
  async initialize(): Promise<void> {
    try {
      console.log('📱 Initializing Offline Sync Manager...');

      // Load pending operations from database
      await this.loadPendingOperations();

      // Load conflicts from database
      await this.loadConflicts();

      // Start periodic sync if enabled
      if (this.config.enableBackgroundSync) {
        this.startPeriodicSync();
      }

      console.log('✅ Offline Sync Manager initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Offline Sync Manager:', error);
      throw error;
    }
  }

  // MARK: - Operation Management

  /**
   * Queue operation for sync
   */
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    try {
      const operationId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const syncOperation: SyncOperation = {
        ...operation,
        id: operationId,
        timestamp: new Date(),
        retryCount: 0,
        status: 'pending'
      };

      // Add to queue
      this.syncQueue.push(syncOperation);

      // Store in database
      await this.storeOperation(syncOperation);

      // Try immediate sync if online
      if (this.isOnline && !this.isSyncing) {
        this.syncOperations();
      }

      console.log(`📱 Operation queued: ${operation.type} ${operation.entity} (${operationId})`);
      return operationId;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }

  /**
   * Queue task creation
   */
  async queueTaskCreation(taskData: any, userId: string, userRole: UserRole): Promise<string> {
    return await this.queueOperation({
      type: 'create',
      entity: 'task',
      entityId: taskData.id || `temp_${Date.now()}`,
      data: taskData,
      userId,
      userRole,
      maxRetries: this.config.maxRetries,
      priority: 'medium'
    });
  }

  /**
   * Queue task update
   */
  async queueTaskUpdate(taskId: string, updates: any, userId: string, userRole: UserRole): Promise<string> {
    return await this.queueOperation({
      type: 'update',
      entity: 'task',
      entityId: taskId,
      data: updates,
      userId,
      userRole,
      maxRetries: this.config.maxRetries,
      priority: 'medium'
    });
  }

  /**
   * Queue clock in/out
   */
  async queueClockOperation(operation: 'clock_in' | 'clock_out', data: any, userId: string, userRole: UserRole): Promise<string> {
    return await this.queueOperation({
      type: 'create',
      entity: 'clock_in',
      entityId: `clock_${Date.now()}`,
      data: { operation, ...data },
      userId,
      userRole,
      maxRetries: this.config.maxRetries,
      priority: 'high'
    });
  }

  /**
   * Queue photo upload
   */
  async queuePhotoUpload(photoData: any, userId: string, userRole: UserRole): Promise<string> {
    return await this.queueOperation({
      type: 'create',
      entity: 'photo',
      entityId: photoData.id || `photo_${Date.now()}`,
      data: photoData,
      userId,
      userRole,
      maxRetries: this.config.maxRetries,
      priority: 'low'
    });
  }

  // MARK: - Sync Operations

  /**
   * Start sync process
   */
  async syncOperations(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`📱 Starting sync of ${this.syncQueue.length} operations`);

    try {
      // Sort operations by priority and timestamp
      const sortedOperations = this.syncQueue
        .filter(op => op.status === 'pending')
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
    }
          
          return a.timestamp.getTime() - b.timestamp.getTime();
    });

      // Process operations in batches
      const batchSize = 10;
      for (let i = 0; i < sortedOperations.length; i += batchSize) {
        const batch = sortedOperations.slice(i, i + batchSize);
        await this.processBatch(batch);
      }

      // Clean up completed operations
      await this.cleanupCompletedOperations();

      console.log('✅ Sync completed successfully');

    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process batch of operations
   */
  private async processBatch(operations: SyncOperation[]): Promise<void> {
    const promises = operations.map(operation => this.processOperation(operation));
    await Promise.allSettled(promises);
  }

  /**
   * Process individual operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    try {
      // Update status to syncing
      operation.status = 'syncing';
      await this.updateOperationStatus(operation.id, 'syncing');

      // Execute operation based on type
      let success = false;
      
      switch (operation.entity) {
        case 'task':
          success = await this.syncTaskOperation(operation);
          break;
        case 'clock_in':
          success = await this.syncClockOperation(operation);
          break;
        case 'photo':
          success = await this.syncPhotoOperation(operation);
          break;
        case 'worker':
          success = await this.syncWorkerOperation(operation);
          break;
        case 'building':
          success = await this.syncBuildingOperation(operation);
          break;
        case 'note':
          success = await this.syncNoteOperation(operation);
          break;
      }

      if (success) {
        operation.status = 'completed';
        await this.updateOperationStatus(operation.id, 'completed');
        console.log(`✅ Operation completed: ${operation.type} ${operation.entity}`);
      } else {
        throw new Error('Operation failed');
      }

    } catch (error) {
      console.error(`❌ Operation failed: ${operation.type} ${operation.entity}`, error);
      
      operation.retryCount++;
      operation.error = error.message;
      
      if (operation.retryCount >= operation.maxRetries) {
        operation.status = 'failed';
        await this.updateOperationStatus(operation.id, 'failed');
      } else {
        operation.status = 'pending';
        await this.updateOperationStatus(operation.id, 'pending');
      }
    }
  }

  // MARK: - Entity-Specific Sync

  /**
   * Sync task operation
   */
  private async syncTaskOperation(operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'create': {
          const taskId = await this.serviceContainer.databaseIntegration.createTask(operation.data);
          return !!taskId;
    }
          
        case 'update':
          return await this.serviceContainer.databaseIntegration.updateTaskStatus(
      operation.entityId,
            operation.data.status,
            operation.data.completionNotes
          );
          
        case 'delete':
          // Implement task deletion
          return true;
      default:
          return false;
    }
    } catch (error) {
      console.error('Task sync failed:', error);
      return false;
    }
  }

  /**
   * Sync clock operation
   */
  private async syncClockOperation(operation: SyncOperation): Promise<boolean> {
    try {
      const { operation: clockOp, buildingId } = operation.data;
      
      switch (clockOp) {
        case 'clock_in':
          return await this.serviceContainer.databaseIntegration.clockInWorker(
      operation.userId,
            buildingId
          );
          
        case 'clock_out':
          return await this.serviceContainer.databaseIntegration.clockOutWorker(
      operation.userId
          );
          
        default:
          return false;
    }
    } catch (error) {
      console.error('Clock sync failed:', error);
      return false;
    }
  }

  /**
   * Sync photo operation
   */
  private async syncPhotoOperation(operation: SyncOperation): Promise<boolean> {
    try {
      // Implement photo upload to server
      // For now, just return true as placeholder
      return true;
    } catch (error) {
      console.error('Photo sync failed:', error);
      return false;
    }
  }

  /**
   * Sync worker operation
   */
  private async syncWorkerOperation(operation: SyncOperation): Promise<boolean> {
    try {
      // Implement worker data sync
      return true;
    } catch (error) {
      console.error('Worker sync failed:', error);
      return false;
    }
  }

  /**
   * Sync building operation
   */
  private async syncBuildingOperation(operation: SyncOperation): Promise<boolean> {
    try {
      // Implement building data sync
      return true;
    } catch (error) {
      console.error('Building sync failed:', error);
      return false;
    }
  }

  /**
   * Sync note operation
   */
  private async syncNoteOperation(operation: SyncOperation): Promise<boolean> {
    try {
      // Implement note sync
      return true;
    } catch (error) {
      console.error('Note sync failed:', error);
      return false;
    }
  }

  // MARK: - Conflict Resolution

  /**
   * Handle sync conflict
   */
  async handleConflict(operation: SyncOperation, serverData: any): Promise<void> {
    try {
      const conflict: SyncConflict = {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operationId: operation.id,
        serverData,
        clientData: operation.data,
        conflictType: this.detectConflictType(operation.data, serverData),
        resolution: 'pending'
      };

      this.conflicts.push(conflict);
      operation.status = 'conflict';
      
      await this.storeConflict(conflict);
      await this.updateOperationStatus(operation.id, 'conflict');

      console.log(`⚠️ Conflict detected: ${operation.type} ${operation.entity}`);

    } catch (error) {
      console.error('Failed to handle conflict:', error);
    }
  }

  /**
   * Detect conflict type
   */
  private detectConflictType(clientData: any, serverData: any): SyncConflict['conflictType'] {
    // Simple conflict detection logic
    if (clientData.deleted && !serverData.deleted) {
      return 'deletion_conflict';
    }
    
    if (clientData.updatedAt && serverData.updatedAt && 
        new Date(clientData.updatedAt) > new Date(serverData.updatedAt)) {
      return 'concurrent_edit';
    }
    
    return 'data_mismatch';
    }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId: string, resolution: SyncConflict['conflictResolution'], resolvedData?: any): Promise<boolean> {
    try {
      const conflict = this.conflicts.find(c => c.id === conflictId);
      if (!conflict) return false;
      conflict.resolution = 'resolved';
      conflict.resolvedData = resolvedData;
      conflict.resolvedBy = 'user'; // In real implementation, use actual user ID
      conflict.resolvedAt = new Date();

      // Update conflict in database
      await this.updateConflict(conflict);

      // Retry the operation
      const operation = this.syncQueue.find(op => op.id === conflict.operationId);
      if (operation) {
        operation.status = 'pending';
        operation.data = resolvedData || operation.data;
        await this.updateOperationStatus(operation.id, 'pending');
        
        // Trigger sync
        this.syncOperations();
      }

      return true;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }
  }

  // MARK: - Network Management

  /**
   * Setup network listener
   */
  private setupNetworkListener(): void {
    // In React Native, you would use NetInfo
    // For now, we'll simulate network state changes
    this.isOnline = true;
  }

  /**
   * Handle network state change
   */
  private handleNetworkChange(isOnline: boolean): void {
    this.isOnline = isOnline;
    
    if (isOnline && this.syncQueue.length > 0) {
      console.log('🌐 Network restored, starting sync...');
      this.syncOperations();
    } else if (!isOnline) {
      console.log('📱 Network lost, operations will be queued');
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncOperations();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // MARK: - Database Operations

  /**
   * Store operation in database
   */
  private async storeOperation(operation: SyncOperation): Promise<void> {
    try {
      await this.database.execute(
        `INSERT INTO sync_operations (id, type, entity, entity_id, data, timestamp, user_id, user_role, 
         retry_count, max_retries, priority, status, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          operation.id,
          operation.type,
          operation.entity,
          operation.entityId,
          JSON.stringify(operation.data),
          operation.timestamp.toISOString(),
          operation.userId,
          operation.userRole,
          operation.retryCount,
          operation.maxRetries,
          operation.priority,
          operation.status,
          operation.error || null
        ]
      );
    } catch (error) {
      console.error('Failed to store operation:', error);
    }
  }

  /**
   * Update operation status
   */
  private async updateOperationStatus(operationId: string, status: SyncOperation['status']): Promise<void> {
    try {
      await this.database.execute(
        'UPDATE sync_operations SET status = ? WHERE id = ?',
        [status, operationId]
      );
    } catch (error) {
      console.error('Failed to update operation status:', error);
    }
  }

  /**
   * Load pending operations from database
   */
  private async loadPendingOperations(): Promise<void> {
    try {
      const result = await this.database.query(
        'SELECT * FROM sync_operations WHERE status IN ("pending", "failed") ORDER BY timestamp ASC'
      );

      this.syncQueue = result.map(row => ({
        id: row.id,
        type: row.type,
        entity: row.entity,
        entityId: row.entity_id,
        data: JSON.parse(row.data),
        timestamp: new Date(row.timestamp),
        userId: row.user_id,
        userRole: row.user_role,
        retryCount: row.retry_count,
        maxRetries: row.max_retries,
        priority: row.priority,
        status: row.status,
        error: row.error
      }));

      console.log(`📱 Loaded ${this.syncQueue.length} pending operations`);

    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }

  /**
   * Store conflict in database
   */
  private async storeConflict(conflict: SyncConflict): Promise<void> {
    try {
      await this.database.execute(
        `INSERT INTO sync_conflicts (id, operation_id, server_data, client_data, conflict_type, 
         resolution, resolved_data, resolved_by, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conflict.id,
          conflict.operationId,
          JSON.stringify(conflict.serverData),
          JSON.stringify(conflict.clientData),
          conflict.conflictType,
          conflict.resolution,
          conflict.resolvedData ? JSON.stringify(conflict.resolvedData) : null,
          conflict.resolvedBy || null,
          conflict.resolvedAt ? conflict.resolvedAt.toISOString() : null
        ]
      );
    } catch (error) {
      console.error('Failed to store conflict:', error);
    }
  }

  /**
   * Update conflict in database
   */
  private async updateConflict(conflict: SyncConflict): Promise<void> {
    try {
      await this.database.execute(
        `UPDATE sync_conflicts SET resolution = ?, resolved_data = ?, resolved_by = ?, resolved_at = ?
         WHERE id = ?`,
        [
          conflict.resolution,
          conflict.resolvedData ? JSON.stringify(conflict.resolvedData) : null,
          conflict.resolvedBy || null,
          conflict.resolvedAt ? conflict.resolvedAt.toISOString() : null,
          conflict.id
        ]
      );
    } catch (error) {
      console.error('Failed to update conflict:', error);
    }
  }

  /**
   * Load conflicts from database
   */
  private async loadConflicts(): Promise<void> {
    try {
      const result = await this.database.query(
        'SELECT * FROM sync_conflicts WHERE resolution = "pending"'
      );

      this.conflicts = result.map(row => ({
        id: row.id,
        operationId: row.operation_id,
        serverData: JSON.parse(row.server_data),
        clientData: JSON.parse(row.client_data),
        conflictType: row.conflict_type,
        resolution: row.resolution,
        resolvedData: row.resolved_data ? JSON.parse(row.resolved_data) : undefined,
        resolvedBy: row.resolved_by,
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined
      }));

      console.log(`📱 Loaded ${this.conflicts.length} pending conflicts`);

    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  /**
   * Cleanup completed operations
   */
  private async cleanupCompletedOperations(): Promise<void> {
    try {
      const completedOperations = this.syncQueue.filter(op => op.status === 'completed');
      
      if (completedOperations.length > 0) {
        const operationIds = completedOperations.map(op => op.id);
        
        await this.database.execute(
          `DELETE FROM sync_operations WHERE id IN (${operationIds.map(() => '?').join(',')})`,
          operationIds
        );

        // Remove from memory
        this.syncQueue = this.syncQueue.filter(op => op.status !== 'completed');
        
        console.log(`🧹 Cleaned up ${completedOperations.length} completed operations`);
      }

    } catch (error) {
      console.error('Failed to cleanup completed operations:', error);
    }
  }

  // MARK: - Public API

  /**
   * Get sync statistics
   */
  getSyncStats(): SyncStats {
    const now = new Date();
    const nextSync = this.isOnline ? new Date(now.getTime() + this.config.syncInterval) : null;

    return {
      totalOperations: this.syncQueue.length,
      pendingOperations: this.syncQueue.filter(op => op.status === 'pending').length,
      completedOperations: this.syncQueue.filter(op => op.status === 'completed').length,
      failedOperations: this.syncQueue.filter(op => op.status === 'failed').length,
      conflictOperations: this.syncQueue.filter(op => op.status === 'conflict').length,
      lastSyncTime: this.isSyncing ? now : null,
      nextSyncTime: nextSync,
      isOnline: this.isOnline,
      syncInProgress: this.isSyncing
    };
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): SyncConflict[] {
    return this.conflicts.filter(conflict => conflict.resolution === 'pending');
    }

  /**
   * Force sync
   */
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncOperations();
    }
  }

  /**
   * Clear all operations
   */
  async clearAllOperations(): Promise<void> {
    try {
      await this.database.execute('DELETE FROM sync_operations');
      await this.database.execute('DELETE FROM sync_conflicts');
      
      this.syncQueue = [];
      this.conflicts = [];
      
      console.log('🧹 All sync operations cleared');

    } catch (error) {
      console.error('Failed to clear operations:', error);
    }
  }

  /**
   * Destroy sync manager
   */
  async destroy(): Promise<void> {
    this.stopPeriodicSync();
    this.syncQueue = [];
    this.conflicts = [];
  }
}

export default OfflineSyncManager;
