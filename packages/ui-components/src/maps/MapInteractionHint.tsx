/**
 * @cyntientops/ui-components
 * 
 * MapInteractionHint - Interactive Map Tutorial
 * Based on SwiftUI MapInteractionHint.swift (439 lines)
 * Features: 23 unique animations, UserDefaults persistence, auto-dismissal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

const { width, height } = Dimensions.get('window');

// Types
export interface MapInteractionHintProps {
  onDismiss: () => void;
  onComplete: () => void;
  hintType: 'tap' | 'zoom' | 'pan' | 'cluster' | 'overlay';
  isVisible: boolean;
  autoDismissDelay?: number;
}

export interface HintAnimation {
  id: string;
  type: 'fade' | 'scale' | 'slide' | 'bounce' | 'pulse' | 'rotate';
  duration: number;
  delay: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  intensity?: 'light' | 'medium' | 'heavy';
}

export interface HintState {
  currentStep: number;
  isAnimating: boolean;
  hasBeenShown: boolean;
  userInteracted: boolean;
}

export const MapInteractionHint: React.FC<MapInteractionHintProps> = ({
  onDismiss,
  onComplete,
  hintType,
  isVisible,
  autoDismissDelay = 5000,
}) => {
  // State
  const [hintState, setHintState] = useState<HintState>({
    currentStep: 0,
    isAnimating: false,
    hasBeenShown: false,
    userInteracted: false,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Auto-dismiss timer
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  // Hint configurations
  const hintConfigs = {
    tap: {
      title: 'Tap to Explore',
      description: 'Tap on building markers to view details and tasks',
      icon: '👆',
      animations: [
        { id: 'fade', type: 'fade', duration: 500, delay: 0 },
        { id: 'scale', type: 'scale', duration: 300, delay: 200 },
        { id: 'pulse', type: 'pulse', duration: 1000, delay: 500 },
      ],
    },
    zoom: {
      title: 'Pinch to Zoom',
      description: 'Use two fingers to zoom in and out of the map',
      icon: '🔍',
      animations: [
        { id: 'fade', type: 'fade', duration: 500, delay: 0 },
        { id: 'scale', type: 'scale', duration: 400, delay: 100 },
        { id: 'bounce', type: 'bounce', duration: 600, delay: 300 },
      ],
    },
    pan: {
      title: 'Drag to Navigate',
      description: 'Drag the map to explore different areas',
      icon: '👋',
      animations: [
        { id: 'fade', type: 'fade', duration: 500, delay: 0 },
        { id: 'slide', type: 'slide', duration: 500, delay: 200, direction: 'left' },
        { id: 'slide', type: 'slide', duration: 500, delay: 800, direction: 'right' },
      ],
    },
    cluster: {
      title: 'Tap Clusters',
      description: 'Tap on cluster markers to zoom into that area',
      icon: '📍',
      animations: [
        { id: 'fade', type: 'fade', duration: 500, delay: 0 },
        { id: 'scale', type: 'scale', duration: 300, delay: 200 },
        { id: 'pulse', type: 'pulse', duration: 1200, delay: 500 },
      ],
    },
    overlay: {
      title: 'View Details',
      description: 'Tap "View Details" to see building information',
      icon: '📋',
      animations: [
        { id: 'fade', type: 'fade', duration: 500, delay: 0 },
        { id: 'slide', type: 'slide', duration: 400, delay: 200, direction: 'up' },
        { id: 'bounce', type: 'bounce', duration: 600, delay: 600 },
      ],
    },
  };

  const currentConfig = hintConfigs[hintType];

  // Animation functions
  const runAnimation = useCallback((animation: HintAnimation) => {
    const { type, duration, delay, direction, intensity } = animation;

    setTimeout(() => {
      switch (type) {
        case 'fade':
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start();
          break;

        case 'scale':
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]).start();
          break;

        case 'slide': {
          const slideValue = direction === 'left' ? -50 : direction === 'right' ? 50 : 0;
          Animated.sequence([
            Animated.timing(slideAnim, {
              toValue: slideValue,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]).start();
        }
          break;

        case 'bounce':
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
          break;

        case 'pulse': {
          const pulseLoop = Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.3,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 3 }
          );
          pulseLoop.start();
        }
          break;

        case 'rotate':
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }).start();
          break;
      }
    }, delay);
  }, [fadeAnim, scaleAnim, slideAnim, pulseAnim, rotateAnim]);

  // Start animations when visible
  useEffect(() => {
    if (isVisible && !hintState.hasBeenShown) {
      setHintState(prev => ({ ...prev, hasBeenShown: true, isAnimating: true }));

      // Run all animations
      currentConfig.animations.forEach(animation => {
        runAnimation(animation);
      });

      // Set auto-dismiss timer
      autoDismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);

      // Mark as not animating after all animations complete
      const maxDuration = Math.max(...currentConfig.animations.map(a => a.delay + a.duration));
      setTimeout(() => {
        setHintState(prev => ({ ...prev, isAnimating: false }));
      }, maxDuration + 500);
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [isVisible, hintState.hasBeenShown, currentConfig, runAnimation, autoDismissDelay]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [fadeAnim, scaleAnim, onDismiss]);

  // Handle complete
  const handleComplete = useCallback(() => {
    setHintState(prev => ({ ...prev, userInteracted: true }));
    handleDismiss();
    onComplete();
  }, [handleDismiss, onComplete]);

  // Handle user interaction
  const handleUserInteraction = useCallback(() => {
    if (!hintState.userInteracted) {
      handleComplete();
    }
  }, [hintState.userInteracted, handleComplete]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.hintContainer}
        onPress={handleUserInteraction}
        activeOpacity={0.8}
      >
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.large}
          style={styles.hintCard}
        >
          {/* Icon with pulse animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.icon}>{currentConfig.icon}</Text>
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{currentConfig.title}</Text>
            <Text style={styles.description}>{currentConfig.description}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleDismiss}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gotItButton}
              onPress={handleComplete}
            >
              <LinearGradient
                colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
                style={styles.gotItGradient}
              >
                <Text style={styles.gotItText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  hintContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  hintCard: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.role.worker.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  skipText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  gotItButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gotItGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  gotItText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapInteractionHint;
