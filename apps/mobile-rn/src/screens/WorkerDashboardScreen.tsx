/**
 * 👷 Worker Dashboard Screen
 * Mirrors: CyntientOps/Views/Main/WorkerDashboardView.swift
 * Purpose: Main worker dashboard with task timeline and clock-in functionality
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkerDashboard } from '@cyntientops/ui-components';
import { WorkerViewModel } from '@cyntientops/context-engines';
import { DatabaseManager } from '@cyntientops/database';
import { ClockInManager, LocationManager, NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { ServiceContainer } from '@cyntientops/business-core';
import { APIClientManager } from '@cyntientops/api-clients';

interface WorkerDashboardScreenProps {
  workerId: string;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToBuilding?: (buildingId: string) => void;
}

export const WorkerDashboardScreen: React.FC<WorkerDashboardScreenProps> = ({
  workerId,
  onNavigateToTask,
  onNavigateToBuilding
}) => {
  const [viewModel, setViewModel] = useState<WorkerViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeViewModel();
  }, [workerId]);

  const initializeViewModel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize all required services
      const databaseManager = DatabaseManager.getInstance({
        path: 'cyntientops.db'
      });
      await databaseManager.initialize();

      const serviceContainer = ServiceContainer.getInstance();
      const apiClientManager = APIClientManager.getInstance();
      const intelligenceService = IntelligenceService.getInstance(
        databaseManager,
        serviceContainer,
        apiClientManager
      );

      const clockInManager = ClockInManager.getInstance(databaseManager);
      const locationManager = LocationManager.getInstance(databaseManager);
      const notificationManager = NotificationManager.getInstance(databaseManager);

      // Initialize ViewModel
      const workerViewModel = WorkerViewModel.getInstance(
        databaseManager,
        clockInManager,
        locationManager,
        notificationManager,
        intelligenceService
      );

      // Initialize dashboard
      await workerViewModel.initialize(workerId);

      setViewModel(workerViewModel);
    } catch (err) {
      console.error('Failed to initialize worker dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockIn = async (buildingId: string, location: { latitude: number; longitude: number; accuracy: number }) => {
    if (!viewModel) return;

    try {
      const success = await viewModel.clockIn(buildingId, location);
      if (!success) {
        Alert.alert('Clock In Failed', 'Please check your location and try again.');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!viewModel) return;

    try {
      const success = await viewModel.clockOut();
      if (!success) {
        Alert.alert('Clock Out Failed', 'Please try again.');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      Alert.alert('Error', 'Failed to clock out. Please try again.');
    }
  };

  const handleTaskUpdate = async (taskId: string, status: string) => {
    if (!viewModel) return;

    try {
      const success = await viewModel.updateTaskStatus(taskId, status);
      if (!success) {
        Alert.alert('Update Failed', 'Failed to update task status.');
      }
    } catch (error) {
      console.error('Task update error:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  const handleNotificationRead = async (notificationId: string) => {
    if (!viewModel) return;

    try {
      await viewModel.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Notification read error:', error);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <WorkerDashboard
          state={viewModel.getState()}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onTaskUpdate={handleTaskUpdate}
          onNotificationRead={handleNotificationRead}
          onNavigateToTask={onNavigateToTask}
          onNavigateToBuilding={onNavigateToBuilding}
        />
      </ScrollView>
    </SafeAreaView>
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
