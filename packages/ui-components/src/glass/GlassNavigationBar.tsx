/**
 * GlassNavigationBar Component
 * 
 * Complete glass navigation bar implementation extracted from SwiftUI source
 * Mirrors: CyntientOps/Components/Glass/GlassNavigationBar.swift
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
  SafeAreaView,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  GlassIntensity, 
  GLASS_INTENSITY_CONFIG, 
  GLASS_OVERLAYS
} from '@cyntientops/design-tokens';

export interface GlassNavigationBarProps {
  title: string;
  subtitle?: string;
  showMapButton?: boolean;
  onMapReveal?: () => void;
  showBackButton?: boolean;
  onBackTap?: () => void;
  actions?: React.ReactNode;
  intensity?: GlassIntensity;
  style?: ViewStyle;
  testID?: string;
}

export const GlassNavigationBar: React.FC<GlassNavigationBarProps> = ({
  title,
  subtitle,
  showMapButton = false,
  onMapReveal,
  showBackButton = false,
  onBackTap,
  actions,
  intensity = GlassIntensity.THICK,
  style,
  testID
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const intensityConfig = GLASS_INTENSITY_CONFIG[intensity];
  const overlay = GLASS_OVERLAYS.regular;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleValue, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const navigationBarStyle = [
    styles.container,
    {
      backgroundColor: overlay.background,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
    },
    style
  ];

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <BlurView
        intensity={intensityConfig.blurRadius}
        tint="dark"
        style={styles.blurView}
      >
        <View style={navigationBarStyle}>
          <View style={styles.content}>
            <View style={styles.leftSection}>
              {showBackButton && (
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={onBackTap}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.7}
                  testID={`${testID}-back`}
                  accessibilityLabel="Back"
                  accessibilityRole="button"
                >
                  <Animated.View
                    style={[
                      styles.buttonContainer,
                      {
                        transform: [{ scale: scaleValue }],
                      }
                    ]}
                  >
                    <Text style={styles.buttonIcon}>‹</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
              
              {showMapButton && (
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={onMapReveal}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.7}
                  testID={`${testID}-map`}
                  accessibilityLabel="Show map"
                  accessibilityRole="button"
                >
                  <Animated.View
                    style={[
                      styles.buttonContainer,
                      {
                        transform: [{ scale: scaleValue }],
                      }
                    ]}
                  >
                    <Text style={styles.buttonIcon}>🗺️</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.titleSection}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>

            <View style={styles.rightSection}>
              {actions}
            </View>
          </View>
        </View>
      </BlurView>
    </SafeAreaView>
  );
};

export interface GlassNavigationActionProps {
  icon: string;
  onPress: () => void;
  isDestructive?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const GlassNavigationAction: React.FC<GlassNavigationActionProps> = ({
  icon,
  onPress,
  isDestructive = false,
  testID,
  accessibilityLabel
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(scaleValue, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const buttonColor = isDestructive ? '#FF3B30' : '#FFFFFF';

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.actionButtonContainer,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: isDestructive ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            transform: [{ scale: scaleValue }],
          }
        ]}
      >
        <Text style={[styles.actionButtonIcon, { color: buttonColor }]}>
          {icon}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  blurView: {
    overflow: 'hidden',
  },
  container: {
    borderBottomWidth: 0.5,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationButton: {
    marginRight: 8,
  },
  buttonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  actionButton: {
    marginLeft: 12,
  },
  actionButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export default GlassNavigationBar;