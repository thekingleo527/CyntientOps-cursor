/**
 * 📊 Compliance Summary Card
 * Shows portfolio-wide compliance metrics
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard, GlassIntensity } from '../glass';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';

export interface ComplianceSummaryCardProps {
  portfolioScore: number;
  criticalBuildings: number;
  totalViolations: number;
  totalOutstanding: number;
  violationsByType: {
    hpd: number;
    dob: number;
    dsny: number;
  };
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value}`;
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return Colors.success;
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return Colors.error;
};

const getScoreStatus = (score: number): string => {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'WARNING';
  return 'CRITICAL';
};

const StatItem: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
  </View>
);

export const ComplianceSummaryCard: React.FC<ComplianceSummaryCardProps> = ({
  portfolioScore,
  criticalBuildings,
  totalViolations,
  totalOutstanding,
  violationsByType
}) => {
  const scoreColor = getScoreColor(portfolioScore);
  const scoreStatus = getScoreStatus(portfolioScore);

  return (
    <GlassCard intensity={GlassIntensity.Medium} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Overview</Text>
        <Text style={styles.subtitle}>Portfolio-wide monitoring</Text>
      </View>

      <View style={styles.scoreContainer}>
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {portfolioScore.toFixed(1)}
          </Text>
          <Text style={[styles.scoreStatus, { color: scoreColor }]}>
            {scoreStatus}
          </Text>
        </View>
      </View>

      {criticalBuildings > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertText}>
            {criticalBuildings} building{criticalBuildings > 1 ? 's' : ''} need immediate attention
          </Text>
        </View>
      )}

      <View style={styles.violationsSection}>
        <Text style={styles.sectionTitle}>Violations by Type</Text>
        <View style={styles.violationGrid}>
          <View style={styles.violationItem}>
            <Text style={styles.violationCount}>{violationsByType.dsny}</Text>
            <Text style={styles.violationType}>DSNY</Text>
          </View>
          <View style={styles.violationItem}>
            <Text style={styles.violationCount}>{violationsByType.hpd}</Text>
            <Text style={styles.violationType}>HPD</Text>
          </View>
          <View style={styles.violationItem}>
            <Text style={styles.violationCount}>{violationsByType.dob}</Text>
            <Text style={styles.violationType}>DOB</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatItem label="Total Violations" value={totalViolations} />
        <StatItem
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          color={totalOutstanding > 0 ? Colors.error : Colors.success}
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
  scoreContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: Typography.weights.bold as any,
  },
  scoreStatus: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    marginTop: Spacing.xs,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    fontWeight: Typography.weights.semibold as any,
  },
  violationsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: Typography.weights.semibold as any,
  },
  violationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  violationItem: {
    alignItems: 'center',
  },
  violationCount: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  violationType: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.sm,
  },
  statItem: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
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
