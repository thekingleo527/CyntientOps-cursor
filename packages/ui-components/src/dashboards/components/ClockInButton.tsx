/**
 * @cyntientops/ui-components
 * 
 * Clock In Button Component
 * Mirrors Swift ClockInButton.swift
 */

import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { GlassButton, Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface ClockInButtonProps {
  isClockedIn: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  disabled?: boolean;
}

export const ClockInButton: React.FC<ClockInButtonProps> = ({
  isClockedIn,
  onClockIn,
  onClockOut,
  disabled = false,
}) => {
  const handlePress = () => {
    if (isClockedIn) {
      Alert.alert(
        'Clock Out',
        'Are you sure you want to clock out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock Out', style: 'destructive', onPress: onClockOut },
        ]
      );
    } else {
      Alert.alert(
        'Clock In',
        'Are you ready to start your shift?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock In', onPress: onClockIn },
        ]
      );
    }
  };

  const getButtonConfig = () => {
    if (isClockedIn) {
      return {
        title: 'Clock Out',
        variant: 'danger' as const,
        subtitle: 'End your shift',
      };
    } else {
      return {
        title: 'Clock In',
        variant: 'primary' as const,
        subtitle: 'Start your shift',
      };
    }
  };

  const config = getButtonConfig();

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <GlassButton
          title={config.title}
          onPress={handlePress}
          variant={config.variant}
          size="large"
          disabled={disabled}
          fullWidth
        />
      </View>
      
      <Text style={styles.subtitle}>{config.subtitle}</Text>
      
      {disabled && (
        <Text style={styles.disabledText}>
          Complete your current tasks to clock in
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  disabledText: {
    ...Typography.bodySmall,
    color: Colors.text.disabled,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
