/**
 * @cyntientops/ui-components
 * 
 * Building Management Component
 * Mirrors Swift BuildingManagement.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ServiceContainer } from '@cyntientops/business-core';

export interface BuildingManagementProps {
  onBuildingPress?: (buildingId: string) => void;
}

export const BuildingManagement: React.FC<BuildingManagementProps> = ({
  onBuildingPress,
}) => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingStats, setBuildingStats] = useState({
    totalBuildings: 0,
    activeBuildings: 0,
    averageComplianceScore: 0,
    buildingsWithIssues: 0,
    totalOverdueTasks: 0,
    totalUrgentTasks: 0,
  });

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadBuildingData();
  }, []);

  const loadBuildingData = () => {
    try {
      const allBuildings = services.operationalData.getBuildings();
      setBuildings(allBuildings);
      
      const stats = services.building.getBuildingStatistics();
      setBuildingStats(stats);
    } catch (error) {
      console.error('Error loading building data:', error);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 0.9) return Colors.status.success;
    if (score >= 0.7) return Colors.status.warning;
    return Colors.status.error;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getBuildingTasks = (buildingId: string) => {
    return services.operationalData.getTasksForBuilding(buildingId);
  };

  const getOverdueTasks = (buildingId: string) => {
    const tasks = getBuildingTasks(buildingId);
    return tasks.filter(task => {
      // This would be determined by task status in a real implementation
      return false;
    }).length;
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Building Management</Text>
      
      {/* Building Statistics */}
      <View style={styles.statsOverview}>
        <Text style={styles.overviewTitle}>Building Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{buildingStats.totalBuildings}</Text>
            <Text style={styles.statLabel}>Total Buildings</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.status.success }]}>
              {buildingStats.activeBuildings}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              { color: getComplianceColor(buildingStats.averageComplianceScore) }
            ]}>
              {formatPercentage(buildingStats.averageComplianceScore)}
            </Text>
            <Text style={styles.statLabel}>Avg. Compliance</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.status.error }]}>
              {buildingStats.buildingsWithIssues}
            </Text>
            <Text style={styles.statLabel}>With Issues</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.status.error }]}>
              {buildingStats.totalOverdueTasks}
            </Text>
            <Text style={styles.statLabel}>Overdue Tasks</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.priority.urgent }]}>
              {buildingStats.totalUrgentTasks}
            </Text>
            <Text style={styles.statLabel}>Urgent Tasks</Text>
          </View>
        </View>
      </View>

      {/* Building List */}
      <View style={styles.buildingsSection}>
        <Text style={styles.buildingsTitle}>Buildings</Text>
        
        {buildings.map((building) => (
          <TouchableOpacity
            key={building.id}
            style={styles.buildingItem}
            onPress={() => onBuildingPress?.(building.id)}
          >
            <View style={styles.buildingHeader}>
              <View style={styles.buildingInfo}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={styles.buildingAddress}>{building.address}</Text>
              </View>
              
              <View style={styles.buildingStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: building.isActive ? Colors.status.success : Colors.status.error }
                ]}>
                  <Text style={styles.statusText}>
                    {building.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.buildingMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {getBuildingTasks(building.id).length}
                </Text>
                <Text style={styles.metricLabel}>Tasks</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={[
                  styles.metricValue,
                  { color: getComplianceColor(building.compliance_score || 0) }
                ]}>
                  {formatPercentage(building.compliance_score || 0)}
                </Text>
                <Text style={styles.metricLabel}>Compliance</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={[
                  styles.metricValue,
                  { color: getOverdueTasks(building.id) > 0 ? Colors.status.error : Colors.text.primary }
                ]}>
                  {getOverdueTasks(building.id)}
                </Text>
                <Text style={styles.metricLabel}>Overdue</Text>
              </View>
            </View>
            
            {building.specialNotes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText} numberOfLines={2}>
                  {building.specialNotes}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  statsOverview: {
    marginBottom: Spacing.xl,
  },
  overviewTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.role.admin.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  buildingsSection: {
    marginBottom: Spacing.xl,
  },
  buildingsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  buildingItem: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  buildingAddress: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  buildingStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  buildingMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.titleSmall,
    color: Colors.role.admin.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: Spacing.sm,
  },
  notesLabel: {
    ...Typography.labelMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    lineHeight: 18,
  },
});
