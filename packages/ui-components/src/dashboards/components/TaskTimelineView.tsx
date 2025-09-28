/**
 * @cyntientops/ui-components
 * 
 * Task Timeline View Component
 * Mirrors Swift TaskTimelineView.swift
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { GlassCard, Colors, Typography, Spacing, TaskCategoryColors } from '@cyntientops/design-tokens';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface TaskTimelineViewProps {
  tasks: OperationalDataTaskAssignment[];
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
}

export interface TaskTimelineItemProps {
  task: OperationalDataTaskAssignment;
  onPress?: () => void;
}

const TaskTimelineItem: React.FC<TaskTimelineItemProps> = ({ task, onPress }) => {
  const getCategoryColor = (category: string) => {
    const categoryKey = category.toLowerCase() as keyof typeof TaskCategoryColors;
    return TaskCategoryColors[categoryKey] || Colors.text.tertiary;
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getStatusColor = () => {
    // This would be determined by task status in a real implementation
    return Colors.status.pending;
  };

  return (
    <GlassCard
      style={styles.taskCard}
      onPress={onPress}
      variant="interactive"
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <Text style={styles.taskBuilding}>{task.building}</Text>
        </View>
        <View style={styles.taskMeta}>
          <Text style={styles.taskTime}>
            {formatTime(task.startHour)} - {formatTime(task.endHour)}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.category) }]}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.taskDetails}>
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>
        
        <View style={styles.taskFooter}>
          <View style={styles.taskTags}>
            <View style={[styles.tag, { backgroundColor: Colors.glass.thin }]}>
              <Text style={styles.tagText}>{task.skillLevel}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: Colors.glass.thin }]}>
              <Text style={styles.tagText}>{task.recurrence}</Text>
            </View>
            {task.requiresPhoto && (
              <View style={[styles.tag, { backgroundColor: Colors.status.info }]}>
                <Text style={styles.tagText}>Photo Required</Text>
              </View>
            )}
          </View>
          
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        </View>
      </View>
    </GlassCard>
  );
};

export const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({
  tasks,
  onTaskPress,
}) => {
  if (tasks.length === 0) {
    return (
      <GlassCard style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No tasks scheduled</Text>
        <Text style={styles.emptySubtitle}>You're all caught up for today!</Text>
      </GlassCard>
    );
  }

  const renderTask = ({ item }: { item: OperationalDataTaskAssignment }) => (
    <TaskTimelineItem
      task={item}
      onPress={() => onTaskPress?.(item)}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
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
  listContainer: {
    paddingBottom: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
  taskCard: {
    marginBottom: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  taskInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  taskTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  taskBuilding: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  taskTime: {
    ...Typography.labelMedium,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  categoryText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  taskDetails: {
    marginTop: Spacing.sm,
  },
  taskDescription: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  tagText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontSize: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyCard: {
    margin: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
});
