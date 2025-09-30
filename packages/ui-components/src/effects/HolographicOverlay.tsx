/**
 * 🌟 Holographic Overlay Effects
 * Purpose: Advanced holographic visual effects for Nova AI and premium features
 * Features: Animated grids, particle systems, light refraction effects
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@cyntientops/design-tokens';

const { width, height } = Dimensions.get('window');

export interface HolographicOverlayProps {
  intensity?: 'subtle' | 'medium' | 'intense';
  animationSpeed?: 'slow' | 'normal' | 'fast';
  gridPattern?: boolean;
  particleSystem?: boolean;
  lightRefraction?: boolean;
  children?: React.ReactNode;
  style?: any;
}

export const HolographicOverlay: React.FC<HolographicOverlayProps> = ({
  intensity = 'medium',
  animationSpeed = 'normal',
  gridPattern = true,
  particleSystem = true,
  lightRefraction = true,
  children,
  style,
}) => {
  const gridAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const refractionAnim = useRef(new Animated.Value(0)).current;

  const getSpeedConfig = () => {
    switch (animationSpeed) {
      case 'slow':
        return { grid: 4000, particle: 6000, refraction: 5000 };
      case 'normal':
        return { grid: 2000, particle: 3000, refraction: 2500 };
      case 'fast':
        return { grid: 1000, particle: 1500, refraction: 1250 };
      default:
        return { grid: 2000, particle: 3000, refraction: 2500 };
    }
  };

  const getIntensityConfig = () => {
    switch (intensity) {
      case 'subtle':
        return { opacity: 0.1, scale: 0.8, blur: 2 };
      case 'medium':
        return { opacity: 0.2, scale: 1.0, blur: 4 };
      case 'intense':
        return { opacity: 0.3, scale: 1.2, blur: 6 };
      default:
        return { opacity: 0.2, scale: 1.0, blur: 4 };
    }
  };

  const speedConfig = getSpeedConfig();
  const intensityConfig = getIntensityConfig();

  useEffect(() => {
    const gridAnimation = Animated.loop(
      Animated.timing(gridAnim, {
        toValue: 1,
        duration: speedConfig.grid,
        useNativeDriver: true,
      })
    );
    gridAnimation.start();

    return () => gridAnimation.stop();
  }, [gridAnim, speedConfig.grid]);

  useEffect(() => {
    const particleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: speedConfig.particle,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 0,
          duration: speedConfig.particle,
          useNativeDriver: true,
        }),
      ])
    );
    particleAnimation.start();

    return () => particleAnimation.stop();
  }, [particleAnim, speedConfig.particle]);

  useEffect(() => {
    const refractionAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(refractionAnim, {
          toValue: 1,
          duration: speedConfig.refraction,
          useNativeDriver: true,
        }),
        Animated.timing(refractionAnim, {
          toValue: 0,
          duration: speedConfig.refraction,
          useNativeDriver: true,
        }),
      ])
    );
    refractionAnimation.start();

    return () => refractionAnimation.stop();
  }, [refractionAnim, speedConfig.refraction]);

  const gridTranslateY = gridAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const particleOpacity = particleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.8, 0.2],
  });

  const refractionScale = refractionAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Base Holographic Background */}
      <LinearGradient
        colors={[
          'rgba(0,255,255,0.05)',
          'rgba(255,0,255,0.05)',
          'rgba(0,255,255,0.05)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.baseGradient}
      />

      {/* Grid Pattern */}
      {gridPattern && (
        <Animated.View
          style={[
            styles.gridContainer,
            {
              opacity: intensityConfig.opacity,
              transform: [{ translateY: gridTranslateY }],
            },
          ]}
        >
          {Array.from({ length: 20 }).map((_, index) => (
            <View
              key={`horizontal-${index}`}
              style={[
                styles.gridLine,
                styles.horizontalLine,
                {
                  top: (index * height) / 20,
                  opacity: 0.3,
                },
              ]}
            />
          ))}
          {Array.from({ length: 15 }).map((_, index) => (
            <View
              key={`vertical-${index}`}
              style={[
                styles.gridLine,
                styles.verticalLine,
                {
                  left: (index * width) / 15,
                  opacity: 0.3,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* Particle System */}
      {particleSystem && (
        <View style={styles.particleContainer}>
          {Array.from({ length: 12 }).map((_, index) => (
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
                        outputRange: [0.5, 1.5],
                      }),
                    },
                    {
                      rotate: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Light Refraction Effect */}
      {lightRefraction && (
        <Animated.View
          style={[
            styles.refractionContainer,
            {
              opacity: intensityConfig.opacity,
              transform: [{ scale: refractionScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.1)',
              'rgba(0,255,255,0.2)',
              'rgba(255,0,255,0.2)',
              'rgba(255,255,255,0.1)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.refractionGradient}
          />
        </Animated.View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0,255,255,0.3)',
  },
  horizontalLine: {
    width: '100%',
    height: 1,
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,255,255,0.6)',
  },
  refractionContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  refractionGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default HolographicOverlay;
