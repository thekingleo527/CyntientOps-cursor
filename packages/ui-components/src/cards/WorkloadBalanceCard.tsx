/**
 * ⚖️ Workload Balance Card
 * Purpose: Display workload distribution and balance across workers
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface WorkerWorkload {
  name: string;
  taskCount: number;
  dailyHours: number;
  efficiency: number;
  buildingsCovered: number;
  role: 'specialist' | 'generalist' | 'admin' | 'floating';
}

export interface WorkloadBalanceCardProps {
  workers: WorkerWorkload[];
  totalTasks: number;
  averageEfficiency: number;
  balanceScore: number; // 0-1 (how well balanced the workload is)
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const WorkloadBalanceCard: React.FC<WorkloadBalanceCardProps> = ({
  workers,
  totalTasks,
  averageEfficiency,
  balanceScore,
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const getBalanceColor = (score: number) => {
    if (score >= 0.8) return Colors.status.success;
    if (score >= 0.6) return Colors.status.info;
    if (score >= 0.4) return Colors.status.warning;
    return Colors.status.error;
  };

  const getBalanceStatus = (score: number) => {
    if (score >= 0.8) return 'WELL BALANCED';
    if (score >= 0.6) return 'GOOD BALANCE';
    if (score >= 0.4) return 'NEEDS ADJUSTMENT';
    return 'IMBALANCED';
  };

  const formatBalance = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'specialist':
        return '🔧';
      case 'generalist':
        return '👷';
      case 'admin':
        return '👨‍💼';
      case 'floating':
        return '🚀';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'specialist':
        return Colors.status.warning;
      case 'generalist':
        return Colors.status.info;
      case 'admin':
        return Colors.primary;
      case 'floating':
        return Colors.status.success;
      default:
        return Colors.text.secondary;
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.9) return Colors.status.success;
    if (efficiency >= 0.7) return Colors.status.info;
    if (efficiency >= 0.5) return Colors.status.warning;
    return Colors.status.error;
  };

  const renderContent = () => (
    <GlassCard 
      style={[styles.container, { backgroundColor }]} 
      intensity={GlassIntensity.REGULAR} 
      cornerRadius={CornerRadius.CARD}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Workload Balance</Text>
          <Text style={styles.subtitle}>{workers.length} Workers • {totalTasks} Total Tasks</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceValue, { color: getBalanceColor(balanceScore) }]}>
            {formatBalance(balanceScore)}
          </Text>
          <Text style={styles.balanceLabel}>Balance</Text>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(averageEfficiency * 100)}%</Text>
            <Text style={styles.summaryLabel}>Avg Efficiency</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalTasks}</Text>
            <Text style={styles.summaryLabel}>Total Tasks</Text>
          </View>
        </View>
      </View>

      <View style={styles.workersContainer}>
        <Text style={styles.workersTitle}>Worker Distribution</Text>
        <View style={styles.workersList}>
          {workers.map((worker, index) => (
            <View key={index} style={styles.workerItem}>
              <View style={styles.workerHeader}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerIcon}>{getRoleIcon(worker.role)}</Text>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={[styles.workerRole, { color: getRoleColor(worker.role) }]}>
                    {worker.role.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.workerMetrics}>
                  <Text style={[styles.workerEfficiency, { color: getEfficiencyColor(worker.efficiency) }]}>
                    {Math.round(worker.efficiency * 100)}%
                  </Text>
                  <Text style={styles.workerTasks}>{worker.taskCount} tasks</Text>
                </View>
              </View>
              <View style={styles.workerDetails}>
                <Text style={styles.workerDetail}>
                  {worker.dailyHours}h daily • {worker.buildingsCovered} buildings
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getBalanceColor(balanceScore) }]}>
          {getBalanceStatus(balanceScore)}
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
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceValue: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  summaryContainer: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  workersContainer: {
    marginBottom: Spacing.lg,
  },
  workersTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  workersList: {
    gap: Spacing.sm,
  },
  workerItem: {
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workerIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  workerName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  workerRole: {
    ...Typography.caption,
    fontWeight: '500',
  },
  workerMetrics: {
    alignItems: 'flex-end',
  },
  workerEfficiency: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
  },
  workerTasks: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  workerDetails: {
    marginTop: Spacing.xs,
  },
  workerDetail: {
    ...Typography.caption,
    color: Colors.text.secondary,
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

export default WorkloadBalanceCard;

