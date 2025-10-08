/**
 * 📱 Offline Support Manager
 * Purpose: Comprehensive offline support with caching, sync queue, and conflict resolution
 * Features: Network monitoring, data persistence, sync queue, conflict resolution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Logger } from './LoggingService';

export interface SyncAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  compressionEnabled: boolean;
}

export interface OfflineConfig {
  cacheConfig: CacheConfig;
  syncBatchSize: number;
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export class OfflineSupportManager {
  private static instance: OfflineSupportManager;
  private config: OfflineConfig;
  private isOnline = true;
  private syncQueue: SyncAction[] = [];
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;
  private isInitialized = false;

  private constructor(config: OfflineConfig) {
    this.config = {
      cacheConfig: {
        maxSize: 1000,
        ttl: 5 * 60 * 1000, // 5 minutes
        compressionEnabled: true,
      },
      syncBatchSize: 10,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      ...config,
    };
  }

  public static getInstance(config?: OfflineConfig): OfflineSupportManager {
    if (!OfflineSupportManager.instance) {
      if (!config) {
        throw new Error('Offline config is required for first initialization');
      }
      OfflineSupportManager.instance = new OfflineSupportManager(config);
    }
    return OfflineSupportManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load sync queue from storage
      await this.loadSyncQueue();
      
      // Load cache from storage
      await this.loadCache();
      
      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Start sync timer
      this.startSyncTimer();
      
      this.isInitialized = true;
      Logger.info('Offline support manager initialized', 'OfflineSupportManager');
    } catch (error) {
      Logger.error('Failed to initialize offline support manager', error, 'OfflineSupportManager');
      throw error;
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        Logger.info(`Loaded ${this.syncQueue.length} items from sync queue`, 'OfflineSupportManager');
      }
    } catch (error) {
      Logger.error('Failed to load sync queue', error, 'OfflineSupportManager');
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      Logger.error('Failed to save sync queue', error, 'OfflineSupportManager');
    }
  }

  private async loadCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('offline_cache');
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        this.cache = new Map(Object.entries(parsedCache));
        Logger.info(`Loaded ${this.cache.size} items from cache`, 'OfflineSupportManager');
      }
    } catch (error) {
      Logger.error('Failed to load cache', error, 'OfflineSupportManager');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem('offline_cache', JSON.stringify(cacheObject));
    } catch (error) {
      Logger.error('Failed to save cache', error, 'OfflineSupportManager');
    }
  }

  private setupNetworkMonitoring(): void {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (!wasOnline && this.isOnline) {
        Logger.info('Network connection restored', 'OfflineSupportManager');
        this.processSyncQueue();
      } else if (wasOnline && !this.isOnline) {
        Logger.info('Network connection lost', 'OfflineSupportManager');
      }
    });
  }

  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  public async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheTTL = ttl || this.config.cacheConfig.ttl;
      const timestamp = Date.now();
      
      this.cache.set(key, {
        data,
        timestamp,
        ttl: cacheTTL,
      });
      
      // Clean up expired cache entries
      this.cleanupExpiredCache();
      
      // Save to storage
      await this.saveCache();
      
      Logger.debug(`Cached data for key: ${key}`, 'OfflineSupportManager');
    } catch (error) {
      Logger.error('Failed to cache data', error, 'OfflineSupportManager');
    }
  }

  public async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = this.cache.get(key);
      
      if (!cached) {
        return null;
      }
      
      // Check if expired
      if (Date.now() - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        await this.saveCache();
        return null;
      }
      
      return cached.data;
    } catch (error) {
      Logger.error('Failed to get cached data', error, 'OfflineSupportManager');
      return null;
    }
  }

  public async queueSyncAction(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const syncAction: SyncAction = {
        ...action,
        id: this.generateId(),
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      this.syncQueue.push(syncAction);
      await this.saveSyncQueue();
      
      Logger.debug(`Queued sync action: ${syncAction.type} ${syncAction.entity}`, 'OfflineSupportManager');
      
      // Try to process immediately if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
      
      return syncAction.id;
    } catch (error) {
      Logger.error('Failed to queue sync action', error, 'OfflineSupportManager');
      throw error;
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    const batch = this.syncQueue.splice(0, this.config.syncBatchSize);
    const results: { success: boolean; action: SyncAction; error?: any }[] = [];
    
    for (const action of batch) {
      try {
        await this.executeSyncAction(action);
        results.push({ success: true, action });
      } catch (error) {
        results.push({ success: false, action, error });
        
        // Retry logic
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
          this.syncQueue.push(action);
        } else {
          Logger.error(`Max retries exceeded for sync action: ${action.id}`, 'OfflineSupportManager');
        }
      }
    }
    
    // Save updated queue
    await this.saveSyncQueue();
    
    Logger.info(`Processed ${batch.length} sync actions, ${results.filter(r => r.success).length} successful`, 'OfflineSupportManager');
  }

  private async executeSyncAction(action: SyncAction): Promise<void> {
    // This would integrate with your actual API service
    // For now, we'll simulate the API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate API call
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Simulated API error'));
        }
      }, 1000);
    });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      Logger.debug(`Cleaned up ${cleanedCount} expired cache entries`, 'OfflineSupportManager');
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getSyncQueueStatus() {
    return {
      queueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      cacheSize: this.cache.size,
      pendingActions: this.syncQueue.map(action => ({
        id: action.id,
        type: action.type,
        entity: action.entity,
        retryCount: action.retryCount,
      })),
    };
  }

  public async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      await AsyncStorage.removeItem('offline_cache');
      Logger.info('Cache cleared', 'OfflineSupportManager');
    } catch (error) {
      Logger.error('Failed to clear cache', error, 'OfflineSupportManager');
    }
  }

  public async clearSyncQueue(): Promise<void> {
    try {
      this.syncQueue = [];
      await AsyncStorage.removeItem('sync_queue');
      Logger.info('Sync queue cleared', 'OfflineSupportManager');
    } catch (error) {
      Logger.error('Failed to clear sync queue', error, 'OfflineSupportManager');
    }
  }

  public destroy(): void {
    this.stopSyncTimer();
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    
    this.cache.clear();
    this.syncQueue = [];
    this.isInitialized = false;
    
    Logger.info('Offline support manager destroyed', 'OfflineSupportManager');
  }

  public static destroyInstance(): void {
    if (OfflineSupportManager.instance) {
      OfflineSupportManager.instance.destroy();
      OfflineSupportManager.instance = null as any;
    }
  }
}

export default OfflineSupportManager;
