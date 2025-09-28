/**
 * 🎨 Glass Loading View
 * Mirrors: CyntientOps/Components/Glass/GlassLoadingView.swift
 * Purpose: Glassmorphism loading view with blur effects and transparency
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface GlassLoadingViewProps {
  message?: string;
  showBlur?: boolean;
  backgroundColor?: string;
  spinnerColor?: string;
  textColor?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
}

export const GlassLoadingView: React.FC<GlassLoadingViewProps> = ({
  message = 'Loading...',
  showBlur = true,
  backgroundColor = Colors.glass.regular,
  spinnerColor = Colors.status.info,
  textColor = Colors.text.primary,
  size = 'large',
  overlay = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderContent = () => (
    <View style={[
      styles.container,
      overlay && styles.overlay,
      { backgroundColor: overlay ? 'rgba(0, 0, 0, 0.5)' : 'transparent' },
    ]}>
      <Animated.View style={[
        styles.loadingCard,
        { backgroundColor },
        { transform: [{ scale: pulseAnim }] },
      ]}>
        <Animated.View style={[
          styles.spinnerContainer,
          { transform: [{ rotate: spin }] },
        ]}>
          <ActivityIndicator
            size={size}
            color={spinnerColor}
          />
        </Animated.View>
        
        <Text style={[
          styles.message,
          { color: textColor },
        ]}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );

  if (showBlur && !overlay) {
    return (
      <BlurView intensity={20} style={styles.blurContainer}>
        {renderContent()}
      </BlurView>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  loadingCard: {
    padding: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
    shadowColor: Colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinnerContainer: {
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default GlassLoadingView;