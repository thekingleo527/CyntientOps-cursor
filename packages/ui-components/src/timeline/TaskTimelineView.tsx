/**
 * 📋 Task Timeline View
 * Mirrors: CyntientOps/Views/Main/TaskTimelineView.swift
 * Purpose: Complete task timeline with filtering, sorting, and real-time updates
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { OperationalDataTaskAssignment, TaskUrgency, TaskStatus } from '@cyntientops/domain-schema';
import { TaskTimelineRow } from './TaskTimelineRow';

export interface TaskTimelineViewProps {
  tasks: OperationalDataTaskAssignment[];
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskStart?: (taskId: string) => void;
  showBuilding?: boolean;
  compact?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  workerId?: string;
  buildingId?: string;
}

export type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskSort = 'due_date' | 'priority' | 'created_at' | 'building';

export const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskStart,
  showBuilding = false,
  compact = false,
  isLoading = false,
  onRefresh,
  isRefreshing = false,
  workerId,
  buildingId,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('due_date');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply filter
    switch (filter) {
      case 'pending':
        filtered = tasks.filter(task => task.status === 'Pending');
        break;
      case 'in_progress':
        filtered = tasks.filter(task => task.status === 'In Progress');
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === 'Completed');
        break;
      case 'overdue':
        filtered = tasks.filter(task => {
          if (!task.due_date || task.status === 'Completed') return false;
          return new Date(task.due_date) < new Date();
        });
        break;
      default:
        filtered = tasks;
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        
        case 'priority':
          const priorityOrder: Record<TaskUrgency, number> = {
            emergency: 0,
            critical: 1,
            urgent: 2,
            high: 3,
            medium: 4,
            low: 5,
            normal: 6,
          };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        
        case 'created_at':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        
        case 'building':
          return (a.assigned_building_id || '').localeCompare(b.assigned_building_id || '');
        
        default:
          return 0;
      }
    });
  }, [tasks, filter, sortBy]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'Completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    return { total, completed, pending, inProgress, overdue };
  }, [tasks]);

  const renderFilterButton = (filterType: TaskFilter, label: string, count?: number) => (
    <TouchableOpacity
      key={filterType}
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.activeFilterButtonText,
      ]}>
        {label}
        {count !== undefined && ` (${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderSortButton = (sortType: TaskSort, label: string) => (
    <TouchableOpacity
      key={sortType}
      style={[
        styles.sortButton,
        sortBy === sortType && styles.activeSortButton,
      ]}
      onPress={() => setSortBy(sortType)}
    >
      <Text style={[
        styles.sortButtonText,
        sortBy === sortType && styles.activeSortButtonText,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTaskStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{taskStats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: Colors.status.success }]}>
          {taskStats.completed}
        </Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: Colors.status.warning }]}>
          {taskStats.pending}
        </Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: Colors.status.error }]}>
          {taskStats.overdue}
        </Text>
        <Text style={styles.statLabel}>Overdue</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        {renderFilterButton('all', 'All', taskStats.total)}
        {renderFilterButton('pending', 'Pending', taskStats.pending)}
        {renderFilterButton('in_progress', 'In Progress', taskStats.inProgress)}
        {renderFilterButton('completed', 'Completed', taskStats.completed)}
        {renderFilterButton('overdue', 'Overdue', taskStats.overdue)}
      </View>
      
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {renderSortButton('due_date', 'Due Date')}
        {renderSortButton('priority', 'Priority')}
        {renderSortButton('created_at', 'Created')}
        {showBuilding && renderSortButton('building', 'Building')}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No tasks found</Text>
      <Text style={styles.emptyDescription}>
        {filter === 'all' 
          ? 'No tasks have been assigned yet.'
          : `No ${filter.replace('_', ' ')} tasks found.`
        }
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary.blue} />
      <Text style={styles.loadingText}>Loading tasks...</Text>
    </View>
  );

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Task Timeline</Text>
          {workerId && (
            <Text style={styles.subtitle}>Worker Tasks</Text>
          )}
          {buildingId && (
            <Text style={styles.subtitle}>Building Tasks</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task Statistics */}
      {renderTaskStats()}

      {/* Filters */}
      {showFilters && renderFilters()}

      {/* Task List */}
      <View style={styles.taskListContainer}>
        {isLoading ? (
          renderLoadingState()
        ) : filteredAndSortedTasks.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView
            style={styles.taskList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary.blue}
                />
              ) : undefined
            }
          >
            {filteredAndSortedTasks.map((task) => (
              <TaskTimelineRow
                key={task.id}
                task={task}
                onTaskPress={onTaskPress}
                showBuilding={showBuilding}
                compact={compact}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  filterToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  filterToggleText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary.blue + '20',
    borderColor: Colors.primary.blue,
  },
  filterButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 6,
  },
  activeSortButton: {
    backgroundColor: Colors.primary.green + '20',
  },
  sortButtonText: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  activeSortButtonText: {
    color: Colors.primary.green,
    fontWeight: '600',
  },
  taskListContainer: {
    flex: 1,
    minHeight: 200,
  },
  taskList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
});

export default TaskTimelineView;
