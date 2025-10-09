/**
 * ⏰ Time Allocation Card
 * Purpose: Display time management analytics and task distribution
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface TimeAllocationCardProps {
  workerName: string;
  dailyHours: number;
  taskDistribution: {
    cleaning: number;
    maintenance: number;
    sanitation: number;
    inspection: number;
  };
  efficiencyScore: number; // 0-1
  overtimeHours: number;
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const TimeAllocationCard: React.FC<TimeAllocationCardProps> = ({
  workerName,
  dailyHours,
  taskDistribution,
  efficiencyScore,
  overtimeHours,
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const getEfficiencyColor = (score: number) => {
    if (score >= 0.9) return Colors.status.success;
    if (score >= 0.7) return Colors.status.info;
    if (score >= 0.5) return Colors.status.warning;
    return Colors.status.error;
  };

  const getEfficiencyStatus = (score: number) => {
    if (score >= 0.9) return 'EXCELLENT';
    if (score >= 0.7) return 'GOOD';
    if (score >= 0.5) return 'FAIR';
    return 'NEEDS IMPROVEMENT';
  };

  const formatEfficiency = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getTaskCategoryColor = (category: string) => {
    switch (category) {
      case 'cleaning':
        return Colors.status.info;
      case 'maintenance':
        return Colors.status.warning;
      case 'sanitation':
        return Colors.status.success;
      case 'inspection':
        return Colors.primary;
      default:
        return Colors.text.secondary;
    }
  };

  const getTaskCategoryIcon = (category: string) => {
    switch (category) {
      case 'cleaning':
        return '🧹';
      case 'maintenance':
        return '🔧';
      case 'sanitation':
        return '🗑️';
      case 'inspection':
        return '🔍';
      default:
        return '📋';
    }
  };

  const totalTasks = Object.values(taskDistribution).reduce((sum, count) => sum + count, 0);

  const renderContent = () => (
    <GlassCard 
      style={[styles.container, { backgroundColor }]} 
      intensity={GlassIntensity.REGULAR} 
      cornerRadius={CornerRadius.CARD}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Time Allocation</Text>
          <Text style={styles.workerName}>{workerName}</Text>
        </View>
        <View style={styles.efficiencyContainer}>
          <Text style={[styles.efficiencyValue, { color: getEfficiencyColor(efficiencyScore) }]}>
            {formatEfficiency(efficiencyScore)}
          </Text>
          <Text style={styles.efficiencyLabel}>Efficiency</Text>
        </View>
      </View>

      <View style={styles.hoursContainer}>
        <View style={styles.hoursRow}>
          <View style={styles.hoursItem}>
            <Text style={styles.hoursValue}>{dailyHours}h</Text>
            <Text style={styles.hoursLabel}>Daily Hours</Text>
          </View>
          <View style={styles.hoursItem}>
            <Text style={[styles.hoursValue, { color: overtimeHours > 0 ? Colors.status.warning : Colors.text.primary }]}>
              {overtimeHours}h
            </Text>
            <Text style={styles.hoursLabel}>Overtime</Text>
          </View>
        </View>
      </View>

      <View style={styles.distributionContainer}>
        <Text style={styles.distributionTitle}>Task Distribution ({totalTasks} total)</Text>
        <View style={styles.distributionGrid}>
          {Object.entries(taskDistribution).map(([category, count]) => (
            <View key={category} style={styles.distributionItem}>
              <View style={styles.distributionHeader}>
                <Text style={styles.distributionIcon}>
                  {getTaskCategoryIcon(category)}
                </Text>
                <Text style={styles.distributionCategory}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </View>
              <Text style={[styles.distributionCount, { color: getTaskCategoryColor(category) }]}>
                {count}
              </Text>
              <View style={styles.distributionBar}>
                <View 
                  style={[
                    styles.distributionBarFill,
                    { 
                      width: `${(count / totalTasks) * 100}%`,
                      backgroundColor: getTaskCategoryColor(category)
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getEfficiencyColor(efficiencyScore) }]}>
          {getEfficiencyStatus(efficiencyScore)}
        </Text>
      </View>
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: 16,
    margin: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  workerName: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  efficiencyContainer: {
    alignItems: 'center',
  },
  efficiencyValue: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
  },
  efficiencyLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  hoursContainer: {
    marginBottom: Spacing.lg,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  hoursItem: {
    alignItems: 'center',
    flex: 1,
  },
  hoursValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  hoursLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  distributionContainer: {
    marginBottom: Spacing.lg,
  },
  distributionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  distributionGrid: {
    gap: Spacing.sm,
  },
  distributionItem: {
    marginBottom: Spacing.sm,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  distributionIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  distributionCategory: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  distributionCount: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  distributionBar: {
    height: 4,
    backgroundColor: Colors.glass.thin,
    borderRadius: 2,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

export default TimeAllocationCard;

