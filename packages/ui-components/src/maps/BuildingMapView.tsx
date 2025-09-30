/**
 * 🗺️ Building Map View
 * Purpose: Interactive map with building markers and intelligence popovers
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { NamedCoordinate, OperationalDataTaskAssignment, WeatherSnapshot } from '@cyntientops/domain-schema';

export interface BuildingMapViewProps {
  buildings: NamedCoordinate[];
  tasks: OperationalDataTaskAssignment[];
  weather?: WeatherSnapshot;
  onBuildingPress?: (building: NamedCoordinate) => void;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  selectedBuildingId?: string;
  workerLocation?: { latitude: number; longitude: number };
  showWeatherOverlay?: boolean;
}

export interface BuildingMarker {
  id: string;
  coordinate: { latitude: number; longitude: number };
  building: NamedCoordinate;
  tasks: OperationalDataTaskAssignment[];
  taskCount: number;
  urgentTaskCount: number;
  completedTaskCount: number;
}

export const BuildingMapView: React.FC<BuildingMapViewProps> = ({
  buildings,
  tasks,
  weather,
  onBuildingPress,
  onTaskPress,
  selectedBuildingId,
  workerLocation,
  showWeatherOverlay = true,
}) => {
  const [markers, setMarkers] = useState<BuildingMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<BuildingMarker | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128, // NYC default
    longitude: -74.0060,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    generateMarkers();
    updateRegion();
  }, [buildings, tasks, selectedBuildingId]);

  const generateMarkers = () => {
    const newMarkers: BuildingMarker[] = buildings.map(building => {
      const buildingTasks = tasks.filter(task => task.assigned_building_id === building.id);
      const urgentTasks = buildingTasks.filter(task => 
        ['emergency', 'critical', 'urgent'].includes(task.priority)
      );
      const completedTasks = buildingTasks.filter(task => task.status === 'Completed');

      return {
        id: building.id,
        coordinate: {
          latitude: building.latitude,
          longitude: building.longitude,
        },
        building,
        tasks: buildingTasks,
        taskCount: buildingTasks.length,
        urgentTaskCount: urgentTasks.length,
        completedTaskCount: completedTasks.length,
      };
    });

    setMarkers(newMarkers);
  };

  const updateRegion = () => {
    if (buildings.length === 0) return;

    if (selectedBuildingId) {
      const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
      if (selectedBuilding) {
        setRegion({
          latitude: selectedBuilding.latitude,
          longitude: selectedBuilding.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } else {
      // Fit all buildings in view
      const latitudes = buildings.map(b => b.latitude);
      const longitudes = buildings.map(b => b.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const deltaLat = Math.max(maxLat - minLat, 0.01) * 1.2;
      const deltaLng = Math.max(maxLng - minLng, 0.01) * 1.2;
      
      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: deltaLat,
        longitudeDelta: deltaLng,
      });
    }
  };

  const getMarkerColor = (marker: BuildingMarker): string => {
    if (marker.urgentTaskCount > 0) return Colors.status.error;
    if (marker.taskCount > 0) return Colors.status.warning;
    return Colors.status.success;
  };

  const getMarkerIcon = (marker: BuildingMarker): string => {
    if (marker.urgentTaskCount > 0) return '🚨';
    if (marker.taskCount > 0) return '📋';
    return '✅';
  };

  const renderMarker = (marker: BuildingMarker) => (
    <Marker
      key={marker.id}
      coordinate={marker.coordinate}
      onPress={() => setSelectedMarker(marker)}
    >
      <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(marker) }]}>
        <Text style={styles.markerIcon}>{getMarkerIcon(marker)}</Text>
        <Text style={styles.markerText}>{marker.taskCount}</Text>
      </View>
      
      <Callout onPress={() => onBuildingPress?.(marker.building)}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{marker.building.name}</Text>
          <Text style={styles.calloutAddress}>{marker.building.address}</Text>
          <View style={styles.calloutStats}>
            <Text style={styles.calloutStat}>
              📋 {marker.taskCount} tasks
            </Text>
            {marker.urgentTaskCount > 0 && (
              <Text style={[styles.calloutStat, { color: Colors.status.error }]}>
                🚨 {marker.urgentTaskCount} urgent
              </Text>
            )}
          </View>
        </View>
      </Callout>
    </Marker>
  );

  const renderWorkerLocation = () => {
    if (!workerLocation) return null;

    return (
      <Marker
        coordinate={workerLocation}
        title="Your Location"
        description="Current position"
      >
        <View style={styles.workerMarker}>
          <Text style={styles.workerIcon}>👤</Text>
        </View>
      </Marker>
    );
  };

  const renderWeatherOverlay = () => {
    if (!weather || !showWeatherOverlay) return null;

    return (
      <View style={styles.weatherOverlay}>
        <View style={styles.weatherCard}>
          <Text style={styles.weatherIcon}>🌤️</Text>
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherTemp}>
              {weather.temperature ? `${Math.round(weather.temperature)}°F` : 'N/A'}
            </Text>
            <Text style={styles.weatherCondition}>
              {weather.condition || 'Unknown'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTaskModal = () => (
    <Modal
      visible={showTaskModal && selectedMarker !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTaskModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Tasks at {selectedMarker?.building.name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTaskModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.taskList}>
            {selectedMarker?.tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={() => {
                  onTaskPress?.(task);
                  setShowTaskModal(false);
                }}
              >
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.name}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.priority) }
                  ]}>
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <Text style={styles.taskStatus}>Status: {task.status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'emergency':
      case 'critical':
      case 'urgent': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.primary.yellow;
      case 'low': return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {markers.map(renderMarker)}
        {renderWorkerLocation()}
      </MapView>
      
      {renderWeatherOverlay()}
      {renderTaskModal()}
      
      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (selectedMarker) {
              setShowTaskModal(true);
            }
          }}
          disabled={!selectedMarker}
        >
          <Text style={styles.controlButtonText}>📋</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={updateRegion}
        >
          <Text style={styles.controlButtonText}>🎯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height * 0.7,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.primary,
  },
  markerIcon: {
    fontSize: 16,
  },
  markerText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  calloutContainer: {
    width: 200,
    padding: Spacing.sm,
  },
  calloutTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  calloutAddress: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  calloutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calloutStat: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
  },
  workerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.primary,
  },
  workerIcon: {
    fontSize: 16,
  },
  weatherOverlay: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  weatherCard: {
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  weatherIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  weatherCondition: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  mapControls: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  controlButtonText: {
    fontSize: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.base.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  modalTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  taskList: {
    flex: 1,
    padding: Spacing.lg,
  },
  taskItem: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  priorityText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  taskDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  taskStatus: {
    ...Typography.caption,
    color: Colors.primary.blue,
    fontWeight: '500',
  },
});

export default BuildingMapView;
