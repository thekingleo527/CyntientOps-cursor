/**
 * @cyntientops/ui-components
 * 
 * Worker Hero Card Component
 * Mirrors Swift WorkerHeroCard.swift
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { WorkerProfile } from '@cyntientops/domain-schema';

export interface WorkerHeroCardProps {
  worker: WorkerProfile;
  isClockedIn: boolean;
  todaysTaskCount: number;
}

export const WorkerHeroCard: React.FC<WorkerHeroCardProps> = ({
  worker,
  isClockedIn,
  todaysTaskCount,
}) => {
  const getStatusColor = () => {
    if (isClockedIn) {
      return Colors.status.success;
    }
    return Colors.text.tertiary;
  };

  const getStatusText = () => {
    if (isClockedIn) {
      return 'Clocked In';
    }
    return 'Available';
  };

  return (
    <GlassCard style={styles.card} variant="elevated">
      <View style={styles.header}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerRole}>{worker.role}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todaysTaskCount}</Text>
          <Text style={styles.statLabel}>Today's Tasks</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{worker.hourlyRate}</Text>
          <Text style={styles.statLabel}>Hourly Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{worker.shift}</Text>
          <Text style={styles.statLabel}>Shift</Text>
        </View>
      </View>

      {worker.skills && (
        <View style={styles.skillsContainer}>
          <Text style={styles.skillsLabel}>Skills:</Text>
          <Text style={styles.skillsText}>{worker.skills}</Text>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.headlineMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  workerRole: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.role.worker.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  skillsContainer: {
    marginTop: Spacing.md,
  },
  skillsLabel: {
    ...Typography.labelMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  skillsText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    lineHeight: 20,
  },
});
