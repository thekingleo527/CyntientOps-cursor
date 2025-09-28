/**
 * 🎨 Glass Tab Bar
 * Mirrors: CyntientOps/Components/Glass/GlassTabBar.swift
 * Purpose: Glassmorphism tab bar with blur effects and transparency
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface GlassTabBarProps {
  tabs: Array<{
    key: string;
    label: string;
    icon: string;
    badge?: number;
  }>;
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const GlassTabBar: React.FC<GlassTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.content}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => onTabPress(tab.key)}
          >
            <View style={styles.tabContent}>
              <Text style={[
                styles.tabIcon,
                activeTab === tab.key && styles.activeTabIcon,
              ]}>
                {tab.icon}
              </Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}>
                {tab.label}
              </Text>
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (showBlur) {
    return (
      <BlurView intensity={20} style={styles.blurContainer}>
        {renderContent()}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginHorizontal: Spacing.xs,
  },
  activeTab: {
    backgroundColor: Colors.glass.overlay,
  },
  tabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  activeTabIcon: {
    color: Colors.status.info,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: Colors.status.info,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
});

export default GlassTabBar;
