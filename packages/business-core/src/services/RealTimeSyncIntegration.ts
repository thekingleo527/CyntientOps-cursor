/**
 * 🔄 Real-Time Sync Integration Service
 * Purpose: Integrates WebSocket sync with existing services and UI components
 * Features: Service integration, UI updates, conflict resolution, data consistency
 */

import { Logger } from './LoggingService';
import { OptimizedWebSocketManager } from './OptimizedWebSocketManager';
import { RealTimeMessageRouter, MessageContext } from './RealTimeMessageRouter';
import { OfflineSupportManager } from './OfflineSupportManager';

export interface SyncEvent {
  type: string;
  entityId: string;
  entityType: string;
  data: any;
  timestamp: number;
  userId: string;
  version: number;
}

export interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  resolvedData: any;
  conflicts: Conflict[];
}

export interface Conflict {
  field: string;
  serverValue: any;
  clientValue: any;
  resolution: 'server' | 'client' | 'merged';
}

export class RealTimeSyncIntegration {
  private static instance: RealTimeSyncIntegration;
  private webSocketManager: OptimizedWebSocketManager | null = null;
  private messageRouter: RealTimeMessageRouter | null = null;
  private offlineManager: OfflineSupportManager | null = null;
  private syncListeners: Map<string, Set<(event: SyncEvent) => void>> = new Map();
  private conflictResolvers: Map<string, (conflict: Conflict) => any> = new Map();
  private isInitialized = false;

  private constructor() {
    this.setupDefaultConflictResolvers();
  }

  public static getInstance(): RealTimeSyncIntegration {
    if (!RealTimeSyncIntegration.instance) {
      RealTimeSyncIntegration.instance = new RealTimeSyncIntegration();
    }
    return RealTimeSyncIntegration.instance;
  }

  public async initialize(
    webSocketManager: OptimizedWebSocketManager,
    messageRouter: RealTimeMessageRouter,
    offlineManager: OfflineSupportManager,
    context: MessageContext
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.webSocketManager = webSocketManager;
    this.messageRouter = messageRouter;
    this.offlineManager = offlineManager;

    // Initialize message router
    this.messageRouter.initialize(webSocketManager, context);

    // Setup event listeners
    this.setupEventListeners();

    // Connect WebSocket
    await this.webSocketManager.connect();

    this.isInitialized = true;
    Logger.info('Real-time sync integration initialized', 'RealTimeSyncIntegration');
  }

  private setupEventListeners(): void {
    // Listen for WebSocket events
    if (this.webSocketManager) {
      this.webSocketManager.addListener('sync-integration', (message) => {
        this.handleWebSocketMessage(message);
      });
    }

    // Listen for offline sync events
    if (this.offlineManager) {
      // This would integrate with the offline manager's sync events
      // For now, we'll simulate the integration
    }
  }

  private async handleWebSocketMessage(message: any): Promise<void> {
    try {
      const syncEvent: SyncEvent = {
        type: message.type,
        entityId: message.data.id || message.data.entityId,
        entityType: message.data.entityType || this.getEntityTypeFromMessage(message),
        data: message.data,
        timestamp: message.timestamp || Date.now(),
        userId: message.data.userId || 'unknown',
        version: message.data.version || 1,
      };

      // Check for conflicts
      const conflict = await this.checkForConflicts(syncEvent);
      if (conflict) {
        await this.resolveConflict(conflict, syncEvent);
      } else {
        await this.processSyncEvent(syncEvent);
      }
    } catch (error) {
      Logger.error('Error handling WebSocket message', error, 'RealTimeSyncIntegration');
    }
  }

  private getEntityTypeFromMessage(message: any): string {
    // Determine entity type from message structure
    if (message.data.taskId) return 'task';
    if (message.data.buildingId) return 'building';
    if (message.data.workerId) return 'worker';
    if (message.data.clientId) return 'client';
    return 'unknown';
  }

  private async checkForConflicts(syncEvent: SyncEvent): Promise<Conflict[] | null> {
    // Check if there are local changes that conflict with incoming changes
    const localData = await this.getLocalData(syncEvent.entityType, syncEvent.entityId);
    
    if (!localData) {
      return null; // No local data, no conflict
    }

    const conflicts: Conflict[] = [];
    
    // Simple conflict detection - in production, you'd have more sophisticated logic
    for (const [field, value] of Object.entries(syncEvent.data)) {
      if (localData[field] !== undefined && localData[field] !== value) {
        conflicts.push({
          field,
          serverValue: value,
          clientValue: localData[field],
          resolution: 'server', // Default resolution
        });
      }
    }

    return conflicts.length > 0 ? conflicts : null;
  }

  private async resolveConflict(conflicts: Conflict[], syncEvent: SyncEvent): Promise<void> {
    Logger.warn(`Resolving ${conflicts.length} conflicts for ${syncEvent.entityType}:${syncEvent.entityId}`, 'RealTimeSyncIntegration');

    const resolution: ConflictResolution = {
      strategy: 'server_wins', // Default strategy
      resolvedData: { ...syncEvent.data },
      conflicts,
    };

    // Apply conflict resolution
    for (const conflict of conflicts) {
      const resolver = this.conflictResolvers.get(conflict.field);
      if (resolver) {
        resolution.resolvedData[conflict.field] = resolver(conflict);
      } else {
        // Default resolution strategy
        resolution.resolvedData[conflict.field] = conflict.serverValue;
        conflict.resolution = 'server';
      }
    }

    // Update local data with resolved values
    await this.updateLocalData(syncEvent.entityType, syncEvent.entityId, resolution.resolvedData);

    // Emit conflict resolved event
    this.emitSyncEvent('conflict-resolved', {
      ...syncEvent,
      data: resolution.resolvedData,
      // conflicts: resolution.conflicts, // Removed: conflicts property doesn't exist on SyncEvent
    });
  }

