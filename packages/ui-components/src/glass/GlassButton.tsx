/**
 * GlassButton Component
 * Mirrors SwiftUI GlassButton with multiple styles and states
 */

import React from 'react';
import { Text, ViewStyle, TextStyle, Pressable, Animated, ActivityIndicator } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { GlassIntensity, getGlassConfig } from './GlassIntensity';

export enum GlassButtonStyle {
  primary = 'primary',
  secondary = 'secondary',
  outline = 'outline',
  ghost = 'ghost',
  destructive = 'destructive'
}

export enum GlassButtonSize {
  small = 'small',
  medium = 'medium',
  large = 'large'
}

export interface GlassButtonProps {
  title: string;
  onPress?: () => void;
  style?: GlassButtonStyle;
  size?: GlassButtonSize;
  intensity?: GlassIntensity;
  isFullWidth?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  style = GlassButtonStyle.primary,
  size = GlassButtonSize.medium,
  intensity = GlassIntensity.regular,
  isFullWidth = false,
  isDisabled = false,
  isLoading = false,
  testID
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const config = getGlassConfig(intensity);

  const handlePressIn = () => {
    if (isDisabled || isLoading) return;
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  };

  const handlePressOut = () => {
    if (isDisabled || isLoading) return;
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10
    }).start();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: getCornerRadius(),
      paddingHorizontal: getHorizontalPadding(),
      paddingVertical: getVerticalPadding(),
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: config.shadowOpacity,
      shadowRadius: config.shadowRadius,
      elevation: 4
    };

    if (isFullWidth) {
      baseStyle.width = '100%';
    }

    switch (style) {
      case GlassButtonStyle.primary:
        return {
          ...baseStyle,
          borderColor: `rgba(59, 130, 246, ${config.borderOpacity})`,
          backgroundColor: `rgba(59, 130, 246, ${config.opacity})`
        };
      case GlassButtonStyle.secondary:
        return {
          ...baseStyle,
          borderColor: `rgba(107, 114, 128, ${config.borderOpacity})`,
          backgroundColor: `rgba(107, 114, 128, ${config.opacity})`
        };
      case GlassButtonStyle.outline:
        return {
          ...baseStyle,
          borderColor: `rgba(59, 130, 246, ${config.borderOpacity * 2})`,
          backgroundColor: `rgba(255, 255, 255, ${config.opacity * 0.5})`
        };
      case GlassButtonStyle.ghost:
        return {
          ...baseStyle,
          borderColor: `rgba(255, 255, 255, ${config.borderOpacity})`,
          backgroundColor: `rgba(255, 255, 255, ${config.opacity * 0.3})`
        };
      case GlassButtonStyle.destructive:
        return {
          ...baseStyle,
          borderColor: `rgba(239, 68, 68, ${config.borderOpacity})`,
          backgroundColor: `rgba(239, 68, 68, ${config.opacity})`
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center'
    };

    switch (size) {
      case GlassButtonSize.small:
        return { ...baseStyle, fontSize: 12 };
      case GlassButtonSize.medium:
        return { ...baseStyle, fontSize: 14 };
      case GlassButtonSize.large:
        return { ...baseStyle, fontSize: 16 };
      default:
        return baseStyle;
    }
  };

  const getTextColor = (): string => {
    switch (style) {
      case GlassButtonStyle.primary:
      case GlassButtonStyle.destructive:
        return '#FFFFFF';
      case GlassButtonStyle.secondary:
        return '#FFFFFF';
      case GlassButtonStyle.outline:
        return '#3B82F6';
      case GlassButtonStyle.ghost:
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getCornerRadius = (): number => {
    switch (size) {
      case GlassButtonSize.small:
        return 6;
      case GlassButtonSize.medium:
        return 8;
      case GlassButtonSize.large:
        return 12;
      default:
        return 8;
    }
  };

  const getHorizontalPadding = (): number => {
    switch (size) {
      case GlassButtonSize.small:
        return 12;
      case GlassButtonSize.medium:
        return 16;
      case GlassButtonSize.large:
        return 20;
      default:
        return 16;
    }
  };

  const getVerticalPadding = (): number => {
    switch (size) {
      case GlassButtonSize.small:
        return 8;
      case GlassButtonSize.medium:
        return 12;
      case GlassButtonSize.large:
        return 16;
      default:
        return 12;
    }
  };

  const buttonStyle = getButtonStyle();
  const textStyle = getTextStyle();
  const textColor = getTextColor();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled || isLoading}
        style={({ pressed }) => [
          buttonStyle,
          {
            opacity: (isDisabled || isLoading) ? 0.5 : (pressed ? 0.8 : 1)
          }
        ]}
        testID={testID}
      >
        <BlurView
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          blurType="light"
          blurAmount={config.blur}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.1)"
        />
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          backgroundColor: `rgba(255, 255, 255, ${config.opacity})`
        }} />
        <View style={{ zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <Text style={[textStyle, { color: textColor }]}>
              {title}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};
