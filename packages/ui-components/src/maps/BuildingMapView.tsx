/**
 * @cyntientops/ui-components
 * 
 * BuildingMapView - Building-Specific Map View
 * Based on SwiftUI BuildingMapView.swift (512 lines)
 * Features: Custom annotations, route visualization, worker tracking, real-time updates
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from '../mocks/expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { Building, OperationalDataTaskAssignment, Worker } from '@cyntientops/domain-schema';

const { width, height } = Dimensions.get('window');

// Types
export interface BuildingMapViewProps {
  building: Building;
  tasks: OperationalDataTaskAssignment[];
  workers: Worker[];
  onTaskPress: (task: OperationalDataTaskAssignment) => void;
  onWorkerPress: (worker: Worker) => void;
  showRoutes?: boolean;
  showWorkerLocations?: boolean;
  enableRealTimeUpdates?: boolean;
}

export interface RouteData {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  color: string;
  width: number;
  taskId: string;
  workerId: string;
}

export interface WorkerLocation {
  workerId: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface MapViewState {
  selectedTask: OperationalDataTaskAssignment | null;
  selectedWorker: Worker | null;
  showTaskDetails: boolean;
  showWorkerDetails: boolean;
  currentRegion: Region;
  routes: RouteData[];
  workerLocations: WorkerLocation[];
}

export const BuildingMapView: React.FC<BuildingMapViewProps> = ({
  building,
  tasks,
  workers,
  onTaskPress,
  onWorkerPress,
  showRoutes = true,
  showWorkerLocations = true,
  enableRealTimeUpdates = true,
}) => {
  // State
  const [mapState, setMapState] = useState<MapViewState>({
    selectedTask: null,
    selectedWorker: null,
    showTaskDetails: false,
    showWorkerDetails: false,
    currentRegion: {
      latitude: building.latitude,
      longitude: building.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
    routes: [],
    workerLocations: [],
  });

  // Refs
  const mapRef = useRef<MapView>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Generate routes for tasks
  const generateRoutes = useCallback(() => {
    if (!showRoutes) return [];

    const routes: RouteData[] = tasks.map(task => {
      const worker = workers.find(w => w.id === task.assignedWorkerId);
      if (!worker) return null;

      // Generate route from worker location to building
      const coordinates = [
        { latitude: worker.latitude || building.latitude, longitude: worker.longitude || building.longitude },
        { latitude: building.latitude, longitude: building.longitude },
      ];

      return {
        id: `route_${task.id}`,
        coordinates,
        color: getTaskPriorityColor(task.priority),
        width: getTaskPriorityWidth(task.priority),
        taskId: task.id,
        workerId: task.assignedWorkerId,
      };
    }).filter(Boolean) as RouteData[];

    setMapState(prev => ({ ...prev, routes }));
  }, [tasks, workers, building, showRoutes]);

  // Generate worker locations
  const generateWorkerLocations = useCallback(() => {
    if (!showWorkerLocations) return [];

    const locations: WorkerLocation[] = workers.map(worker => ({
      workerId: worker.id,
      latitude: worker.latitude || building.latitude + (Math.random() - 0.5) * 0.001,
      longitude: worker.longitude || building.longitude + (Math.random() - 0.5) * 0.001,
      lastUpdated: new Date(),
      isActive: worker.isActive || false,
    }));

    setMapState(prev => ({ ...prev, workerLocations: locations }));
  }, [workers, building, showWorkerLocations]);

  // Initialize data
  useEffect(() => {
    generateRoutes();
    generateWorkerLocations();
  }, [generateRoutes, generateWorkerLocations]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates) {
      updateInterval.current = setInterval(() => {
        generateWorkerLocations();
      }, 30000); // Update every 30 seconds

      return () => {
        if (updateInterval.current) {
          clearInterval(updateInterval.current);
        }
      };
    }
  }, [enableRealTimeUpdates, generateWorkerLocations]);

  // Helper functions
  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.role.worker.primary;
    }
  };

  const getTaskPriorityWidth = (priority: string) => {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  };

  // Handle task marker press
  const handleTaskPress = useCallback((task: OperationalDataTaskAssignment) => {
    setMapState(prev => ({
      ...prev,
      selectedTask: task,
      showTaskDetails: true,
      showWorkerDetails: false,
    }));
    onTaskPress(task);
  }, [onTaskPress]);

  // Handle worker marker press
  const handleWorkerPress = useCallback((worker: Worker) => {
    setMapState(prev => ({
      ...prev,
      selectedWorker: worker,
      showWorkerDetails: true,
      showTaskDetails: false,
    }));
    onWorkerPress(worker);
  }, [onWorkerPress]);

  // Handle close details
  const handleCloseDetails = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      showTaskDetails: false,
      showWorkerDetails: false,
      selectedTask: null,
      selectedWorker: null,
    }));
  }, []);

  // Render task markers
  const renderTaskMarkers = useCallback(() => {
    return tasks.map(task => {
      const worker = workers.find(w => w.id === task.assignedWorkerId);
      if (!worker) return null;

      return (
        <Marker
          key={`task_${task.id}`}
          coordinate={{
            latitude: building.latitude + (Math.random() - 0.5) * 0.0005,
            longitude: building.longitude + (Math.random() - 0.5) * 0.0005,
          }}
          onPress={() => handleTaskPress(task)}
        >
          <TaskMarkerView task={task} />
        </Marker>
      );
    });
  }, [tasks, workers, building, handleTaskPress]);

  // Render worker markers
  const renderWorkerMarkers = useCallback(() => {
    return mapState.workerLocations.map(location => {
      const worker = workers.find(w => w.id === location.workerId);
      if (!worker) return null;

      return (
        <Marker
          key={`worker_${location.workerId}`}
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          onPress={() => handleWorkerPress(worker)}
        >
          <WorkerMarkerView worker={worker} isActive={location.isActive} />
        </Marker>
      );
    });
  }, [mapState.workerLocations, workers, handleWorkerPress]);

  // Render routes
  const renderRoutes = useCallback(() => {
    return mapState.routes.map(route => (
      <Polyline
        key={route.id}
        coordinates={route.coordinates}
        strokeColor={route.color}
        strokeWidth={route.width}
        lineDashPattern={[5, 5]}
      />
    ));
  }, [mapState.routes]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapState.currentRegion}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
        maxZoomLevel={20}
        minZoomLevel={10}
      >
        {/* Building Marker */}
        <Marker
          coordinate={{
            latitude: building.latitude,
            longitude: building.longitude,
          }}
          title={building.name}
          description={building.address}
        >
          <BuildingMarkerView building={building} />
        </Marker>

        {/* Routes */}
        {renderRoutes()}

        {/* Task Markers */}
        {renderTaskMarkers()}

        {/* Worker Markers */}
        {renderWorkerMarkers()}
      </MapView>

      {/* Task Details Overlay */}
      {mapState.showTaskDetails && mapState.selectedTask && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={handleCloseDetails} />
          <View style={styles.overlayContent}>
            <GlassCard
              intensity={GlassIntensity.regular}
              cornerRadius={CornerRadius.large}
              style={styles.detailsCard}
            >
              <Text style={styles.taskTitle}>{mapState.selectedTask.title}</Text>
              <Text style={styles.taskDescription}>{mapState.selectedTask.description}</Text>
              <Text style={styles.taskPriority}>
                Priority: {mapState.selectedTask.priority}
              </Text>
              <Text style={styles.taskStatus}>
                Status: {mapState.selectedTask.status}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseDetails}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </View>
      )}

      {/* Worker Details Overlay */}
      {mapState.showWorkerDetails && mapState.selectedWorker && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={handleCloseDetails} />
          <View style={styles.overlayContent}>
            <GlassCard
              intensity={GlassIntensity.regular}
              cornerRadius={CornerRadius.large}
              style={styles.detailsCard}
            >
              <Text style={styles.workerName}>{mapState.selectedWorker.name}</Text>
              <Text style={styles.workerRole}>{mapState.selectedWorker.role}</Text>
              <Text style={styles.workerStatus}>
                Status: {mapState.selectedWorker.isActive ? 'Active' : 'Inactive'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseDetails}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </View>
      )}
    </View>
  );
};

