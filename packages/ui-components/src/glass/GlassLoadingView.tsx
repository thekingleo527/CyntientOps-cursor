/**
 * GlassLoadingView Component
 * Mirrors SwiftUI GlassLoadingView with glass-styled loading states
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { GlassIntensity, getGlassConfig } from './GlassIntensity';

export interface GlassLoadingViewProps {
  message?: string;
  intensity?: GlassIntensity;
  cornerRadius?: number;
  size?: 'small' | 'large';
  color?: string;
  testID?: string;
}

export const GlassLoadingView: React.FC<GlassLoadingViewProps> = ({
  message = 'Loading...',
  intensity = GlassIntensity.regular,
  cornerRadius = 12,
  size = 'large',
  color = '#3B82F6',
  testID
}) => {
  const config = getGlassConfig(intensity);

  return (
    <View style={[styles.container, { borderRadius: cornerRadius }]} testID={testID}>
      <BlurView
        style={StyleSheet.absoluteFillObject}
        blurType="light"
        blurAmount={config.blur}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
      />
      <View style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: `rgba(255, 255, 255, ${config.opacity})` }
      ]} />
      <View style={[
        StyleSheet.absoluteFillObject,
        {
          borderWidth: 1,
          borderColor: `rgba(255, 255, 255, ${config.borderOpacity})`,
          borderRadius: cornerRadius
        }
      ]} />
      
      <View style={styles.content}>
        <ActivityIndicator
          size={size}
          color={color}
          style={styles.spinner}
        />
        <Text style={[styles.message, { color: '#FFFFFF' }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
    overflow: 'hidden'
  },
  content: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    marginBottom: 12
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  }
});
