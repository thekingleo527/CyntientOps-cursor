/**
 * @cyntientops/ui-components
 * 
 * Portfolio Overview Component
 * Mirrors Swift PortfolioOverview.swift
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../../glass';
import { ClientPortfolio } from '@cyntientops/domain-schema';

export interface PortfolioOverviewProps {
  portfolio: ClientPortfolio;
  onBuildingPress?: (buildingId: string) => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  portfolio,
  onBuildingPress,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 0.9) return Colors.status.success;
    if (score >= 0.7) return Colors.status.warning;
    return Colors.status.error;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return Colors.status.success;
    if (efficiency >= 0.6) return Colors.status.warning;
    return Colors.status.error;
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Portfolio Overview</Text>
      
      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{portfolio.totalBuildings}</Text>
          <Text style={styles.metricLabel}>Buildings</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{portfolio.totalTasks}</Text>
          <Text style={styles.metricLabel}>Total Tasks</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{portfolio.completedTasks}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[
            styles.metricValue,
            { color: getComplianceColor(portfolio.averageComplianceScore) }
          ]}>
            {formatPercentage(portfolio.averageComplianceScore)}
          </Text>
          <Text style={styles.metricLabel}>Compliance</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {formatCurrency(portfolio.monthlySpend)}
          </Text>
          <Text style={styles.metricLabel}>Monthly Spend</Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[
            styles.metricValue,
            { color: getEfficiencyColor(portfolio.efficiency) }
          ]}>
            {formatPercentage(portfolio.efficiency)}
          </Text>
          <Text style={styles.metricLabel}>Efficiency</Text>
        </View>
      </View>

      {/* Building List */}
      <View style={styles.buildingsSection}>
        <Text style={styles.buildingsTitle}>Buildings</Text>
        
        {portfolio.buildings.map((building) => (
          <TouchableOpacity
            key={building.buildingId}
            style={styles.buildingItem}
            onPress={() => onBuildingPress?.(building.buildingId)}
          >
            <View style={styles.buildingInfo}>
              <Text style={styles.buildingName}>{building.buildingName}</Text>
              <Text style={styles.buildingTasks}>
                {building.taskCount} tasks • {building.overdueCount} overdue
              </Text>
            </View>
            
            <View style={styles.buildingMetrics}>
              <View style={[
                styles.complianceBadge,
                { backgroundColor: getComplianceColor(building.complianceScore) }
              ]}>
                <Text style={styles.complianceText}>
                  {formatPercentage(building.complianceScore)}
                </Text>
              </View>
              
              {building.urgentCount > 0 && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>
                    {building.urgentCount} urgent
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Performance Summary */}
      <View style={styles.performanceSummary}>
        <Text style={styles.summaryTitle}>Performance Summary</Text>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Completion Rate</Text>
          <Text style={styles.summaryValue}>
            {formatPercentage(portfolio.completedTasks / portfolio.totalTasks)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Overdue Tasks</Text>
          <Text style={[
            styles.summaryValue,
            { color: portfolio.overdueTasks > 0 ? Colors.status.error : Colors.status.success }
          ]}>
            {portfolio.overdueTasks}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Projected Costs</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(portfolio.projectedCosts)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  metricItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.role.client.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  buildingsSection: {
    marginBottom: Spacing.xl,
  },
  buildingsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  buildingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  buildingTasks: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  buildingMetrics: {
    alignItems: 'flex-end',
  },
  complianceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  complianceText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  urgentText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  performanceSummary: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  summaryTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  summaryValue: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});
