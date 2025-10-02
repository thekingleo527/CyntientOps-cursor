/**
 * 🗺️ Map Reveal Container
 * Mirrors: CyntientOps/Views/Components/Map/MapRevealContainer.swift (849+ lines)
 * Purpose: Advanced map interaction with building portfolio, route optimization, and real-time data overlay
 * Features: Weather overlay, traffic data, building selection, route planning, Nova AI integration
 */

import React from 'react';
const { useState, useEffect, useRef, useCallback } = React;
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

// Mock Animated and PanResponder for development
class MockAnimatedValue {
  _value: number;
  constructor(value: number) {
    this._value = value;
  }
  setValue = () => {};
  interpolate = () => this._value;
}

const Animated = {
  Value: MockAnimatedValue,
  timing: (value: any, config: any) => ({ start: () => {} }),
  parallel: (animations: any[]) => ({ start: () => {} }),
  sequence: (animations: any[]) => ({ start: () => {} }),
  View: View,
};

const PanResponder = {
  create: (config: any) => ({ panHandlers: {} }),
};
// Mock MapView components for development
const MapView = ({ children, style, ...props }: any) => (
  <View style={[style, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]} {...props}>
    <Text style={{ color: '#666', fontSize: 16 }}>🗺️ Map View (Mock)</Text>
    {children}
  </View>
);

const Marker = ({ coordinate, title, description, pinColor, onPress, ...props }: any) => (
  <TouchableOpacity 
    style={{
      position: 'absolute',
      left: coordinate.latitude * 10,
      top: coordinate.longitude * 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: pinColor || '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
    }}
    onPress={onPress}
    {...props}
  >
    <Text style={{ color: 'white', fontSize: 10 }}>📍</Text>
  </TouchableOpacity>
);

const Polyline = ({ coordinates, strokeColor, strokeWidth, ...props }: any) => (
  <View style={{ position: 'absolute', width: '100%', height: '100%' }} {...props} />
);

const Circle = ({ center, radius, fillColor, strokeColor, ...props }: any) => (
  <View style={{ position: 'absolute', width: '100%', height: '100%' }} {...props} />
);

const PROVIDER_GOOGLE = 'google';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { NamedCoordinate, WeatherSnapshot, UserRole, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import MapClusteringService, { BuildingMarker, ClusteredMarker } from '../maps/services/MapClusteringService';
import { ClusterMarker } from '../maps/components/ClusterMarker';
import { useMapClustering } from '../maps/hooks/useMapClustering';
// Mock interfaces for development
interface WeatherAPIClient {
  getCurrentWeather(lat: number, lng: number): Promise<any>;
}

interface ServiceContainer {
  getInstance(config: any): ServiceContainer;
  apiClients: {
    weather: WeatherAPIClient;
  };
}

const { width, height } = Dimensions.get('window');

export interface MapRevealContainerProps {
  buildings: NamedCoordinate[];
  selectedBuilding?: NamedCoordinate;
  onBuildingSelect: (building: NamedCoordinate) => void;
  onRouteOptimize: (buildings: NamedCoordinate[]) => void;
  onWeatherToggle: (enabled: boolean) => void;
  onTrafficToggle: (enabled: boolean) => void;
  userRole: UserRole;
  weather?: WeatherSnapshot;
  showWeatherOverlay: boolean;
  showTrafficData: boolean;
  currentLocation?: { latitude: number; longitude: number };
  tasks?: OperationalDataTaskAssignment[];
  container: ServiceContainer;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onNovaAIPress?: () => void;
}

export interface RouteOptimization {
  optimizedRoute: NamedCoordinate[];
  totalDistance: number;
  estimatedTime: number;
  weatherImpact: number;
  trafficImpact: number;
  efficiency: number;
}

export interface MapOverlayData {
  weather: {
    temperature: number;
    condition: string;
    icon: string;
    alerts: string[];
  };
  traffic: {
    congestionLevel: number;
    incidents: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high';
      location: { latitude: number; longitude: number };
      description: string;
    }>;
  };
  buildings: {
    total: number;
    active: number;
    compliance: number;
    tasks: number;
  };
}

