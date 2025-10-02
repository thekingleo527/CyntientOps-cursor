/**
 * @cyntientops/ui-components
 * 
 * Performance Reports Component
 * Mirrors Swift PerformanceReports.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ServiceContainer } from '@cyntientops/business-core';

export const PerformanceReports: React.FC = () => {
  const [systemStats, setSystemStats] = useState({
    totalWorkers: 0,
    totalBuildings: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    urgentTasks: 0,
    completionRate: 0,
  });

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = () => {
    try {
      const workers = services.operationalData.getWorkers();
      const buildings = services.operationalData.getBuildings();
      const tasks = services.operationalData.getRoutines();
      
      const completedTasks = tasks.filter(task => {
        // This would be determined by task status in a real implementation
        return false;
      }).length;
      
      const overdueTasks = services.task.getOverdueTasks().length;
      const urgentTasks = services.task.getUrgentTasks().length;
      
      setSystemStats({
        totalWorkers: workers.length,
        totalBuildings: buildings.length,
        totalTasks: tasks.length,
        completedTasks,
        overdueTasks,
        urgentTasks,
        completionRate: completedTasks / tasks.length,
      });
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.9) return Colors.status.success;
    if (rate >= 0.7) return Colors.status.warning;
    return Colors.status.error;
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Performance Reports</Text>
      
      {/* System Overview */}
      <View style={styles.overviewSection}>
        <Text style={styles.overviewTitle}>System Overview</Text>
        
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{systemStats.totalWorkers}</Text>
            <Text style={styles.overviewLabel}>Total Workers</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{systemStats.totalBuildings}</Text>
            <Text style={styles.overviewLabel}>Total Buildings</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{systemStats.totalTasks}</Text>
            <Text style={styles.overviewLabel}>Total Tasks</Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={[styles.overviewValue, { color: Colors.status.success }]}>
              {systemStats.completedTasks}
            </Text>
            <Text style={styles.overviewLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.metricsTitle}>Performance Metrics</Text>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Completion Rate</Text>
          <Text style={[
            styles.metricValue,
            { color: getCompletionRateColor(systemStats.completionRate) }
          ]}>
            {formatPercentage(systemStats.completionRate)}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Overdue Tasks</Text>
          <Text style={[
            styles.metricValue,
            { color: systemStats.overdueTasks > 0 ? Colors.status.error : Colors.status.success }
          ]}>
            {systemStats.overdueTasks}
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Urgent Tasks</Text>
          <Text style={[
            styles.metricValue,
            { color: systemStats.urgentTasks > 0 ? Colors.priority.urgent : Colors.status.success }
          ]}>
            {systemStats.urgentTasks}
          </Text>
        </View>
      </View>

      {/* Performance Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.insightsTitle}>Performance Insights</Text>
        
        {systemStats.completionRate >= 0.9 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🎉</Text>
            <Text style={styles.insightText}>
              Excellent performance! The system is operating at peak efficiency.
            </Text>
          </View>
        )}
        
        {systemStats.completionRate >= 0.7 && systemStats.completionRate < 0.9 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>👍</Text>
            <Text style={styles.insightText}>
              Good performance. Consider optimizing task scheduling to improve completion rates.
            </Text>
          </View>
        )}
        
        {systemStats.completionRate < 0.7 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>📈</Text>
            <Text style={styles.insightText}>
              Performance needs improvement. Review task assignments and worker capacity.
            </Text>
          </View>
        )}
        
        {systemStats.overdueTasks > 0 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>⚠️</Text>
            <Text style={styles.insightText}>
              {systemStats.overdueTasks} overdue tasks require immediate attention.
            </Text>
          </View>
        )}
        
        {systemStats.urgentTasks > 0 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🚨</Text>
            <Text style={styles.insightText}>
              {systemStats.urgentTasks} urgent tasks need priority handling.
            </Text>
          </View>
        )}
        
        {systemStats.overdueTasks === 0 && systemStats.urgentTasks === 0 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>✅</Text>
            <Text style={styles.insightText}>
              All tasks are on schedule. Great job maintaining operational excellence!
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.actionsTitle}>Report Actions</Text>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Generate detailed performance report</Text>
        </View>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>📧</Text>
          <Text style={styles.actionText}>Email report to stakeholders</Text>
        </View>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>Schedule automated reports</Text>
        </View>
        
        <View style={styles.actionItem}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Analyze performance trends</Text>
        </View>
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
  overviewSection: {
    marginBottom: Spacing.xl,
  },
  overviewTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '45%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  overviewValue: {
    ...Typography.titleLarge,
    color: Colors.role.admin.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  overviewLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  metricsSection: {
    marginBottom: Spacing.xl,
  },
  metricsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  metricLabel: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  metricValue: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  insightsSection: {
    marginBottom: Spacing.xl,
  },
  insightsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  insightText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  actionsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  actionText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
});
