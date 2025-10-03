/**
 * @cyntientops/design-tokens
 * 
 * GlassButton Component
 * Mirrors: CyntientOps/Components/Glass/GlassButton.swift
 * Glass morphism button with exact SwiftUI implementation
 */

import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '../tokens/colors';
import { Spacing } from '../tokens/spacing';
import { BorderRadius } from '../tokens/spacing';
import { ComponentShadows } from '../tokens/shadows';
import { Typography } from '../tokens/typography';
import { GlassIntensity, GlassIntensityConfigs } from '../tokens/glassmorphism';

// MARK: - Glass Button Style (matching SwiftUI exactly)
export enum GlassButtonStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  DESTRUCTIVE = 'destructive',
}

export interface GlassButtonStyleConfig {
  baseColor: string;
  textColor: string;
  intensity: GlassIntensity;
}

export const GlassButtonStyleConfigs: Record<GlassButtonStyle, GlassButtonStyleConfig> = {
  [GlassButtonStyle.PRIMARY]: {
    baseColor: Colors.primaryAction,
    textColor: Colors.primaryText,
    intensity: GlassIntensity.REGULAR,
  },
  [GlassButtonStyle.SECONDARY]: {
    baseColor: Colors.secondaryText,
    textColor: Colors.primaryText,
    intensity: GlassIntensity.THIN,
  },
  [GlassButtonStyle.TERTIARY]: {
    baseColor: 'transparent',
    textColor: Colors.primaryText,
    intensity: GlassIntensity.ULTRA_THIN,
  },
  [GlassButtonStyle.DESTRUCTIVE]: {
    baseColor: Colors.critical,
    textColor: Colors.primaryText,
    intensity: GlassIntensity.REGULAR,
  },
};

// MARK: - Glass Button Size (matching SwiftUI exactly)
export enum GlassButtonSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface GlassButtonSizeConfig {
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  fontWeight: string;
  cornerRadius: number;
}

export const GlassButtonSizeConfigs: Record<GlassButtonSize, GlassButtonSizeConfig> = {
  [GlassButtonSize.SMALL]: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '500',
    cornerRadius: 12,
  },
  [GlassButtonSize.MEDIUM]: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
    cornerRadius: 16,
  },
  [GlassButtonSize.LARGE]: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    cornerRadius: 20,
  },
};

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: GlassButtonStyle;
  size?: GlassButtonSize;
  disabled?: boolean;
  loading?: boolean;
  customStyle?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  style = GlassButtonStyle.PRIMARY,
  size = GlassButtonSize.MEDIUM,
  disabled = false,
  loading = false,
  customStyle,
  textStyle,
  fullWidth = false,
}) => {
  const styleConfig = GlassButtonStyleConfigs[style];
  const sizeConfig = GlassButtonSizeConfigs[size];
  const intensityConfig = GlassIntensityConfigs[styleConfig.intensity];

  const buttonStyle: ViewStyle = {
    backgroundColor: styleConfig.baseColor === 'transparent' 
      ? `rgba(255, 255, 255, ${intensityConfig.opacity})`
      : styleConfig.baseColor,
    borderColor: styleConfig.baseColor === 'transparent'
      ? `rgba(255, 255, 255, ${intensityConfig.strokeOpacity})`
      : styleConfig.baseColor,
    borderWidth: 1,
    borderRadius: sizeConfig.cornerRadius,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: intensityConfig.shadowRadius,
    elevation: 8,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && {
      opacity: 0.5,
    }),
    ...customStyle,
  };

  const textStyleCombined: TextStyle = {
    color: styleConfig.textColor,
    fontSize: sizeConfig.fontSize,
    fontWeight: sizeConfig.fontWeight as any,
    textAlign: 'center',
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Text style={textStyleCombined}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

// MARK: - Glass Button Presets (matching SwiftUI GlassButton.swift)
export const GlassButtonPresets = {
  // Primary button with regular glass effect
  primary: {
    style: GlassButtonStyle.PRIMARY,
    size: GlassButtonSize.MEDIUM,
  },
  
  // Secondary button with thin glass effect
  secondary: {
    style: GlassButtonStyle.SECONDARY,
    size: GlassButtonSize.MEDIUM,
  },
  
  // Tertiary button with minimal glass effect
  tertiary: {
    style: GlassButtonStyle.TERTIARY,
    size: GlassButtonSize.MEDIUM,
  },
  
  // Destructive button for dangerous actions
  destructive: {
    style: GlassButtonStyle.DESTRUCTIVE,
    size: GlassButtonSize.MEDIUM,
  },
  
  // Small primary button
  primarySmall: {
    style: GlassButtonStyle.PRIMARY,
    size: GlassButtonSize.SMALL,
  },
  
  // Large primary button
  primaryLarge: {
    style: GlassButtonStyle.PRIMARY,
    size: GlassButtonSize.LARGE,
  },
} as const;

export type GlassButtonPreset = keyof typeof GlassButtonPresets;

// Legacy variants for backward compatibility
export const GlassButtonVariants = {
  primary: {
    style: GlassButtonStyle.PRIMARY,
  },
  secondary: {
    style: GlassButtonStyle.SECONDARY,
  },
  tertiary: {
    style: GlassButtonStyle.TERTIARY,
  },
  danger: {
    style: GlassButtonStyle.DESTRUCTIVE,
  },
} as const;

export type GlassButtonVariant = keyof typeof GlassButtonVariants;