export const MapRevealContainer: React.FC<MapRevealContainerProps> = ({
  buildings,
  selectedBuilding,
  onBuildingSelect,
  onRouteOptimize,
  onWeatherToggle,
  onTrafficToggle,
  userRole,
  weather,
  showWeatherOverlay,
  showTrafficData,
  currentLocation,
  tasks = [],
  container,
  onTaskPress,
  onNovaAIPress,
}) => {
  // State management
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7589,
    longitude: -73.9851,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedBuildings, setSelectedBuildings] = useState<NamedCoordinate[]>([]);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [overlayData, setOverlayData] = useState<MapOverlayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showBuildingDetails, setShowBuildingDetails] = useState(false);
  const [selectedBuildingTasks, setSelectedBuildingTasks] = useState<OperationalDataTaskAssignment[]>([]);

  // Convert buildings to BuildingMarker format for clustering
  const buildingMarkers: BuildingMarker[] = buildings.map(b => ({
    id: b.id,
    name: b.name,
    address: b.address,
    latitude: b.latitude,
    longitude: b.longitude,
    taskCount: b.activeTasks?.length || 0,
    urgentTaskCount: b.activeTasks?.filter(t => t.priority === 'urgent').length || 0,
    complianceScore: b.complianceScore || 100,
    status: b.hasEmergency ? 'emergency' : 'active',
    metadata: b,
  }));

  // Initialize clustering
  const { clusters, updateClusters, isInitialized } = useMapClustering(buildingMarkers);

  // Animation refs
  const controlsAnimation = useRef(new Animated.Value(1)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  const routeAnimation = useRef(new Animated.Value(0)).current;

  // Map ref
  const mapRef = useRef<any>(null);

  // Initialize map data
  useEffect(() => {
    initializeMapData();
  }, [buildings, weather, tasks]);

  // Update clusters when region changes
  const handleRegionChangeComplete = (newRegion: any) => {
    setMapRegion(newRegion);
    updateClusters(newRegion);
  };

  // Handle cluster press (zoom in)
  const handleClusterPress = (clusterId: number) => {
    const expansionRegion = MapClusteringService.getClusterExpansionRegion(clusterId);

    if (expansionRegion && mapRef.current) {
      mapRef.current.animateToRegion(expansionRegion, 300);
    }
  };

  // Update overlay data when dependencies change
  useEffect(() => {
    updateOverlayData();
  }, [weather, showWeatherOverlay, showTrafficData, buildings, tasks]);

  // Animate controls visibility
  useEffect(() => {
    Animated.timing(controlsAnimation, {
      toValue: showControls ? 1 : 0,
        duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showControls]);

  const initializeMapData = async () => {
    setIsLoading(true);
    try {
      // Calculate optimal map region based on buildings
      if (buildings.length > 0) {
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
        
        setMapRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: deltaLat,
          longitudeDelta: deltaLng,
        });
      }

      // Load overlay data
      await loadOverlayData();
    } catch (error) {
      console.error('Failed to initialize map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOverlayData = async () => {
    try {
      // Simulate loading weather and traffic data
      const weatherData = weather ? {
        temperature: weather.temperature,
        condition: weather.condition,
        icon: weather.icon,
        alerts: weather.condition === 'rainy' ? ['Rain expected - consider indoor tasks'] : [],
      } : {
        temperature: 22,
        condition: 'sunny',
        icon: '☀️',
        alerts: [],
      };

      const trafficData = {
        congestionLevel: 45, // Realistic NYC traffic level
        incidents: [
          {
            id: '1',
            type: 'construction',
            severity: 'medium' as const,
            location: { latitude: 40.7589, longitude: -73.9851 },
            description: 'Road construction on 5th Avenue',
          },
        ],
      };

      const buildingData = {
        total: buildings.length,
        active: buildings.filter(b => tasks.some(t => t.buildingId === b.id)).length,
        compliance: buildings.reduce((sum, b) => sum + (b.complianceScore || 0), 0) / buildings.length, // Real compliance from buildings
        tasks: tasks.length,
      };

      setOverlayData({
        weather: weatherData,
        traffic: trafficData,
        buildings: buildingData,
      });
    } catch (error) {
      console.error('Failed to load overlay data:', error);
    }
  };

  const updateOverlayData = () => {
    if (overlayData) {
      Animated.timing(overlayAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleBuildingPress = useCallback((building: NamedCoordinate) => {
    onBuildingSelect(building);
    
    // Get tasks for this building
    const buildingTasks = tasks.filter(task => task.buildingId === building.id);
    setSelectedBuildingTasks(buildingTasks);
    setShowBuildingDetails(true);

    // Animate to building location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
          latitude: building.latitude,
          longitude: building.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [onBuildingSelect, tasks]);

  const handleRouteOptimization = useCallback(async () => {
    if (selectedBuildings.length < 2) {
      Alert.alert('Route Optimization', 'Please select at least 2 buildings for route optimization.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate route optimization
      const optimizedRoute = [...selectedBuildings];
      const totalDistance = calculateTotalDistance(optimizedRoute);
      const estimatedTime = totalDistance * 2; // 2 minutes per mile
      const weatherImpact = weather?.condition === 'rainy' ? 15 : 0;
      const trafficImpact = overlayData?.traffic.congestionLevel || 0;
      const efficiency = Math.max(0, 100 - weatherImpact - trafficImpact);

      const optimization: RouteOptimization = {
        optimizedRoute,
        totalDistance,
        estimatedTime,
        weatherImpact,
        trafficImpact,
        efficiency,
      };

      setRouteOptimization(optimization);
      onRouteOptimize(optimizedRoute);

      // Animate route
      Animated.timing(routeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Route optimization failed:', error);
      Alert.alert('Error', 'Failed to optimize route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBuildings, weather, overlayData, onRouteOptimize]);

  const calculateTotalDistance = (route: NamedCoordinate[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const distance = calculateDistance(route[i], route[i + 1]);
      totalDistance += distance;
    }
    return totalDistance;
  };

  const calculateDistance = (point1: NamedCoordinate, point2: NamedCoordinate): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toggleBuildingSelection = (building: NamedCoordinate) => {
    setSelectedBuildings(prev => {
      const isSelected = prev.some(b => b.id === building.id);
      if (isSelected) {
        return prev.filter(b => b.id !== building.id);
      } else {
        return [...prev, building];
      }
    });
  };

  const renderMapControls = () => (
      <Animated.View 
        style={[
        styles.mapControls,
        {
          opacity: controlsAnimation,
          transform: [{
            translateY: controlsAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          }],
          },
        ]}
      >
      <GlassCard style={styles.controlsCard} intensity="regular" cornerRadius="card">
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, mapType === 'standard' && styles.activeControlButton]}
            onPress={() => setMapType('standard')}
          >
            <Text style={styles.controlButtonText}>🗺️ Standard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, mapType === 'satellite' && styles.activeControlButton]}
            onPress={() => setMapType('satellite')}
          >
            <Text style={styles.controlButtonText}>🛰️ Satellite</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, mapType === 'hybrid' && styles.activeControlButton]}
            onPress={() => setMapType('hybrid')}
          >
            <Text style={styles.controlButtonText}>🔀 Hybrid</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, showWeatherOverlay && styles.activeControlButton]}
            onPress={() => onWeatherToggle(!showWeatherOverlay)}
          >
            <Text style={styles.controlButtonText}>
              {showWeatherOverlay ? '🌤️ Weather On' : '🌤️ Weather Off'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, showTrafficData && styles.activeControlButton]}
            onPress={() => onTrafficToggle(!showTrafficData)}
          >
            <Text style={styles.controlButtonText}>
              {showTrafficData ? '🚦 Traffic On' : '🚦 Traffic Off'}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedBuildings.length >= 2 && (
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={handleRouteOptimization}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.primaryText} size="small" />
            ) : (
              <Text style={styles.optimizeButtonText}>🚀 Optimize Route</Text>
            )}
          </TouchableOpacity>
        )}

        {onNovaAIPress && (
          <TouchableOpacity
            style={styles.novaButton}
            onPress={onNovaAIPress}
          >
            <Text style={styles.novaButtonText}>🧠 Nova AI</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
      </Animated.View>
  );

  const renderOverlayData = () => {
    if (!overlayData || !showWeatherOverlay) return null;

    return (
      <Animated.View
        style={[
          styles.overlayData,
          {
            opacity: overlayAnimation,
            transform: [{
              translateY: overlayAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }],
          },
        ]}
      >
        <GlassCard style={styles.overlayCard} intensity="regular" cornerRadius="card">
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayTitle}>📍 Real-time Data</Text>
            <TouchableOpacity onPress={() => setShowControls(!showControls)}>
              <Text style={styles.toggleText}>{showControls ? '▼' : '▲'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.overlayContent}>
            <View style={styles.overlaySection}>
              <Text style={styles.overlaySectionTitle}>🌤️ Weather</Text>
              <Text style={styles.overlayText}>
                {overlayData.weather.icon} {overlayData.weather.temperature}°C - {overlayData.weather.condition}
              </Text>
              {overlayData.weather.alerts.length > 0 && (
                <Text style={styles.alertText}>⚠️ {overlayData.weather.alerts[0]}</Text>
              )}
            </View>
            
            {showTrafficData && (
              <View style={styles.overlaySection}>
                <Text style={styles.overlaySectionTitle}>🚦 Traffic</Text>
                <Text style={styles.overlayText}>
                  Congestion: {Math.round(overlayData.traffic.congestionLevel)}%
                </Text>
                {overlayData.traffic.incidents.length > 0 && (
                  <Text style={styles.alertText}>
                    🚧 {overlayData.traffic.incidents[0].description}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.overlaySection}>
              <Text style={styles.overlaySectionTitle}>🏢 Buildings</Text>
              <Text style={styles.overlayText}>
                {overlayData.buildings.active}/{overlayData.buildings.total} active
              </Text>
              <Text style={styles.overlayText}>
                {overlayData.buildings.tasks} tasks • {overlayData.buildings.compliance}% compliance
              </Text>
            </View>
          </View>
        </GlassCard>
        </Animated.View>
    );
  };

  const renderRouteOptimization = () => {
    if (!routeOptimization) return null;

    return (
      <Animated.View 
        style={[
          styles.routeOptimization,
          {
            opacity: routeAnimation,
            transform: [{
              scale: routeAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            }],
          },
        ]}
      >
        <GlassCard style={styles.routeCard} intensity="regular" cornerRadius="card">
          <Text style={styles.routeTitle}>🚀 Optimized Route</Text>
          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{routeOptimization.totalDistance.toFixed(1)} mi</Text>
              <Text style={styles.routeStatLabel}>Distance</Text>
            </View>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{routeOptimization.estimatedTime.toFixed(0)} min</Text>
              <Text style={styles.routeStatLabel}>Time</Text>
            </View>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatValue}>{routeOptimization.efficiency.toFixed(0)}%</Text>
              <Text style={styles.routeStatLabel}>Efficiency</Text>
            </View>
          </View>
          <View style={styles.routeImpacts}>
            <Text style={styles.impactText}>
              🌧️ Weather Impact: +{routeOptimization.weatherImpact} min
            </Text>
            <Text style={styles.impactText}>
              🚦 Traffic Impact: +{routeOptimization.trafficImpact} min
                </Text>
              </View>
        </GlassCard>
      </Animated.View>
    );
  };

  const renderBuildingDetails = () => {
    if (!showBuildingDetails || !selectedBuilding) return null;

    return (
      <View style={styles.buildingDetails}>
        <GlassCard style={styles.buildingDetailsCard} intensity="regular" cornerRadius="card">
          <View style={styles.buildingDetailsHeader}>
            <Text style={styles.buildingDetailsTitle}>{selectedBuilding.name}</Text>
            <TouchableOpacity onPress={() => setShowBuildingDetails(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.buildingDetailsAddress}>{selectedBuilding.address}</Text>
          
          {selectedBuildingTasks.length > 0 && (
            <View style={styles.buildingTasks}>
              <Text style={styles.buildingTasksTitle}>📋 Tasks ({selectedBuildingTasks.length})</Text>
              <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
                {selectedBuildingTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => onTaskPress?.(task)}
                  >
                    <Text style={styles.taskName}>{task.title}</Text>
                    <Text style={styles.taskStatus}>{task.status}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  const getMarkerColor = (building: NamedCoordinate) => {
    if (selectedBuildings.some(b => b.id === building.id)) {
      return Colors.primaryAction;
    }
    if (selectedBuilding?.id === building.id) {
      return Colors.info;
    }
    return Colors.success;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        region={mapRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={showTrafficData}
        showsIndoors={true}
      >
        {/* Current Location */}
        {currentLocation && (
          <Circle
            center={currentLocation}
            radius={100}
            strokeColor={Colors.info}
            fillColor={Colors.info + '20'}
            strokeWidth={2}
          />
        )}

        {/* Clustered Markers */}
        {isInitialized && clusters.map(marker => {
          if (marker.cluster) {
            // Render cluster marker
            const stats = MapClusteringService.getClusterStats(marker.properties.cluster_id);
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
            // Render individual building marker
            const building = marker.properties;
            return (
              <Marker
                key={marker.id}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={building.name}
                description={building.address}
                pinColor={getMarkerColor(building)}
                onPress={() => handleBuildingPress(building)}
                onCalloutPress={() => toggleBuildingSelection(building)}
              />
            );
          }
        })}

        {/* Optimized Route */}
        {routeOptimization && routeOptimization.optimizedRoute.length > 1 && (
          <Polyline
            coordinates={routeOptimization.optimizedRoute.map(building => ({
              latitude: building.latitude,
              longitude: building.longitude,
            }))}
            strokeColor={Colors.primaryAction}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Traffic Incidents */}
        {showTrafficData && overlayData?.traffic.incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={incident.location}
            title="Traffic Incident"
            description={incident.description}
            pinColor={incident.severity === 'high' ? Colors.error : incident.severity === 'medium' ? Colors.warning : Colors.info}
          />
        ))}
      </MapView>

      {renderOverlayData()}
      {renderMapControls()}
      {renderRouteOptimization()}
      {renderBuildingDetails()}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.info} />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  controlsCard: {
    padding: Spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  controlButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  activeControlButton: {
    backgroundColor: Colors.primaryAction + '20',
    borderColor: Colors.primaryAction,
  },
  controlButtonText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  optimizeButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  optimizeButtonText: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  novaButton: {
    backgroundColor: Colors.role.admin.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  novaButtonText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  overlayData: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  overlayCard: {
    padding: Spacing.md,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  overlayTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  toggleText: {
    ...Typography.titleMedium,
    color: Colors.secondaryText,
  },
  overlayContent: {
    gap: Spacing.sm,
  },
  overlaySection: {
    marginBottom: Spacing.sm,
  },
  overlaySectionTitle: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  overlayText: {
    ...Typography.caption,
    color: Colors.primaryText,
  },
  alertText: {
    ...Typography.caption,
    color: Colors.warning,
    fontStyle: 'italic',
  },
  routeOptimization: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 998,
  },
  routeCard: {
    padding: Spacing.md,
  },
  routeTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatValue: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  routeStatLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  routeImpacts: {
    gap: Spacing.xs,
  },
  impactText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  buildingDetails: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxHeight: height * 0.4,
    zIndex: 997,
  },
  buildingDetailsCard: {
    padding: Spacing.md,
  },
  buildingDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  buildingDetailsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    ...Typography.titleMedium,
    color: Colors.secondaryText,
  },
  buildingDetailsAddress: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  buildingTasks: {
    marginTop: Spacing.sm,
  },
  buildingTasksTitle: {
    ...Typography.caption,
    color: Colors.primaryAction,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tasksList: {
    maxHeight: 120,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  taskName: {
    ...Typography.caption,
    color: Colors.primaryText,
    flex: 1,
  },
  taskStatus: {
    ...Typography.caption,
    color: Colors.info,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background + '80',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.primaryText,
    marginTop: Spacing.md,
  },
});

export default MapRevealContainer;