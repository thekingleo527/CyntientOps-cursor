/**
 * @cyntientops/ui-components
 * 
 * MapRevealContainer - Critical Map Component
 * Based on SwiftUI MapRevealContainer.swift (849 lines)
 * Features: Dual-mode reveal/overlay, building markers, clustering, gesture handling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from '../mocks/expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { Building, OperationalDataTaskAssignment, UserRole } from '@cyntientops/domain-schema';
import MapClusteringService, { BuildingMarker, ClusteredMarker } from './services/MapClusteringService';
import { ClusterMarker } from './components/ClusterMarker';

const { width, height } = Dimensions.get('window');

// Types
export interface MapRevealContainerProps {
  buildings: Building[];
  tasks: OperationalDataTaskAssignment[];
  userRole: UserRole;
  onBuildingPress: (building: Building) => void;
  onTaskPress: (task: OperationalDataTaskAssignment) => void;
  initialRegion?: Region;
  showClustering?: boolean;
  enableGestures?: boolean;
}

export interface MapState {
  isRevealed: boolean;
  isOverlayVisible: boolean;
  selectedBuilding: Building | null;
  selectedTask: OperationalDataTaskAssignment | null;
  currentRegion: Region;
  zoomLevel: number;
}

export interface MapAnimationState {
  revealProgress: Animated.Value;
  overlayOpacity: Animated.Value;
  markerScale: Animated.Value;
  hintOpacity: Animated.Value;
}

export const MapRevealContainer: React.FC<MapRevealContainerProps> = ({
  buildings,
  tasks,
  userRole,
  onBuildingPress,
  onTaskPress,
  initialRegion,
  showClustering = true,
  enableGestures = true,
}) => {
  // State
  const [mapState, setMapState] = useState<MapState>({
    isRevealed: false,
    isOverlayVisible: false,
    selectedBuilding: null,
    selectedTask: null,
    currentRegion: initialRegion || {
      latitude: 40.7580,
      longitude: -73.9855,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    },
    zoomLevel: 10,
  });

  // Animation values
  const animationState = useRef<MapAnimationState>({
    revealProgress: new Animated.Value(0),
    overlayOpacity: new Animated.Value(0),
    markerScale: new Animated.Value(1),
    hintOpacity: new Animated.Value(1),
  });

  // Refs
  const mapRef = useRef<MapView>(null);
  const clusteringService = useRef<MapClusteringService>(new MapClusteringService());
  const [clusters, setClusters] = useState<ClusteredMarker[]>([]);

  // Initialize clustering
  useEffect(() => {
    if (buildings.length > 0 && showClustering) {
      const buildingMarkers: BuildingMarker[] = buildings.map(building => ({
        id: building.id,
        name: building.name,
        address: building.address,
        latitude: building.latitude,
        longitude: building.longitude,
        taskCount: tasks.filter(t => t.buildingId === building.id).length,
        urgentTaskCount: tasks.filter(t => t.buildingId === building.id && t.priority === 'urgent').length,
        complianceScore: building.complianceScore || 100,
        status: building.hasEmergency ? 'emergency' : 'active',
        metadata: building,
      }));

      clusteringService.current.initialize(buildingMarkers);
      updateClusters(mapState.currentRegion);
    }
  }, [buildings, tasks, showClustering]);

  // Update clusters when region changes
  const updateClusters = useCallback((region: Region) => {
    if (!clusteringService.current.isInitialized()) return;

    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    const newClusters = clusteringService.current.getClusters(region, zoom);
    setClusters(newClusters);
  }, []);

  // Handle region change
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setMapState(prev => ({ ...prev, currentRegion: region }));
    updateClusters(region);
  }, [updateClusters]);

  // Reveal animation
  const revealMap = useCallback(() => {
    setMapState(prev => ({ ...prev, isRevealed: true }));
    
    Animated.parallel([
      Animated.timing(animationState.current.revealProgress, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(animationState.current.hintOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Overlay animation
  const showOverlay = useCallback((building: Building) => {
    setMapState(prev => ({ ...prev, selectedBuilding: building, isOverlayVisible: true }));
    
    Animated.timing(animationState.current.overlayOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const hideOverlay = useCallback(() => {
    Animated.timing(animationState.current.overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMapState(prev => ({ ...prev, isOverlayVisible: false, selectedBuilding: null }));
    });
  }, []);

  // Handle building press
  const handleBuildingPress = useCallback((building: Building) => {
    showOverlay(building);
    onBuildingPress(building);
  }, [showOverlay, onBuildingPress]);

  // Handle cluster press
  const handleClusterPress = useCallback((clusterId: number) => {
    const expansionRegion = clusteringService.current.getClusterExpansionRegion(clusterId);
    if (expansionRegion && mapRef.current) {
      mapRef.current.animateToRegion(expansionRegion, 300);
    }
  }, []);

  // Render markers
  const renderMarkers = useCallback(() => {
    if (showClustering && clusters.length > 0) {
      return clusters.map(marker => {
        if (marker.cluster) {
          const stats = clusteringService.current.getClusterStats(marker.properties.cluster_id);
          return (
            <ClusterMarker
              key={marker.id}
              latitude={marker.latitude}
              longitude={marker.longitude}
              pointCount={marker.pointCount || 0}
              onPress={() => handleClusterPress(marker.properties.cluster_id)}
              stats={stats}
            />
          );
        } else {
          const building = buildings.find(b => b.id === marker.properties.id);
          if (!building) return null;

          return (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
              onPress={() => handleBuildingPress(building)}
              tracksViewChanges={false}
            >
              <BuildingMarkerView building={building} />
            </Marker>
          );
        }
      });
    } else {
      return buildings.map(building => (
        <Marker
          key={building.id}
          coordinate={{ latitude: building.latitude, longitude: building.longitude }}
          onPress={() => handleBuildingPress(building)}
          tracksViewChanges={false}
        >
          <BuildingMarkerView building={building} />
        </Marker>
      ));
    }
  }, [showClustering, clusters, buildings, handleClusterPress, handleBuildingPress]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <Animated.View
        style={[
          styles.mapContainer,
          {
            opacity: animationState.current.revealProgress,
            transform: [
              {
                scale: animationState.current.revealProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapState.currentRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton
          loadingEnabled
          maxZoomLevel={20}
          minZoomLevel={5}
        >
          {renderMarkers()}
        </MapView>
      </Animated.View>

      {/* Reveal Hint */}
      {!mapState.isRevealed && (
        <Animated.View
          style={[
            styles.revealHint,
            { opacity: animationState.current.hintOpacity },
          ]}
        >
          <TouchableOpacity onPress={revealMap} style={styles.revealButton}>
            <LinearGradient
              colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
              style={styles.revealGradient}
            >
              <Text style={styles.revealText}>Tap to Reveal Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Building Overlay */}
      {mapState.isOverlayVisible && mapState.selectedBuilding && (
        <Animated.View
          style={[
            styles.overlay,
            { opacity: animationState.current.overlayOpacity },
          ]}
        >
          <TouchableOpacity style={styles.overlayBackground} onPress={hideOverlay} />
          <View style={styles.overlayContent}>
            <GlassCard
              intensity={GlassIntensity.regular}
              cornerRadius={CornerRadius.large}
              style={styles.buildingCard}
            >
              <Text style={styles.buildingName}>{mapState.selectedBuilding.name}</Text>
              <Text style={styles.buildingAddress}>{mapState.selectedBuilding.address}</Text>
              <Text style={styles.buildingCompliance}>
                Compliance: {Math.round((mapState.selectedBuilding.complianceScore || 0) * 100)}%
              </Text>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => {
                  hideOverlay();
                  onBuildingPress(mapState.selectedBuilding!);
                }}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Building Marker Component
const BuildingMarkerView: React.FC<{ building: Building }> = ({ building }) => {
  const getMarkerColor = () => {
    if (building.hasEmergency) return Colors.status.error;
    if ((building.complianceScore || 0) < 0.7) return Colors.status.warning;
    return Colors.status.success;
  };

  return (
    <View style={[styles.marker, { backgroundColor: getMarkerColor() }]}>
      <Text style={styles.markerText}>
        {building.name.split(' ')[0]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  revealHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -25 }],
  },
  revealButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  revealGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  revealText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  buildingCard: {
    padding: 20,
  },
  buildingName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  buildingAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  buildingCompliance: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 20,
  },
  viewDetailsButton: {
    backgroundColor: Colors.role.worker.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.text.inverse,
  },
  markerText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default MapRevealContainer;
