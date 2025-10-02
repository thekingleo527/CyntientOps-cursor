/**
 * ✅ Building Tasks Tab
 * Mirrors: SwiftUI BuildingDetailView Tasks tab functionality
 * Purpose: Task management, tracking, and assignment
 * Features: Task lists, worker assignments, progress tracking, completion status
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ServiceContainer } from '@cyntientops/business-core';
import { NamedCoordinate, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface BuildingTasksTabProps {
  tasks: OperationalDataTaskAssignment[];
  workers: any[];
  building: NamedCoordinate;
  container: ServiceContainer;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onWorkerPress?: (workerId: string) => void;
}

export interface TaskFilter {
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  category: 'all' | 'cleaning' | 'maintenance' | 'inspection' | 'repair' | 'compliance';
  worker: 'all' | string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export const BuildingTasksTab: React.FC<BuildingTasksTabProps> = ({
  tasks,
  workers,
  building,
  container,
  onTaskPress,
  onWorkerPress
}) => {
  const [filteredTasks, setFilteredTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0
  });
  const [filters, setFilters] = useState<TaskFilter>({
    status: 'all',
    priority: 'all',
    category: 'all',
    worker: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<OperationalDataTaskAssignment | null>(null);

  useEffect(() => {
    loadTasks();
  }, [building.id]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      // Load tasks from hardcoded data
      const buildingTasks = generateBuildingTasks(building.id);
      setFilteredTasks(buildingTasks);
      calculateTaskStats(buildingTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBuildingTasks = (buildingId: string): OperationalDataTaskAssignment[] => {
    // Generate building-specific tasks based on hardcoded data
    const buildingTasks = {
      '1': [ // 12 West 18th Street
        {
          id: 'task_1_1',
          name: 'Daily Lobby Cleaning',
          description: 'Complete daily cleaning of lobby area including floors, windows, and furniture',
          category: 'cleaning',
          priority: 'high',
          status: 'pending',
          assigned_worker_id: '1',
          assigned_building_id: buildingId,
          due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          estimated_duration: 45,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task_1_2',
          name: 'Stairwell Maintenance',
          description: 'Sweep and mop all stairwells, check for safety issues',
          category: 'maintenance',
          priority: 'medium',
          status: 'in_progress',
          assigned_worker_id: '1',
          assigned_building_id: buildingId,
          due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          estimated_duration: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task_1_3',
          name: 'Trash Collection',
          description: 'Collect and dispose of all trash from building',
          category: 'cleaning',
          priority: 'high',
          status: 'completed',
          assigned_worker_id: '1',
          assigned_building_id: buildingId,
          due_date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          estimated_duration: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area)
        {
          id: 'task_4_1',
          name: 'Museum Area Deep Clean',
          description: 'Specialized deep cleaning for Rubin Museum area',
          category: 'cleaning',
          priority: 'urgent',
          status: 'pending',
          assigned_worker_id: '4',
          assigned_building_id: buildingId,
          due_date: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
          estimated_duration: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task_4_2',
          name: 'Cultural Area Inspection',
          description: 'Inspect cultural area for compliance and safety',
          category: 'inspection',
          priority: 'high',
          status: 'in_progress',
          assigned_worker_id: '4',
          assigned_building_id: buildingId,
          due_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
          estimated_duration: 90,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'task_4_3',
          name: 'Visitor Area Preparation',
          description: 'Prepare visitor areas for daily operations',
          category: 'cleaning',
          priority: 'medium',
          status: 'completed',
          assigned_worker_id: '4',
          assigned_building_id: buildingId,
          due_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          estimated_duration: 75,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
    };

    return buildingTasks[buildingId as keyof typeof buildingTasks] || [];
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(task => task.category === filters.category);
    }

    // Apply worker filter
    if (filters.worker !== 'all') {
      filtered = filtered.filter(task => task.assigned_worker_id === filters.worker);
    }

    setFilteredTasks(filtered);
    calculateTaskStats(filtered);
  };

  const calculateTaskStats = (taskList: OperationalDataTaskAssignment[]) => {
    const total = taskList.length;
    const pending = taskList.filter(task => task.status === 'pending').length;
    const inProgress = taskList.filter(task => task.status === 'in_progress').length;
    const completed = taskList.filter(task => task.status === 'completed').length;
    const overdue = taskList.filter(task => 
      task.status !== 'completed' && new Date(task.due_date) < new Date()
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setTaskStats({
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'pending': return Colors.info;
      case 'overdue': return Colors.critical;
      default: return Colors.inactive;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.critical;
      case 'high': return Colors.warning;
      case 'medium': return Colors.info;
      case 'low': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔧';
      case 'inspection': return '🔍';
      case 'repair': return '🔨';
      case 'compliance': return '📋';
      default: return '📝';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return `Overdue by ${Math.abs(diffHours)}h`;
    } else if (diffHours < 1) {
      return 'Due soon';
    } else if (diffHours < 24) {
      return `Due in ${diffHours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getWorkerName = (workerId: string) => {
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.name : 'Unassigned';
  };

  const renderTaskItem = (task: OperationalDataTaskAssignment) => {
    const isOverdue = task.status !== 'completed' && new Date(task.due_date) < new Date();
    const workerName = getWorkerName(task.assigned_worker_id);

    return (
      <TouchableOpacity
        key={task.id}
        onPress={() => {
          setSelectedTask(task);
          onTaskPress?.(task);
        }}
      >
        <GlassCard 
          style={[
            styles.taskCard,
            isOverdue && styles.overdueTaskCard
          ]} 
          intensity={GlassIntensity.REGULAR} 
          cornerRadius={CornerRadius.CARD}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskHeaderLeft}>
              <Text style={styles.taskIcon}>{getCategoryIcon(task.category)}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.name}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
            </View>
            
            <View style={styles.taskHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.taskMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Priority</Text>
                <Text style={[styles.metaValue, { color: getPriorityColor(task.priority) }]}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Duration</Text>
                <Text style={styles.metaValue}>{formatDuration(task.estimated_duration)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Due</Text>
                <Text style={[styles.metaValue, isOverdue && { color: Colors.critical }]}>
                  {formatDueDate(task.due_date)}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Worker</Text>
                <TouchableOpacity onPress={() => onWorkerPress?.(task.assigned_worker_id)}>
                  <Text style={[styles.metaValue, { color: Colors.primaryAction }]}>
                    {workerName}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{task.category}</Text>
              </View>
            </View>
          </View>

          {isOverdue && (
            <View style={styles.overdueWarning}>
              <Text style={styles.overdueText}>⚠️ This task is overdue</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => {
    return (
      <GlassCard style={styles.filtersCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.filtersTitle}>Filters</Text>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'pending', 'in_progress', 'completed', 'overdue'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  filters.status === status && styles.filterOptionSelected
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: status as any }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.status === status && styles.filterOptionTextSelected
                ]}>
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Priority:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'low', 'medium', 'high', 'urgent'].map(priority => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.filterOption,
                  filters.priority === priority && styles.filterOptionSelected
                ]}
                onPress={() => setFilters(prev => ({ ...prev, priority: priority as any }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.priority === priority && styles.filterOptionTextSelected
                ]}>
                  {priority.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </GlassCard>
    );
  };

  const renderStats = () => {
    return (
      <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.statsTitle}>Task Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{taskStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{taskStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{taskStats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{taskStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.critical }]}>{taskStats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.primaryAction }]}>{taskStats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryAction}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>✅ Task Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} for {building.name}
          </Text>
        </View>

        {renderStats()}
        {renderFilters()}

        <View style={styles.tasksContainer}>
          {filteredTasks.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptyDescription}>
                No tasks match the current filters. Try adjusting your filter criteria.
              </Text>
            </GlassCard>
          ) : (
            filteredTasks.map(renderTaskItem)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  statsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  filtersCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  filtersTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  filterRow: {
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.glassOverlay,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  filterOptionText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  tasksContainer: {
    marginBottom: Spacing.lg,
  },
  taskCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  overdueTaskCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  taskHeaderRight: {
    marginLeft: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  taskMeta: {
    marginTop: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  overdueWarning: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.critical + '20',
    borderRadius: 6,
  },
  overdueText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});

export default BuildingTasksTab;