/**
 * 👑 Admin Dashboard Screen
 * Mirrors: CyntientOps/Views/Main/AdminDashboardView.swift
 * Purpose: System-wide monitoring, analytics, and management
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminDashboard } from '@cyntientops/ui-components';
import { AdminViewModel } from '@cyntientops/context-engines';
import { DatabaseManager } from '@cyntientops/database';
import { NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { ServiceContainer } from '@cyntientops/business-core';
import { APIClientManager } from '@cyntientops/api-clients';
import { ErrorBoundary } from '@cyntientops/ui-components';

interface AdminDashboardScreenProps {
  onNavigateToWorker?: (workerId: string) => void;
  onNavigateToBuilding?: (buildingId: string) => void;
  onNavigateToClient?: (clientId: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  onNavigateToWorker,
  onNavigateToBuilding,
  onNavigateToClient
}) => {
  const [viewModel, setViewModel] = useState<AdminViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeViewModel();
  }, []);

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

      const notificationManager = NotificationManager.getInstance(databaseManager);

      // Initialize ViewModel
      const adminViewModel = AdminViewModel.getInstance(
        databaseManager,
        notificationManager,
        intelligenceService
      );

      // Initialize dashboard
      await adminViewModel.initialize();

      setViewModel(adminViewModel);
    } catch (err) {
      Logger.error('Failed to initialize admin dashboard:', undefined, 'AdminDashboardScreen.tsx');
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkerStatusUpdate = async (workerId: string, status: string) => {
    if (!viewModel) return;

    try {
      const success = await viewModel.updateWorkerStatus(workerId, status);
      if (!success) {
        Alert.alert('Update Failed', 'Failed to update worker status.');
      }
    } catch (error) {
      Logger.error('Worker status update error:', undefined, 'AdminDashboardScreen.tsx');
      Alert.alert('Error', 'Failed to update worker status. Please try again.');
    }
  };

  const handleAlertResolve = (alertId: string) => {
    if (!viewModel) return;

    try {
      viewModel.resolveAlert(alertId);
    } catch (error) {
      Logger.error('Alert resolve error:', undefined, 'AdminDashboardScreen.tsx');
    }
  };

  const handleNotificationRead = async (notificationId: string) => {
    if (!viewModel) return;

    try {
      await viewModel.markNotificationAsRead(notificationId);
    } catch (error) {
      Logger.error('Notification read error:', undefined, 'AdminDashboardScreen.tsx');
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
    <ErrorBoundary context="AdminDashboardScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <AdminDashboard
            state={viewModel.getState()}
            onWorkerStatusUpdate={handleWorkerStatusUpdate}
            onAlertResolve={handleAlertResolve}
            onNotificationRead={handleNotificationRead}
            onNavigateToWorker={onNavigateToWorker}
            onNavigateToBuilding={onNavigateToBuilding}
            onNavigateToClient={onNavigateToClient}
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

export default AdminDashboardScreen;
