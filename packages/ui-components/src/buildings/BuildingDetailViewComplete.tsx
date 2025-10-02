/**
 * 🏢 Complete Building Detail View
 * Mirrors: CyntientOps/Views/Components/Buildings/BuildingDetailView.swift (4,752 lines)
 * Purpose: Complete building management with 9 tabs, integrating hardcoded operational data with real-time API data
 * Architecture: Hardcoded routines/tasks + Public API data (DSNY, HPD, DOB, LL97) = Comprehensive building profile
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ServiceContainer } from '@cyntientops/business-core';
import { NamedCoordinate, BuildingMetrics, ComplianceIssue, UserRole } from '@cyntientops/domain-schema';

// Import all building tabs
import { BuildingOverviewTab } from './tabs/BuildingOverviewTab';
import { BuildingRoutesTab } from './tabs/BuildingRoutesTab';
import { BuildingTasksTab } from './tabs/BuildingTasksTab';
import { BuildingTeamTab } from './tabs/BuildingTeamTab';
import { BuildingHistoryTab } from './tabs/BuildingHistoryTab';
import { BuildingSanitationTab } from './tabs/BuildingSanitationTab';
import { BuildingInventoryTab } from './tabs/BuildingInventoryTab';
import { BuildingSpacesTab } from './tabs/BuildingSpacesTab';
import { BuildingEmergencyTab } from './tabs/BuildingEmergencyTab';

export interface BuildingDetailViewCompleteProps {
  container: ServiceContainer;
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  userRole: UserRole;
  onBack?: () => void;
  onWorkerPress?: (workerId: string) => void;
  onTaskPress?: (taskId: string) => void;
  onCompliancePress?: (issue: ComplianceIssue) => void;
}

// Exact match to SwiftUI BuildingDetailTab enum
export enum BuildingDetailTab {
  OVERVIEW = 'Overview',
  ROUTES = 'Routes',
  TASKS = 'Tasks',
  WORKERS = 'Workers',
  HISTORY = 'History',
  SANITATION = 'Sanitation',
  INVENTORY = 'Inventory',
  SPACES = 'Spaces',
  EMERGENCY = 'Emergency'
}

export interface BuildingDetailData {
  building: NamedCoordinate;
  metrics: BuildingMetrics;
  tasks: any[];
  workers: any[];
  inventory: any[];
  compliance: any;
  routes: any[];
  media: any[];
  // API-enhanced data
  dsnySchedule: any;
  hpdViolations: any[];
  dobPermits: any[];
  ll97Emissions: any[];
  // Real-time status
  lastSync: Date;
  isOnline: boolean;
}

export const BuildingDetailViewComplete: React.FC<BuildingDetailViewCompleteProps> = ({
  container,
  buildingId,
  buildingName,
  buildingAddress,
  userRole,
  onBack,
  onWorkerPress,
  onTaskPress,
  onCompliancePress
}) => {
  const [selectedTab, setSelectedTab] = useState<BuildingDetailTab>(BuildingDetailTab.OVERVIEW);
  const [buildingData, setBuildingData] = useState<BuildingDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  useEffect(() => {
    loadBuildingData();
  }, [buildingId]);

  const loadBuildingData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load hardcoded operational data from data-seed
      const operationalData = container.operationalData;
      const buildingService = container.buildings;
      const complianceService = container.compliance;
      const analyticsService = container.analytics;
      const database = container.database;

      // Get building from hardcoded data
      const building = buildingService.getBuildingById(buildingId);
      if (!building) {
        throw new Error('Building not found in operational data');
      }

      // Load comprehensive data from multiple sources
      const [
        buildingTasks,
        buildingWorkers,
        buildingRoutines,
        complianceSummary,
        dsnySchedule,
        buildingMetrics,
        inventoryData,
        maintenanceData,
        spacesData
      ] = await Promise.all([
        // Hardcoded operational data
        operationalData.getTasksForBuilding(buildingId),
        operationalData.getWorkersForBuilding(buildingId),
        operationalData.getRoutinesForBuilding(buildingId),
        
        // Real-time API data
        complianceService.getBuildingComplianceSummary(buildingId),
        complianceService.getDSNYScheduleForBuilding(buildingId),
        buildingService.getBuildingMetrics(buildingId),
        
        // Database data
        database.query('SELECT * FROM inventory WHERE buildingId = ?', [buildingId]),
        database.query('SELECT * FROM maintenance_records WHERE buildingId = ?', [buildingId]),
        database.query('SELECT * FROM building_spaces WHERE buildingId = ?', [buildingId])
      ]);

      // Hydrate workers with real-time status
      const hydratedWorkers = buildingWorkers.map(worker => {
        const realTimeStatus = container.workers.getWorkerStatus(worker.id);
        return {
          ...worker,
          status: realTimeStatus?.status || 'offline',
          currentBuilding: realTimeStatus?.currentBuilding,
          clockInTime: realTimeStatus?.clockInTime,
          lastActive: realTimeStatus?.lastActive || new Date()
        };
      });

      // Hydrate tasks with real-time status
      const hydratedTasks = buildingTasks.map(task => {
        const realTimeStatus = container.tasks.getTaskStatus(task.id);
        return {
          ...task,
          status: realTimeStatus?.status || task.status,
          assigned_worker_id: realTimeStatus?.assignedWorkerId || task.assigned_worker_id,
          updated_at: realTimeStatus?.lastUpdated || task.updated_at
        };
      });

      // Combine hardcoded + API + database data
      const combinedData: BuildingDetailData = {
        building: {
          id: building.id,
          name: building.name,
          address: building.address,
          latitude: building.latitude,
          longitude: building.longitude
        },
        metrics: buildingMetrics,
        tasks: hydratedTasks,
        workers: hydratedWorkers,
        inventory: inventoryData,
        compliance: complianceSummary,
        routes: buildingRoutines, // Hardcoded routines become routes
        media: [], // Would be loaded from media service
        // API-enhanced data
        dsnySchedule: dsnySchedule,
        hpdViolations: complianceSummary.hpdViolations,
        dobPermits: complianceSummary.dobPermits,
        ll97Emissions: complianceSummary.ll97Emissions,
        // Real-time status
        lastSync: new Date(),
        isOnline: true
      };

      setBuildingData(combinedData);
    } catch (error) {
      console.error('Error loading building data:', error);
      Alert.alert('Error', 'Failed to load building data');
    } finally {
      setIsLoading(false);
    }
  }, [buildingId, container]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBuildingData();
    setIsRefreshing(false);
  }, [loadBuildingData]);

  const shouldShowTab = (tab: BuildingDetailTab): boolean => {
    // Role-based tab visibility
    switch (userRole) {
      case 'admin':
        return true; // Admins see all tabs
      case 'manager':
        return tab !== BuildingDetailTab.EMERGENCY; // Managers don't see emergency
      case 'worker':
        return [BuildingDetailTab.OVERVIEW, BuildingDetailTab.TASKS, BuildingDetailTab.ROUTES, BuildingDetailTab.SPACES].includes(tab);
      case 'client':
        return [BuildingDetailTab.OVERVIEW, BuildingDetailTab.COMPLIANCE, BuildingDetailTab.HISTORY].includes(tab);
      default:
        return false;
    }
  };

  const getTabIcon = (tab: BuildingDetailTab): string => {
    switch (tab) {
      case BuildingDetailTab.OVERVIEW: return '📊';
      case BuildingDetailTab.ROUTES: return '🗺️';
      case BuildingDetailTab.TASKS: return '✅';
      case BuildingDetailTab.WORKERS: return '👥';
      case BuildingDetailTab.MAINTENANCE: return '🔧';
      case BuildingDetailTab.SANITATION: return '🗑️';
      case BuildingDetailTab.INVENTORY: return '📦';
      case BuildingDetailTab.SPACES: return '🗝️';
      case BuildingDetailTab.EMERGENCY: return '🚨';
      default: return '📋';
    }
  };

  const renderTabContent = () => {
    if (!buildingData) return null;

    switch (selectedTab) {
      case BuildingDetailTab.OVERVIEW:
        return (
          <BuildingOverviewTab
            building={buildingData.building}
            metrics={buildingData.metrics}
            onWorkerPress={onWorkerPress}
            onTaskPress={onTaskPress}
          />
        );
      case BuildingDetailTab.ROUTES:
        return (
          <BuildingRoutesTab
            routes={buildingData.routes}
            building={buildingData.building}
            container={container}
            onRoutePress={(route) => console.log('Route pressed:', route)}
            onSequencePress={(sequence) => console.log('Sequence pressed:', sequence)}
          />
        );
      case BuildingDetailTab.TASKS:
        return (
          <BuildingTasksTab
            tasks={buildingData.tasks}
            workers={buildingData.workers}
            building={buildingData.building}
            container={container}
            onTaskPress={onTaskPress}
            onWorkerPress={onWorkerPress}
          />
        );
      case BuildingDetailTab.WORKERS:
        return (
          <BuildingTeamTab
            workers={buildingData.workers}
            building={buildingData.building}
            container={container}
            onWorkerPress={onWorkerPress}
            onAssignWorker={(workerId, taskId) => console.log('Assign worker:', workerId, taskId)}
            onClockInWorker={(workerId) => console.log('Clock in worker:', workerId)}
            onClockOutWorker={(workerId) => console.log('Clock out worker:', workerId)}
          />
        );
      case BuildingDetailTab.HISTORY:
        return (
          <BuildingHistoryTab
            buildingId={buildingId}
            buildingName={buildingName}
            container={container}
            onHistoryItemPress={onTaskPress}
          />
        );
      case BuildingDetailTab.SANITATION:
        return (
          <BuildingSanitationTab
            buildingId={buildingId}
            buildingName={buildingName}
            buildingAddress={buildingAddress}
            container={container}
            onSanitationPress={onTaskPress}
          />
        );
      case BuildingDetailTab.INVENTORY:
        return (
          <BuildingInventoryTab
            inventory={buildingData.inventory}
            buildingId={buildingId}
            container={container}
          />
        );
      case BuildingDetailTab.SPACES:
        return (
          <BuildingSpacesTab
            buildingId={buildingId}
            buildingName={buildingName}
            container={container}
            onSpacePress={onTaskPress}
          />
        );
      case BuildingDetailTab.EMERGENCY:
        return (
          <BuildingEmergencyTab
            buildingId={buildingId}
            buildingName={buildingName}
            buildingAddress={buildingAddress}
            container={container}
            onCall={(contact) => console.log('Call contact:', contact)}
            onMessage={(contact) => console.log('Message contact:', contact)}
            onEmergencyReport={(report) => console.log('Emergency report:', report)}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading building details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.buildingName}>{buildingName}</Text>
          <Text style={styles.buildingAddress}>{buildingAddress}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Building Hero Section */}
      <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD} style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>{buildingName}</Text>
            <Text style={styles.heroSubtitle}>{buildingAddress}</Text>
            {buildingData && (
              <View style={styles.heroMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{buildingData.workers.length}</Text>
                  <Text style={styles.metricLabel}>Workers</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{buildingData.tasks.length}</Text>
                  <Text style={styles.metricLabel}>Tasks</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{Math.round(buildingData.metrics.complianceScore * 100)}%</Text>
                  <Text style={styles.metricLabel}>Compliance</Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setIsHeaderExpanded(!isHeaderExpanded)}
          >
            <Text style={styles.expandButtonText}>{isHeaderExpanded ? '−' : '+'}</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabContainer}>
          {Object.values(BuildingDetailTab).map((tab) => {
            if (!shouldShowTab(tab)) return null;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  selectedTab === tab && styles.tabButtonSelected
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={styles.tabIcon}>{getTabIcon(tab)}</Text>
                <Text style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabTextSelected
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Tab Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryAction}
          />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  buildingName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
  },
  buildingAddress: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontFamily: Typography.fonts.primary,
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 20,
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
  },
  heroCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    fontFamily: Typography.fonts.primary,
    marginBottom: 16,
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryAction,
    fontFamily: Typography.fonts.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontFamily: Typography.fonts.primary,
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 20,
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
  },
  tabScroll: {
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabButtonSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emergencyContainer: {
    padding: 20,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    fontFamily: Typography.fonts.primary,
    marginBottom: 20,
  },
  emergencyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 16,
    color: Colors.primaryText,
    fontFamily: Typography.fonts.primary,
  },
});
