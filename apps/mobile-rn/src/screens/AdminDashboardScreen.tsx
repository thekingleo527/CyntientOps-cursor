/**
 * 👑 Admin Dashboard Screen
 * Mirrors: CyntientOps/Views/Main/AdminDashboardView.swift
 * Purpose: System-wide monitoring, analytics, and management
 */

import React, { useEffect, useState } from 'react';
import config from '../config/app.config';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AdminDashboard,
  ErrorBoundary,
  PortfolioValueCard,
  ComplianceSummaryCard,
  TopPropertiesCard,
  DevelopmentOpportunitiesCard,
} from '@cyntientops/ui-components';
import { AdminViewModel } from '@cyntientops/context-engines';
import { DatabaseManager } from '@cyntientops/database';
import { NotificationManager } from '@cyntientops/managers';
import { IntelligenceService } from '@cyntientops/intelligence-services';
import { ServiceContainer, PropertyDataService } from '@cyntientops/business-core';
import { ViolationDataService } from '../services/ViolationDataService';
import { APIClientManager } from '@cyntientops/api-clients';
import { Logger } from '@cyntientops/business-core';

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
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    initializeViewModel();
  }, []);

  // Subscribe to real-time updates for admin critical events and refresh
  useEffect(() => {
    const services = ServiceContainer.getInstance();
    const id = 'admin-dashboard';
    try {
      services.realTimeOrchestrator.addUpdateListener(id, (update: any) => {
        try {
          const t = String(update?.type || '');
          if (t.includes('building') || t.includes('compliance') || t.includes('critical') || t.includes('task')) {
            void refreshDashboard();
          }
        } catch (error) {
          console.warn('Failed to handle real-time update for admin dashboard:', error);
          // Non-critical: Dashboard will refresh on next manual refresh
        }
      });
    } catch (error) {
      console.warn('Failed to add real-time listener for admin dashboard:', error);
      // Non-critical: Dashboard works without real-time updates
    }
    return () => {
      try { 
        services.realTimeOrchestrator.removeUpdateListener(id); 
      } catch (error) {
        console.warn('Failed to remove real-time listener for admin dashboard:', error);
        // Non-critical: Cleanup failed but component is unmounting
      }
    };
  }, []);

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

  const refreshDashboard = async () => {
    if (!viewModel) return;
    try {
      await viewModel.initialize();
      setRefreshTick((t) => t + 1);
    } catch (err) {
      Logger.error('Failed to refresh admin dashboard:', undefined, 'AdminDashboardScreen.tsx');
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

  // Get portfolio and compliance data
  const portfolioStats = PropertyDataService.getPortfolioStats();
  const topProperties = PropertyDataService.getTopPropertiesByValue(5);
  const developmentOpportunities = PropertyDataService.getPropertiesWithDevelopmentPotential().slice(0, 6);

  // Calculate compliance summary
  const allProperties = PropertyDataService.getAllProperties();
  const violationsByType = { hpd: 0, dob: 0, dsny: 0 };
  let totalOutstanding = 0;
  let totalScore = 0;

  allProperties.forEach(property => {
    const violations = ViolationDataService.getViolationData(property.id);
    if (violations) {
      violationsByType.hpd += violations.hpd;
      violationsByType.dob += violations.dob;
      violationsByType.dsny += violations.dsny;
      totalOutstanding += violations.outstanding;
      totalScore += violations.score;
    }
  });

  const totalViolations = violationsByType.hpd + violationsByType.dob + violationsByType.dsny;
  const portfolioScore = allProperties.length > 0 ? totalScore / allProperties.length : 100;
  const criticalBuildings = allProperties.filter(property => {
    const violations = ViolationDataService.getViolationData(property.id);
    return violations && violations.score < 50;
  }).length;

  return (
    <ErrorBoundary context="AdminDashboardScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Portfolio Overview Cards */}
          <PortfolioValueCard
            marketValue={portfolioStats.totalMarketValue}
            assessedValue={portfolioStats.totalAssessedValue}
            unitsResidential={portfolioStats.totalUnitsResidential}
            unitsCommercial={portfolioStats.totalUnitsCommercial}
            totalSquareFeet={portfolioStats.totalSquareFeet}
            buildingCount={portfolioStats.totalBuildings}
          />

          <ComplianceSummaryCard
            portfolioScore={portfolioScore}
            criticalBuildings={criticalBuildings}
            totalViolations={totalViolations}
            totalOutstanding={totalOutstanding}
            violationsByType={violationsByType}
          />

          <TopPropertiesCard
            properties={topProperties.map(p => ({
              id: p.id,
              name: p.name,
              marketValue: p.marketValue,
              complianceScore: ViolationDataService.getViolationData(p.id)?.score || 100,
              violations: (() => {
                const v = ViolationDataService.getViolationData(p.id);
                return v ? v.hpd + v.dob + v.dsny : 0;
              })(),
            }))}
            onPropertyPress={onNavigateToBuilding}
          />

          <DevelopmentOpportunitiesCard
            opportunities={developmentOpportunities.map(p => ({
              id: p.id,
              name: p.name,
              unusedFARPercent: p.unusedFARPercent,
              currentFAR: p.builtFAR,
              maxFAR: p.maxFAR,
              estimatedValueIncrease: Math.round(p.marketValue * (p.unusedFARPercent / 100)),
            }))}
            onOpportunityPress={onNavigateToBuilding}
          />

          {/* Original Admin Dashboard */}
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