// Building Marker Component
const BuildingMarkerView: React.FC<{ building: Building }> = ({ building }) => {
  return (
    <View style={styles.buildingMarker}>
      <Text style={styles.buildingMarkerText}>🏢</Text>
    </View>
  );
};

// Task Marker Component
const TaskMarkerView: React.FC<{ task: OperationalDataTaskAssignment }> = ({ task }) => {
  const getTaskColor = () => {
    switch (task.priority) {
      case 'urgent': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.role.worker.primary;
    }
  };

  return (
    <View style={[styles.taskMarker, { backgroundColor: getTaskColor() }]}>
      <Text style={styles.taskMarkerText}>📋</Text>
    </View>
  );
};

// Worker Marker Component
const WorkerMarkerView: React.FC<{ worker: Worker; isActive: boolean }> = ({ worker, isActive }) => {
  return (
    <View style={[
      styles.workerMarker,
      { backgroundColor: isActive ? Colors.status.success : Colors.status.pending }
    ]}>
      <Text style={styles.workerMarkerText}>👷</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayContent: {
    width: width * 0.8,
    maxWidth: 400,
  },
  detailsCard: {
    padding: 20,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  taskPriority: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 20,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  workerRole: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  workerStatus: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: Colors.role.worker.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  buildingMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.role.worker.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.text.inverse,
  },
  buildingMarkerText: {
    fontSize: 24,
  },
  taskMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.inverse,
  },
  taskMarkerText: {
    fontSize: 16,
  },
  workerMarker: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.inverse,
  },
  workerMarkerText: {
    fontSize: 18,
  },
});

export default BuildingMapView;