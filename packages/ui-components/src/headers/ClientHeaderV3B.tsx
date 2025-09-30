/**
 * 🏢 Client Header V3B
 * Mirrors: CyntientOps/Views/Components/Headers/ClientHeaderV3B.swift
 * Purpose: Client dashboard header with portfolio info and Nova AI integration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';

export interface ClientHeaderV3BProps {
  clientName: string;
  portfolioCount: number;
  complianceScore: number;
  hasAlerts: boolean;
  onRoute: (route: ClientHeaderRoute) => void;
}

export enum ClientHeaderRoute {
  mainMenu = 'mainMenu',
  profile = 'profile',
  novaChat = 'novaChat',
  alerts = 'alerts',
}

export const ClientHeaderV3B: React.FC<ClientHeaderV3BProps> = ({
  clientName,
  portfolioCount,
  complianceScore,
  hasAlerts,
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
        style={styles.novaContainer}
        onPress={() => onRoute(ClientHeaderRoute.novaChat)}
        activeOpacity={0.7}
      >
        <View style={styles.novaAvatar}>
          <Text style={styles.novaInitials}>N</Text>
        </View>
        <Text style={styles.novaLabel}>Nova AI</Text>
      </TouchableOpacity>

      {/* Right: Client Profile Pill */}
      <TouchableOpacity
        style={styles.clientPill}
        onPress={() => onRoute(ClientHeaderRoute.profile)}
        activeOpacity={0.7}
      >
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{clientName}</Text>
          <View style={styles.metricsRow}>
            <Text style={styles.metric}>
              {portfolioCount} Buildings
            </Text>
            <Text style={styles.metric}>
              {Math.round(complianceScore)}% Compliance
            </Text>
          </View>
        </View>
        {hasAlerts && (
          <View style={styles.alertIndicator}>
            <View style={styles.alertDot} />
          </View>
        )}
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
  clientPill: {
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
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  metric: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
    marginRight: Spacing.sm,
  },
  alertIndicator: {
    marginLeft: Spacing.sm,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.warning,
  },
});

export default ClientHeaderV3B;
