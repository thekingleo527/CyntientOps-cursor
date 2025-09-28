/**
 * @cyntientops/ui-components
 * 
 * Admin Dashboard Component
 * Mirrors Swift AdminDashboardView.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { GlassCard, GlassButton, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { ServiceContainer } from '@cyntientops/business-core';

// Import dashboard components
import { RealtimeMonitoring } from './components/RealtimeMonitoring';
import { TaskDistribution } from './components/TaskDistribution';
import { BuildingManagement } from './components/BuildingManagement';
import { PerformanceReports } from './components/PerformanceReports';

export interface AdminDashboardProps {
  onWorkerPress?: (workerId: string) => void;
  onBuildingPress?: (buildingId: string) => void;
  onTaskPress?: (taskId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onWorkerPress,
  onBuildingPress,
  onTaskPress,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    totalBuildings: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = () => {
    try {
      const workers = services.operationalData.getWorkers();
      const buildings = services.operationalData.getBuildings();
      const tasks = services.operationalData.getRoutines();
      
      const activeWorkers = workers.filter(worker => 
        services.worker.getClockInData(worker.id)
      ).length;
      
      const completedTasks = tasks.filter(task => 
        // This would be determined by task status in a real implementation
        false
      ).length;
      
      const overdueTasks = services.task.getOverdueTasks().length;
      
      setSystemStats({
        totalWorkers: workers.length,
        activeWorkers,
        totalBuildings: buildings.length,
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSystemStats();
    setIsRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.admin.primary}
        />
      }
    >
      {/* System Overview */}
      <GlassCard style={styles.overviewCard} variant="elevated">
        <Text style={styles.sectionTitle}>System Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{systemStats.totalWorkers}</Text>
            <Text style={styles.statLabel}>Total Workers</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              { color: Colors.status.success }
            ]}>
              {systemStats.activeWorkers}
            </Text>
            <Text style={styles.statLabel}>Active Workers</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{systemStats.totalBuildings}</Text>
            <Text style={styles.statLabel}>Buildings</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{systemStats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              { color: Colors.status.success }
            ]}>
              {systemStats.completedTasks}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              { color: systemStats.overdueTasks > 0 ? Colors.status.error : Colors.text.primary }
            ]}>
              {systemStats.overdueTasks}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
      </GlassCard>

      {/* Realtime Monitoring */}
      <RealtimeMonitoring
        onWorkerPress={onWorkerPress}
      />

      {/* Task Distribution */}
      <TaskDistribution
        onTaskPress={onTaskPress}
      />

      {/* Building Management */}
      <BuildingManagement
        onBuildingPress={onBuildingPress}
      />

      {/* Performance Reports */}
      <PerformanceReports />

      {/* Quick Actions */}
      <GlassCard style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <GlassButton
            title="Add Worker"
            onPress={() => {}}
            variant="primary"
            size="small"
          />
          <GlassButton
            title="Add Building"
            onPress={() => {}}
            variant="secondary"
            size="small"
          />
          <GlassButton
            title="Generate Report"
            onPress={() => {}}
            variant="tertiary"
            size="small"
          />
          <GlassButton
            title="System Settings"
            onPress={() => {}}
            variant="tertiary"
            size="small"
          />
        </View>
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  overviewCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleLarge,
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
  quickActionsCard: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
});
