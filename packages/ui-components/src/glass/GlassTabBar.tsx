/**
 * GlassTabBar Component
 * 
 * Complete glass tab bar implementation extracted from SwiftUI source
 * Mirrors: CyntientOps/Components/Glass/GlassTabBar.swift
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  GlassIntensity, 
  GLASS_INTENSITY_CONFIG, 
  CORNER_RADIUS_VALUES, 
  CornerRadius,
  GLASS_OVERLAYS
} from '@cyntientops/design-tokens';

const { width: screenWidth } = Dimensions.get('window');

export interface GlassTabItem {
  title: string;
  icon: string;
  selectedIcon: string;
}

export interface GlassTabBarProps {
  selectedTab: number;
  onTabChange: (index: number) => void;
  tabs: GlassTabItem[];
  intensity?: GlassIntensity;
  cornerRadius?: CornerRadius;
  style?: ViewStyle;
  testID?: string;
}

export const GlassTabBar: React.FC<GlassTabBarProps> = ({
  selectedTab,
  onTabChange,
  tabs,
  intensity = GlassIntensity.REGULAR,
  cornerRadius = CornerRadius.LARGE,
  style,
  testID
}) => {
  const [animatedTab, setAnimatedTab] = useState(selectedTab);
  const [tabWidths, setTabWidths] = useState<{ [key: number]: number }>({});

  const intensityConfig = GLASS_INTENSITY_CONFIG[intensity];
  const radius = CORNER_RADIUS_VALUES[cornerRadius];
  const overlay = GLASS_OVERLAYS.regular;

  useEffect(() => {
    setAnimatedTab(selectedTab);
  }, [selectedTab]);

  const handleTabPress = (index: number) => {
    onTabChange(index);
    setAnimatedTab(index);
  };

  const getTabColor = (index: number): string => {
    if (animatedTab === index) {
      return '#007AFF'; // Selected tab uses accent color
    } else {
      return 'rgba(255, 255, 255, 0.6)'; // Unselected tabs use muted text
    }
  };

  const tabBarStyle = [
    styles.container,
    {
      borderRadius: radius,
      backgroundColor: overlay.background,
      borderColor: overlay.stroke,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 15,
    },
    style
  ];

  return (
    <View style={styles.wrapper} testID={testID}>
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
        <View style={tabBarStyle}>
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tabButton}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
                testID={`${testID}-tab-${index}`}
                accessibilityLabel={`${tab.title} tab`}
                accessibilityHint={animatedTab === index ? 'Currently selected' : 'Double tap to select'}
                accessibilityRole="button"
                accessibilityState={{ selected: animatedTab === index }}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  setTabWidths(prev => ({ ...prev, [index]: width }));
                }}
              >
                <View style={styles.tabContent}>
                  {animatedTab === index && (
                    <View style={styles.selectedTabBackground} />
                  )}
                  
                  <View style={styles.tabIconContainer}>
                    <Text style={[styles.tabIcon, { color: getTabColor(index) }]}>
                      {animatedTab === index ? tab.selectedIcon : tab.icon}
                    </Text>
                  </View>
                  
                  <Text style={[styles.tabTitle, { color: getTabColor(index) }]}>
                    {tab.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  blurView: {
    overflow: 'hidden',
  },
  container: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedTabBackground: {
    position: 'absolute',
    top: -12,
    left: -8,
    right: -8,
    bottom: -12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabIconContainer: {
    marginBottom: 6,
  },
  tabIcon: {
    fontSize: 22,
    fontWeight: '600',
  },
  tabTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default GlassTabBar;