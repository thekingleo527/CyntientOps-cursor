/**
 * @cyntientops/ui-components
 * 
 * Glass Components
 * Mock implementations for development
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

// Export additional properties that components expect
export const GlassIntensity = {
  // lowercase keys
  ultraThin: 'ultraThin',
  thin: 'thin',
  regular: 'regular',
  medium: 'medium',
  thick: 'thick',
  // uppercase aliases for compatibility with design-tokens enums
  ULTRA_THIN: 'ultraThin',
  THIN: 'thin',
  REGULAR: 'regular',
  THICK: 'thick',
} as const;

export const CornerRadius = {
  // lowercase keys
  small: 8,
  medium: 12,
  large: 16,
  card: 12,
  // uppercase aliases for compatibility with design-tokens enums
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 16,
  CARD: 12,
} as const;

// Mock GlassCard component with intensity and cornerRadius support
export const GlassCard: React.FC<{ 
  children: React.ReactNode; 
  style?: any; 
  intensity?: string;
  cornerRadius?: string | number;
}> = ({ children, style, intensity, cornerRadius }) => {
  const getIntensityStyle = (intensity?: string) => {
    switch (intensity) {
      case 'ultraThin': return { backgroundColor: 'rgba(255, 255, 255, 0.05)' };
      case 'thin': return { backgroundColor: 'rgba(255, 255, 255, 0.1)' };
      case 'regular': return { backgroundColor: 'rgba(255, 255, 255, 0.15)' };
      case 'medium': return { backgroundColor: 'rgba(255, 255, 255, 0.2)' };
      case 'thick': return { backgroundColor: 'rgba(255, 255, 255, 0.25)' };
      default: return { backgroundColor: 'rgba(255, 255, 255, 0.15)' };
    }
  };

  const getCornerRadius = (cornerRadius?: string | number) => {
    if (typeof cornerRadius === 'number') return cornerRadius;
    if (typeof cornerRadius === 'string') {
      switch (cornerRadius) {
        case 'small': return 8;
        case 'medium': return 12;
        case 'large': return 16;
        case 'card': return 12;
        default: return 12;
      }
    }
    return 12;
  };

  return (
    <View style={[
      styles.glassCard, 
      getIntensityStyle(intensity),
      { borderRadius: getCornerRadius(cornerRadius) },
      style
    ]}>
      {children}
    </View>
  );
};

// Mock GlassButton component
export const GlassButton: React.FC<{ children: React.ReactNode; onPress?: () => void; style?: any }> = ({ children, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.glassButton, style]}>
    <Text style={styles.glassButtonText}>{children}</Text>
  </TouchableOpacity>
);

// Mock GlassOverlay component
export const GlassOverlay: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[styles.glassOverlay, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    alignItems: 'center',
  },
  glassButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default {
  GlassCard,
  GlassButton,
  GlassOverlay,
  GlassIntensity,
  CornerRadius,
};
