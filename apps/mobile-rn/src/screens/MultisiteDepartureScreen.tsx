/**
 * 🚚 Multisite Departure Screen
 * Mirrors: CyntientOps/Views/Departure/MultisiteDepartureView.swift
 * Purpose: Multi-site departure management with route optimization
 */

import React, { useState, useEffect } from 'react';
import config from '../config/app.config';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { Building, WorkerProfile, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { MapContainer } from '@cyntientops/ui-components';
import { Logger } from '@cyntientops/business-core';

interface DepartureSite {
  building: Building;
  tasks: OperationalDataTaskAssignment[];
  assignedWorkers: WorkerProfile[];
  estimatedDuration: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  departureTime?: Date;
  arrivalTime?: Date;
}

interface RouteOptimization {
  optimizedOrder: string[];
  totalDistance: number;
  estimatedTotalTime: number;
  fuelEfficiency: number;
}

export const MultisiteDepartureScreen: React.FC = () => {
  const [departureSites, setDepartureSites] = useState<DepartureSite[]>([]);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadDepartureSites();
  }, []);

  const loadDepartureSites = async () => {
    try {
      setIsLoading(true);
      
      const databaseManager = DatabaseManager.getInstance({
        path: config.databasePath
      });
      await databaseManager.initialize();

      const buildings = await databaseManager.getBuildings();
      const workers = await databaseManager.getWorkers();
      const tasks = await databaseManager.getTasks();

      const sites: DepartureSite[] = buildings.map(building => {
        const buildingTasks = tasks.filter(task => task.assigned_building_id === building.id);
        const assignedWorkers = workers.filter(worker => 
          buildingTasks.some(task => task.assigned_worker_id === worker.id)
        );

        // Calculate estimated duration based on task complexity
        const estimatedDuration = buildingTasks.reduce((total, task) => {
          const baseTime = 2; // 2 hours base time per task
          const complexityMultiplier = getTaskComplexityMultiplier(task.category);
          return total + (baseTime * complexityMultiplier);
        }, 0);

        // Determine priority based on task urgency and building importance
        const priority = determinePriority(buildingTasks, building);

        return {
          building,
          tasks: buildingTasks,
          assignedWorkers,
          estimatedDuration,
          priority,
          status: 'pending' as const,
        };
      });

      // Sort by priority and estimated duration
      sites.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.estimatedDuration - b.estimatedDuration;
      });

      setDepartureSites(sites);
    } catch (error) {
      Logger.error('Failed to load departure sites:', undefined, 'MultisiteDepartureScreen.tsx');
      Alert.alert('Error', 'Failed to load departure sites');
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskComplexityMultiplier = (category: string): number => {
    const complexityMap: Record<string, number> = {
      'Cleaning': 1.0,
      'Maintenance': 1.5,
      'Inspection': 2.0,
      'Repair': 2.5,
      'Compliance': 3.0,
      'Emergency': 4.0,
    };
    return complexityMap[category] || 1.0;
  };

  const determinePriority = (tasks: OperationalDataTaskAssignment[], building: Building): 'high' | 'medium' | 'low' => {
    const urgentTasks = tasks.filter(task => task.priority === 'urgent');
    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date()
    );

    if (urgentTasks.length > 0 || overdueTasks.length > 0) {
      return 'high';
    }

    if (tasks.length > 5 || building.building_type === 'commercial') {
      return 'medium';
    }

    return 'low';
  };

  const toggleSiteSelection = (buildingId: string) => {
    const newSelected = new Set(selectedSites);
    if (newSelected.has(buildingId)) {
      newSelected.delete(buildingId);
    } else {
      newSelected.add(buildingId);
    }
    setSelectedSites(newSelected);
    
    // Optimize route when sites are selected
    if (newSelected.size > 1) {
      optimizeRoute(Array.from(newSelected));
    } else {
      setRouteOptimization(null);
    }
  };

  const optimizeRoute = async (selectedBuildingIds: string[]) => {
    try {
      const selectedBuildings = departureSites
        .filter(site => selectedBuildingIds.includes(site.building.id))
        .map(site => site.building);

      // Simple route optimization (in a real app, this would use a proper routing algorithm)
      const optimizedOrder = selectedBuildingIds.sort((a, b) => {
        const buildingA = selectedBuildings.find(bld => bld.id === a);
        const buildingB = selectedBuildings.find(bld => bld.id === b);
        
        if (!buildingA || !buildingB) return 0;
        
        // Sort by distance from current location (simplified)
        return buildingA.latitude! - buildingB.latitude!;
      });

      // Calculate estimated metrics
      const totalDistance = calculateTotalDistance(selectedBuildings);
      const estimatedTotalTime = selectedBuildings.reduce((total, building) => {
        const site = departureSites.find(s => s.building.id === building.id);
        return total + (site?.estimatedDuration || 2);
      }, 0);

      setRouteOptimization({
        optimizedOrder,
        totalDistance,
        estimatedTotalTime,
        fuelEfficiency: 85, // Mock value
      });
    } catch (error) {
      Logger.error('Failed to optimize route:', undefined, 'MultisiteDepartureScreen.tsx');
    }
  };

  const calculateTotalDistance = (buildings: Building[]): number => {
    // Simplified distance calculation (in a real app, use proper routing)
    let totalDistance = 0;
    for (let i = 1; i < buildings.length; i++) {
      const prev = buildings[i - 1];
      const curr = buildings[i];
      if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
        // Simple distance calculation (not accurate for real routing)
        const latDiff = curr.latitude - prev.latitude;
        const lngDiff = curr.longitude - prev.longitude;
        totalDistance += Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
      }
    }
    return totalDistance;
  };

  const startDeparture = async () => {
    if (selectedSites.size === 0) {
      Alert.alert('No Sites Selected', 'Please select at least one site for departure');
      return;
    }

    try {
      const selectedSitesData = departureSites.filter(site => 
        selectedSites.has(site.building.id)
      );

      // Update site statuses
      const updatedSites = departureSites.map(site => {
        if (selectedSites.has(site.building.id)) {
          return {
            ...site,
            status: 'in_progress' as const,
            departureTime: new Date(),
          };
        }
        return site;
      });

      setDepartureSites(updatedSites);

      Alert.alert(
        'Departure Started',
        `Starting departure to ${selectedSites.size} site(s). Route optimized for efficiency.`,
        [
          { text: 'OK', onPress: () => Logger.debug('Departure started', undefined, 'MultisiteDepartureScreen.tsx') }
        ]
      );
    } catch (error) {
      Logger.error('Failed to start departure:', undefined, 'MultisiteDepartureScreen.tsx');
      Alert.alert('Error', 'Failed to start departure');
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderSiteItem = ({ item }: { item: DepartureSite }) => {
    const isSelected = selectedSites.has(item.building.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.siteItem,
          isSelected && styles.selectedSiteItem,
          { borderLeftColor: getPriorityColor(item.priority) }
        ]}
        onPress={() => toggleSiteSelection(item.building.id)}
      >
        <View style={styles.siteHeader}>
          <View style={styles.siteInfo}>
            <Text style={styles.buildingName}>{item.building.name}</Text>
            <Text style={styles.buildingAddress}>{item.building.address}</Text>
          </View>
          <View style={styles.siteBadges}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.siteMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.tasks.length}</Text>
            <Text style={styles.metricLabel}>Tasks</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.assignedWorkers.length}</Text>
            <Text style={styles.metricLabel}>Workers</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.estimatedDuration}h</Text>
            <Text style={styles.metricLabel}>Duration</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.selectionText}>✓ Selected for departure</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading departure sites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Multisite Departure</Text>
        <TouchableOpacity
          style={styles.mapToggle}
          onPress={() => setShowMap(!showMap)}
        >
          <Text style={styles.mapToggleText}>{showMap ? 'List' : 'Map'}</Text>
        </TouchableOpacity>
      </View>

      {showMap ? (
        <MapContainer
          buildings={departureSites.map(site => site.building)}
          workers={departureSites.flatMap(site => site.assignedWorkers)}
          tasks={departureSites.flatMap(site => site.tasks)}
          selectedBuildingId={selectedSites.size === 1 ? Array.from(selectedSites)[0] : undefined}
          onBuildingSelect={(building) => toggleSiteSelection(building.id)}
        />
      ) : (
        <ScrollView style={styles.content}>
          {/* Route Optimization Summary */}
          {routeOptimization && (
            <View style={styles.routeSummary}>
              <Text style={styles.routeTitle}>Route Optimization</Text>
              <View style={styles.routeMetrics}>
                <View style={styles.routeMetric}>
                  <Text style={styles.routeMetricValue}>{routeOptimization.totalDistance.toFixed(1)} km</Text>
                  <Text style={styles.routeMetricLabel}>Total Distance</Text>
                </View>
                <View style={styles.routeMetric}>
                  <Text style={styles.routeMetricValue}>{routeOptimization.estimatedTotalTime}h</Text>
                  <Text style={styles.routeMetricLabel}>Est. Time</Text>
                </View>
                <View style={styles.routeMetric}>
                  <Text style={styles.routeMetricValue}>{routeOptimization.fuelEfficiency}%</Text>
                  <Text style={styles.routeMetricLabel}>Efficiency</Text>
                </View>
              </View>
            </View>
          )}

          {/* Sites List */}
          <FlatList
            data={departureSites}
            renderItem={renderSiteItem}
            keyExtractor={(item) => item.building.id}
            scrollEnabled={false}
            style={styles.sitesList}
          />

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.startButton,
                selectedSites.size === 0 && styles.disabledButton
              ]}
              onPress={startDeparture}
              disabled={selectedSites.size === 0}
            >
              <Text style={styles.startButtonText}>
                Start Departure ({selectedSites.size} sites)
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mapToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  mapToggleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  routeSummary: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  routeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeMetric: {
    alignItems: 'center',
  },
  routeMetricValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  routeMetricLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  sitesList: {
    paddingHorizontal: 20,
  },
  siteItem: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedSiteItem: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  siteInfo: {
    flex: 1,
  },
  buildingName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buildingAddress: {
    color: '#9ca3af',
    fontSize: 14,
  },
  siteBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  siteMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  selectionIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectionText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    padding: 20,
  },
  startButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultisiteDepartureScreen;
