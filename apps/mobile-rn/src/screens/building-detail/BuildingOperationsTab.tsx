/**
 * 🏢 Building Operations Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingTasksTabOptimized.swift
 * Purpose: Task management with filtering, swipe actions, and urgency sorting
 *
 * ⚡ OPTIMIZED: Virtualized task list with pagination
 * 🎯 FOCUSED: Only loads visible tasks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { TaskService, getSupabaseClient, isSupabaseConfigured } from '@cyntientops/business-core';
import { Database } from '@cyntientops/database';

type TaskFilter = 'active' | 'completed' | 'overdue' | 'all';

interface ContextualTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  urgency: string;
  dueDate?: Date;
  scheduledDate?: Date;
  requiresPhoto: boolean;
  estimatedDuration: number; // in seconds
  buildingId: string;
  buildingName: string;
  workerName?: string;
  completedAt?: Date;
}

interface BuildingOperationsTabProps {
  buildingId: string;
  buildingName: string;
}

interface KnowledgeHighlight {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  tags: string[];
  updatedAt?: Date;
}

export const BuildingOperationsTab: React.FC<BuildingOperationsTabProps> = ({
  buildingId,
  buildingName,
}) => {
  const [tasks, setTasks] = useState<ContextualTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [knowledgeHighlights, setKnowledgeHighlights] = useState<KnowledgeHighlight[]>([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const loadTasks = useCallback(async () => {
    try {
      const db = Database.getInstance();
      const whereClause = getWhereClause(selectedFilter);

      const query = `
        SELECT
          t.id, t.title, t.description, t.status, t.urgency,
          t.dueDate, t.scheduledDate, t.estimatedDuration,
          t.requiresPhoto, t.category, t.completedAt,
          w.name as worker_name
        FROM tasks t
        LEFT JOIN workers w ON t.workerId = w.id
        WHERE t.buildingId = ? ${whereClause}
        ORDER BY
          CASE t.urgency
            WHEN 'critical' THEN 1
            WHEN 'emergency' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END,
          t.dueDate ASC
        LIMIT 100
      `;

      const rows = await db.executeSql(query, [buildingId]);
      const loadedTasks = rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status || 'pending',
        urgency: row.urgency || 'medium',
        dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
        scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : undefined,
        requiresPhoto: row.requiresPhoto === 1,
        estimatedDuration: (row.estimatedDuration || 30) * 60, // Convert minutes to seconds
        buildingId,
        buildingName,
        workerName: row.worker_name,
        completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      }));

      setTasks(loadedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [buildingId, buildingName, selectedFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    let mounted = true;

    async function fetchKnowledge() {
      if (!isSupabaseConfigured()) {
        if (mounted) setKnowledgeStatus('ready');
        return;
      }

      try {
        setKnowledgeStatus('loading');
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('knowledge_chunks')
          .select(
            `id, content, chunk_index, knowledge_documents(id, title, source_type, tags, updated_at)`
          )
          .ilike('content', `%${buildingName ?? ''}%`)
          .in('knowledge_documents.source_type', ['task', 'dsny_schedule', 'worker'])
          .order('updated_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        const mapped: KnowledgeHighlight[] = (data ?? [])
          .map((item: any) => {
            const doc = item.knowledge_documents ?? {};
            return {
              id: item.id,
              title: doc.title ?? 'Operations Entry',
              content: item.content ?? '',
              sourceType: doc.source_type ?? 'knowledge',
              tags: Array.isArray(doc.tags) ? doc.tags : [],
              updatedAt: doc.updated_at ? new Date(doc.updated_at) : undefined,
            };
          })
          .filter((entry: KnowledgeHighlight) => entry.content.length > 0);

        if (!mounted) return;
        setKnowledgeHighlights(mapped);
        setKnowledgeStatus('ready');
      } catch (err: any) {
        if (!mounted) return;
        setKnowledgeStatus('error');
      }
    }

    if (knowledgeStatus === 'idle') {
      fetchKnowledge();
    }

    return () => {
      mounted = false;
    };
  }, [buildingName, knowledgeStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
  }, [loadTasks]);

  const completeTask = async (task: ContextualTask) => {
    try {
      const db = Database.getInstance();
      await db.executeSql(
        `UPDATE tasks
         SET status = 'completed', completedAt = datetime('now')
         WHERE id = ?`,
        [task.id]
      );
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const renderRightActions = (task: ContextualTask) => {
    if (task.status === 'completed') return null;

    return (
      <TouchableOpacity
        style={styles.swipeAction}
        onPress={() => completeTask(task)}
      >
        <Text style={styles.swipeActionText}>Complete</Text>
      </TouchableOpacity>
    );
  };

  const renderTask = ({ item }: { item: ContextualTask }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <GlassCard
        intensity={GlassIntensity.THIN}
        cornerRadius={CornerRadius.MEDIUM}
        style={styles.taskCard}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TaskPriorityBadge urgency={item.urgency} />
        </View>

        {item.description && (
          <Text style={styles.taskDescription} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          {item.dueDate && (
            <View style={styles.taskMetaItem}>
              <Text style={styles.taskMetaIcon}>📅</Text>
              <Text style={styles.taskMetaText}>
                {item.dueDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          {item.requiresPhoto && (
            <View style={styles.taskMetaItem}>
              <Text style={styles.taskMetaIcon}>📸</Text>
              <Text style={[styles.taskMetaText, { color: Colors.info }]}>
                Photo Required
              </Text>
            </View>
          )}

          <View style={styles.spacer} />

          <Text style={styles.taskDuration}>
            {Math.round(item.estimatedDuration / 60)} min
          </Text>
        </View>
      </GlassCard>
    </Swipeable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No {selectedFilter} tasks</Text>
      <Text style={styles.emptyMessage}>
        Tasks will appear here as they are assigned.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Picker */}
      <View style={styles.filterContainer}>
        {(['active', 'completed', 'overdue', 'all'] as TaskFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          knowledgeStatus !== 'idle' && knowledgeHighlights.length > 0 ? (
            <View style={styles.knowledgeSection}>
              <Text style={styles.knowledgeSectionTitle}>Operations Insights</Text>
              {knowledgeHighlights.map((item) => (
                <GlassCard
                  key={item.id}
                  intensity={GlassIntensity.medium}
                  cornerRadius={CornerRadius.lg}
                  style={styles.knowledgeCard}
                >
                  <Text style={styles.knowledgeTitle}>{item.title}</Text>
                  <Text style={styles.knowledgeContent}>{item.content}</Text>
                  {item.tags.length > 0 && (
                    <View style={styles.tagContainer}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <Text key={`${item.id}-${tag}`} style={styles.tag}>
                          {tag.toUpperCase()}
                        </Text>
                      ))}
                    </View>
                  )}
                </GlassCard>
              ))}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.info}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const TaskPriorityBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const getColor = () => {
    switch (urgency.toLowerCase()) {
      case 'critical':
      case 'emergency':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
      case 'normal':
        return Colors.status.caution;
      case 'low':
        return Colors.success;
      default:
        return Colors.text.secondary;
    }
  };

  const color = getColor();

  return (
    <View style={[styles.priorityBadge, { backgroundColor: color + '33' }]}>
      <Text style={[styles.priorityText, { color }]}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Text>
    </View>
  );
};

