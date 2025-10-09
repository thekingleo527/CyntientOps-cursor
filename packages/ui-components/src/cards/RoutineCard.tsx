/**
 * 🃏 Routine Card
 * Purpose: Display building routine tasks with worker assignment and schedule
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface RoutineCardProps {
  time: string;
  title: string;
  worker: string;
  category: string;
  skillLevel: string;
  requiresPhoto: boolean;
  frequency: string;
  daysOfWeek?: string;
  onPress?: () => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  time,
  title,
  worker,
  category,
  skillLevel,
  requiresPhoto,
  frequency,
  daysOfWeek,
  onPress,
}) => {
  const getCategoryIcon = () => {
    switch (category.toLowerCase()) {
      case 'cleaning': return 'broom';
      case 'maintenance': return 'wrench';
      case 'sanitation': return 'delete';
      case 'inspection': return 'magnify';
      case 'security': return 'shield-check';
      default: return 'clipboard-list';
    }
  };

  const content = (
    <GlassCard style={styles.container} intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.role.worker.primary} />
          <Text style={styles.time}>{time}</Text>
        </View>
        {requiresPhoto && (
          <View style={styles.photoBadge}>
            <MaterialCommunityIcons name="camera" size={12} color={Colors.status.info} />
          </View>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="account" size={14} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{worker}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <MaterialCommunityIcons name={getCategoryIcon()} size={12} color={Colors.text.secondary} />
          <Text style={styles.metaText}>{category}</Text>
        </View>
        <View style={styles.metaBadge}>
          <MaterialCommunityIcons name="star" size={12} color={Colors.text.secondary} />
          <Text style={styles.metaText}>{skillLevel}</Text>
        </View>
        <View style={styles.metaBadge}>
          <MaterialCommunityIcons name="repeat" size={12} color={Colors.text.secondary} />
          <Text style={styles.metaText}>{frequency}</Text>
        </View>
      </View>

      {daysOfWeek && (
        <View style={styles.daysRow}>
          <Text style={styles.daysLabel}>Days:</Text>
          <Text style={styles.daysValue}>{daysOfWeek}</Text>
        </View>
      )}
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    ...Typography.caption,
    color: Colors.role.worker.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  photoBadge: {
    backgroundColor: Colors.status.info + '20',
    padding: 4,
    borderRadius: 12,
  },
  title: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  detailsRow: {
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  metaText: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  daysLabel: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
    marginRight: 4,
  },
  daysValue: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});

export default RoutineCard;
