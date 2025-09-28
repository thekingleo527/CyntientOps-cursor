/**
 * NovaAvatar Component
 * Mirrors SwiftUI NovaAvatar with multiple states and animations
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { BlurView } from '@react-native-community/blur';

export enum NovaState {
  idle = 'idle',
  thinking = 'thinking',
  active = 'active',
  urgent = 'urgent',
  error = 'error'
}

export enum NovaSize {
  small = 'small',
  medium = 'medium',
  large = 'large'
}

export interface NovaAvatarProps {
  state?: NovaState;
  size?: NovaSize;
  isActive?: boolean;
  hasUrgentInsights?: boolean;
  isBusy?: boolean;
  onTap?: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export const NovaAvatar: React.FC<NovaAvatarProps> = ({
  state = NovaState.idle,
  size = NovaSize.medium,
  isActive = true,
  hasUrgentInsights = false,
  isBusy = false,
  onTap,
  onLongPress,
  testID
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Pulse animation for active state
    if (isActive && !isBusy) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true
          })
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [isActive, isBusy]);

  useEffect(() => {
    // Rotation animation for thinking state
    if (state === NovaState.thinking || isBusy) {
      const rotationAnimation = Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true
        })
      );
      rotationAnimation.start();

      return () => rotationAnimation.stop();
    }
  }, [state, isBusy]);

  useEffect(() => {
    // Glow animation for urgent state
    if (hasUrgentInsights || state === NovaState.urgent) {
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      );
      glowAnimation.start();

      return () => glowAnimation.stop();
    }
  }, [hasUrgentInsights, state]);

  const getSize = (): number => {
    switch (size) {
      case NovaSize.small:
        return 32;
      case NovaSize.medium:
        return 48;
      case NovaSize.large:
        return 64;
      default:
        return 48;
    }
  };

  const getStateColor = (): string => {
    switch (state) {
      case NovaState.idle:
        return '#3B82F6';
      case NovaState.thinking:
        return '#8B5CF6';
      case NovaState.active:
        return '#10B981';
      case NovaState.urgent:
        return '#EF4444';
      case NovaState.error:
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const getStateIcon = (): string => {
    switch (state) {
      case NovaState.idle:
        return '🧠';
      case NovaState.thinking:
        return '⚡';
      case NovaState.active:
        return '🎯';
      case NovaState.urgent:
        return '🚨';
      case NovaState.error:
        return '⚠️';
      default:
        return '🧠';
    }
  };

  const avatarSize = getSize();
  const stateColor = getStateColor();
  const stateIcon = getStateIcon();

  const avatarContent = (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]} testID={testID}>
      {/* Background Glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: avatarSize * 1.5,
            height: avatarSize * 1.5,
            backgroundColor: stateColor,
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      />

      {/* Main Avatar Circle */}
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderColor: stateColor,
            borderWidth: 2
          }
        ]}
      >
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType="light"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
        />
        <View style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: `rgba(255, 255, 255, 0.2)` }
        ]} />

        {/* State Icon */}
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }
            ]
          }}
        >
          <Text style={[styles.icon, { fontSize: avatarSize * 0.4 }]}>
            {stateIcon}
          </Text>
        </Animated.View>
      </View>

      {/* Urgent Indicator */}
      {(hasUrgentInsights || state === NovaState.urgent) && (
        <View
          style={[
            styles.urgentIndicator,
            {
              width: avatarSize * 0.3,
              height: avatarSize * 0.3,
              borderRadius: (avatarSize * 0.3) / 2,
              top: -avatarSize * 0.1,
              right: -avatarSize * 0.1
            }
          ]}
        >
          <Text style={[styles.urgentText, { fontSize: avatarSize * 0.15 }]}>
            !
          </Text>
        </View>
      )}
    </View>
  );

  if (onTap || onLongPress) {
    return (
      <Pressable
        onPress={onTap}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }]
          }
        ]}
      >
        {avatarContent}
      </Pressable>
    );
  }

  return avatarContent;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  glow: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.3
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  icon: {
    zIndex: 1
  },
  urgentIndicator: {
    position: 'absolute',
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3
  },
  urgentText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  }
});
