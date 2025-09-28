/**
 * 🃏 Client Hero Card
 * Mirrors: CyntientOps/Components/Cards/ClientHeroCard.swift
 * Purpose: Glassmorphism client hero card with portfolio overview and key metrics
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassStatusBadge } from '../glass/GlassStatusBadge';

export interface ClientHeroCardProps {
  clientName: string;
  clientRole: string;
  portfolioValue: number;
  totalBuildings: number;
  totalWorkers: number;
  totalTasks: number;
  completionRate: number;
  complianceScore: number;
  monthlySpend: number;
  trends: {
    spend: number; // % change
    efficiency: number; // % change
    compliance: number; // % change
  };
  actions?: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const ClientHeroCard: React.FC<ClientHeroCardProps> = ({
  clientName,
  clientRole,
  portfolioValue,
  totalBuildings,
  totalWorkers,
  totalTasks,
  completionRate,
  complianceScore,
  monthlySpend,
  trends,
  actions = [],
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const getTrendColor = (value: number) => {
    if (value > 0) return Colors.status.success;
    if (value < 0) return Colors.status.error;
    return Colors.text.secondary;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return '📈';
    if (value < 0) return '📉';
    return '➡️';
  };

  const getComplianceStatus = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getActionButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    switch (variant) {
      case 'secondary':
        return [styles.actionButton, styles.secondaryButton];
      case 'danger':
        return [styles.actionButton, styles.dangerButton];
      default:
        return [styles.actionButton, styles.primaryButton];
    }
  };

  const getActionButtonTextStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButtonText;
      case 'danger':
        return styles.dangerButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  const renderContent = () => (
    <GlassCard style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.clientRole}>{clientRole}</Text>
        </View>
        <GlassStatusBadge
          status={getComplianceStatus(complianceScore)}
          label={`${complianceScore}% Compliance`}
          size="small"
          showBlur={showBlur}
        />
      </View>

      <View style={styles.portfolioValue}>
        <Text style={styles.portfolioValueLabel}>Portfolio Value</Text>
        <Text style={styles.portfolioValueAmount}>
          ${portfolioValue.toLocaleString()}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{totalBuildings}</Text>
          <Text style={styles.metricLabel}>Buildings</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{totalWorkers}</Text>
          <Text style={styles.metricLabel}>Workers</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{totalTasks}</Text>
          <Text style={styles.metricLabel}>Tasks</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{completionRate}%</Text>
          <Text style={styles.metricLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.financialSection}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.financialMetrics}>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Monthly Spend</Text>
            <Text style={styles.financialValue}>
              ${monthlySpend.toLocaleString()}
            </Text>
            <View style={styles.trendContainer}>
              <Text style={styles.trendIcon}>{getTrendIcon(trends.spend)}</Text>
              <Text style={[styles.trendValue, { color: getTrendColor(trends.spend) }]}>
                {trends.spend >= 0 ? '+' : ''}{trends.spend}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.trendsSection}>
        <Text style={styles.sectionTitle}>Performance Trends</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendsList}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Efficiency</Text>
            <View style={styles.trendContainer}>
              <Text style={styles.trendIcon}>{getTrendIcon(trends.efficiency)}</Text>
              <Text style={[styles.trendValue, { color: getTrendColor(trends.efficiency) }]}>
                {trends.efficiency >= 0 ? '+' : ''}{trends.efficiency}%
              </Text>
            </View>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Compliance</Text>
            <View style={styles.trendContainer}>
              <Text style={styles.trendIcon}>{getTrendIcon(trends.compliance)}</Text>
              <Text style={[styles.trendValue, { color: getTrendColor(trends.compliance) }]}>
                {trends.compliance >= 0 ? '+' : ''}{trends.compliance}%
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={getActionButtonStyle(action.variant)}
              onPress={action.onPress}
            >
              <Text style={getActionButtonTextStyle(action.variant)}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </GlassCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: 16,
    margin: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  clientRole: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  portfolioValue: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
  },
  portfolioValueLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  portfolioValueAmount: {
    ...Typography.titleLarge,
    color: Colors.status.success,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  financialSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  financialMetrics: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
  },
  financialItem: {
    alignItems: 'center',
  },
  financialLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  financialValue: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  trendsSection: {
    marginBottom: Spacing.lg,
  },
  trendsList: {
    flexDirection: 'row',
  },
  trendItem: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
    minWidth: 100,
  },
  trendLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  trendValue: {
    ...Typography.caption,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.status.info,
  },
  secondaryButton: {
    backgroundColor: Colors.glass.thin,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  dangerButton: {
    backgroundColor: Colors.status.error,
  },
  primaryButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  dangerButtonText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

export default ClientHeroCard;
