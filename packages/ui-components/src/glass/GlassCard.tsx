/**
 * GlassCard Component
 * Mirrors SwiftUI GlassCard with proper glass morphism effects
 */

import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { GlassIntensity, getGlassConfig } from './GlassIntensity';

export interface GlassCardProps {
  children: React.ReactNode;
  intensity?: GlassIntensity;
  cornerRadius?: number;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = GlassIntensity.regular,
  cornerRadius = 12,
  padding = 16,
  onPress,
  style,
  disabled = false,
  testID
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const config = getGlassConfig(intensity);

  const handlePressIn = () => {
    if (disabled) return;
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  };

  const cardStyle: ViewStyle = {
    borderRadius: cornerRadius,
    padding,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `rgba(255, 255, 255, ${config.borderOpacity})`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: config.shadowOpacity,
    shadowRadius: config.shadowRadius,
    elevation: 4,
    ...style
  };

  const content = (
    <View style={cardStyle} testID={testID}>
      <BlurView
        style={StyleSheet.absoluteFillObject}
        blurType="light"
        blurAmount={config.blur}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(255, 255, 255, ${config.opacity})` }]} />
      <View style={{ zIndex: 1 }}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.8 : 1
            }
          ]}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {content}
    </Animated.View>
  );
};
