/**
 * @cyntientops/ui-components
 * 
 * Worker Dashboard Component
 * Mirrors Swift WorkerDashboardView.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { GlassCard, GlassButton, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { WorkerProfile, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

// Import dashboard components
import { WorkerHeroCard } from './components/WorkerHeroCard';
import { TaskTimelineView } from './components/TaskTimelineView';
import { ClockInButton } from './components/ClockInButton';
import { WeatherRibbon } from './components/WeatherRibbon';
import { PerformanceMetrics } from './components/PerformanceMetrics';

export interface WorkerDashboardProps {
  workerId: string;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onClockIn?: () => void;
  onClockOut?: () => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  workerId,
  onTaskPress,
  onClockIn,
  onClockOut,
}) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadWorkerData();
  }, [workerId]);

  const loadWorkerData = async () => {
    try {
      const workerData = services.operationalData.getWorkerById(workerId);
      const tasks = services.operationalData.getTodaysTasksForWorker(workerId);
      
      setWorker(workerData || null);
      setTodaysTasks(tasks);
      
      // Check clock-in status
      const clockInData = services.worker.getClockInData(workerId);
      setIsClockedIn(!!clockInData);
    } catch (error) {
      console.error('Error loading worker data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkerData();
    setIsRefreshing(false);
  };

  const handleClockIn = async () => {
    try {
      // This would typically get GPS coordinates
      const clockInData = {
        workerId,
        buildingId: todaysTasks[0]?.buildingId || '',
        latitude: 40.7128, // NYC coordinates
        longitude: -74.0060,
        timestamp: new Date(),
      };
      
      await services.worker.clockInWorker(clockInData);
      setIsClockedIn(true);
      onClockIn?.();
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      await services.worker.clockOutWorker(workerId);
      setIsClockedIn(false);
      onClockOut?.();
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  if (!worker) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading worker data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.worker.primary}
        />
      }
    >
      {/* Weather Ribbon */}
      <WeatherRibbon />

      {/* Worker Hero Card */}
      <WorkerHeroCard
        worker={worker}
        isClockedIn={isClockedIn}
        todaysTaskCount={todaysTasks.length}
      />

      {/* Clock In/Out Button */}
      <ClockInButton
        isClockedIn={isClockedIn}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        disabled={!todaysTasks.length}
      />

      {/* Today's Tasks Timeline */}
      <TaskTimelineView
        tasks={todaysTasks}
        onTaskPress={onTaskPress}
      />

      {/* Performance Metrics */}
      <PerformanceMetrics
        workerId={workerId}
      />

      {/* Quick Actions */}
      <GlassCard style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <GlassButton
            title="View All Tasks"
            onPress={() => {}}
            variant="secondary"
            size="small"
          />
          <GlassButton
            title="Report Issue"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
  },
  quickActionsCard: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
