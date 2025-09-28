/**
 * 👷 Worker Header V3B
 * Mirrors: CyntientOps/Views/Components/Headers/WorkerHeaderV3B.swift
 * Purpose: Worker dashboard header with profile pill and Nova AI integration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';

export interface WorkerHeaderV3BProps {
  name: string;
  initials: string;
  photoURL?: string;
  nextTaskName?: string;
  showClockPill: boolean;
  isNovaProcessing: boolean;
  onRoute: (route: WorkerHeaderRoute) => void;
}

export enum WorkerHeaderRoute {
  mainMenu = 'mainMenu',
  profile = 'profile',
  clockAction = 'clockAction',
  novaChat = 'novaChat',
}

export const WorkerHeaderV3B: React.FC<WorkerHeaderV3BProps> = ({
  name,
  initials,
  photoURL,
  nextTaskName,
  showClockPill,
  isNovaProcessing,
  onRoute,
}) => {
  return (
    <View style={styles.container}>
      {/* Left: Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>CyntientOps</Text>
      </View>

      {/* Center: Nova AI */}
      <TouchableOpacity
        style={[styles.novaContainer, isNovaProcessing && styles.novaProcessing]}
        onPress={() => onRoute(WorkerHeaderRoute.novaChat)}
        activeOpacity={0.7}
      >
        <View style={styles.novaAvatar}>
          <Text style={styles.novaInitials}>N</Text>
        </View>
        <Text style={styles.novaLabel}>Nova AI</Text>
        {isNovaProcessing && (
          <View style={styles.processingIndicator}>
            <View style={styles.processingDot} />
          </View>
        )}
      </TouchableOpacity>

      {/* Right: Profile Pill */}
      <TouchableOpacity
        style={styles.profilePill}
        onPress={() => onRoute(WorkerHeaderRoute.profile)}
        activeOpacity={0.7}
      >
        <View style={styles.profileAvatar}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileImage} />
          ) : (
            <Text style={styles.profileInitials}>{initials}</Text>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          {nextTaskName && (
            <Text style={styles.nextTask} numberOfLines={1}>
              Next: {nextTaskName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.glass.regular,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  novaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glass.regular,
  },
  novaProcessing: {
    borderColor: Colors.status.info,
    backgroundColor: Colors.status.info + '20',
  },
  novaAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.status.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  novaInitials: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  novaLabel: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  processingIndicator: {
    marginLeft: Spacing.xs,
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.status.info,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.thin,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glass.regular,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileInitials: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  nextTask: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
});

export default WorkerHeaderV3B;
