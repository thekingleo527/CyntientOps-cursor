/**
 * 🃏 Stat Card
 * Mirrors: CyntientOps/Components/Cards/StatCard.swift
 * Purpose: Glassmorphism stat card for displaying key performance indicators
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    period?: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
  size = 'medium',
}) => {
  const getColorConfig = () => {
    switch (color) {
      case 'success':
        return {
          primary: Colors.status.success,
          secondary: Colors.status.success + '20',
        };
      case 'warning':
        return {
          primary: Colors.status.warning,
          secondary: Colors.status.warning + '20',
        };
      case 'error':
        return {
          primary: Colors.status.error,
          secondary: Colors.status.error + '20',
        };
      case 'info':
        return {
          primary: Colors.status.info,
          secondary: Colors.status.info + '20',
        };
      default:
        return {
          primary: Colors.primary,
          secondary: Colors.primary + '20',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          padding: Spacing.sm,
          titleSize: Typography.caption.fontSize,
          valueSize: Typography.titleMedium.fontSize,
          subtitleSize: Typography.captionSmall.fontSize,
        };
      case 'large':
        return {
          padding: Spacing.xl,
          titleSize: Typography.subheadline.fontSize,
          valueSize: Typography.titleLarge.fontSize * 1.2,
          subtitleSize: Typography.body.fontSize,
        };
      default: // medium
        return {
          padding: Spacing.md,
          titleSize: Typography.body.fontSize,
          valueSize: Typography.titleLarge.fontSize,
          subtitleSize: Typography.caption.fontSize,
        };
    }
  };

  const getTrendConfig = () => {
    if (!trend) return null;

    const getTrendIcon = () => {
      switch (trend.direction) {
        case 'up':
          return '📈';
        case 'down':
          return '📉';
        default:
          return '➡️';
      }
    };

    const getTrendColor = () => {
      switch (trend.direction) {
        case 'up':
          return Colors.status.success;
        case 'down':
          return Colors.status.error;
        default:
          return Colors.text.secondary;
      }
    };

    return {
      icon: getTrendIcon(),
      color: getTrendColor(),
    };
  };

  const colorConfig = getColorConfig();
  const sizeConfig = getSizeConfig();
  const trendConfig = getTrendConfig();

  const renderContent = () => (
    <GlassCard style={[
      styles.container,
      { backgroundColor },
      { padding: sizeConfig.padding },
    ]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.title,
            { fontSize: sizeConfig.titleSize },
            { color: colorConfig.primary },
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[
              styles.subtitle,
              { fontSize: sizeConfig.subtitleSize },
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: colorConfig.secondary }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text style={[
          styles.value,
          { fontSize: sizeConfig.valueSize },
          { color: colorConfig.primary },
        ]}>
          {value}
        </Text>
      </View>

      {trend && trendConfig && (
        <View style={styles.trendContainer}>
          <Text style={styles.trendIcon}>{trendConfig.icon}</Text>
          <Text style={[styles.trendValue, { color: trendConfig.color }]}>
            {trend.value}
          </Text>
          {trend.period && (
            <Text style={styles.trendPeriod}>
              {trend.period}
            </Text>
          )}
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
    borderRadius: 12,
    margin: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.text.secondary,
    marginTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  valueContainer: {
    marginBottom: Spacing.sm,
  },
  value: {
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  trendValue: {
    ...Typography.caption,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  trendPeriod: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
});

export default StatCard;
