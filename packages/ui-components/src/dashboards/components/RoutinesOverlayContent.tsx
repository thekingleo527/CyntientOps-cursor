/**
 * @cyntientops/ui-components
 * 
 * Routines Overlay Content - Full routines and tasks view
 * Contains: Today's Tasks, Weekly Schedule, DSNY Schedule, Daily Routines
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { TaskTimelineView } from '../../timeline/TaskTimelineView';

export interface RoutinesOverlayContentProps {
  workerId: string;
  workerName: string;
  onTaskPress: (task: OperationalDataTaskAssignment) => void;
}

export const RoutinesOverlayContent: React.FC<RoutinesOverlayContentProps> = ({
  workerId,
  workerName,
  onTaskPress,
}) => {
  const [todaysTasks, setTodaysTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [dsnyTasks, setDsnyTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRoutinesData();
  }, [workerId]);

  const loadRoutinesData = async () => {
    try {
      // Mock data - in real app, this would come from TaskService
      const mockTasks: OperationalDataTaskAssignment[] = [
        {
          id: 'task-1',
          name: 'Sidewalk + Curb Sweep / Trash Return - 131 Perry',
          description: 'Daily sidewalk and curb cleaning with trash return',
          buildingId: '10',
          buildingName: '131 Perry Street',
          buildingAddress: '131 Perry Street, New York, NY',
          buildingLatitude: 40.7359,
          buildingLongitude: -74.0076,
          assigned_worker_id: workerId,
          assigned_building_id: '10',
          due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          status: 'Pending',
          priority: 'high',
          category: 'Cleaning',
          skillLevel: 'Basic',
          recurrence: 'Daily',
          startHour: 6,
          endHour: 7,
          daysOfWeek: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          estimatedDuration: 60,
          requiresPhoto: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task-2',
          name: 'Lobby Cleaning - 131 Perry',
          description: 'Daily lobby cleaning and maintenance',
          buildingId: '10',
          buildingName: '131 Perry Street',
          buildingAddress: '131 Perry Street, New York, NY',
          buildingLatitude: 40.7359,
          buildingLongitude: -74.0076,
          assigned_worker_id: workerId,
          assigned_building_id: '10',
          due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          status: 'Pending',
          priority: 'medium',
          category: 'Cleaning',
          skillLevel: 'Basic',
          recurrence: 'Daily',
          startHour: 10,
          endHour: 11,
          daysOfWeek: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          estimatedDuration: 60,
          requiresPhoto: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setTodaysTasks(mockTasks);
      
      // Filter DSNY tasks
      const dsnyTasks = mockTasks.filter(task => 
        task.category === 'DSNY' || task.name.toLowerCase().includes('dsny') || task.name.toLowerCase().includes('trash')
      );
      setDsnyTasks(dsnyTasks);
    } catch (error) {
      console.error('Failed to load routines data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoutinesData();
    setRefreshing(false);
  };

  const renderTodaysTasks = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
      {todaysTasks.length > 0 ? (
        <TaskTimelineView
          tasks={todaysTasks}
          onTaskPress={onTaskPress}
        />
      ) : (
        <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tasks scheduled for today</Text>
        </GlassCard>
      )}
    </View>
  );

  const renderDSNYSchedule = () => {
    if (dsnyTasks.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗑️ DSNY Collection Schedule</Text>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.dsnyCard}>
          <View style={styles.dsnyHeader}>
            <Text style={styles.dsnyTitle}>Today's Collection Tasks</Text>
          </View>
          
          {dsnyTasks.map(task => (
            <View key={task.id} style={styles.dsnyTaskItem}>
              <View style={styles.dsnyTaskInfo}>
                <Text style={styles.dsnyTaskName}>{task.name}</Text>
                <Text style={styles.dsnyTaskLocation}>📍 {task.buildingName}</Text>
              </View>
              <View style={styles.dsnyTaskTime}>
                <Text style={styles.dsnyTaskTimeText}>
                  {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </View>
    );
  };

  const renderWeeklySchedule = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Weekly Schedule</Text>
      <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.scheduleCard}>
        <View style={styles.scheduleGrid}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <View key={day} style={styles.scheduleDay}>
              <Text style={styles.scheduleDayName}>{day}</Text>
              <Text style={styles.scheduleDayTasks}>
                {index < 5 ? '6:00 AM - 5:00 PM' : 'Off'}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.worker.primary}
        />
      }
    >
      {renderTodaysTasks()}
      {renderDSNYSchedule()}
      {renderWeeklySchedule()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  dsnyCard: {
    padding: Spacing.md,
  },
  dsnyHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dsnyTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  dsnyTaskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dsnyTaskInfo: {
    flex: 1,
  },
  dsnyTaskName: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  dsnyTaskLocation: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.secondary,
  },
  dsnyTaskTime: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  dsnyTaskTimeText: {
    fontSize: Typography.fontSize.xSmall,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  scheduleCard: {
    padding: Spacing.md,
  },
  scheduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleDay: {
    alignItems: 'center',
    flex: 1,
  },
  scheduleDayName: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  scheduleDayTasks: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default RoutinesOverlayContent;
