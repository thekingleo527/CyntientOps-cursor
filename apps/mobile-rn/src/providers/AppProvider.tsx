/**
 * 🏗️ App Provider
 * Initializes and provides all services to the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
// Use optimized service container for fast boot
import { optimizedServiceContainer } from '../utils/OptimizedServiceContainer';
import { AssetOptimizer } from '../utils/AssetOptimizer';
import { bootMonitor } from '../utils/BootMonitor';
import { nativeImageCompressor } from '../utils/NativeImageCompressor';
import { compressionMonitor } from '../utils/CompressionMonitor';
import config from '../config/app.config';

interface AppContextValue {
  services: typeof optimizedServiceContainer;
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
  const [services, setServices] = useState<typeof optimizedServiceContainer | null>(null);

  useEffect(() => {
    // Fast initialization - no delays
    void initializeApp();
  }, []);

  const initializeApp = async () => {
    bootMonitor.startPhase('App Initialization');
    
    try {
      bootMonitor.startPhase('Initialize Optimized Service Container');
      
      // Initialize the optimized service container
      try {
        await optimizedServiceContainer.initialize();
      } catch (error) {
        console.error('Service container initialization failed:', error);
        // Continue without services for now
      }
      
      bootMonitor.endPhase('Initialize Optimized Service Container');

      setServices(optimizedServiceContainer);
      setIsReady(true);
      
      bootMonitor.endPhase('App Initialization');
      bootMonitor.logReport();

      // Defer asset preloading to background
      setTimeout(() => {
        bootMonitor.startPhase('Asset Preloading');
        AssetOptimizer.getInstance().preloadCriticalAssets()
          .then(() => bootMonitor.endPhase('Asset Preloading'))
          .catch((error) => {
            console.warn('Failed to preload critical assets:', error);
            bootMonitor.endPhase('Asset Preloading');
          });
      }, 100);

      // Start image compression monitoring
      compressionMonitor.startMonitoring();
      
      // Defer image compression to background
      setTimeout(() => {
        bootMonitor.startPhase('Image Compression');
        nativeImageCompressor.preloadImages()
          .then(() => bootMonitor.endPhase('Image Compression'))
          .catch((error) => {
            console.warn('Failed to preload images:', error);
            bootMonitor.endPhase('Image Compression');
          });
      }, 500);

    } catch (err) {
      bootMonitor.endPhase('App Initialization');
      try {
        const { Logger } = await import('@cyntientops/business-core/src/services/LoggingService');
        Logger.error('Fast boot initialization failed', err as any, 'AppProvider');
      } catch (loggerError) {
        console.error('Failed to log initialization error:', loggerError);
        console.error('Fast boot initialization failed:', err);
      }
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
        <Text style={styles.errorHint}>Debug: isReady={isReady.toString()}, services={services ? 'yes' : 'no'}</Text>
      </View>
    );
  }

  console.log('AppProvider: Rendering children');
  return (
    <AppContext.Provider value={{ services, isReady, error }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to access app services
 */
export const useServices = (): typeof optimizedServiceContainer => {
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
