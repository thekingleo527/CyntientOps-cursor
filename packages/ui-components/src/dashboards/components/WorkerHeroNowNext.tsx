/**
 * 👷 Worker Hero Now/Next Component
 * Mirrors: CyntientOps/Views/Components/Worker/WorkerHeroNowNext.swift
 * Purpose: Hero card showing current status and next task
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../../glass';
import { OperationalDataTaskAssignment, NamedCoordinate } from '@cyntientops/domain-schema';

export interface WorkerHeroNowNextProps {
  workerName: string;
  currentBuilding?: NamedCoordinate;
  nextTask?: OperationalDataTaskAssignment;
  isClockedIn: boolean;
  clockInTime?: Date;
  onClockAction: () => void;
}

export const WorkerHeroNowNext: React.FC<WorkerHeroNowNextProps> = ({
  workerName,
  currentBuilding,
  nextTask,
  isClockedIn,
  clockInTime,
  onClockAction,
}) => {
  const getClockStatusColor = () => {
    return isClockedIn ? Colors.success : Colors.warning;
  };

  const getClockStatusText = () => {
    return isClockedIn ? '🟢 CLOCKED IN' : '🟡 CLOCKED OUT';
  };

  const formatClockInTime = () => {
    if (!clockInTime) return '';
    return `Since ${clockInTime.toLocaleTimeString()}`;
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.header}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{workerName}</Text>
          <Text style={styles.workerRole}>Field Worker</Text>
          <Text style={styles.currentBuilding}>
            {currentBuilding ? `📍 ${currentBuilding.name}` : '📍 No current building'}
          </Text>
        </View>
        <View style={styles.clockStatus}>
          <View style={[styles.clockIndicator, { backgroundColor: getClockStatusColor() }]}>
            <Text style={styles.clockText}>{getClockStatusText()}</Text>
          </View>
          {isClockedIn && clockInTime && (
            <Text style={styles.clockTime}>{formatClockInTime()}</Text>
          )}
        </View>
      </View>

      {nextTask && (
        <View style={styles.nextTaskSection}>
          <Text style={styles.nextTaskLabel}>Next Task:</Text>
          <Text style={styles.nextTaskTitle}>{nextTask.name}</Text>
          <Text style={styles.nextTaskDescription}>{nextTask.description}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getClockStatusColor() }]}
          onPress={onClockAction}
        >
          <Text style={styles.actionButtonText}>
            {isClockedIn ? '🕐 Clock Out' : '🕐 Clock In'}
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  workerRole: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  currentBuilding: {
    ...Typography.caption,
    color: Colors.info,
    marginTop: Spacing.xs,
  },
  clockStatus: {
    alignItems: 'flex-end',
  },
  clockIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  clockText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  clockTime: {
    ...Typography.captionSmall,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  nextTaskSection: {
    backgroundColor: Colors.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  nextTaskLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  nextTaskTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginTop: 2,
  },
  nextTaskDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
});

export default WorkerHeroNowNext;
