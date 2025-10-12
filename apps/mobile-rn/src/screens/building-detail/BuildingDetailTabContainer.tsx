/**
 * 🏢 Building Detail Tab Container
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingDetailTabContainer.swift
 * Purpose: Lazy-loaded tabs with role-aware defaults and memory optimization
 *
 * 🚀 PERFORMANCE OPTIMIZED: Lazy-loaded tabs with minimal memory footprint
 * 💡 PRODUCTION READY: Each tab loads only when accessed
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import BuildingOverviewTab from './BuildingOverviewTab';
import BuildingOperationsTab from './BuildingOperationsTab';
import BuildingComplianceTab from './BuildingComplianceTab';
import BuildingResourcesTab from './BuildingResourcesTab';
import BuildingEmergencyTab from './BuildingEmergencyTab';
import BuildingReportsTab from './BuildingReportsTab';

const initialLayout = { width: Dimensions.get('window').width };

interface BuildingDetailTabContainerProps {
  buildingId: string;
  buildingName: string;
  userRole: string;
  complianceScore?: number;
  outstandingViolations?: number;
  // Props for Overview tab
  building: any;
  violationSummary: any;
  propertyDetails?: any;
  schedule?: any;
  dsnyScheduleData?: any;
  workers: any[];
  routineSummaries: any[];
  canViewPropertyDetails: boolean;
  renderPropertyDetailsCard: (property: any) => React.ReactNode;
  renderComplianceCard: (summary: any, score: number) => React.ReactNode;
  renderScheduleCard: (schedule: any) => React.ReactNode;
  renderWorkerCard: (worker: any) => React.ReactNode;
  renderRoutineCard: (routine: any) => React.ReactNode;
  renderEmptyMessage: (message: string) => React.ReactNode;
  renderSectionHeader: (title: string) => React.ReactNode;
  DSNYScheduleCard?: React.ComponentType<any>;
}

export const BuildingDetailTabContainer: React.FC<BuildingDetailTabContainerProps> = ({
  buildingId,
  buildingName,
  userRole,
  complianceScore = 100,
  outstandingViolations = 0,
  building,
  violationSummary,
  propertyDetails,
  schedule,
  dsnyScheduleData,
  workers,
  routineSummaries,
  canViewPropertyDetails,
  renderPropertyDetailsCard,
  renderComplianceCard,
  renderScheduleCard,
  renderWorkerCard,
  renderRoutineCard,
  renderEmptyMessage,
  renderSectionHeader,
  DSNYScheduleCard,
}) => {
  // Lazy-loading state
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0])); // Overview always loaded

  // Tab navigation state
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'overview', title: 'Overview' },
    { key: 'operations', title: 'Operations' },
    { key: 'compliance', title: 'Compliance' },
    { key: 'resources', title: 'Resources' },
    { key: 'emergency', title: 'Emergency' },
    { key: 'reports', title: 'Reports' },
  ]);

  // Role-aware default tab selection
  useEffect(() => {
    let initialTab = 0; // Overview default

    if (userRole === 'worker') {
      initialTab = 1; // Operations first for workers
    } else {
      // If compliance risk is notable, surface Compliance first
      if (complianceScore < 80 || outstandingViolations > 0) {
        initialTab = 2; // Compliance tab
      }
    }

    setIndex(initialTab);
    // Load the initial tab
    setTimeout(() => {
      setLoadedTabs((prev) => new Set(prev).add(initialTab));
    }, 100);
  }, [userRole, complianceScore, outstandingViolations]);

  // Load tab when accessed
  useEffect(() => {
    if (!loadedTabs.has(index)) {
      // Small delay to ensure smooth animation
      setTimeout(() => {
        setLoadedTabs((prev) => new Set(prev).add(index));
      }, 100);
    }
  }, [index, loadedTabs]);

  // Loading placeholder for lazy-loaded tabs
  const LoadingScene = ({ message }: { message: string }) => (
    <View style={styles.loadingScene}>
      <ActivityIndicator size="large" color={Colors.info} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );

  // Scene renderers with lazy-loading
  const renderScene = ({ route }: { route: { key: string; title: string } }) => {
    const tabIndex = routes.findIndex((r) => r.key === route.key);
    const isLoaded = loadedTabs.has(tabIndex);

    if (!isLoaded) {
      return <LoadingScene message={`Loading ${route.title.toLowerCase()}...`} />;
    }

    switch (route.key) {
      case 'overview':
        return (
          <BuildingOverviewTab
            buildingId={buildingId}
            building={building}
            complianceScore={complianceScore}
            violationSummary={violationSummary}
            propertyDetails={propertyDetails}
            schedule={schedule}
            dsnyScheduleData={dsnyScheduleData}
            workers={workers}
            routineSummaries={routineSummaries}
            canViewPropertyDetails={canViewPropertyDetails}
            renderPropertyDetailsCard={renderPropertyDetailsCard}
            renderComplianceCard={renderComplianceCard}
            renderScheduleCard={renderScheduleCard}
            renderWorkerCard={renderWorkerCard}
            renderRoutineCard={renderRoutineCard}
            renderEmptyMessage={renderEmptyMessage}
            renderSectionHeader={renderSectionHeader}
            DSNYScheduleCard={DSNYScheduleCard}
          />
        );
      case 'operations':
        return <BuildingOperationsTab buildingId={buildingId} buildingName={buildingName} />;
      case 'compliance':
        return <BuildingComplianceTab buildingId={buildingId} buildingName={buildingName} />;
      case 'resources':
        return <BuildingResourcesTab buildingId={buildingId} buildingName={buildingName} />;
      case 'emergency':
        return <BuildingEmergencyTab buildingId={buildingId} buildingName={buildingName} />;
      case 'reports':
        return <BuildingReportsTab buildingId={buildingId} buildingName={buildingName} />;
      default:
        return <LoadingScene message="Loading..." />;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      scrollEnabled
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      tabStyle={styles.tab}
      labelStyle={styles.tabLabel}
      activeColor={Colors.info}
      inactiveColor={Colors.text.secondary}
    />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      lazy
      lazyPreloadDistance={0} // Only load when tab is accessed
    />
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.glass.regular,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  tab: {
    width: 'auto',
    minWidth: 100,
  },
  tabIndicator: {
    backgroundColor: Colors.info,
    height: 3,
  },
  tabLabel: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingScene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    ...Typography.bodyMedium,
  },
});

export default BuildingDetailTabContainer;
