/**
 * 🃏 DSNY Schedule Card
 * Purpose: Display DSNY collection schedule with worker assignments
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface DSNYScheduleCardProps {
  collectionDays: string[];
  setOutWorker: string | null;
  setOutTime: string | null;
  bringInWorker: string | null;
  bringInTime: string | null;
  nextCollection: Date | null;
  onViewFull?: () => void;
}

export const DSNYScheduleCard: React.FC<DSNYScheduleCardProps> = ({
  collectionDays,
  setOutWorker,
  setOutTime,
  bringInWorker,
  bringInTime,
  nextCollection,
  onViewFull,
}) => {
  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getDaysUntilCollection = () => {
    if (!nextCollection) return null;
    const now = new Date();
    const diff = nextCollection.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysUntil = getDaysUntilCollection();

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="delete-variant" size={24} color={Colors.status.info} />
          <Text style={styles.title}>DSNY Collection Schedule</Text>
        </View>
        {onViewFull && (
          <TouchableOpacity onPress={onViewFull}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Collection Days */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Collection Days</Text>
        <View style={styles.daysRow}>
          {collectionDays.map((day, index) => (
            <View key={index} style={styles.dayBadge}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Next Collection */}
      {nextCollection && (
        <View style={styles.nextCollectionContainer}>
          <MaterialCommunityIcons name="calendar-alert" size={20} color={Colors.status.warning} />
          <View style={styles.nextCollectionText}>
            <Text style={styles.nextCollectionLabel}>Next Collection</Text>
            <Text style={styles.nextCollectionValue}>
              {formatDate(nextCollection)}
              {daysUntil !== null && (
                <Text style={styles.nextCollectionDays}> ({daysUntil} {daysUntil === 1 ? 'day' : 'days'})</Text>
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Worker Assignments */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Worker Assignments</Text>

        {setOutWorker && (
          <View style={styles.workerRow}>
            <View style={styles.workerBadge}>
              <MaterialCommunityIcons name="arrow-up-bold" size={14} color={Colors.role.worker.primary} />
              <Text style={styles.workerLabel}>Set Out</Text>
            </View>
            <Text style={styles.workerName}>{setOutWorker}</Text>
            {setOutTime && <Text style={styles.workerTime}>{setOutTime}</Text>}
          </View>
        )}

        {bringInWorker && (
          <View style={styles.workerRow}>
            <View style={styles.workerBadge}>
              <MaterialCommunityIcons name="arrow-down-bold" size={14} color={Colors.status.success} />
              <Text style={styles.workerLabel}>Bring In</Text>
            </View>
            <Text style={styles.workerName}>{bringInWorker}</Text>
            {bringInTime && <Text style={styles.workerTime}>{bringInTime}</Text>}
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  dayBadge: {
    backgroundColor: Colors.status.info + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.status.info + '40',
  },
  dayText: {
    ...Typography.caption,
    color: Colors.status.info,
    fontWeight: '600',
  },
  nextCollectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.status.warning + '10',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.status.warning + '40',
  },
  nextCollectionText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  nextCollectionLabel: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  nextCollectionValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  nextCollectionDays: {
    color: Colors.status.warning,
    fontWeight: 'normal',
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  workerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  workerLabel: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    marginLeft: 4,
    fontWeight: '600',
  },
  workerName: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  workerTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});

export default DSNYScheduleCard;
