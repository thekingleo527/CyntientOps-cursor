/**
 * ✅ Compliance Status Card (for Clients)
 * Shows detailed violation breakdown
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard, GlassIntensity } from '../glass';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';

export interface ComplianceStatusCardProps {
  score: number;
  status: string;
  hpdViolations: number;
  dobViolations: number;
  dsnyViolations: number;
  outstanding: number;
}

const formatCurrency = (value: number): string => {
  if (value === 0) return '$0';
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

const ViolationItem: React.FC<{ type: string; count: number; description: string }> = ({
  type,
  count,
  description
}) => (
  <View style={styles.violationItem}>
    <View style={styles.violationHeader}>
      <Text style={styles.violationType}>{type}</Text>
      <View style={[styles.countBadge, count > 0 && styles.countBadgeActive]}>
        <Text style={[styles.countText, count > 0 && styles.countTextActive]}>{count}</Text>
      </View>
    </View>
    <Text style={styles.violationDescription}>{description}</Text>
  </View>
);

export const ComplianceStatusCard: React.FC<ComplianceStatusCardProps> = ({
  score,
  status,
  hpdViolations,
  dobViolations,
  dsnyViolations,
  outstanding
}) => {
  const scoreColor = getScoreColor(score);
  const totalViolations = hpdViolations + dobViolations + dsnyViolations;

  return (
    <GlassCard intensity={GlassIntensity.Medium} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Status</Text>
      </View>

      <View style={styles.scoreSection}>
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { color: scoreColor }]}>{status}</Text>
        </View>
        <View style={styles.scoreSummary}>
          <Text style={styles.summaryTitle}>Current Status</Text>
          <Text style={styles.summaryText}>
            {totalViolations === 0
              ? 'No active violations'
              : `${totalViolations} active violation${totalViolations > 1 ? 's' : ''}`}
          </Text>
          {outstanding > 0 && (
            <Text style={[styles.summaryOutstanding, { color: Colors.error }]}>
              {formatCurrency(outstanding)} outstanding
            </Text>
          )}
        </View>
      </View>

      <View style={styles.violationsSection}>
        <Text style={styles.sectionTitle}>Violations by Type</Text>

        <ViolationItem
          type="HPD"
          count={hpdViolations}
          description="Housing Preservation & Development"
        />

        <ViolationItem
          type="DOB"
          count={dobViolations}
          description="Department of Buildings"
        />

        <ViolationItem
          type="DSNY"
          count={dsnyViolations}
          description="Sanitation & Waste Management"
        />
      </View>

      {totalViolations === 0 ? (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>
            Your property is in full compliance with NYC regulations
          </Text>
        </View>
      ) : (
        <View style={styles.actionBanner}>
          <Text style={styles.actionIcon}>📋</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Action Required</Text>
            <Text style={styles.actionText}>
              Please contact building management to address active violations
            </Text>
          </View>
        </View>
      )}
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
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: Spacing.md,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: Typography.weights.bold as any,
  },
  scoreLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold as any,
    marginTop: Spacing.xs,
  },
  scoreSummary: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  summaryText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  summaryOutstanding: {
    fontSize: Typography.sizes.sm,
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
  violationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  violationType: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  countBadgeActive: {
    backgroundColor: Colors.error,
  },
  countText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.secondary,
  },
  countTextActive: {
    color: Colors.background,
  },
  violationDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    padding: Spacing.md,
    borderRadius: 8,
  },
  successIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.success,
    fontWeight: Typography.weights.semibold as any,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    padding: Spacing.md,
    borderRadius: 8,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold as any,
    color: '#f59e0b',
    marginBottom: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
});
