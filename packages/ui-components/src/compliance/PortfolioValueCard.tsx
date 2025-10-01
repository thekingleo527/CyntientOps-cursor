/**
 * 💰 Portfolio Value Card
 * Shows total portfolio market value and key metrics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard, GlassIntensity } from '../glass';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';

export interface PortfolioValueCardProps {
  marketValue: number;
  assessedValue: number;
  unitsResidential: number;
  unitsCommercial: number;
  totalSquareFeet: number;
  buildingCount: number;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

const StatItem: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>
      {typeof value === 'number' ? formatNumber(value) : value}
    </Text>
  </View>
);

export const PortfolioValueCard: React.FC<PortfolioValueCardProps> = ({
  marketValue,
  assessedValue,
  unitsResidential,
  unitsCommercial,
  totalSquareFeet,
  buildingCount
}) => {
  const marketPremium = Math.round(((marketValue - assessedValue) / assessedValue) * 100);

  return (
    <GlassCard intensity={GlassIntensity.Medium} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Value</Text>
        <Text style={styles.subtitle}>{buildingCount} Buildings • Real-time data</Text>
      </View>

      <View style={styles.valueSection}>
        <View style={styles.mainValue}>
          <Text style={styles.valueLabel}>Market Value</Text>
          <Text style={styles.value}>{formatCurrency(marketValue)}</Text>
        </View>

        <View style={styles.secondaryValue}>
          <Text style={styles.valueLabel}>Assessed Value (Tax)</Text>
          <Text style={styles.secondaryValueText}>{formatCurrency(assessedValue)}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatItem label="Residential Units" value={unitsResidential} />
        <StatItem label="Commercial Units" value={unitsCommercial} />
        <StatItem label="Total Sq Ft" value={formatNumber(totalSquareFeet)} />
        <StatItem
          label="Market Premium"
          value={`${marketPremium}%`}
          color={Colors.success}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  valueSection: {
    marginBottom: Spacing.lg,
  },
  mainValue: {
    marginBottom: Spacing.md,
  },
  valueLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 36,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
  },
  secondaryValue: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  secondaryValueText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
});
