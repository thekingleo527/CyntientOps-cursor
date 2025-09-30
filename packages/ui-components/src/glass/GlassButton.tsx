/**
 * GlassButton Component
 * 
 * Complete glass button implementation extracted from SwiftUI source
 * Mirrors: CyntientOps/Components/Glass/GlassButton.swift
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  HapticFeedback
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  GlassIntensity, 
  GLASS_INTENSITY_CONFIG, 
  GlassButtonStyle,
  GLASS_BUTTON_STYLES,
  GlassButtonSize,
  GLASS_BUTTON_SIZES,
  CORNER_RADIUS_VALUES,
  CornerRadius
} from '@cyntientops/design-tokens';

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: GlassButtonStyle;
  size?: GlassButtonSize;
  isFullWidth?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  icon?: string;
  cornerRadius?: CornerRadius;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  style = GlassButtonStyle.PRIMARY,
  size = GlassButtonSize.MEDIUM,
  isFullWidth = false,
  isDisabled = false,
  isLoading = false,
  icon,
  cornerRadius,
  containerStyle,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));
  const [loadingRotation] = useState(new Animated.Value(0));

  const styleConfig = GLASS_BUTTON_STYLES[style];
  const sizeConfig = GLASS_BUTTON_SIZES[size];
  const intensityConfig = GLASS_INTENSITY_CONFIG[styleConfig.intensity];
  const radius = cornerRadius ? CORNER_RADIUS_VALUES[cornerRadius] : sizeConfig.cornerRadius;

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotation.setValue(0);
    }
  }, [isLoading, loadingRotation]);

  const handlePressIn = () => {
    if (isDisabled || isLoading) return;
    
    setIsPressed(true);
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.96,
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
    if (isDisabled || isLoading) return;
    
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
    if (isDisabled || isLoading) return;
    
    // Haptic feedback
    HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const buttonStyle = [
    styles.container,
    {
      borderRadius: radius,
      paddingTop: sizeConfig.padding.top,
      paddingBottom: sizeConfig.padding.bottom,
      paddingLeft: sizeConfig.padding.left,
      paddingRight: sizeConfig.padding.right,
      backgroundColor: styleConfig.baseColor,
      shadowColor: styleConfig.baseColor,
      shadowOffset: { width: 0, height: isPressed ? 4 : 2 },
      shadowOpacity: isPressed ? 0.4 : 0.2,
      shadowRadius: isPressed ? 8 : 4,
      elevation: isPressed ? 8 : 4,
      width: isFullWidth ? '100%' : undefined,
    },
    containerStyle
  ];

  const textColor = isDisabled 
    ? `${styleConfig.textColor}80` // 50% opacity
    : styleConfig.textColor;

  const displayText = isLoading ? 'Loading...' : title;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled || isLoading}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled || isLoading }}
      style={buttonStyle}
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
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleValue }],
              opacity: opacityValue,
            }
          ]}
        >
          <View style={styles.contentRow}>
            {isLoading && (
              <Animated.View
                style={[
                  styles.loadingContainer,
                  {
                    transform: [{
                      rotate: loadingRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}
              >
                <ActivityIndicator
                  size="small"
                  color={textColor}
                />
              </Animated.View>
            )}
            
            {!isLoading && icon && (
              <Text style={[styles.icon, { color: textColor }]}>
                {icon}
              </Text>
            )}
            
            <Text
              style={[
                styles.text,
                {
                  fontSize: sizeConfig.fontSize,
                  color: textColor,
                },
                textStyle
              ]}
              numberOfLines={1}
            >
              {displayText}
            </Text>
            
            {isFullWidth && <View style={styles.spacer} />}
          </View>
        </Animated.View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    marginRight: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
});

export default GlassButton;