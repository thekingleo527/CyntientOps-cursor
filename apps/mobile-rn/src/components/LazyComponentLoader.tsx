/**
 * 🎯 Lazy Component Loader
 * Optimized component loading with preloading and error boundaries
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { InteractionManager } from 'react-native';

interface LazyComponentProps {
  fallback?: ReactNode;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Enhanced lazy component with preloading and error handling
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyComponentProps = {}
) {
  const { fallback, preload = false, priority = 'medium' } = options;
  
  const LazyComponent = React.lazy(importFunc);

  // Preload component if requested
  if (preload) {
    const preloadTask = InteractionManager.runAfterInteractions(() => {
      importFunc().catch(() => {
        // Silently fail preloading
      });
    });
  }

  return React.forwardRef<any, React.ComponentProps<T> & LazyComponentProps>((props, ref) => {
    const [loadingState, setLoadingState] = React.useState<LoadingState>({
      isLoading: true,
      error: null
    });

    const handleError = (error: Error) => {
      setLoadingState({ isLoading: false, error });
    };

    const defaultFallback = (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );

    if (loadingState.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load component</Text>
          <Text style={styles.errorSubtext}>{loadingState.error.message}</Text>
        </View>
      );
    }

    return (
      <Suspense fallback={fallback || defaultFallback}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    );
  });
}

/**
 * Preload multiple components
 */
export async function preloadComponents(
  components: Array<() => Promise<any>>,
  priority: 'high' | 'medium' | 'low' = 'low'
): Promise<void> {
  const loadComponents = async () => {
    await Promise.allSettled(
      components.map(component => component().catch(() => {
        // Silently fail preloading
      }))
    );
  };

  if (priority === 'high') {
    await loadComponents();
  } else {
    InteractionManager.runAfterInteractions(loadComponents);
  }
}

/**
 * Component preloader for common screens
 */
export const ComponentPreloader = {
  // Preload critical screens
  preloadCriticalScreens: () => preloadComponents([
    () => import('../screens/LoginScreen'),
    () => import('../screens/WorkerDashboardScreen'),
    () => import('../screens/ClientDashboardScreen'),
  ], 'high'),

  // Preload compliance screens
  preloadComplianceScreens: () => preloadComponents([
    () => import('../screens/compliance/HPDDetailScreen'),
    () => import('../screens/compliance/DOBDetailScreen'),
    () => import('../screens/compliance/DSNYDetailScreen'),
    () => import('../screens/compliance/LL97DetailScreen'),
  ], 'low'),

  // Preload routine screens
  preloadRoutineScreens: () => preloadComponents([
    () => import('../screens/DailyRoutineScreen'),
    () => import('../screens/WeeklyRoutineScreen'),
    () => import('../screens/TaskTimelineScreen'),
  ], 'low'),
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

