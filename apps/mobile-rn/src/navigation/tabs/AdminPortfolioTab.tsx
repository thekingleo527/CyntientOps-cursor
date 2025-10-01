/**
 * @cyntientops/mobile-rn
 *
 * Admin Portfolio Tab - Full portfolio map view for administrators
 * Features: All building locations, system-wide tasks, worker tracking, analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';
import { MapRevealContainer } from '@cyntientops/ui-components/src/maps/MapRevealContainer';
import { BuildingMapView } from '@cyntientops/ui-components/src/maps/BuildingMapView';
import { TaskService } from '@cyntientops/business-core/src/services/TaskService';
import { Building, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import buildingsData from '@cyntientops/data-seed/buildings.json';
import workersData from '@cyntientops/data-seed/workers.json';
import { Logger } from '@cyntientops/business-core';

const { width, height } = Dimensions.get('window');

// Types
export interface AdminPortfolioTabProps {
  adminId: string;
  adminName: string;
  userRole: string;
}

export interface MapViewMode {
  id: 'portfolio' | 'building' | 'workers' | 'analytics';
  title: string;
  icon: string;
}

const MAP_MODES: MapViewMode[] = [
  { id: 'portfolio', title: 'Portfolio', icon: '🏢' },
  { id: 'building', title: 'Building', icon: '📍' },
  { id: 'workers', title: 'Workers', icon: '👷' },
  { id: 'analytics', title: 'Analytics', icon: '📊' },
];

export const AdminPortfolioTab: React.FC<AdminPortfolioTabProps> = ({
  adminId,
  adminName,
}) => {
  const [activeMode, setActiveMode] = useState<'portfolio' | 'building' | 'workers' | 'analytics'>('portfolio');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [tasks, setTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    loadMapData();
  }, [adminId]);

  const loadMapData = async () => {
    try {
      // Load ALL buildings (admin sees everything)
      const buildingList: Building[] = buildingsData.map((building: any) => ({
        id: building.id,
        name: building.name,
        address: building.address,
        latitude: building.latitude,
        longitude: building.longitude,
        complianceScore: building.compliance_score || 0.85,
        hasEmergency: false,
        activeTasks: [],
        contactInfo: {
          phone: building.contactPhone || '+1-555-0000',
          email: building.contactEmail || 'contact@building.com',
        },
      }));
      setBuildings(buildingList);

      // Load all tasks across all buildings
      const taskService = TaskService.getInstance();
      const allTasks: OperationalDataTaskAssignment[] = [];

      // Get tasks for all workers
      workersData.forEach(worker => {
        const schedule = taskService.generateWorkerTasks(worker.id);
        allTasks.push(...schedule.now, ...schedule.next, ...schedule.today);
      });

      setTasks(allTasks);
    } catch (error) {
      Logger.error('Failed to load admin portfolio data:', undefined, 'AdminPortfolioTab.tsx');
    }
  };

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setActiveMode('building');
  };

  const handleTaskPress = (task: OperationalDataTaskAssignment) => {
    // Navigate to task details
    Logger.debug('Task pressed:', undefined, 'AdminPortfolioTab.tsx');
  };

  const renderModeButton = (mode: MapViewMode) => {
    const isActive = activeMode === mode.id;

    return (
      <TouchableOpacity
        key={mode.id}
        style={[styles.modeButton, isActive && styles.activeModeButton]}
        onPress={() => setActiveMode(mode.id)}
      >
        <Text style={styles.modeIcon}>{mode.icon}</Text>
        <Text style={[styles.modeText, isActive && styles.activeModeText]}>
          {mode.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPortfolioView = () => (
    <MapRevealContainer
      buildings={buildings}
      tasks={tasks}
      userRole="admin"
      onBuildingPress={handleBuildingPress}
      onTaskPress={handleTaskPress}
      showClustering={true}
      enableGestures={true}
    />
  );

  const renderBuildingView = () => {
    if (!selectedBuilding) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select a building to view details</Text>
        </View>
      );
    }

    const buildingTasks = tasks.filter(task => task.buildingId === selectedBuilding.id);

    return (
      <BuildingMapView
        building={selectedBuilding}
        tasks={buildingTasks}
        workers={[]} // Would load actual workers
        onTaskPress={handleTaskPress}
        onWorkerPress={() => {}}
        showRoutes={true}
        showWorkerLocations={true}
        enableRealTimeUpdates={true}
      />
    );
  };

  const renderWorkersView = () => (
    <MapRevealContainer
      buildings={buildings}
      tasks={tasks}
      userRole="admin"
      onBuildingPress={handleBuildingPress}
      onTaskPress={handleTaskPress}
      showClustering={false}
      enableGestures={true}
    />
  );

  const renderAnalyticsView = () => (
    <MapRevealContainer
      buildings={buildings}
      tasks={tasks}
      userRole="admin"
      onBuildingPress={handleBuildingPress}
      onTaskPress={handleTaskPress}
      showClustering={true}
      enableGestures={true}
    />
  );

  const renderContent = () => {
    switch (activeMode) {
      case 'portfolio':
        return renderPortfolioView();
      case 'building':
        return renderBuildingView();
      case 'workers':
        return renderWorkersView();
      case 'analytics':
        return renderAnalyticsView();
      default:
        return renderPortfolioView();
    }
  };

  // Calculate stats
  const totalUnits = buildings.reduce((sum, b: any) => {
    const building = buildingsData.find((bd: any) => bd.id === b.id);
    return sum + (building?.numberOfUnits || 0);
  }, 0);

  const avgCompliance = buildings.length > 0
    ? Math.round((buildings.reduce((sum, b) => sum + (b.complianceScore || 0), 0) / buildings.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.MEDIUM}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{buildings.length}</Text>
              <Text style={styles.statLabel}>Buildings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workersData.length}</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Active Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgCompliance}%</Text>
              <Text style={styles.statLabel}>Compliance</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        {MAP_MODES.map(renderModeButton)}
      </View>

      {/* Map Content */}
      <View style={styles.mapContainer}>
        {renderContent()}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionText}>Alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.role.admin.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.glass.regular,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: Colors.role.admin.primary,
  },
  modeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeModeText: {
    color: Colors.text.inverse,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.glass.regular,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});

export default AdminPortfolioTab;