  private async processSyncEvent(syncEvent: SyncEvent): Promise<void> {
    try {
      // Update local data
      await this.updateLocalData(syncEvent.entityType, syncEvent.entityId, syncEvent.data);

      // Cache the update
      if (this.offlineManager) {
        await this.offlineManager.cacheData(
          `${syncEvent.entityType}:${syncEvent.entityId}`,
          syncEvent.data
        );
      }

      // Emit sync event to listeners
      this.emitSyncEvent('data-synced', syncEvent);

      Logger.debug(`Processed sync event: ${syncEvent.type} for ${syncEvent.entityType}:${syncEvent.entityId}`, 'RealTimeSyncIntegration');
    } catch (error) {
      Logger.error('Error processing sync event', error, 'RealTimeSyncIntegration');
    }
  }

  private async getLocalData(entityType: string, entityId: string): Promise<any> {
    // This would integrate with your local database/storage
    // For now, we'll return null to indicate no local data
    return null;
  }

  private async updateLocalData(entityType: string, entityId: string, data: any): Promise<void> {
    // This would integrate with your local database/storage
    // For now, we'll just log the update
    Logger.debug(`Updating local data for ${entityType}:${entityId}`, 'RealTimeSyncIntegration');
  }

  private setupDefaultConflictResolvers(): void {
    // Task status conflicts - server wins for status changes
    this.conflictResolvers.set('status', (conflict) => {
      if (conflict.serverValue === 'completed' || conflict.serverValue === 'cancelled') {
        return conflict.serverValue; // Server wins for final states
      }
      return conflict.clientValue; // Client wins for in-progress states
    });

    // Timestamp conflicts - always use the latest
    this.conflictResolvers.set('timestamp', (conflict) => {
      return Math.max(conflict.serverValue, conflict.clientValue);
    });

    // Description conflicts - merge both
    this.conflictResolvers.set('description', (conflict) => {
      if (conflict.serverValue && conflict.clientValue) {
        return `${conflict.clientValue}\n\n[Updated: ${conflict.serverValue}]`;
      }
      return conflict.serverValue || conflict.clientValue;
    });
  }

  public addSyncListener(entityType: string, callback: (event: SyncEvent) => void): void {
    if (!this.syncListeners.has(entityType)) {
      this.syncListeners.set(entityType, new Set());
    }
    this.syncListeners.get(entityType)!.add(callback);
  }

  public removeSyncListener(entityType: string, callback: (event: SyncEvent) => void): void {
    const listeners = this.syncListeners.get(entityType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emitSyncEvent(eventType: string, syncEvent: SyncEvent): void {
    const listeners = this.syncListeners.get(syncEvent.entityType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(syncEvent);
        } catch (error) {
          Logger.error('Error in sync listener callback', error, 'RealTimeSyncIntegration');
        }
      });
    }

    // Also emit to global listeners
    const globalListeners = this.syncListeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(syncEvent);
        } catch (error) {
          Logger.error('Error in global sync listener callback', error, 'RealTimeSyncIntegration');
        }
      });
    }
  }

  public async sendSyncEvent(syncEvent: Omit<SyncEvent, 'timestamp' | 'version'>): Promise<void> {
    if (!this.webSocketManager || !this.webSocketManager.isConnected()) {
      // Queue for offline sync
      if (this.offlineManager) {
        await this.offlineManager.queueSyncAction({
          type: 'UPDATE',
          entity: syncEvent.entityType,
          data: syncEvent,
          maxRetries: 3, // Added missing maxRetries property
        });
      }
      return;
    }

    const fullSyncEvent: SyncEvent = {
      ...syncEvent,
      timestamp: Date.now(),
      version: 1, // This would be incremented based on local version
    };

    const success = this.webSocketManager.send({
      type: 'sync_event',
      data: fullSyncEvent,
      timestamp: Date.now(),
    });

    if (!success) {
      Logger.warn('Failed to send sync event via WebSocket', 'RealTimeSyncIntegration');
      // Queue for retry
      if (this.offlineManager) {
        await this.offlineManager.queueSyncAction({
          type: 'UPDATE',
          entity: syncEvent.entityType,
          data: syncEvent,
          maxRetries: 3, // Added missing maxRetries property
        });
      }
    }
  }

  public getSyncStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.webSocketManager?.isConnected() || false,
      connectionState: this.webSocketManager?.getConnectionState() || 'CLOSED',
      listenerCount: Array.from(this.syncListeners.values()).reduce((sum, set) => sum + set.size, 0),
      conflictResolverCount: this.conflictResolvers.size,
    };
  }

  public destroy(): void {
    if (this.webSocketManager) {
      this.webSocketManager.removeListener('sync-integration');
    }

    this.syncListeners.clear();
    this.conflictResolvers.clear();
    this.webSocketManager = null;
    this.messageRouter = null;
    this.offlineManager = null;
    this.isInitialized = false;

    Logger.info('Real-time sync integration destroyed', 'RealTimeSyncIntegration');
  }

  public static destroyInstance(): void {
    if (RealTimeSyncIntegration.instance) {
      RealTimeSyncIntegration.instance.destroy();
      RealTimeSyncIntegration.instance = null as any;
    }
  }
}

export default RealTimeSyncIntegration;
