/**
 * 🗺️ Map Interaction Hint Component
 * Purpose: Provides interactive hints and guidance for map interactions
 * Features: Gesture hints, tooltips, interactive tutorials
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { AdvancedGlassmorphism } from '../effects/AdvancedGlassmorphism';

const { width, height } = Dimensions.get('window');

export interface MapInteractionHintProps {
  type: 'pinch_zoom' | 'pan' | 'tap_marker' | 'long_press' | 'double_tap' | 'swipe' | 'custom';
  title: string;
  description: string;
  icon: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  autoHide?: boolean;
  autoHideDelay?: number;
  onDismiss?: () => void;
  onAction?: () => void;
  actionText?: string;
  showProgress?: boolean;
  progress?: number;
  style?: any;
}

export const MapInteractionHint: React.FC<MapInteractionHintProps> = ({
  type,
  title,
  description,
  icon,
  position = 'center',
  autoHide = true,
  autoHideDelay = 5000,
  onDismiss,
  onAction,
  actionText = 'Got it',
  showProgress = false,
  progress = 0,
  style,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progressValue, setProgressValue] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide timer
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
      setProgressValue(progress);
    }
  }, [progress, showProgress]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  const handleAction = () => {
    onAction?.();
    handleDismiss();
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: Spacing.xl, alignSelf: 'center' };
      case 'bottom':
        return { bottom: Spacing.xl, alignSelf: 'center' };
      case 'left':
        return { left: Spacing.md, alignSelf: 'center' };
      case 'right':
        return { right: Spacing.md, alignSelf: 'center' };
      case 'center':
      default:
        return { alignSelf: 'center', marginTop: height * 0.3 };
    }
  };

  const getInteractionAnimation = () => {
    switch (type) {
      case 'pinch_zoom':
        return (
          <View style={styles.gestureAnimation}>
            <View style={[styles.pinchGesture, styles.pinchStart]} />
            <View style={[styles.pinchGesture, styles.pinchEnd]} />
          </View>
        );
      case 'pan':
        return (
          <View style={styles.gestureAnimation}>
            <View style={styles.panGesture} />
          </View>
        );
      case 'tap_marker':
        return (
          <View style={styles.gestureAnimation}>
            <View style={styles.tapGesture} />
          </View>
        );
      case 'long_press':
        return (
          <View style={styles.gestureAnimation}>
            <View style={styles.longPressGesture} />
          </View>
        );
      case 'double_tap':
        return (
          <View style={styles.gestureAnimation}>
            <View style={styles.doubleTapGesture} />
          </View>
        );
      case 'swipe':
        return (
          <View style={styles.gestureAnimation}>
            <View style={styles.swipeGesture} />
          </View>
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <AdvancedGlassmorphism
        intensity="thick"
        cornerRadius={16}
        animated={true}
        style={styles.hintCard}
      >
        <LinearGradient
          colors={[Colors.glassOverlayLight, Colors.glassOverlayDark]}
          style={styles.gradientBackground}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {/* Gesture Animation */}
            {getInteractionAnimation()}

            {/* Progress Bar */}
            {showProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progressValue)}%</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
                  <Text style={styles.actionButtonText}>{actionText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </AdvancedGlassmorphism>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    maxWidth: width * 0.8,
  },
  hintCard: {
    overflow: 'hidden',
  },
  gradientBackground: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.info + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: 'bold',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  gestureAnimation: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pinchGesture: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.info,
  },
  pinchStart: {
    top: 10,
    left: 10,
  },
  pinchEnd: {
    bottom: 10,
    right: 10,
  },
  panGesture: {
    width: 60,
    height: 4,
    backgroundColor: Colors.info,
    borderRadius: 2,
  },
  tapGesture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.info + '40',
    borderWidth: 2,
    borderColor: Colors.info,
  },
  longPressGesture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.warning + '40',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  doubleTapGesture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.success + '40',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  swipeGesture: {
    width: 50,
    height: 4,
    backgroundColor: Colors.info,
    borderRadius: 2,
  },
  progressContainer: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.thin,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.info,
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  actionButtonText: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
});

export default MapInteractionHint;
