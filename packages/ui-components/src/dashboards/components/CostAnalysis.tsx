/**
 * @cyntientops/ui-components
 * 
 * Cost Analysis Component
 * Mirrors Swift CostAnalysis.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ClientBillingSummary } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface CostAnalysisProps {
  clientId: string;
}

export const CostAnalysis: React.FC<CostAnalysisProps> = ({
  clientId,
}) => {
  const [billingSummary, setBillingSummary] = useState<ClientBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadCostAnalysis();
  }, [clientId]);

  const loadCostAnalysis = () => {
    try {
      const summary = services.client.getClientBillingSummary(clientId, 'current-month');
      setBillingSummary(summary);
    } catch (error) {
      console.error('Error loading cost analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Cleaning': Colors.taskCategory.cleaning,
      'Maintenance': Colors.taskCategory.maintenance,
      'Sanitation': Colors.taskCategory.sanitation,
      'Inspection': Colors.taskCategory.inspection,
      'Operations': Colors.taskCategory.operations,
      'Repair': Colors.taskCategory.repair,
      'Security': Colors.taskCategory.security,
    };
    return categoryColors[category] || Colors.text.tertiary;
  };

  if (loading) {
    return (
      <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.loadingText}>Loading cost analysis...</Text>
      </GlassCard>
    );
  }

  if (!billingSummary) {
    return (
      <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.errorText}>Unable to load cost data</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Cost Analysis</Text>
      
      {/* Summary Overview */}
      <View style={styles.summaryOverview}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCurrency(billingSummary.totalCost)}
          </Text>
          <Text style={styles.summaryLabel}>Total Cost</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatHours(billingSummary.totalHours)}
          </Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCurrency(billingSummary.totalCost / billingSummary.totalHours)}
          </Text>
          <Text style={styles.summaryLabel}>Avg. Rate</Text>
        </View>
      </View>

      {/* Task Category Breakdown */}
      <View style={styles.categoryBreakdown}>
        <Text style={styles.breakdownTitle}>Task Category Breakdown</Text>
        
        {billingSummary.taskBreakdown.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={[
                styles.categoryColor,
                { backgroundColor: getCategoryColor(category.category) }
              ]} />
              <Text style={styles.categoryName}>{category.category}</Text>
            </View>
            
            <View style={styles.categoryMetrics}>
              <Text style={styles.categoryHours}>
                {formatHours(category.hours)}
              </Text>
              <Text style={styles.categoryCost}>
                {formatCurrency(category.cost)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Building Breakdown */}
      <View style={styles.buildingBreakdown}>
        <Text style={styles.breakdownTitle}>Building Breakdown</Text>
        
        {billingSummary.buildingBreakdown.map((building, index) => (
          <View key={index} style={styles.buildingItem}>
            <View style={styles.buildingInfo}>
              <Text style={styles.buildingName}>{building.buildingName}</Text>
              <Text style={styles.buildingHours}>
                {formatHours(building.hours)} • {formatCurrency(building.cost)}
              </Text>
            </View>
            
            <View style={styles.buildingCost}>
              <Text style={styles.costPercentage}>
                {Math.round((building.cost / billingSummary.totalCost) * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Cost Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Cost Insights</Text>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>💰</Text>
          <Text style={styles.insightText}>
            Average cost per hour: {formatCurrency(billingSummary.totalCost / billingSummary.totalHours)}
          </Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>📊</Text>
          <Text style={styles.insightText}>
            Most expensive category: {billingSummary.taskBreakdown.reduce((max, category) => 
              category.cost > max.cost ? category : max
            ).category}
          </Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>🏢</Text>
          <Text style={styles.insightText}>
            Highest cost building: {billingSummary.buildingBreakdown.reduce((max, building) => 
              building.cost > max.cost ? building : max
            ).buildingName}
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
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.status.error,
    textAlign: 'center',
  },
  summaryOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.titleLarge,
    color: Colors.role.client.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  categoryBreakdown: {
    marginBottom: Spacing.xl,
  },
  breakdownTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  categoryName: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  categoryMetrics: {
    alignItems: 'flex-end',
  },
  categoryHours: {
    ...Typography.labelMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  categoryCost: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  buildingBreakdown: {
    marginBottom: Spacing.xl,
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
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  buildingHours: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  buildingCost: {
    alignItems: 'flex-end',
  },
  costPercentage: {
    ...Typography.titleSmall,
    color: Colors.role.client.primary,
    fontWeight: '600',
  },
  insightsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  insightsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  insightText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});
