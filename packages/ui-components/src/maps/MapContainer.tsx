/**
 * 🗺️ Map Container with Bubble Markers
 * Mirrors: CyntientOps/Views/Maps/MapContainer.swift
 * Purpose: Interactive map with building markers and intelligence popovers
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Callout, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Building, WorkerProfile, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { IntelligencePopover } from './IntelligencePopover';
import { BuildingMarker } from './BuildingMarker';

interface MapContainerProps {
  buildings: Building[];
  workers?: WorkerProfile[];
  tasks?: OperationalDataTaskAssignment[];
  selectedBuildingId?: string;
  onBuildingSelect?: (building: Building) => void;
  onWorkerSelect?: (worker: WorkerProfile) => void;
  showWorkerLocations?: boolean;
  showTaskOverlay?: boolean;
  intelligenceData?: any;
}

const { width, height } = Dimensions.get('window');

export const MapContainer: React.FC<MapContainerProps> = ({
  buildings,
  workers = [],
  tasks = [],
  selectedBuildingId,
  onBuildingSelect,
  onWorkerSelect,
  showWorkerLocations = false,
  showTaskOverlay = false,
  intelligenceData
}) => {
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128, // NYC center
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedMarker, setSelectedMarker] = useState<string | null>(selectedBuildingId || null);
  const [showIntelligencePopover, setShowIntelligencePopover] = useState(false);
  const [popoverData, setPopoverData] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (buildings.length > 0) {
      // Calculate region to fit all buildings
      const coordinates = buildings.filter(b => b.latitude && b.longitude);
      if (coordinates.length > 0) {
        const minLat = Math.min(...coordinates.map(b => b.latitude!));
        const maxLat = Math.max(...coordinates.map(b => b.latitude!));
        const minLng = Math.min(...coordinates.map(b => b.longitude!));
        const maxLng = Math.max(...coordinates.map(b => b.longitude!));

        const newRegion = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.2,
          longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.2,
        };

        setRegion(newRegion);
      }
    }
  }, [buildings]);

  useEffect(() => {
    if (selectedBuildingId && mapRef.current) {
      const building = buildings.find(b => b.id === selectedBuildingId);
      if (building && building.latitude && building.longitude) {
        mapRef.current.animateToRegion({
          latitude: building.latitude,
          longitude: building.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
        setSelectedMarker(selectedBuildingId);
      }
    }
  }, [selectedBuildingId, buildings]);

  const handleMarkerPress = (building: Building) => {
    setSelectedMarker(building.id);
    setShowIntelligencePopover(true);
    
    // Prepare intelligence data for popover
    const buildingTasks = tasks.filter(t => t.assigned_building_id === building.id);
    const buildingWorkers = workers.filter(w => 
      buildingTasks.some(t => t.assigned_worker_id === w.id)
    );
    
    const popoverData = {
      building,
      tasks: buildingTasks,
      workers: buildingWorkers,
      intelligence: intelligenceData?.[building.id] || null,
      metrics: {
        totalTasks: buildingTasks.length,
        completedTasks: buildingTasks.filter(t => t.status === 'Completed').length,
        activeWorkers: buildingWorkers.filter(w => w.status === 'Available' || w.status === 'clockedIn').length,
        complianceRate: buildingTasks.length > 0 
          ? (buildingTasks.filter(t => t.status === 'Completed').length / buildingTasks.length) * 100 
          : 100,
      }
    };
    
    setPopoverData(popoverData);
    onBuildingSelect?.(building);
  };

  const handleCalloutPress = (building: Building) => {
    Alert.alert(
      building.name,
      `Address: ${building.address}\nType: ${building.building_type || 'N/A'}\nManagement: ${building.management_company || 'N/A'}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'View Details', onPress: () => onBuildingSelect?.(building) }
      ]
    );
  };

  const getMarkerColor = (building: Building): string => {
    if (selectedMarker === building.id) return '#10b981'; // Green for selected
    
    const buildingTasks = tasks.filter(t => t.assigned_building_id === building.id);
    const completedTasks = buildingTasks.filter(t => t.status === 'Completed').length;
    const completionRate = buildingTasks.length > 0 ? (completedTasks / buildingTasks.length) * 100 : 100;
    
    if (completionRate >= 90) return '#10b981'; // Green for high completion
    if (completionRate >= 70) return '#f59e0b'; // Yellow for medium completion
    return '#ef4444'; // Red for low completion
  };

  const getMarkerSize = (building: Building): number => {
    const buildingTasks = tasks.filter(t => t.assigned_building_id === building.id);
    const baseSize = 30;
    const taskMultiplier = Math.min(buildingTasks.length * 2, 20);
    return baseSize + taskMultiplier;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* Building Markers */}
        {buildings
          .filter(building => building.latitude && building.longitude)
          .map((building) => (
            <Marker
              key={building.id}
              coordinate={{
                latitude: building.latitude!,
                longitude: building.longitude!,
              }}
              onPress={() => handleMarkerPress(building)}
            >
              <BuildingMarker
                building={building}
                color={getMarkerColor(building)}
                size={getMarkerSize(building)}
                isSelected={selectedMarker === building.id}
                taskCount={tasks.filter(t => t.assigned_building_id === building.id).length}
              />
              <Callout onPress={() => handleCalloutPress(building)}>
                <View style={styles.callout}>
                  <View style={styles.calloutHeader}>
                    <Text style={styles.buildingName}>{building.name}</Text>
                    <Text style={styles.buildingAddress}>{building.address}</Text>
                  </View>
                  <View style={styles.calloutMetrics}>
                    <Text style={styles.metricText}>
                      Tasks: {tasks.filter(t => t.assigned_building_id === building.id).length}
                    </Text>
                    <Text style={styles.metricText}>
                      Workers: {workers.filter(w => 
                        tasks.some(t => t.assigned_building_id === building.id && t.assigned_worker_id === w.id)
                      ).length}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}

        {/* Worker Location Markers */}
        {showWorkerLocations && workers
          .filter(worker => worker.status === 'clockedIn' && worker.currentLocation)
          .map((worker) => (
            <Marker
              key={`worker-${worker.id}`}
              coordinate={{
                latitude: worker.currentLocation!.latitude,
                longitude: worker.currentLocation!.longitude,
              }}
              onPress={() => onWorkerSelect?.(worker)}
            >
              <View style={styles.workerMarker}>
                <Text style={styles.workerInitial}>
                  {worker.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Intelligence Popover */}
      {showIntelligencePopover && popoverData && (
        <IntelligencePopover
          data={popoverData}
          onClose={() => {
            setShowIntelligencePopover(false);
            setSelectedMarker(null);
          }}
          onViewDetails={() => {
            setShowIntelligencePopover(false);
            onBuildingSelect?.(popoverData.building);
          }}
        />
      )}

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <View style={styles.controlButton}>
          <Text style={styles.controlText}>📍</Text>
        </View>
        <View style={styles.controlButton}>
          <Text style={styles.controlText}>🔍</Text>
        </View>
        <View style={styles.controlButton}>
          <Text style={styles.controlText}>📊</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    width: 200,
    padding: 12,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  calloutHeader: {
    marginBottom: 8,
  },
  buildingName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buildingAddress: {
    color: '#9ca3af',
    fontSize: 14,
  },
  calloutMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  workerMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  workerInitial: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlText: {
    fontSize: 18,
  },
});

export default MapContainer;
