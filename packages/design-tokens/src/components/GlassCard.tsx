/**
 * @cyntientops/design-tokens
 * 
 * GlassCard Component
 * Mirrors: CyntientOps/Components/Glass/GlassCard.swift
 * Core glass morphism component with exact SwiftUI implementation
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Colors } from '../tokens/colors';
import { Spacing } from '../tokens/spacing';
import { BorderRadius } from '../tokens/spacing';
import { ComponentShadows } from '../tokens/shadows';

// MARK: - Glass Intensity (matching SwiftUI exactly)
export enum GlassIntensity {
  ULTRA_THIN = 'ultraThin',
  THIN = 'thin',
  REGULAR = 'regular',
  THICK = 'thick',
}

export interface GlassIntensityConfig {
  opacity: number;
  blurRadius: number;
  strokeOpacity: number;
  shadowRadius: number;
  brightness: number;
}

export const GlassIntensityConfigs: Record<GlassIntensity, GlassIntensityConfig> = {
  [GlassIntensity.ULTRA_THIN]: {
    opacity: 0.05,
    blurRadius: 10,
    strokeOpacity: 0.05,
    shadowRadius: 6,
    brightness: 0.3,
  },
  [GlassIntensity.THIN]: {
    opacity: 0.1,
    blurRadius: 15,
    strokeOpacity: 0.1,
    shadowRadius: 12,
    brightness: 0.2,
  },
  [GlassIntensity.REGULAR]: {
    opacity: 0.15,
    blurRadius: 20,
    strokeOpacity: 0.15,
    shadowRadius: 20,
    brightness: 0.1,
  },
  [GlassIntensity.THICK]: {
    opacity: 0.25,
    blurRadius: 30,
    strokeOpacity: 0.25,
    shadowRadius: 30,
    brightness: 0.05,
  },
};

export interface GlassCardProps extends Omit<TouchableOpacityProps, 'style'> {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: GlassIntensity;
  variant?: 'default' | 'elevated' | 'interactive' | 'subtle';
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof BorderRadius;
  shadow?: boolean;
  blur?: boolean;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = GlassIntensity.REGULAR,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'lg',
  shadow = true,
  blur = true,
  onPress,
  ...touchableProps
}) => {
  const intensityConfig = GlassIntensityConfigs[intensity];
  
  const cardStyle: ViewStyle = {
    backgroundColor: `rgba(255, 255, 255, ${intensityConfig.opacity})`,
    padding: Spacing[padding],
    borderRadius: BorderRadius[borderRadius],
    borderWidth: 1,
    borderColor: `rgba(255, 255, 255, ${intensityConfig.strokeOpacity})`,
    ...(shadow && {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: intensityConfig.shadowRadius,
      elevation: 8,
    }),
    ...(blur && {
      // Note: React Native doesn't have native blur, this would need a library like react-native-blur
      // For now, we'll use opacity and shadow to simulate the effect
      opacity: 0.95,
    }),
  };

  if (variant === 'elevated') {
    cardStyle.backgroundColor = Colors.elevated;
    cardStyle.borderColor = Colors.borderMedium;
  }

  if (variant === 'interactive') {
    cardStyle.backgroundColor = `rgba(255, 255, 255, ${GlassIntensityConfigs[GlassIntensity.THICK].opacity})`;
    cardStyle.borderColor = Colors.borderAccent;
  }

  if (variant === 'subtle') {
    cardStyle.backgroundColor = `rgba(255, 255, 255, ${GlassIntensityConfigs[GlassIntensity.ULTRA_THIN].opacity})`;
    cardStyle.borderColor = `rgba(255, 255, 255, ${GlassIntensityConfigs[GlassIntensity.ULTRA_THIN].strokeOpacity})`;
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

// Glass Card variants (matching SwiftUI exactly)
export const GlassCardVariants = {
  default: {
    intensity: GlassIntensity.REGULAR,
    variant: 'default' as const,
  },
  elevated: {
    intensity: GlassIntensity.THICK,
    variant: 'elevated' as const,
  },
  interactive: {
    intensity: GlassIntensity.THICK,
    variant: 'interactive' as const,
  },
  subtle: {
    intensity: GlassIntensity.ULTRA_THIN,
    variant: 'subtle' as const,
  },
} as const;

export type GlassCardVariant = keyof typeof GlassCardVariants;

// MARK: - Glass Card Presets (matching SwiftUI GlassCard.swift)
export const GlassCardPresets = {
  // Standard card with regular glass effect
  standard: {
    intensity: GlassIntensity.REGULAR,
    variant: 'default' as const,
    shadow: true,
    blur: true,
  },
  
  // Subtle card with minimal glass effect
  subtle: {
    intensity: GlassIntensity.ULTRA_THIN,
    variant: 'subtle' as const,
    shadow: false,
    blur: true,
  },
  
  // Elevated card with strong glass effect
  elevated: {
    intensity: GlassIntensity.THICK,
    variant: 'elevated' as const,
    shadow: true,
    blur: true,
  },
  
  // Interactive card for buttons and touchable elements
  interactive: {
    intensity: GlassIntensity.THICK,
    variant: 'interactive' as const,
    shadow: true,
    blur: true,
  },
  
  // Navigation card with thin glass effect
  navigation: {
    intensity: GlassIntensity.THIN,
    variant: 'default' as const,
    shadow: true,
    blur: true,
  },
} as const;

export type GlassCardPreset = keyof typeof GlassCardPresets;
