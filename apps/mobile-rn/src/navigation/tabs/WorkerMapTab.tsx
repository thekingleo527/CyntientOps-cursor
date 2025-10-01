/**
 * @cyntientops/mobile-rn
 * 
 * Worker Map Tab - Dedicated map view for workers
 * Features: Building locations, task markers, navigation, clock-in integration
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
import { Logger } from '@cyntientops/business-core';

const { width, height } = Dimensions.get('window');

// Types
export interface WorkerMapTabProps {
  userId: string;
  userName: string;
  userRole: string;
}

export interface MapViewMode {
  id: 'portfolio' | 'building' | 'tasks';
  title: string;
  icon: string;
}

const MAP_MODES: MapViewMode[] = [
  { id: 'portfolio', title: 'Portfolio', icon: '🏢' },
  { id: 'building', title: 'Building', icon: '📍' },
  { id: 'tasks', title: 'Tasks', icon: '📋' },
];

export const WorkerMapTab: React.FC<WorkerMapTabProps> = ({
  userId,
  userName,
}) => {
  const [activeMode, setActiveMode] = useState<'portfolio' | 'building' | 'tasks'>('portfolio');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [tasks, setTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  useEffect(() => {
    loadMapData();
  }, [userId]);

  const loadMapData = async () => {
    try {
      // Load buildings
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

      // Load tasks
      const taskService = TaskService.getInstance();
      const schedule = taskService.generateWorkerTasks(userId);
      setTasks([...schedule.now, ...schedule.next, ...schedule.today]);
    } catch (error) {
      Logger.error('Failed to load map data:', undefined, 'WorkerMapTab.tsx');
    }
  };

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setActiveMode('building');
  };

  const handleTaskPress = (task: OperationalDataTaskAssignment) => {
    // Navigate to task details
    Logger.debug('Task pressed:', undefined, 'WorkerMapTab.tsx');
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
      userRole="worker"
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

  const renderTasksView = () => (
    <MapRevealContainer
      buildings={buildings}
      tasks={tasks}
      userRole="worker"
      onBuildingPress={handleBuildingPress}
      onTaskPress={handleTaskPress}
      showClustering={false}
      enableGestures={true}
    />
  );

  const renderContent = () => {
    switch (activeMode) {
      case 'portfolio':
        return renderPortfolioView();
      case 'building':
        return renderBuildingView();
      case 'tasks':
        return renderTasksView();
      default:
        return renderPortfolioView();
    }
  };

  return (
    <View style={styles.container}>
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
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionText}>My Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.glass.regular,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: Colors.role.worker.primary,
  },
  modeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modeText: {
    fontSize: 14,
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
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.glass.regular,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});

export default WorkerMapTab;
