/**
 * 🏢 Client Dashboard Screen
 * Mirrors: CyntientOps/Views/Main/ClientDashboardView.swift
 * Purpose: Client portfolio overview with building management and compliance
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientDashboard } from '@cyntientops/ui-components';
import { ClientViewModel } from '@cyntientops/context-engines';
import { DatabaseManager } from '@cyntientops/database';
import { NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { ServiceContainer } from '@cyntientops/business-core';
import { APIClientManager } from '@cyntientops/api-clients';
import { ErrorBoundary } from '@cyntientops/ui-components';

interface ClientDashboardScreenProps {
  clientId: string;
  onNavigateToBuilding?: (buildingId: string) => void;
  onNavigateToWorker?: (workerId: string) => void;
}

export const ClientDashboardScreen: React.FC<ClientDashboardScreenProps> = ({
  clientId,
  onNavigateToBuilding,
  onNavigateToWorker
}) => {
  const [viewModel, setViewModel] = useState<ClientViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeViewModel();
  }, [clientId]);

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
      const clientViewModel = ClientViewModel.getInstance(
        databaseManager,
        notificationManager,
        intelligenceService
      );

      // Initialize dashboard
      await clientViewModel.initialize(clientId);

      setViewModel(clientViewModel);
    } catch (err) {
      Logger.error('Failed to initialize client dashboard:', undefined, 'ClientDashboardScreen.tsx');
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildingUpdate = async (buildingId: string, updates: any) => {
    if (!viewModel) return;

    try {
      const success = await viewModel.updateBuilding(buildingId, updates);
      if (!success) {
        Alert.alert('Update Failed', 'Failed to update building information.');
      }
    } catch (error) {
      Logger.error('Building update error:', undefined, 'ClientDashboardScreen.tsx');
      Alert.alert('Error', 'Failed to update building. Please try again.');
    }
  };

  const handleNotificationRead = async (notificationId: string) => {
    if (!viewModel) return;

    try {
      await viewModel.markNotificationAsRead(notificationId);
    } catch (error) {
      Logger.error('Notification read error:', undefined, 'ClientDashboardScreen.tsx');
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
    <ErrorBoundary context="ClientDashboardScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ClientDashboard
            state={viewModel.getState()}
            onBuildingUpdate={handleBuildingUpdate}
            onNotificationRead={handleNotificationRead}
            onNavigateToBuilding={onNavigateToBuilding}
            onNavigateToWorker={onNavigateToWorker}
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

export default ClientDashboardScreen;
