/**
 * 🔄 Real-Time Sync Hook
 * Purpose: React hook for real-time data synchronization
 * Features: Automatic updates, conflict resolution, offline support
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ServiceContainer } from '@cyntientops/business-core';
import { Logger } from '@cyntientops/business-core';
import { SyncEvent } from '@cyntientops/business-core';

export interface UseRealTimeSyncOptions {
  entityType: string;
  entityId?: string;
  enabled?: boolean;
  onUpdate?: (data: any) => void;
  onConflict?: (conflict: any) => void;
  onError?: (error: Error) => void;
}

export interface RealTimeSyncState {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  data: any;
}

export const useRealTimeSync = (options: UseRealTimeSyncOptions) => {
  const {
    entityType,
    entityId,
    enabled = true,
    onUpdate,
    onConflict,
    onError,
  } = options;

  const [state, setState] = useState<RealTimeSyncState>({
    isConnected: false,
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    data: null,
  });

  const mountedRef = useRef(true);
  const syncListenerRef = useRef<((event: SyncEvent) => void) | null>(null);
  const servicesRef = useRef<{
    syncIntegration: any;
    optimizedWebSocket: any;
    offlineSupport: any;
  } | null>(null);

  // Initialize services
  useEffect(() => {
    if (!enabled || !mountedRef.current) return;

    try {
      const services = ServiceContainer.getInstance();
      servicesRef.current = {
        syncIntegration: services.syncIntegration,
        optimizedWebSocket: services.optimizedWebSocket,
        offlineSupport: services.offlineSupport,
      };

      // Check connection status
      const isConnected = services.optimizedWebSocket.isConnected();
      setState(prev => ({ ...prev, isConnected }));

      Logger.debug(`Real-time sync hook initialized for ${entityType}${entityId ? `:${entityId}` : ''}`, 'useRealTimeSync');
    } catch (error) {
      Logger.error('Failed to initialize real-time sync hook', error, 'useRealTimeSync');
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to initialize sync' }));
    }
  }, [enabled, entityType, entityId]);

  // Setup sync listener
  useEffect(() => {
    if (!enabled || !servicesRef.current || !mountedRef.current) return;

    const syncListener = (event: SyncEvent) => {
      if (!mountedRef.current) return;

      // Filter events by entity type and ID
      if (event.entityType !== entityType) return;
      if (entityId && event.entityId !== entityId) return;

      try {
        setState(prev => ({
          ...prev,
          data: event.data,
          lastSyncTime: event.timestamp,
          isSyncing: false,
          error: null,
        }));

        onUpdate?.(event.data);
      } catch (error) {
        Logger.error('Error in sync listener', error, 'useRealTimeSync');
        setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Sync error' }));
        onError?.(error as Error);
      }
    };

    syncListenerRef.current = syncListener;
    servicesRef.current.syncIntegration.addSyncListener(entityType, syncListener);

    return () => {
      if (servicesRef.current && syncListenerRef.current) {
        servicesRef.current.syncIntegration.removeSyncListener(entityType, syncListenerRef.current);
      }
    };
  }, [enabled, entityType, entityId, onUpdate, onError]);

  // Monitor connection status
  useEffect(() => {
    if (!enabled || !servicesRef.current || !mountedRef.current) return;

    const checkConnection = () => {
      if (!mountedRef.current || !servicesRef.current) return;
      
      const isConnected = servicesRef.current.optimizedWebSocket.isConnected();
      setState(prev => ({ ...prev, isConnected }));
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, [enabled]);

  // Send sync event
  const sendSyncEvent = useCallback(async (data: any, eventType: string = 'update') => {
    if (!enabled || !servicesRef.current || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, isSyncing: true, error: null }));

      await servicesRef.current.syncIntegration.sendSyncEvent({
        type: eventType,
        entityId: entityId || 'unknown',
        entityType,
        data,
        userId: 'current-user', // This would come from auth context
      });

      Logger.debug(`Sent sync event: ${eventType} for ${entityType}${entityId ? `:${entityId}` : ''}`, 'useRealTimeSync');
    } catch (error) {
      Logger.error('Failed to send sync event', error, 'useRealTimeSync');
      setState(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Failed to sync' 
      }));
      onError?.(error as Error);
    }
  }, [enabled, entityType, entityId, onError]);

  // Load cached data
  const loadCachedData = useCallback(async () => {
    if (!enabled || !servicesRef.current || !mountedRef.current) return;

    try {
      const cacheKey = `${entityType}${entityId ? `:${entityId}` : ''}`;
      const cachedData = await servicesRef.current.offlineSupport.getCachedData(cacheKey);
      
      if (cachedData && mountedRef.current) {
        setState(prev => ({ ...prev, data: cachedData }));
        onUpdate?.(cachedData);
      }
    } catch (error) {
      Logger.error('Failed to load cached data', error, 'useRealTimeSync');
    }
  }, [enabled, entityType, entityId, onUpdate]);

  // Cache data
  const cacheData = useCallback(async (data: any) => {
    if (!enabled || !servicesRef.current || !mountedRef.current) return;

    try {
      const cacheKey = `${entityType}${entityId ? `:${entityId}` : ''}`;
      await servicesRef.current.offlineSupport.cacheData(cacheKey, data);
    } catch (error) {
      Logger.error('Failed to cache data', error, 'useRealTimeSync');
    }
  }, [enabled, entityType, entityId]);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    if (!servicesRef.current) return null;
    return servicesRef.current.syncIntegration.getSyncStatus();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    sendSyncEvent,
    loadCachedData,
    cacheData,
    getSyncStatus,
  };
};

export default useRealTimeSync;
