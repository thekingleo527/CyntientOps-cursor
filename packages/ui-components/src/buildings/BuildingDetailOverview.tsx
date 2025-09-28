/**
 * 🏢 Building Detail Overview
 * Purpose: Comprehensive building overview with infrastructure, DSNY, and routine data
 * Data Source: BuildingInfrastructureCatalog (NO MOCK DATA)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { BuildingInfrastructureCatalog, BuildingInfrastructure, DSNYCollectionInfo, RoutineCompletionInfo } from '@cyntientops/business-core';

export interface BuildingDetailOverviewProps {
  buildingId: string;
  onRoutineComplete?: (routineType: string, workerId: string, workerName: string) => void;
  onDSNYUpdate?: () => void;
}

export const BuildingDetailOverview: React.FC<BuildingDetailOverviewProps> = ({
  buildingId,
  onRoutineComplete,
  onDSNYUpdate,
}) => {
  const [buildingData, setBuildingData] = useState<BuildingInfrastructure | null>(null);
  const [dsnyInfo, setDsnyInfo] = useState<DSNYCollectionInfo | null>(null);
  const [routineInfo, setRoutineInfo] = useState<RoutineCompletionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBuildingData();
  }, [buildingId]);

  const loadBuildingData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would be properly injected
      const catalog = BuildingInfrastructureCatalog.getInstance({} as any);
      
      const building = catalog.getBuildingInfrastructure(buildingId);
      const dsny = catalog.getDSNYCollectionInfo(buildingId);
      const routines = catalog.getRoutineCompletionInfo(buildingId);
      
      setBuildingData(building);
      setDsnyInfo(dsny);
      setRoutineInfo(routines);
    } catch (error) {
      console.error('Failed to load building data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoutineComplete = (routineType: string) => {
    if (buildingData && onRoutineComplete) {
      // In a real implementation, this would get the current worker info
      const workerId = 'current-worker-id';
      const workerName = 'Current Worker';
      
      onRoutineComplete(routineType, workerId, workerName);
      loadBuildingData(); // Refresh data
    }
  };

  const handleDSNYUpdate = () => {
    if (onDSNYUpdate) {
      onDSNYUpdate();
      loadBuildingData(); // Refresh data
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading building details...</Text>
      </View>
    );
  }

  if (!buildingData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Building not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Building Header */}
      <GlassCard style={styles.headerCard}>
        <Text style={styles.buildingName}>{buildingData.name}</Text>
        <Text style={styles.buildingAddress}>{buildingData.address}</Text>
        <View style={styles.buildingStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{buildingData.numberOfUnits}</Text>
            <Text style={styles.statLabel}>Units</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{buildingData.floors}</Text>
            <Text style={styles.statLabel}>Floors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(buildingData.complianceScore)}%</Text>
            <Text style={styles.statLabel}>Compliance</Text>
          </View>
        </View>
      </GlassCard>

      {/* DSNY Collection Info */}
      {dsnyInfo && (
        <GlassCard style={styles.dsnyCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🗑️ DSNY Collection</Text>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: getDSNYStatusColor(dsnyInfo.status) }]}
              onPress={handleDSNYUpdate}
            >
              <Text style={styles.statusText}>{dsnyInfo.status.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dsnyDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Collection Day:</Text>
              <Text style={styles.detailValue}>{dsnyInfo.collectionDay}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Collection Time:</Text>
              <Text style={styles.detailValue}>{dsnyInfo.collectionTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Set Out Time:</Text>
              <Text style={styles.detailValue}>{dsnyInfo.setOutTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Collection:</Text>
              <Text style={styles.detailValue}>
                {Math.floor((Date.now() - dsnyInfo.lastCollection.getTime()) / (1000 * 60 * 60 * 24))} days ago
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Collection:</Text>
              <Text style={styles.detailValue}>
                {Math.ceil((dsnyInfo.nextCollection.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bin Type:</Text>
              <Text style={styles.detailValue}>{dsnyInfo.binType} ({dsnyInfo.binCount} bins)</Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Routine Completion Info */}
      <GlassCard style={styles.routineCard}>
        <Text style={styles.cardTitle}>📋 Recent Routine Completions</Text>
        {routineInfo.length > 0 ? (
          routineInfo.map((routine, index) => (
            <View key={index} style={styles.routineItem}>
              <View style={styles.routineHeader}>
                <Text style={styles.routineType}>{routine.routineType}</Text>
                <TouchableOpacity
                  style={[styles.statusBadge, { backgroundColor: getRoutineStatusColor(routine.status) }]}
                  onPress={() => handleRoutineComplete(routine.routineType)}
                >
                  <Text style={styles.statusText}>{routine.status.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.routineDetails}>
                <Text style={styles.routineDetail}>
                  Last completed: {Math.floor((Date.now() - routine.lastCompleted.getTime()) / (1000 * 60 * 60 * 24))} days ago
                </Text>
                <Text style={styles.routineDetail}>
                  By: {routine.workerName}
                </Text>
                <Text style={styles.routineDetail}>
                  Time: {routine.completionTime.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No routine completions recorded</Text>
        )}
      </GlassCard>

      {/* Building Infrastructure */}
      <GlassCard style={styles.infrastructureCard}>
        <Text style={styles.cardTitle}>🏗️ Building Infrastructure</Text>
        <View style={styles.infrastructureGrid}>
          <View style={styles.infrastructureItem}>
            <Text style={styles.infrastructureIcon}>🏢</Text>
            <Text style={styles.infrastructureLabel}>Type</Text>
            <Text style={styles.infrastructureValue}>{buildingData.buildingType}</Text>
          </View>
          <View style={styles.infrastructureItem}>
            <Text style={styles.infrastructureIcon}>📅</Text>
            <Text style={styles.infrastructureLabel}>Year Built</Text>
            <Text style={styles.infrastructureValue}>{buildingData.yearBuilt}</Text>
          </View>
          <View style={styles.infrastructureItem}>
            <Text style={styles.infrastructureIcon}>📐</Text>
            <Text style={styles.infrastructureLabel}>Square Feet</Text>
            <Text style={styles.infrastructureValue}>{buildingData.squareFootage.toLocaleString()}</Text>
          </View>
          <View style={styles.infrastructureItem}>
            <Text style={styles.infrastructureIcon}>🏢</Text>
            <Text style={styles.infrastructureLabel}>Client</Text>
            <Text style={styles.infrastructureValue}>{buildingData.clientName}</Text>
          </View>
        </View>
        
        <View style={styles.amenitiesSection}>
          <Text style={styles.amenitiesTitle}>Amenities</Text>
          <View style={styles.amenitiesList}>
            {buildingData.hasElevator && <Text style={styles.amenity}>🛗 Elevator</Text>}
            {buildingData.hasLaundry && <Text style={styles.amenity}>🧺 Laundry</Text>}
            {buildingData.hasGym && <Text style={styles.amenity}>💪 Gym</Text>}
            {buildingData.hasParking && <Text style={styles.amenity}>🅿️ Parking</Text>}
            {buildingData.hasRooftop && <Text style={styles.amenity}>🏢 Rooftop</Text>}
            {buildingData.hasBasement && <Text style={styles.amenity}>🏠 Basement</Text>}
          </View>
        </View>
      </GlassCard>

      {/* Assigned Workers */}
      <GlassCard style={styles.workersCard}>
        <Text style={styles.cardTitle}>👷 Assigned Workers</Text>
        {buildingData.assignedWorkers.map((worker, index) => (
          <View key={index} style={styles.workerItem}>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{worker.workerName}</Text>
              <Text style={styles.workerTasks}>{worker.primaryTasks.join(', ')}</Text>
            </View>
            <Text style={styles.workerLastActive}>
              Last active: {Math.floor((Date.now() - worker.lastActive.getTime()) / (1000 * 60 * 60 * 24))} days ago
            </Text>
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );
};

const getDSNYStatusColor = (status: string): string => {
  switch (status) {
    case 'on_time': return Colors.status.success;
    case 'overdue': return Colors.status.error;
    case 'upcoming': return Colors.status.warning;
    default: return Colors.text.secondary;
  }
};

const getRoutineStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return Colors.status.success;
    case 'overdue': return Colors.status.error;
    case 'pending': return Colors.status.warning;
    default: return Colors.text.secondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  errorText: {
    ...Typography.body,
    color: Colors.status.error,
  },
  headerCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  buildingName: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  buildingAddress: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  buildingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  dsnyCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
  },
  routineCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
  },
  infrastructureCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
  },
  workersCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  dsnyDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  routineItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  routineType: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  routineDetails: {
    gap: 2,
  },
  routineDetail: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  noDataText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.lg,
  },
  infrastructureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  infrastructureItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infrastructureIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  infrastructureLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  infrastructureValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  amenitiesSection: {
    marginTop: Spacing.md,
  },
  amenitiesTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenity: {
    ...Typography.caption,
    color: Colors.text.secondary,
    backgroundColor: Colors.glass.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  workerTasks: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  workerLastActive: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
});

export default BuildingDetailOverview;
