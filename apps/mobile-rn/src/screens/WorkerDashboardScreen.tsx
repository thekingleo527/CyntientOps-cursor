/**
 * 👷 Worker Dashboard Screen
 * Mirrors: CyntientOps/Views/Main/WorkerDashboardView.swift
 * Purpose: Main worker dashboard with task timeline and clock-in functionality
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkerDashboardMainView, useRealTimeSync } from '@cyntientops/ui-components';
import { WorkerDashboardViewModel } from '@cyntientops/context-engines';
import { DatabaseManager } from '@cyntientops/database';
import { ClockInManager, LocationManager, NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { Logger, TaskService } from '@cyntientops/business-core';
import { APIClientManager } from '@cyntientops/api-clients';
import { ErrorBoundary } from '@cyntientops/ui-components';
import { useNavigation } from '@react-navigation/native';
import config from '../config/app.config';
import { useServices } from '../providers/AppProvider';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

interface WorkerDashboardScreenProps {
  workerId: string;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToBuilding?: (buildingId: string) => void;
  onLogout?: () => void;
  userRole?: 'worker' | 'client' | 'admin';
  userName?: string;
}

export const WorkerDashboardScreen: React.FC<WorkerDashboardScreenProps> = ({
  workerId,
  onNavigateToTask,
  onNavigateToBuilding,
  onLogout,
  userRole = 'worker',
  userName = 'Worker'
}) => {
  const [viewModel, setViewModel] = useState<WorkerDashboardViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const navigation = useNavigation<any>();

  // Hero card data from TaskService
  const [currentTask, setCurrentTask] = useState<OperationalDataTaskAssignment | null>(null);
  const [nextTask, setNextTask] = useState<OperationalDataTaskAssignment | null>(null);
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0, rate: 0 });

  // Memory leak prevention refs
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<string | null>(null);
  const viewModelRef = useRef<WorkerDashboardViewModel | null>(null);
  const services = useServices();

  // Real-time sync for tasks
  const taskSync = useRealTimeSync({
    entityType: 'task',
    enabled: true,
    onUpdate: (data) => {
      if (mountedRef.current && viewModelRef.current) {
        // Refresh dashboard when task data updates
        refreshDashboard();
      }
    },
    onError: (error) => {
      Logger.error('Task sync error', error, 'WorkerDashboardScreen');
    },
  });

  // Real-time sync for worker status
  const workerSync = useRealTimeSync({
    entityType: 'worker',
    entityId: workerId,
    enabled: true,
    onUpdate: (data) => {
      if (mountedRef.current && viewModelRef.current) {
        // Update worker status in real-time
        refreshDashboard();
      }
    },
    onError: (error) => {
      Logger.error('Worker sync error', error, 'WorkerDashboardScreen');
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        try {
          services.realTimeOrchestrator.removeUpdateListener(subscriptionRef.current);
        } catch (error) {
          Logger.warn('Failed to remove realtime listener on unmount', error, 'WorkerDashboardScreen');
        }
      }
      if (viewModelRef.current) {
        try {
          viewModelRef.current.dispose?.();
        } catch (error) {
          Logger.warn('Failed to dispose viewModel on unmount', error, 'WorkerDashboardScreen');
        }
      }
    };
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      initializeViewModel();
    }
  }, [workerId]);

  // Auto-refresh hero card data every 30 seconds
  useEffect(() => {
    if (!mountedRef.current) return;

    const interval = setInterval(() => {
      loadHeroCardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadHeroCardData]);

  // Subscribe to real-time updates with proper cleanup
  useEffect(() => {
    if (!mountedRef.current) return;

    const id = `worker-dashboard-${workerId}`;
    subscriptionRef.current = id;
    
    try {
      services.realTimeOrchestrator.addUpdateListener(id, (update: any) => {
        if (!mountedRef.current) return;
        
        try {
          if (!update) return;
          if (update.workerId === workerId) {
            void refreshDashboard();
            return;
          }
          const t = String(update.type || '');
          if (t.includes('task') || t.includes('building') || t.includes('clock')) {
            void refreshDashboard();
          }
        } catch (error) {
          Logger.warn('Error processing realtime update', error, 'WorkerDashboardScreen');
        }
      });
    } catch (error) {
      Logger.warn('Failed to setup realtime listener', error, 'WorkerDashboardScreen');
    }
    
    return () => {
      if (subscriptionRef.current) {
        try {
          services.realTimeOrchestrator.removeUpdateListener(subscriptionRef.current);
          subscriptionRef.current = null;
        } catch (error) {
          Logger.warn('Failed to remove realtime listener', error, 'WorkerDashboardScreen');
        }
      }
    };
  }, [workerId]);

  const initializeViewModel = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Dispose previous viewModel if exists
      if (viewModelRef.current) {
        try {
          viewModelRef.current.dispose?.();
        } catch (error) {
          Logger.warn('Failed to dispose previous viewModel', error, 'WorkerDashboardScreen');
        }
      }

      // Initialize all required services via optimized container
      const databaseManager = services.database as DatabaseManager;
      const intelligenceService = services.intelligence as ReturnType<typeof IntelligenceService.getInstance>;
      const clockInManager = ClockInManager.getInstance(databaseManager);
      const locationManager = LocationManager.getInstance(databaseManager);
      const notificationManager = NotificationManager.getInstance(databaseManager);

      // Initialize ViewModel
      const workerViewModel = WorkerDashboardViewModel.getInstance(
        databaseManager,
        clockInManager,
        locationManager,
        notificationManager,
        intelligenceService
      );

      // Initialize dashboard
      await workerViewModel.initialize(workerId);

      if (mountedRef.current) {
        viewModelRef.current = workerViewModel;
        setViewModel(workerViewModel);

        // Load hero card data
        loadHeroCardData();

        // Initialize real-time sync
        try {
          await services.syncIntegration.initialize(
            services.optimizedWebSocket,
            services.messageRouter,
            services.offlineSupport,
            {
              userId: workerId,
              userRole: 'worker',
              buildingIds: [], // This would be populated from worker's assigned buildings
              permissions: ['task_read', 'task_write', 'clock_in', 'clock_out'],
            }
          );
          
          // Load cached data
          await taskSync.loadCachedData();
          await workerSync.loadCachedData();
          
          Logger.info('Real-time sync initialized for worker dashboard', 'WorkerDashboardScreen');
        } catch (syncError) {
          Logger.error('Failed to initialize real-time sync', syncError, 'WorkerDashboardScreen');
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        Logger.error('Failed to initialize worker dashboard', err, 'WorkerDashboardScreen');
        setError(err instanceof Error ? err.message : 'Failed to initialize dashboard');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [workerId]);

  const loadHeroCardData = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const taskService = TaskService.getInstance();

      // Get current task (NOW category)
      const current = taskService.getCurrentTask(workerId);
      setCurrentTask(current);

      // Get next task (NEXT category)
      const next = taskService.getNextTask(workerId);
      setNextTask(next);

      // Get completion stats
      const stats = taskService.getTodayCompletionStats(workerId);
      setTodayStats(stats);

      Logger.info(`Hero card data loaded: Current=${current?.title || 'none'}, Next=${next?.title || 'none'}, Stats=${stats.completed}/${stats.total}`, 'WorkerDashboardScreen');
    } catch (err) {
      Logger.error('Failed to load hero card data', err, 'WorkerDashboardScreen');
    }
  }, [workerId]);

  const refreshDashboard = useCallback(async () => {
    if (!viewModelRef.current || !mountedRef.current) return;
    try {
      await viewModelRef.current.initialize(workerId);
      loadHeroCardData(); // Refresh hero card data
      if (mountedRef.current) {
        setRefreshTick((t) => t + 1); // force re-render to pull latest state
      }
    } catch (err) {
      Logger.error('Failed to refresh worker dashboard:', undefined, 'WorkerDashboardScreen.tsx');
    }
  }, [workerId, loadHeroCardData]);

  const handleClockIn = useCallback(async (buildingId: string, location: { latitude: number; longitude: number; accuracy: number }) => {
    if (!viewModelRef.current || !mountedRef.current) return;

    try {
      const success = await viewModelRef.current.clockIn(buildingId, location);
      if (!success && mountedRef.current) {
        Alert.alert('Clock In Failed', 'Please check your location and try again.');
      }
    } catch (error) {
      Logger.error('Clock in error:', undefined, 'WorkerDashboardScreen.tsx');
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to clock in. Please try again.');
      }
    }
  }, []);

  const handleClockOut = useCallback(async () => {
    if (!viewModelRef.current || !mountedRef.current) return;

    try {
      const success = await viewModelRef.current.clockOut();
      if (!success && mountedRef.current) {
        Alert.alert('Clock Out Failed', 'Please try again.');
      }
    } catch (error) {
      Logger.error('Clock out error:', undefined, 'WorkerDashboardScreen.tsx');
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to clock out. Please try again.');
      }
    }
  }, []);

  const handleTaskUpdate = useCallback(async (taskId: string, status: string) => {
    if (!viewModelRef.current || !mountedRef.current) return;

    try {
      const success = await viewModelRef.current.updateTaskStatus(taskId, status);
      if (success && mountedRef.current) {
        // Send real-time sync event
        await taskSync.sendSyncEvent({
          taskId,
          status,
          updatedAt: new Date().toISOString(),
          workerId,
        }, 'task_update');
        
        // Cache the update
        await taskSync.cacheData({
          taskId,
          status,
          updatedAt: new Date().toISOString(),
        });
      } else if (mountedRef.current) {
        Alert.alert('Update Failed', 'Failed to update task status.');
      }
    } catch (error) {
      Logger.error('Task update error:', undefined, 'WorkerDashboardScreen.tsx');
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to update task. Please try again.');
      }
    }
  }, [taskSync, workerId]);

  const handleNotificationRead = useCallback(async (notificationId: string) => {
    if (!viewModelRef.current || !mountedRef.current) return;

    try {
      await viewModelRef.current.markNotificationAsRead(notificationId);
    } catch (error) {
      Logger.error('Notification read error:', undefined, 'WorkerDashboardScreen.tsx');
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading indicator would go here */}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          {/* Error display would go here */}
        </View>
      </SafeAreaView>
    );
  }

  if (!viewModel) {
    return null;
  }

  // Prepare hero card data for WorkerDashboardMainView
  const heroCardData = useMemo(() => {
    const taskService = TaskService.getInstance();

    return {
      currentTask: currentTask ? {
        title: currentTask.title,
        building: currentTask.buildingName,
        timeRange: `${taskService.formatHour(currentTask.metadata?.startHour || 0)} - ${taskService.formatHour(currentTask.metadata?.endHour || 0)}`,
        category: currentTask.category,
        requiresPhoto: currentTask.requiresPhoto
      } : null,
      nextTask: nextTask ? {
        title: nextTask.title,
        building: nextTask.buildingName,
        startsAt: taskService.formatHour(nextTask.metadata?.startHour || 0),
        category: nextTask.category
      } : null,
      todayStats: {
        completed: todayStats.completed,
        total: todayStats.total,
        percentage: Math.round(todayStats.rate * 100)
      }
    };
  }, [currentTask, nextTask, todayStats]);

  return (
    <ErrorBoundary context="WorkerDashboardScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <WorkerDashboardMainView
            workerId={workerId}
            workerName={userName}
            userRole={userRole}
            state={viewModel.getState()}
            heroCardData={heroCardData}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onTaskUpdate={handleTaskUpdate}
            onNotificationRead={handleNotificationRead}
            onNavigateToTask={onNavigateToTask}
            onNavigateToBuilding={onNavigateToBuilding}
            onHeaderRoute={(route: any) => {
              if (route === 'profile') {
                navigation.navigate('Profile', { userName, userRole, userId: workerId, onLogout });
              } else if (route === 'clockAction') {
                navigation.navigate('ClockInModal', { workerId });
              }
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WorkerDashboardScreen;
