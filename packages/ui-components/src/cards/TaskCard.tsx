/**
 * 🃏 Task Card
 * Purpose: Display operational tasks with status, time, and action buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../glass';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface TaskCardProps {
  status: 'now' | 'next' | 'today' | 'completed' | 'urgent';
  statusIcon: string;
  statusLabel: string;
  statusColor: string;
  title: string;
  building: string;
  timeRange: string;
  duration: string;
  category: string;
  skillLevel: string;
  requiresPhoto: boolean;
  onPress?: () => void;
  onComplete?: () => void;
  onIssue?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  status,
  statusIcon,
  statusLabel,
  statusColor,
  title,
  building,
  timeRange,
  duration,
  category,
  skillLevel,
  requiresPhoto,
  onPress,
  onComplete,
  onIssue,
}) => {
  const renderStatusBadge = () => (
    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
      <Text style={styles.statusIcon}>{statusIcon}</Text>
      <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );

  const renderActionButtons = () => {
    if (status !== 'now') return null;

    return (
      <View style={styles.actionsContainer}>
        {onComplete && (
          <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={onComplete}>
            <MaterialCommunityIcons name="check-circle" size={16} color={Colors.status.success} />
            <Text style={[styles.actionButtonText, { color: Colors.status.success }]}>Complete</Text>
          </TouchableOpacity>
        )}
        {onIssue && (
          <TouchableOpacity style={[styles.actionButton, styles.issueButton]} onPress={onIssue}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.status.warning} />
            <Text style={[styles.actionButtonText, { color: Colors.status.warning }]}>Issue</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const content = (
    <GlassCard style={styles.container} intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium}>
      {/* Status Badge */}
      {renderStatusBadge()}

      {/* Task Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Building Location */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="office-building" size={14} color={Colors.text.secondary} />
        <Text style={styles.infoText}>{building}</Text>
      </View>

      {/* Time Range */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.text.secondary} />
        <Text style={styles.infoText}>{timeRange} · {duration}</Text>
      </View>

      {/* Category & Skill Level */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValue}>{category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Skill</Text>
          <Text style={styles.metaValue}>{skillLevel}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Photo</Text>
          <Text style={styles.metaValue}>{requiresPhoto ? 'Required' : 'Optional'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {renderActionButtons()}
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
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusLabel: {
    ...Typography.captionSmall,
    fontWeight: '600',
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  completeButton: {
    backgroundColor: Colors.status.success + '10',
    borderColor: Colors.status.success + '40',
  },
  issueButton: {
    backgroundColor: Colors.status.warning + '10',
    borderColor: Colors.status.warning + '40',
  },
  actionButtonText: {
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default TaskCard;
