/**
 * 🏢 Client Dashboard Screen
 * Mirrors: CyntientOps/Views/Main/ClientDashboardView.swift
 * Purpose: Client portfolio overview with building management and compliance
 */

import React, { useEffect, useState } from 'react';
import config from '../config/app.config';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ClientDashboard,
  ErrorBoundary,
  PropertyOverviewCard,
  ComplianceStatusCard,
} from '@cyntientops/ui-components';
import { ClientViewModel } from '@cyntientops/context-engines';
import { DatabaseManager } from '@cyntientops/database';
import { NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { ServiceContainer, PropertyDataService } from '@cyntientops/business-core';
import { ViolationDataService } from '../services/ViolationDataService';
import { APIClientManager } from '@cyntientops/api-clients';
import { Logger } from '@cyntientops/business-core';

interface ClientDashboardScreenProps {
  clientId: string;
  buildingId?: string; // Optional: if not provided, will show first building in portfolio
  onNavigateToBuilding?: (buildingId: string) => void;
  onNavigateToWorker?: (workerId: string) => void;
}

export const ClientDashboardScreen: React.FC<ClientDashboardScreenProps> = ({
  clientId,
  buildingId,
  onNavigateToBuilding,
  onNavigateToWorker
}) => {
  const [viewModel, setViewModel] = useState<ClientViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    initializeViewModel();
  }, [clientId]);

  // Subscribe to portfolio/building updates and refresh
  useEffect(() => {
    const services = ServiceContainer.getInstance();
    const id = `client-dashboard-${clientId}`;
    try {
      services.realTimeOrchestrator.addUpdateListener(id, (update: any) => {
        try {
          const t = String(update?.type || '');
          if (t.includes('building') || t.includes('routine') || t.includes('compliance')) {
            void refreshDashboard();
          }
        } catch { /* TODO: Implement */ }
      });
    } catch { /* TODO: Implement */ }
    return () => {
      try { services.realTimeOrchestrator.removeUpdateListener(id); } catch { /* TODO: Implement */ }
    };
  }, [clientId]);

  const initializeViewModel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize all required services
      const databaseManager = DatabaseManager.getInstance({
        path: config.databasePath
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

  const refreshDashboard = async () => {
    if (!viewModel) return;
    try {
      await viewModel.initialize(clientId);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      Logger.error('Failed to refresh client dashboard:', undefined, 'ClientDashboardScreen.tsx');
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

  // Get client's building data (use provided buildingId or first building)
  const allProperties = PropertyDataService.getAllProperties();
  const targetBuildingId = buildingId || (allProperties.length > 0 ? allProperties[0].id : null);
  const property = targetBuildingId ? PropertyDataService.getPropertyDetails(targetBuildingId) : null;
  const violations = targetBuildingId ? ViolationDataService.getViolationData(targetBuildingId) : null;

  return (
    <ErrorBoundary context="ClientDashboardScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Property Overview Cards */}
          {property && violations && (
            <>
              <PropertyOverviewCard
                address={property.address}
                marketValue={property.marketValue}
                assessedValue={property.assessedValue}
                yearBuilt={property.yearBuilt}
                yearRenovated={property.yearRenovated}
                units={property.unitsTotal}
                complianceScore={violations.score}
                violationsCount={violations.hpd + violations.dob + violations.dsny}
                historicDistrict={property.historicDistrict}
                neighborhood={property.neighborhood}
              />

              <ComplianceStatusCard
                score={violations.score}
                status={violations.score >= 90 ? 'Excellent' : violations.score >= 70 ? 'Good' : violations.score >= 50 ? 'Fair' : 'Needs Attention'}
                hpdViolations={violations.hpd}
                dobViolations={violations.dob}
                dsnyViolations={violations.dsny}
                outstanding={violations.outstanding}
              />
            </>
          )}

          {/* Original Client Dashboard */}
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
