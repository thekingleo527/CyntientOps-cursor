/**
 * 🏠 Property Overview Card (for Clients)
 * Shows client their building's details and value
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard, GlassIntensity } from '../glass';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';

export interface PropertyOverviewCardProps {
  address: string;
  marketValue: number;
  assessedValue: number;
  yearBuilt: string;
  yearRenovated?: string;
  units: number;
  complianceScore: number;
  violationsCount: number;
  historicDistrict?: string;
  neighborhood: string;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return Colors.success;
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return Colors.error;
};

const getScoreStatus = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Attention';
};

const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
  </View>
);

export const PropertyOverviewCard: React.FC<PropertyOverviewCardProps> = ({
  address,
  marketValue,
  assessedValue,
  yearBuilt,
  yearRenovated,
  units,
  complianceScore,
  violationsCount,
  historicDistrict,
  neighborhood
}) => {
  const scoreColor = getScoreColor(complianceScore);
  const scoreStatus = getScoreStatus(complianceScore);

  return (
    <GlassCard intensity={GlassIntensity.Medium} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Property</Text>
        <Text style={styles.address}>{address}</Text>
        <Text style={styles.neighborhood}>{neighborhood}</Text>
      </View>

      {historicDistrict && (
        <View style={styles.historicBadge}>
          <Text style={styles.historicIcon}>🏛️</Text>
          <Text style={styles.historicText}>{historicDistrict}</Text>
        </View>
      )}

      <View style={styles.valueSection}>
        <View style={styles.mainValue}>
          <Text style={styles.valueLabel}>Market Value</Text>
          <Text style={styles.value}>{formatCurrency(marketValue)}</Text>
        </View>
        <View style={styles.secondaryValue}>
          <Text style={styles.valueLabel}>Assessed (Tax)</Text>
          <Text style={styles.secondaryValueText}>{formatCurrency(assessedValue)}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <InfoRow label="Year Built" value={yearBuilt} />
        {yearRenovated && <InfoRow label="Renovated" value={yearRenovated} />}
        <InfoRow label="Units" value={units.toString()} />
      </View>

      <View style={styles.complianceSection}>
        <View style={styles.complianceHeader}>
          <Text style={styles.complianceLabel}>Compliance Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: scoreColor + '20', borderColor: scoreColor }]}>
            <Text style={[styles.statusText, { color: scoreColor }]}>{scoreStatus}</Text>
          </View>
        </View>
        <View style={styles.complianceStats}>
          <View style={styles.complianceStat}>
            <Text style={[styles.complianceScore, { color: scoreColor }]}>{complianceScore}</Text>
            <Text style={styles.complianceStatLabel}>Score</Text>
          </View>
          <View style={styles.complianceStat}>
            <Text style={[styles.complianceScore, violationsCount > 0 && { color: Colors.error }]}>
              {violationsCount}
            </Text>
            <Text style={styles.complianceStatLabel}>Violations</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  address: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  neighborhood: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
  },
  historicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#9333ea',
    padding: Spacing.sm,
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  historicIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  historicText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: '#9333ea',
    fontWeight: Typography.weights.semibold as any,
  },
  valueSection: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mainValue: {
    flex: 1,
    marginRight: Spacing.md,
  },
  secondaryValue: {
    flex: 1,
  },
  valueLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
  },
  secondaryValueText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  infoSection: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  infoValueHighlight: {
    color: Colors.primary,
  },
  complianceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: Spacing.md,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  complianceLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold as any,
  },
  complianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  complianceStat: {
    alignItems: 'center',
  },
  complianceScore: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  complianceStatLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
});
