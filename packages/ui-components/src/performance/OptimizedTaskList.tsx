/**
 * 🚀 Optimized Task List Component
 * Purpose: High-performance FlatList implementation for task rendering
 * Features: Memory optimization, Android performance fixes, virtualization
 */

import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

interface OptimizedTaskListProps {
  tasks: OperationalDataTaskAssignment[];
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onTaskUpdate?: (taskId: string, status: string) => void;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface TaskItemProps {
  task: OperationalDataTaskAssignment;
  onPress?: (task: OperationalDataTaskAssignment) => void;
  onUpdate?: (taskId: string, status: string) => void;
}

// Memoized task item component to prevent unnecessary re-renders
const TaskItem = memo<TaskItemProps>(({ task, onPress, onUpdate }) => {
  const handlePress = useCallback(() => {
    onPress?.(task);
  }, [task, onPress]);

  const handleStatusUpdate = useCallback((status: string) => {
    onUpdate?.(task.id, status);
  }, [task.id, onUpdate]);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Colors.status.success;
      case 'in_progress':
        return Colors.status.warning;
      case 'pending':
        return Colors.status.info;
      case 'overdue':
        return Colors.status.error;
      default:
        return Colors.text.secondary;
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return Colors.status.error;
      case 'medium':
        return Colors.status.warning;
      case 'low':
        return Colors.status.success;
      default:
        return Colors.text.secondary;
    }
  }, []);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.taskItem}>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>
        
        <Text style={styles.taskDescription} numberOfLines={3}>
          {task.description}
        </Text>
        
        <View style={styles.taskFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{task.status}</Text>
          </View>
          
          <Text style={styles.taskDate}>
            {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        </View>
        
        {task.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStatusUpdate('in_progress')}
            >
              <Text style={styles.actionButtonText}>Start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleStatusUpdate('completed')}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
});

TaskItem.displayName = 'TaskItem';

export const OptimizedTaskList: React.FC<OptimizedTaskListProps> = ({
  tasks,
  onTaskPress,
  onTaskUpdate,
  loading = false,
  refreshing = false,
  onRefresh,
}) => {
  // Memoize the render item function to prevent recreation on every render
  const renderItem = useCallback(({ item }: { item: OperationalDataTaskAssignment }) => (
    <TaskItem
      task={item}
      onPress={onTaskPress}
      onUpdate={onTaskUpdate}
    />
  ), [onTaskPress, onTaskUpdate]);

  // Memoize the key extractor function
  const keyExtractor = useCallback((item: OperationalDataTaskAssignment) => item.id, []);

  // Memoize the item layout function for better performance
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Memoize the list footer component
  const ListFooterComponent = useMemo(() => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.footerText}>Loading more tasks...</Text>
      </View>
    );
  }, [loading]);

  // Memoize the empty component
  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No tasks available</Text>
    </View>
  ), []);

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      legacyImplementation={false}
      
      // Pull to refresh
      refreshing={refreshing}
      onRefresh={onRefresh}
      
      // End reached handling
      onEndReachedThreshold={0.5}
      
      // Styling
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

// Constants for performance optimization
const ITEM_HEIGHT = 120; // Fixed height for getItemLayout

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  taskItem: {
    marginBottom: Spacing.md,
  },
  taskCard: {
    padding: Spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  priorityText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  taskDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  taskDate: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: Colors.status.warning,
  },
  completeButton: {
    backgroundColor: Colors.status.success,
  },
  actionButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  footerLoader: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
});

export default OptimizedTaskList;
