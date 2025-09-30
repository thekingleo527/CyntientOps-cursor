/**
 * @cyntientops/ui-components
 * 
 * Performance Metrics Component
 * Mirrors Swift PerformanceMetrics.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../../glass';
import { ServiceContainer } from '@cyntientops/business-core';

export interface PerformanceMetricsProps {
  workerId: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  workerId,
}) => {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    averageTaskTime: 0,
    currentStreak: 0,
    lastActiveDate: null as Date | null,
  });

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadPerformanceMetrics();
  }, [workerId]);

  const loadPerformanceMetrics = () => {
    try {
      const performanceData = services.worker.getWorkerPerformanceMetrics(workerId);
      setMetrics(performanceData);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const formatCompletionRate = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  const formatAverageTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatLastActive = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.9) return Colors.status.success;
    if (rate >= 0.7) return Colors.status.warning;
    return Colors.status.error;
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{metrics.totalTasks}</Text>
          <Text style={styles.metricLabel}>Total Tasks</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{metrics.completedTasks}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[
            styles.metricValue,
            { color: getCompletionRateColor(metrics.completionRate) }
          ]}>
            {formatCompletionRate(metrics.completionRate)}
          </Text>
          <Text style={styles.metricLabel}>Completion Rate</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {formatAverageTime(metrics.averageTaskTime)}
          </Text>
          <Text style={styles.metricLabel}>Avg. Time</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{metrics.currentStreak}</Text>
          <Text style={styles.metricLabel}>Day Streak</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {formatLastActive(metrics.lastActiveDate)}
          </Text>
          <Text style={styles.metricLabel}>Last Active</Text>
        </View>
      </View>

      {/* Performance Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Insights</Text>
        
        {metrics.completionRate >= 0.9 && (
          <Text style={styles.insightText}>
            🎉 Excellent performance! Keep up the great work.
          </Text>
        )}
        
        {metrics.completionRate >= 0.7 && metrics.completionRate < 0.9 && (
          <Text style={styles.insightText}>
            👍 Good performance. You're on track to meet your goals.
          </Text>
        )}
        
        {metrics.completionRate < 0.7 && (
          <Text style={styles.insightText}>
            📈 Focus on completing tasks on time to improve your metrics.
          </Text>
        )}
        
        {metrics.currentStreak > 0 && (
          <Text style={styles.insightText}>
            🔥 {metrics.currentStreak} day streak! Consistency is key.
          </Text>
        )}
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  metricItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.role.worker.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  insightsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  insightsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  insightText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
});
