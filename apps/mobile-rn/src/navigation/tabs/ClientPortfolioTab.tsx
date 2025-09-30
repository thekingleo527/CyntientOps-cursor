/**
 * @cyntientops/mobile-rn
 *
 * Client Portfolio Tab - Map view filtered to client's buildings
 * Features: Client-specific building locations, task markers, compliance view
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

const { width, height } = Dimensions.get('window');

// Client email to client_id mapping
const CLIENT_EMAIL_TO_ID: Record<string, string> = {
  'david@jmrealty.org': 'JMR',
  'mfarhat@farhatrealtymanagement.com': 'WFR',
  'facilities@solarone.org': 'SOL',
  'management@grandelizabeth.com': 'GEL',
  'property@citadelrealty.com': 'CIT',
  'admin@corbelproperty.com': 'COR',
  'management@chelsea115.com': 'CHE',
};

// Types
export interface ClientPortfolioTabProps {
  clientId: string;
  clientName: string;
  userRole: string;
}

export interface MapViewMode {
  id: 'portfolio' | 'building' | 'compliance';
  title: string;
  icon: string;
}

const MAP_MODES: MapViewMode[] = [
  { id: 'portfolio', title: 'Portfolio', icon: '🏢' },
  { id: 'building', title: 'Building', icon: '📍' },
  { id: 'compliance', title: 'Compliance', icon: '✓' },
];

export const ClientPortfolioTab: React.FC<ClientPortfolioTabProps> = ({
  clientId,
  clientName,
}) => {
  const [activeMode, setActiveMode] = useState<'portfolio' | 'building' | 'compliance'>('portfolio');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [tasks, setTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Get client_id from clientId (email-based mapping)
  const getClientCode = (email: string): string => {
    return CLIENT_EMAIL_TO_ID[email] || 'JMR'; // Default to JMR if not found
  };

  useEffect(() => {
    loadMapData();
  }, [clientId]);

  const loadMapData = async () => {
    try {
      const clientCode = getClientCode(clientId);

      // Load only buildings for this client
      const buildingList: Building[] = buildingsData
        .filter((building: any) => building.client_id === clientCode)
        .map((building: any) => ({
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

      // Load tasks for this client's buildings
      const taskService = TaskService.getInstance();
      const allTasks: OperationalDataTaskAssignment[] = [];

      // Get tasks for each building
      buildingList.forEach(building => {
        const buildingTasks = taskService.getTasksForBuilding(building.id);
        allTasks.push(...buildingTasks);
      });

      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load client portfolio data:', error);
    }
  };

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setActiveMode('building');
  };

  const handleTaskPress = (task: OperationalDataTaskAssignment) => {
    // Navigate to task details
    console.log('Task pressed:', task);
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
      userRole="client"
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

  const renderComplianceView = () => (
    <MapRevealContainer
      buildings={buildings}
      tasks={tasks}
      userRole="client"
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
      case 'compliance':
        return renderComplianceView();
      default:
        return renderPortfolioView();
    }
  };

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
              <Text style={styles.statValue}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Active Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {buildings.length > 0
                  ? Math.round((buildings.reduce((sum, b) => sum + (b.complianceScore || 0), 0) / buildings.length) * 100)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Avg Compliance</Text>
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
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>Contact</Text>
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
    color: Colors.role.client.primary,
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
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: Colors.role.client.primary,
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

export default ClientPortfolioTab;