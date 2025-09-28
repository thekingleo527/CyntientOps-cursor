/**
 * 🎨 Glass Status Badge
 * Mirrors: CyntientOps/Components/Glass/GlassStatusBadge.swift
 * Purpose: Glassmorphism status badge with blur effects and transparency
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface GlassStatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'pending' | 'completed' | 'overdue' | 'warning' | 'error' | 'success';
  label?: string;
  showBlur?: boolean;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const GlassStatusBadge: React.FC<GlassStatusBadgeProps> = ({
  status,
  label,
  showBlur = true,
  size = 'medium',
  showIcon = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
      case 'completed':
      case 'success':
        return {
          color: Colors.status.success,
          icon: '🟢',
          defaultLabel: 'Online',
        };
      case 'offline':
        return {
          color: Colors.text.secondary,
          icon: '⚫',
          defaultLabel: 'Offline',
        };
      case 'busy':
      case 'pending':
        return {
          color: Colors.status.warning,
          icon: '🟡',
          defaultLabel: 'Busy',
        };
      case 'overdue':
      case 'error':
        return {
          color: Colors.status.error,
          icon: '🔴',
          defaultLabel: 'Overdue',
        };
      case 'warning':
        return {
          color: Colors.status.warning,
          icon: '⚠️',
          defaultLabel: 'Warning',
        };
      default:
        return {
          color: Colors.text.secondary,
          icon: '⚪',
          defaultLabel: 'Unknown',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          padding: Spacing.xs,
          fontSize: Typography.captionSmall.fontSize,
          iconSize: 12,
        };
      case 'large':
        return {
          padding: Spacing.md,
          fontSize: Typography.body.fontSize,
          iconSize: 20,
        };
      default: // medium
        return {
          padding: Spacing.sm,
          fontSize: Typography.caption.fontSize,
          iconSize: 16,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();
  const displayLabel = label || statusConfig.defaultLabel;

  const renderContent = () => (
    <View style={[
      styles.container,
      {
        padding: sizeConfig.padding,
        backgroundColor: statusConfig.color + '20',
        borderColor: statusConfig.color,
      },
    ]}>
      <View style={styles.content}>
        {showIcon && (
          <Text style={[styles.icon, { fontSize: sizeConfig.iconSize }]}>
            {statusConfig.icon}
          </Text>
        )}
        <Text style={[
          styles.label,
          {
            fontSize: sizeConfig.fontSize,
            color: statusConfig.color,
          },
        ]}>
          {displayLabel}
        </Text>
      </View>
    </View>
  );

  if (showBlur) {
    return (
      <BlurView intensity={10} style={styles.blurContainer}>
        {renderContent()}
      </BlurView>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default GlassStatusBadge;
