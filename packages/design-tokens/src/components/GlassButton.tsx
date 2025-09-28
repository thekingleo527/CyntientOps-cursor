/**
 * @cyntientops/design-tokens
 * 
 * GlassButton Component
 * Glass morphism button component
 */

import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, ComponentShadows, Typography } from '../tokens';

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.role.worker.primary,
          borderColor: Colors.role.worker.primary,
          textColor: Colors.text.primary,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.glass.regular,
          borderColor: Colors.border.medium,
          textColor: Colors.text.primary,
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          borderColor: Colors.border.light,
          textColor: Colors.text.secondary,
        };
      case 'danger':
        return {
          backgroundColor: Colors.status.error,
          borderColor: Colors.status.error,
          textColor: Colors.text.primary,
        };
      default:
        return {
          backgroundColor: Colors.role.worker.primary,
          borderColor: Colors.role.worker.primary,
          textColor: Colors.text.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          fontSize: Typography.labelMedium.fontSize,
          fontWeight: Typography.labelMedium.fontWeight,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          fontSize: Typography.titleMedium.fontSize,
          fontWeight: Typography.titleMedium.fontWeight,
        };
      default: // medium
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          fontSize: Typography.labelLarge.fontSize,
          fontWeight: Typography.labelLarge.fontWeight,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyle: ViewStyle = {
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target
    ...ComponentShadows.button,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && {
      opacity: 0.5,
    }),
    ...style,
  };

  const textStyleCombined: TextStyle = {
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    fontWeight: sizeStyles.fontWeight,
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

// Button variants for easy access
export const GlassButtonVariants = {
  primary: {
    variant: 'primary' as const,
  },
  secondary: {
    variant: 'secondary' as const,
  },
  tertiary: {
    variant: 'tertiary' as const,
  },
  danger: {
    variant: 'danger' as const,
  },
} as const;

export type GlassButtonVariant = keyof typeof GlassButtonVariants;