const getWhereClause = (filter: TaskFilter): string => {
  switch (filter) {
    case 'active':
      return "AND t.status NOT IN ('completed', 'cancelled')";
    case 'completed':
      return "AND t.status = 'completed'";
    case 'overdue':
      return "AND t.status NOT IN ('completed', 'cancelled') AND t.dueDate < datetime('now')";
    case 'all':
      return '';
    default:
      return '';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    ...Typography.bodyMedium,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.glass.thin,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.info + '33',
  },
  filterText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.info,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  taskCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    ...Typography.bodyLarge,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  taskDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaIcon: {
    fontSize: 12,
  },
  taskMetaText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  spacer: {
    flex: 1,
  },
  taskDuration: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  swipeAction: {
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    marginBottom: Spacing.md,
    borderRadius: 12,
    marginLeft: Spacing.sm,
  },
  swipeActionText: {
    color: '#ffffff',
    fontWeight: '600',
    ...Typography.bodyMedium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: 250,
  },
  knowledgeSection: {
    paddingBottom: Spacing.md,
  },
  knowledgeSectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  knowledgeCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  knowledgeTitle: {
    ...Typography.bodyBold,
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
  },
  knowledgeContent: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    ...Typography.captionSmall,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: CornerRadius.xs,
    backgroundColor: Colors.surface.brandTertiary,
    color: Colors.text.primary,
  },
});

export default BuildingOperationsTab;
