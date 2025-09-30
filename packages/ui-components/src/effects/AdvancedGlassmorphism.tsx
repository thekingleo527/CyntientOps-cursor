/**
 * 🎨 Advanced Glassmorphism Effects
 * Purpose: Enhanced visual effects with dynamic blur, gradients, and animations
 * Features: Dynamic intensity, animated particles, holographic overlays
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@cyntientops/design-tokens';

const { width, height } = Dimensions.get('window');

export interface AdvancedGlassmorphismProps {
  intensity?: 'ultra-thin' | 'thin' | 'regular' | 'thick' | 'ultra-thick';
  cornerRadius?: number;
  animated?: boolean;
  holographic?: boolean;
  particleEffect?: boolean;
  children?: React.ReactNode;
  style?: any;
}

export const AdvancedGlassmorphism: React.FC<AdvancedGlassmorphismProps> = ({
  intensity = 'regular',
  cornerRadius = 16,
  animated = false,
  holographic = false,
  particleEffect = false,
  children,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const holographicAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();

      return () => shimmerAnimation.stop();
    }
  }, [animated, shimmerAnim]);

  useEffect(() => {
    if (particleEffect) {
      const particleAnimation = Animated.loop(
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      particleAnimation.start();

      return () => particleAnimation.stop();
    }
  }, [particleEffect, particleAnim]);

  useEffect(() => {
    if (holographic) {
      const holographicAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(holographicAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(holographicAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      holographicAnimation.start();

      return () => holographicAnimation.stop();
    }
  }, [holographic, holographicAnim]);

  const getIntensityConfig = () => {
    switch (intensity) {
      case 'ultra-thin':
        return { blur: 5, opacity: 0.1, borderWidth: 0.5 };
      case 'thin':
        return { blur: 10, opacity: 0.15, borderWidth: 1 };
      case 'regular':
        return { blur: 20, opacity: 0.2, borderWidth: 1.5 };
      case 'thick':
        return { blur: 30, opacity: 0.25, borderWidth: 2 };
      case 'ultra-thick':
        return { blur: 40, opacity: 0.3, borderWidth: 2.5 };
      default:
        return { blur: 20, opacity: 0.2, borderWidth: 1.5 };
    }
  };

  const config = getIntensityConfig();

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const particleOpacity = particleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  const holographicOpacity = holographicAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.3, 0.1],
  });

  return (
    <View style={[styles.container, { borderRadius: cornerRadius }, style]}>
      {/* Base Glass Effect */}
      <BlurView
        intensity={config.blur}
        style={[styles.blurView, { borderRadius: cornerRadius }]}
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            `${Colors.glassOverlayLight}${Math.floor(config.opacity * 255).toString(16).padStart(2, '0')}`,
            `${Colors.glassOverlayDark}${Math.floor(config.opacity * 255).toString(16).padStart(2, '0')}`,
          ]}
          style={[styles.gradientOverlay, { borderRadius: cornerRadius }]}
        />

        {/* Animated Shimmer Effect */}
        {animated && (
          <Animated.View
            style={[
              styles.shimmerEffect,
              {
                transform: [{ translateX: shimmerTranslateX }],
                borderRadius: cornerRadius,
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        )}

        {/* Particle Effect */}
        {particleEffect && (
          <View style={styles.particleContainer}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: particleOpacity,
                    transform: [
                      {
                        scale: particleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Holographic Effect */}
        {holographic && (
          <Animated.View
            style={[
              styles.holographicOverlay,
              {
                opacity: holographicOpacity,
                borderRadius: cornerRadius,
              },
            ]}
          >
            <LinearGradient
              colors={[
                'rgba(0,255,255,0.1)',
                'rgba(255,0,255,0.1)',
                'rgba(0,255,255,0.1)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.holographicGradient}
            />
          </Animated.View>
        )}

        {/* Border Effect */}
        <View
          style={[
            styles.borderEffect,
            {
              borderWidth: config.borderWidth,
              borderRadius: cornerRadius,
            },
          ]}
        />

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.info,
  },
  holographicOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  holographicGradient: {
    flex: 1,
  },
  borderEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default AdvancedGlassmorphism;
