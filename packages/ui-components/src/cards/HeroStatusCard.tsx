/**
 * 🃏 Hero Status Card
 * Mirrors: CyntientOps/Components/Cards/HeroStatusCard.swift
 * Purpose: Glassmorphism hero card with status indicators and key metrics
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { GlassStatusBadge } from '../glass/GlassStatusBadge';

export interface HeroStatusCardProps {
  title: string;
  subtitle?: string;
  status: 'online' | 'offline' | 'busy' | 'pending' | 'completed' | 'overdue' | 'warning' | 'error' | 'success';
  metrics: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
  actions?: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const HeroStatusCard: React.FC<HeroStatusCardProps> = ({
  title,
  subtitle,
  status,
  metrics,
  actions = [],
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const getActionButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    switch (variant) {
      case 'secondary':
        return [styles.actionButton, styles.secondaryButton];
      case 'danger':
        return [styles.actionButton, styles.dangerButton];
      default:
        return [styles.actionButton, styles.primaryButton];
    }
  };

  const getActionButtonTextStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButtonText;
      case 'danger':
        return styles.dangerButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return Colors.status.success;
      case 'down':
        return Colors.status.error;
      default:
        return Colors.text.secondary;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const renderContent = () => (
    <GlassCard style={[styles.container, { backgroundColor }]} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        <GlassStatusBadge
          status={status}
          size="small"
          showBlur={showBlur}
        />
      </View>

      <View style={styles.metricsContainer}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricItem}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            {metric.trend && metric.trendValue && (
              <View style={styles.trendContainer}>
                <Text style={styles.trendIcon}>{getTrendIcon(metric.trend)}</Text>
                <Text style={[styles.trendValue, { color: getTrendColor(metric.trend) }]}>
                  {metric.trendValue}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={getActionButtonStyle(action.variant)}
              onPress={action.onPress}
            >
              <Text style={getActionButtonTextStyle(action.variant)}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  trendValue: {
    ...Typography.captionSmall,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.status.info,
  },
  secondaryButton: {
    backgroundColor: Colors.glass.thin,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  dangerButton: {
    backgroundColor: Colors.status.error,
  },
  primaryButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  dangerButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

export default HeroStatusCard;
