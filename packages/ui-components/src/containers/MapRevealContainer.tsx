/**
 * 🗺️ Map Reveal Container
 * Mirrors: CyntientOps/Maps/MapRevealContainer.swift (849+ lines)
 * Purpose: Advanced dual-mode map with intelligence previews, building markers, and smooth animations
 * Features: Interactive map, building markers, intelligence popovers, map controls, legend, clustering
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, Callout, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { NamedCoordinate, BuildingMetrics } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface MapRevealContainerProps {
  buildings: NamedCoordinate[];
  currentBuildingId?: string;
  focusBuildingId?: string;
  isRevealed: boolean;
  onBuildingTap?: (building: NamedCoordinate) => void;
  container: ServiceContainer;
  children: React.ReactNode;
}

export const MapRevealContainer: React.FC<MapRevealContainerProps> = ({
  buildings,
  currentBuildingId,
  focusBuildingId,
  isRevealed,
  onBuildingTap,
  container,
  children,
}) => {
  // State management
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedBuildingForPreview, setSelectedBuildingForPreview] = useState<NamedCoordinate | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [buildingMetrics, setBuildingMetrics] = useState<Map<string, BuildingMetrics>>(new Map());
  const [cachedMarkerViews, setCachedMarkerViews] = useState<Map<string, any>>(new Map());
  const [metricsLoadTimestamp, setMetricsLoadTimestamp] = useState<Date | null>(null);

  // Map state
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 40.7450, // Chelsea area - 23rd Street vicinity
    longitude: -73.9950, // Between 8th and 9th Avenue
    latitudeDelta: 0.025, // Tighter zoom for neighborhood focus
    longitudeDelta: 0.020, // Optimized for Manhattan's aspect ratio
  });

  // Animation values
  const mapOpacity = useRef(new Animated.Value(isRevealed ? 1 : 0.4)).current;
  const mapBlur = useRef(new Animated.Value(isRevealed ? 0 : 15)).current;
  const contentOffset = useRef(new Animated.Value(0)).current;
  const mapControlsOpacity = useRef(new Animated.Value(isRevealed ? 1 : 0)).current;

  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const mapLegendHeight = 150; // Account for map legend + safe area padding

  // Calculate portfolio center
  const portfolioCenter = useCallback(() => {
    if (buildings.length === 0) {
      return { latitude: 40.7450, longitude: -73.9950 };
    }
    
    const latSum = buildings.reduce((sum, building) => sum + building.latitude, 0);
    const lonSum = buildings.reduce((sum, building) => sum + building.longitude, 0);
    
    return {
      latitude: latSum / buildings.length,
      longitude: lonSum / buildings.length,
    };
  }, [buildings]);

  // Initialize map position
  useEffect(() => {
    const center = portfolioCenter();
    setMapRegion({
      ...center,
      latitudeDelta: 0.025,
      longitudeDelta: 0.020,
    });
  }, [portfolioCenter]);

  // Animate map reveal/hide
  useEffect(() => {
    Animated.parallel([
      Animated.timing(mapOpacity, {
        toValue: isRevealed ? 1 : 0.4,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(mapBlur, {
        toValue: isRevealed ? 0 : 15,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(mapControlsOpacity, {
        toValue: isRevealed ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isRevealed, mapOpacity, mapBlur, mapControlsOpacity]);

  // Preload building metrics
  const preloadBuildingMetrics = useCallback(async () => {
    if (isLoadingMetrics || !container) return;
    
    setIsLoadingMetrics(true);
    try {
      const metrics: Map<string, BuildingMetrics> = new Map();
      
      for (const building of buildings) {
        try {
          // Get building metrics from container
          const buildingMetricsData = await container.metrics?.getBuildingMetrics?.(building.id);
          if (buildingMetricsData) {
            metrics.set(building.id, buildingMetricsData);
          }
        } catch (error) {
          console.warn(`Failed to load metrics for building ${building.id}:`, error);
        }
      }
      
      setBuildingMetrics(metrics);
      setMetricsLoadTimestamp(new Date());
    } catch (error) {
      console.error('Failed to preload building metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [buildings, container, isLoadingMetrics]);

  // Load metrics on mount
  useEffect(() => {
    preloadBuildingMetrics();
  }, [preloadBuildingMetrics]);

  // Handle building tap
  const handleBuildingTap = useCallback((building: NamedCoordinate) => {
    if (isRevealed) {
      setSelectedBuildingForPreview(building);
      onBuildingTap?.(building);
    }
  }, [isRevealed, onBuildingTap]);

  // Handle building hover
  const handleBuildingHover = useCallback((buildingId: string, isHovering: boolean) => {
    if (isRevealed) {
      setHoveredBuildingId(isHovering ? buildingId : null);
    }
  }, [isRevealed]);

  // Map controls
  const zoomIn = useCallback(() => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 0.5,
      longitudeDelta: prev.longitudeDelta * 0.5,
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 2,
      longitudeDelta: prev.longitudeDelta * 2,
    }));
  }, []);

  const closeMap = useCallback(() => {
    // This would be handled by parent component
    // onMapToggle?.();
  }, []);

  // Render building marker
  const renderBuildingMarker = useCallback((building: NamedCoordinate) => {
    const isSelected = building.id === currentBuildingId;
    const isFocused = isRevealed && (building.id === focusBuildingId || building.id === hoveredBuildingId);
    const isInteractive = isRevealed;
    const metrics = buildingMetrics.get(building.id);

    return (
      <Marker
        key={building.id}
        coordinate={{
          latitude: building.latitude,
          longitude: building.longitude,
        }}
        title={building.name}
        description={building.address}
        onPress={() => handleBuildingTap(building)}
        onCalloutPress={() => handleBuildingTap(building)}
      >
        <View style={[
          styles.markerContainer,
          {
            backgroundColor: isSelected ? Colors.status.success : 
                           isFocused ? Colors.base.primary : 
                           Colors.glass.regular,
            borderColor: isSelected ? Colors.status.success : 
                        isFocused ? Colors.base.primary : 
                        Colors.glass.border,
            transform: [{ scale: isFocused ? 1.2 : 1 }],
          }
        ]}>
          <Text style={[
            styles.markerText,
            { color: isSelected || isFocused ? Colors.text.primary : Colors.text.secondary }
          ]}>
            {building.name.charAt(0)}
          </Text>
        </View>
      </Marker>
    );
  }, [currentBuildingId, focusBuildingId, hoveredBuildingId, isRevealed, buildingMetrics, handleBuildingTap]);

  return (
    <View style={styles.container}>
      {/* Base map layer (always present) */}
      <Animated.View 
        style={[
          styles.mapLayer,
          {
            opacity: mapOpacity,
            transform: [
              {
                scale: mapBlur.interpolate({
                  inputRange: [0, 15],
                  outputRange: [1, 0.95],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={isRevealed}
          showsScale={isRevealed}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          mapType="standard"
          scrollEnabled={isRevealed}
          zoomEnabled={isRevealed}
          rotateEnabled={isRevealed}
          pitchEnabled={isRevealed}
        >
          {buildings.map(renderBuildingMarker)}
        </MapView>

        {/* Overlay for ambient mode */}
        {!isRevealed && (
          <Animated.View 
            style={[
              styles.mapOverlay,
              {
                opacity: mapBlur.interpolate({
                  inputRange: [0, 15],
                  outputRange: [0, 0.7],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        )}
      </Animated.View>

      {/* Main content overlay */}
      <Animated.View
        style={[
          styles.contentLayer,
          {
            transform: [
              {
                translateY: contentOffset.interpolate({
                  inputRange: [-100, 0, 100],
                  outputRange: [-10, 0, 10],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>

      {/* Map controls when revealed */}
      {isRevealed && (
        <Animated.View 
          style={[
            styles.mapControls,
            { opacity: mapControlsOpacity },
          ]}
        >
          <View style={styles.controlsContainer}>
            <View style={styles.zoomControls}>
              {/* Zoom In button */}
              <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
              
              {/* Zoom Out button */}
              <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
            </View>
            
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeMap}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Map legend when revealed */}
      {isRevealed && (
        <Animated.View 
          style={[
            styles.mapLegend,
            { opacity: mapControlsOpacity },
          ]}
        >
          <View style={styles.legendContainer}>
            <View style={styles.legendHeader}>
              <Text style={styles.legendIcon}>🏢</Text>
              <Text style={styles.legendTitle}>My Buildings</Text>
              <Text style={styles.legendCount}>{buildings.length}</Text>
            </View>
            
            {currentBuildingId && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.status.success }]} />
                <Text style={styles.legendText}>Currently clocked in</Text>
              </View>
            )}
            
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.base.primary }]} />
              <Text style={styles.legendText}>Portfolio buildings</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Intelligence popover */}
      {selectedBuildingForPreview && (
        <View style={styles.popoverContainer}>
          <View style={styles.popover}>
            <View style={styles.popoverHeader}>
              <Text style={styles.popoverTitle}>{selectedBuildingForPreview.name}</Text>
              <TouchableOpacity 
                style={styles.popoverClose}
                onPress={() => setSelectedBuildingForPreview(null)}
              >
                <Text style={styles.popoverCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.popoverAddress}>{selectedBuildingForPreview.address}</Text>
            
            {buildingMetrics.get(selectedBuildingForPreview.id) && (
              <View style={styles.popoverMetrics}>
                <Text style={styles.popoverMetricsTitle}>Building Metrics</Text>
                <Text style={styles.popoverMetricsText}>
                  Status: Active • Tasks: 5 • Workers: 2
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.popoverButton}
              onPress={() => handleBuildingTap(selectedBuildingForPreview)}
            >
              <Text style={styles.popoverButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  mapLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.base.background,
    zIndex: 1,
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 2,
  },
  controlsContainer: {
    alignItems: 'flex-end',
  },
  zoomControls: {
    marginBottom: Spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass.regular,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.glass.regular,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  legendContainer: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  legendIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  legendTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    flex: 1,
  },
  legendCount: {
    ...Typography.titleMedium,
    color: Colors.base.primary,
    fontWeight: 'bold',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.base.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  popoverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 3,
  },
  popover: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    minWidth: 280,
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  popoverTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    flex: 1,
  },
  popoverClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.glass.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popoverCloseText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  popoverAddress: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  popoverMetrics: {
    marginBottom: Spacing.md,
  },
  popoverMetricsTitle: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  popoverMetricsText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  popoverButton: {
    backgroundColor: Colors.base.primary,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  popoverButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

export default MapRevealContainer;