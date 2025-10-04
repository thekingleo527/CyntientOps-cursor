/**
 * 🏗️ App Provider
 * Initializes and provides all services to the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { InteractionManager } from 'react-native';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
// Defer heavy business-core import to runtime to reduce initial bundle work
import type { ServiceContainer as ServiceContainerType } from '@cyntientops/business-core';
import { AssetOptimizer } from '../utils/AssetOptimizer';
import config from '../config/app.config';

interface AppContextValue {
  services: ServiceContainerType;
  isReady: boolean;
  error: Error | null;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [services, setServices] = useState<ServiceContainerType | null>(null);

  useEffect(() => {
    // Preload critical assets early and in parallel
    AssetOptimizer.getInstance().preloadCriticalAssets().catch(() => { /* TODO: Implement */ });
    // Defer heavy initialization until after first interactions to improve TTI
    const task = InteractionManager.runAfterInteractions(() => {
      void initializeApp();
    });
    return () => task.cancel();
  }, []);

  const initializeApp = async () => {
    try {
      const bc = await import('@cyntientops/business-core');
      bc.Logger.info('Initializing CyntientOps Mobile App', undefined, 'AppProvider');

      // Initialize ServiceContainer with configuration
      const serviceContainer = bc.ServiceContainer.getInstance({
        databasePath: config.databasePath,
        enableOfflineMode: config.enableOfflineMode,
        enableRealTimeSync: config.enableRealTimeSync,
        enableIntelligence: config.enableIntelligence,
        enableWeatherIntegration: config.enableWeatherIntegration,
      });

      // Initialize all services
      // Initialize essential services; other work can continue lazily inside container
      await serviceContainer.initialize();

      // Connect WebSocket if real-time sync is enabled
      if (config.enableRealTimeSync) {
        // Defer WebSocket connection slightly to avoid blocking startup
        setTimeout(async () => {
          bc.Logger.info('Connecting to WebSocket', undefined, 'AppProvider');
          try {
            await serviceContainer.webSocket.connect();
            bc.Logger.info('WebSocket connected successfully', undefined, 'AppProvider');
          } catch (wsError) {
            bc.Logger.warn('WebSocket connection failed (will retry)', wsError, 'AppProvider');
          }
        }, 750);
      }

      setServices(serviceContainer);
      setIsReady(true);
      bc.Logger.info('App initialized successfully', undefined, 'AppProvider');

    } catch (err) {
      try {
        const bc = await import('@cyntientops/business-core');
        bc.Logger.error('App initialization failed', err as any, 'AppProvider');
      } catch { /* TODO: Implement */ }
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <Text style={styles.errorHint}>Please restart the app</Text>
      </View>
    );
  }

  if (!isReady || !services) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing CyntientOps...</Text>
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ services, isReady, error }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to access app services
 */
export const useServices = (): ServiceContainer => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useServices must be used within AppProvider');
  }
  if (!context.services) {
    throw new Error('Services not initialized');
  }
  return context.services;
};

/**
 * Hook to access app readiness state
 */
export const useAppReady = (): boolean => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppReady must be used within AppProvider');
  }
  return context.isReady;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
});

export default AppProvider;
