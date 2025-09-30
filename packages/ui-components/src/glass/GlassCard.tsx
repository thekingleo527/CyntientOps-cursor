/**
 * GlassCard Component
 * 
 * Complete glass card implementation extracted from SwiftUI source
 * Mirrors: CyntientOps/Components/Glass/GlassCard.swift
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
  GestureResponderEvent
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  GlassIntensity, 
  GLASS_INTENSITY_CONFIG, 
  CORNER_RADIUS_VALUES, 
  CornerRadius,
  GLASS_OVERLAYS 
} from '@cyntientops/design-tokens';

export interface GlassCardProps {
  children: React.ReactNode;
  intensity?: GlassIntensity;
  cornerRadius?: CornerRadius;
  padding?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = GlassIntensity.REGULAR,
  cornerRadius = CornerRadius.MEDIUM,
  padding = 16,
  onPress,
  onLongPress,
  disabled = false,
  style,
  contentStyle,
  testID
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));

  const intensityConfig = GLASS_INTENSITY_CONFIG[intensity];
  const radius = CORNER_RADIUS_VALUES[cornerRadius];
  const overlay = GLASS_OVERLAYS.regular;

  const handlePressIn = () => {
    if (disabled) return;
    
    setIsPressed(true);
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    setIsPressed(false);
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    onPress();
  };

  const handleLongPress = () => {
    if (disabled || !onLongPress) return;
    onLongPress();
  };

  const cardStyle = [
    styles.container,
    {
      borderRadius: radius,
      padding,
      backgroundColor: overlay.background,
      borderColor: overlay.stroke,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: intensityConfig.shadowRadius,
      elevation: 8,
    },
    style
  ];

  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={cardStyle}
      >
        <BlurView
          intensity={intensityConfig.blurRadius}
          tint="dark"
          style={[
            styles.blurView,
            {
              borderRadius: radius,
            }
          ]}
        >
          {content}
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        cardStyle,
        {
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        }
      ]}
      testID={testID}
    >
      <BlurView
        intensity={intensityConfig.blurRadius}
        tint="dark"
        style={[
          styles.blurView,
          {
            borderRadius: radius,
          }
        ]}
      >
        {content}
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});

export default GlassCard;