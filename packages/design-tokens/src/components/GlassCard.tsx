/**
 * @cyntientops/design-tokens
 * 
 * GlassCard Component
 * Core glass morphism component extracted from Swift GlassCard.swift
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors, Spacing, BorderRadius, ComponentShadows, GlassShadows, BlurEffects } from '../tokens';

export interface GlassCardProps extends Omit<TouchableOpacityProps, 'style'> {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'ultraThin' | 'thin' | 'regular' | 'thick';
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof BorderRadius;
  shadow?: boolean;
  blur?: boolean;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'regular',
  variant = 'default',
  padding = 'lg',
  borderRadius = 'lg',
  shadow = true,
  blur = true,
  onPress,
  ...touchableProps
}) => {
  const cardStyle: ViewStyle = {
    backgroundColor: Colors.glass[intensity],
    padding: Spacing[padding],
    borderRadius: BorderRadius[borderRadius],
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...(shadow && ComponentShadows.glassCard),
    ...(blur && {
      // Note: React Native doesn't have native blur, this would need a library like react-native-blur
      // For now, we'll use opacity and shadow to simulate the effect
      opacity: 0.95,
    }),
  };

  if (variant === 'elevated') {
    cardStyle.backgroundColor = Colors.base.elevated;
    cardStyle.borderColor = Colors.border.medium;
  }

  if (variant === 'interactive') {
    cardStyle.backgroundColor = Colors.glass.thick;
    cardStyle.borderColor = Colors.border.accent;
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.8}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

// Glass Card variants
export const GlassCardVariants = {
  default: {
    intensity: 'regular' as const,
    variant: 'default' as const,
  },
  elevated: {
    intensity: 'thick' as const,
    variant: 'elevated' as const,
  },
  interactive: {
    intensity: 'thick' as const,
    variant: 'interactive' as const,
  },
  subtle: {
    intensity: 'ultraThin' as const,
    variant: 'default' as const,
  },
} as const;

export type GlassCardVariant = keyof typeof GlassCardVariants;
