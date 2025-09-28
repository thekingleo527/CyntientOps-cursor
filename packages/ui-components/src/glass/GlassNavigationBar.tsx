/**
 * 🎨 Glass Navigation Bar
 * Mirrors: CyntientOps/Components/Glass/GlassNavigationBar.swift
 * Purpose: Glassmorphism navigation bar with blur effects and transparency
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface GlassNavigationBarProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: string;
    onPress: () => void;
  };
  rightActions?: Array<{
    icon: string;
    onPress: () => void;
  }>;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const GlassNavigationBar: React.FC<GlassNavigationBarProps> = ({
  title,
  subtitle,
  leftAction,
  rightActions = [],
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const renderContent = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.content}>
        {leftAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={leftAction.onPress}
          >
            <Text style={styles.actionIcon}>{leftAction.icon}</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        
        <View style={styles.rightActions}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 44,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  actionIcon: {
    fontSize: 20,
    color: Colors.text.primary,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
  },
});

export default GlassNavigationBar;
