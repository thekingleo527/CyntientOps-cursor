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
import { TaskService } from '@cyntientops/business-core/src/services/TaskService';

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
      // Load real tasks from TaskService
      const taskService = TaskService.getInstance();
      const schedule = taskService.generateWorkerTasks(workerId);

      // Combine all tasks from different time slots
      const allTasks = [...schedule.now, ...schedule.next, ...schedule.today];

      setTodaysTasks(allTasks);

      // Filter DSNY tasks (trash/recycling related)
      const filteredDsnyTasks = allTasks.filter(task =>
        task.category === 'DSNY' || task.name.toLowerCase().includes('dsny') || task.name.toLowerCase().includes('trash') || task.name.toLowerCase().includes('recycling')
      );
      setDsnyTasks(filteredDsnyTasks);
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
