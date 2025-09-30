/**
 * @cyntientops/ui-components
 * 
 * Client Analytics Overlay Content - Portfolio analytics and performance metrics
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { LinearGradient } from '../../mocks/expo-linear-gradient';

export interface ClientAnalyticsOverlayContentProps {
  clientId: string;
  clientName: string;
  onRefresh?: () => Promise<void>;
}

export const ClientAnalyticsOverlayContent: React.FC<ClientAnalyticsOverlayContentProps> = ({
  clientId,
  clientName,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const renderPortfolioMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Portfolio Performance</Text>
      <View style={styles.metricsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>94%</Text>
            <Text style={styles.metricLabel}>Maintenance Efficiency</Text>
            <Text style={styles.metricChange}>+3.2% vs last month</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>4.8</Text>
            <Text style={styles.metricLabel}>Tenant Satisfaction</Text>
            <Text style={styles.metricChange}>+0.3 vs last month</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>96%</Text>
            <Text style={styles.metricLabel}>Occupancy Rate</Text>
            <Text style={styles.metricChange}>+2.1% vs last month</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>$2.4M</Text>
            <Text style={styles.metricLabel}>Portfolio Value</Text>
            <Text style={styles.metricChange}>+12.5% vs last year</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderBuildingAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏢 Building Performance</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Top Performing Buildings</Text>
        </View>
        
        {[
          { name: '131 Perry Street', occupancy: 96, satisfaction: 4.9, maintenance: 95, revenue: '$76.8K' },
          { name: '200 5th Avenue', occupancy: 98, satisfaction: 4.8, maintenance: 96, revenue: '$189K' },
          { name: 'Rubin Museum', occupancy: 100, satisfaction: 5.0, maintenance: 98, revenue: '$0' },
          { name: '145 15th Street', occupancy: 94, satisfaction: 4.7, maintenance: 92, revenue: '$50.4K' },
        ].map((building, index) => (
          <View key={index} style={styles.buildingAnalyticItem}>
            <View style={styles.buildingRank}>
              <Text style={styles.buildingRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.buildingAnalyticInfo}>
              <Text style={styles.buildingAnalyticName}>{building.name}</Text>
              <View style={styles.buildingAnalyticMetrics}>
                <Text style={styles.buildingAnalyticMetric}>{building.occupancy}% occupancy</Text>
                <Text style={styles.buildingAnalyticMetric}>{building.satisfaction}/5 satisfaction</Text>
                <Text style={styles.buildingAnalyticMetric}>{building.maintenance}% maintenance</Text>
              </View>
            </View>
            <View style={styles.buildingAnalyticRevenue}>
              <Text style={styles.buildingAnalyticRevenueValue}>{building.revenue}</Text>
              <Text style={styles.buildingAnalyticRevenueLabel}>Monthly</Text>
            </View>
          </View>
        ))}
      </GlassCard>
    </View>
  );

  const renderFinancialAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 Financial Analytics</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Revenue Breakdown</Text>
        </View>
        
        <View style={styles.financialBreakdown}>
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Monthly Rental Income</Text>
            <Text style={styles.financialValue}>$316.2K</Text>
            <Text style={styles.financialChange}>+5.2% vs last month</Text>
          </View>
          
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Maintenance Costs</Text>
            <Text style={styles.financialValue}>$28.4K</Text>
            <Text style={styles.financialChange}>-2.1% vs last month</Text>
          </View>
          
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>Net Operating Income</Text>
            <Text style={styles.financialValue}>$287.8K</Text>
            <Text style={styles.financialChange}>+6.8% vs last month</Text>
          </View>
          
          <View style={styles.financialItem}>
            <Text style={styles.financialLabel}>ROI</Text>
            <Text style={styles.financialValue}>8.7%</Text>
            <Text style={styles.financialChange}>+0.5% vs last month</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderComplianceAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✅ Compliance Analytics</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Compliance Trends</Text>
        </View>
        
        <View style={styles.complianceTrends}>
          <View style={styles.complianceTrendItem}>
            <Text style={styles.complianceTrendLabel}>Excellent (95%+)</Text>
            <View style={styles.complianceTrendBar}>
              <View style={[styles.complianceTrendFill, { width: '70%', backgroundColor: Colors.status.success }]} />
            </View>
            <Text style={styles.complianceTrendValue}>70%</Text>
          </View>
          
          <View style={styles.complianceTrendItem}>
            <Text style={styles.complianceTrendLabel}>Good (90-94%)</Text>
            <View style={styles.complianceTrendBar}>
              <View style={[styles.complianceTrendFill, { width: '25%', backgroundColor: Colors.status.warning }]} />
            </View>
            <Text style={styles.complianceTrendValue}>25%</Text>
          </View>
          
          <View style={styles.complianceTrendItem}>
            <Text style={styles.complianceTrendLabel}>Needs Attention (<90%)</Text>
            <View style={styles.complianceTrendBar}>
              <View style={[styles.complianceTrendFill, { width: '5%', backgroundColor: Colors.status.error }]} />
            </View>
            <Text style={styles.complianceTrendValue}>5%</Text>
          </View>
        </View>
        
        <View style={styles.complianceSummary}>
          <View style={styles.complianceSummaryItem}>
            <Text style={styles.complianceSummaryLabel}>Average Score</Text>
            <Text style={styles.complianceSummaryValue}>93.5%</Text>
          </View>
          <View style={styles.complianceSummaryItem}>
            <Text style={styles.complianceSummaryLabel}>Violations</Text>
            <Text style={styles.complianceSummaryValue}>6</Text>
          </View>
          <View style={styles.complianceSummaryItem}>
            <Text style={styles.complianceSummaryLabel}>Next Inspections</Text>
            <Text style={styles.complianceSummaryValue}>4</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderTrends = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📈 Trends & Insights</Text>
      <View style={styles.trendsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>📈 Occupancy</Text>
          <Text style={styles.trendValue}>+2.1%</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>💰 Revenue</Text>
          <Text style={styles.trendValue}>+5.2%</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>😊 Satisfaction</Text>
          <Text style={styles.trendValue}>+0.3</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>🔧 Maintenance</Text>
          <Text style={styles.trendValue}>+3.2%</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Export Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={styles.actionText}>View Trends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionText}>Financial Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Configure</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.client.primary}
        />
      }
    >
      {renderPortfolioMetrics()}
      {renderBuildingAnalytics()}
      {renderFinancialAnalytics()}
      {renderComplianceAnalytics()}
      {renderTrends()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metricCard: {
    width: '48%',
    overflow: 'hidden',
  },
  metricGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 24,
  },
  metricLabel: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  metricChange: {
    ...Typography.caption,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  analyticsCard: {
    padding: Spacing.lg,
  },
  analyticsHeader: {
    marginBottom: Spacing.md,
  },
  analyticsTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  buildingAnalyticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  buildingRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  buildingRankText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  buildingAnalyticInfo: {
    flex: 1,
  },
  buildingAnalyticName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  buildingAnalyticMetrics: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buildingAnalyticMetric: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  buildingAnalyticRevenue: {
    alignItems: 'center',
  },
  buildingAnalyticRevenueValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  buildingAnalyticRevenueLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  financialBreakdown: {
    gap: Spacing.md,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  financialLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  financialValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  financialChange: {
    ...Typography.caption,
    color: Colors.status.success,
  },
  complianceTrends: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  complianceTrendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complianceTrendLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    width: 120,
  },
  complianceTrendBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border.light,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
  },
  complianceTrendFill: {
    height: '100%',
    borderRadius: 4,
  },
  complianceTrendValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  complianceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  complianceSummaryItem: {
    alignItems: 'center',
  },
  complianceSummaryLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  complianceSummaryValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  trendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  trendCard: {
    width: '48%',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  trendTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  trendValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trendDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ClientAnalyticsOverlayContent;
