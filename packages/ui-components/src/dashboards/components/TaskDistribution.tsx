/**
 * @cyntientops/ui-components
 * 
 * Task Distribution Component
 * Mirrors Swift TaskDistribution.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, TaskCategoryColors } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../../glass';
import { ServiceContainer } from '@cyntientops/business-core';

export interface TaskDistributionProps {
  onTaskPress?: (taskId: string) => void;
}

export const TaskDistribution: React.FC<TaskDistributionProps> = ({
  onTaskPress,
}) => {
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    urgent: 0,
  });
  const [categoryDistribution, setCategoryDistribution] = useState<Record<string, number>>({});
  const [workerDistribution, setWorkerDistribution] = useState<Record<string, number>>({});

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadTaskDistribution();
  }, []);

  const loadTaskDistribution = () => {
    try {
      const stats = services.task.getTaskStatistics();
      setTaskStats(stats);
      
      const categoryDist = services.task.getTaskDistributionByWorker();
      setCategoryDistribution(categoryDist);
      
      const workerDist = services.task.getTaskDistributionByWorker();
      setWorkerDistribution(workerDist);
    } catch (error) {
      console.error('Error loading task distribution:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryKey = category.toLowerCase() as keyof typeof TaskCategoryColors;
    return TaskCategoryColors[categoryKey] || Colors.text.tertiary;
  };

  const formatPercentage = (value: number, total: number) => {
    return Math.round((value / total) * 100);
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Task Distribution</Text>
      
      {/* Task Status Overview */}
      <View style={styles.statusOverview}>
        <Text style={styles.overviewTitle}>Task Status</Text>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{taskStats.total}</Text>
            <Text style={styles.statusLabel}>Total</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: Colors.status.pending }]}>
              {taskStats.pending}
            </Text>
            <Text style={styles.statusLabel}>Pending</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: Colors.status.info }]}>
              {taskStats.inProgress}
            </Text>
            <Text style={styles.statusLabel}>In Progress</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: Colors.status.success }]}>
              {taskStats.completed}
            </Text>
            <Text style={styles.statusLabel}>Completed</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: Colors.status.error }]}>
              {taskStats.overdue}
            </Text>
            <Text style={styles.statusLabel}>Overdue</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Text style={[styles.statusValue, { color: Colors.priority.urgent }]}>
              {taskStats.urgent}
            </Text>
            <Text style={styles.statusLabel}>Urgent</Text>
          </View>
        </View>
      </View>

      {/* Category Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.distributionTitle}>By Category</Text>
        
        {Object.entries(categoryDistribution).map(([category, count]) => (
          <View key={category} style={styles.distributionItem}>
            <View style={styles.distributionHeader}>
              <View style={[
                styles.categoryColor,
                { backgroundColor: getCategoryColor(category) }
              ]} />
              <Text style={styles.categoryName}>{category}</Text>
            </View>
            
            <View style={styles.distributionMetrics}>
              <Text style={styles.distributionCount}>{count}</Text>
              <Text style={styles.distributionPercentage}>
                {formatPercentage(count, taskStats.total)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Worker Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.distributionTitle}>By Worker</Text>
        
        {Object.entries(workerDistribution).map(([workerId, count]) => {
          const worker = services.operationalData.getWorkerById(workerId);
          return (
            <TouchableOpacity
              key={workerId}
              style={styles.distributionItem}
              onPress={() => onTaskPress?.(workerId)}
            >
              <View style={styles.distributionHeader}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerInitial}>
                    {worker?.name?.charAt(0) || '?'}
                  </Text>
                </View>
                <Text style={styles.workerName}>{worker?.name || 'Unknown'}</Text>
              </View>
              
              <View style={styles.distributionMetrics}>
                <Text style={styles.distributionCount}>{count}</Text>
                <Text style={styles.distributionPercentage}>
                  {formatPercentage(count, taskStats.total)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  statusOverview: {
    marginBottom: Spacing.xl,
  },
  overviewTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusValue: {
    ...Typography.titleLarge,
    color: Colors.role.admin.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statusLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  distributionSection: {
    marginBottom: Spacing.xl,
  },
  distributionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  categoryName: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  workerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.role.admin.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  workerInitial: {
    ...Typography.labelMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  workerName: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  distributionMetrics: {
    alignItems: 'flex-end',
  },
  distributionCount: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  distributionPercentage: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
});
