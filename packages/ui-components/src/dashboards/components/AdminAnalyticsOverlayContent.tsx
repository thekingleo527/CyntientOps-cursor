/**
 * @cyntientops/ui-components
 * 
 * Admin Analytics Overlay Content - System analytics and performance metrics
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
import { LinearGradient } from 'expo-linear-gradient';

export interface AdminAnalyticsOverlayContentProps {
  adminId: string;
  adminName: string;
  onRefresh?: () => Promise<void>;
}

export const AdminAnalyticsOverlayContent: React.FC<AdminAnalyticsOverlayContentProps> = ({
  adminId,
  adminName,
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

  const renderPerformanceMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
      <View style={styles.metricsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>94%</Text>
            <Text style={styles.metricLabel}>Task Completion</Text>
            <Text style={styles.metricChange}>+2.3% vs last week</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>2.3m</Text>
            <Text style={styles.metricLabel}>Avg Response Time</Text>
            <Text style={styles.metricChange}>-0.5m vs last week</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>99.9%</Text>
            <Text style={styles.metricLabel}>System Uptime</Text>
            <Text style={styles.metricChange}>+0.1% vs last month</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>4.8</Text>
            <Text style={styles.metricLabel}>Quality Score</Text>
            <Text style={styles.metricChange}>+0.2 vs last week</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderWorkerAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👷 Worker Analytics</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Top Performers This Week</Text>
        </View>
        
        {[
          { name: 'Kevin Dutan', completion: 98, tasks: 45, efficiency: 96 },
          { name: 'Moises Farhat', completion: 96, tasks: 38, efficiency: 94 },
          { name: 'Sarah Johnson', completion: 94, tasks: 42, efficiency: 92 },
          { name: 'Greg Hutson', completion: 92, tasks: 35, efficiency: 90 },
        ].map((worker, index) => (
          <View key={index} style={styles.workerAnalyticItem}>
            <View style={styles.workerRank}>
              <Text style={styles.workerRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.workerAnalyticInfo}>
              <Text style={styles.workerAnalyticName}>{worker.name}</Text>
              <View style={styles.workerAnalyticMetrics}>
                <Text style={styles.workerAnalyticMetric}>{worker.completion}% completion</Text>
                <Text style={styles.workerAnalyticMetric}>{worker.tasks} tasks</Text>
                <Text style={styles.workerAnalyticMetric}>{worker.efficiency}% efficiency</Text>
              </View>
            </View>
            <View style={styles.workerAnalyticScore}>
              <Text style={styles.workerAnalyticScoreValue}>{worker.efficiency}%</Text>
            </View>
          </View>
        ))}
      </GlassCard>
    </View>
  );

  const renderBuildingAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏢 Building Analytics</Text>
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
            <Text style={styles.complianceTrendLabel}>Needs Attention {'(<90%)'}</Text>
            <View style={styles.complianceTrendBar}>
              <View style={[styles.complianceTrendFill, { width: '5%', backgroundColor: Colors.status.error }]} />
            </View>
            <Text style={styles.complianceTrendValue}>5%</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderSystemAnalytics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ System Analytics</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>System Performance</Text>
        </View>
        
        <View style={styles.systemMetrics}>
          <View style={styles.systemMetric}>
            <Text style={styles.systemMetricLabel}>Database Response Time</Text>
            <Text style={styles.systemMetricValue}>45ms</Text>
            <Text style={styles.systemMetricStatus}>✅ Excellent</Text>
          </View>
          
          <View style={styles.systemMetric}>
            <Text style={styles.systemMetricLabel}>API Response Time</Text>
            <Text style={styles.systemMetricValue}>120ms</Text>
            <Text style={styles.systemMetricStatus}>✅ Good</Text>
          </View>
          
          <View style={styles.systemMetric}>
            <Text style={styles.systemMetricLabel}>Memory Usage</Text>
            <Text style={styles.systemMetricValue}>68%</Text>
            <Text style={styles.systemMetricStatus}>⚠️ Monitor</Text>
          </View>
          
          <View style={styles.systemMetric}>
            <Text style={styles.systemMetricLabel}>CPU Usage</Text>
            <Text style={styles.systemMetricValue}>42%</Text>
            <Text style={styles.systemMetricStatus}>✅ Normal</Text>
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
          <Text style={styles.trendTitle}>📈 Task Completion</Text>
          <Text style={styles.trendValue}>+5.2%</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>⚡ Efficiency</Text>
          <Text style={styles.trendValue}>+3.1%</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>😊 Satisfaction</Text>
          <Text style={styles.trendValue}>+2.4%</Text>
          <Text style={styles.trendDescription}>vs last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.trendCard}>
          <Text style={styles.trendTitle}>💰 Cost Efficiency</Text>
          <Text style={styles.trendValue}>-8.7%</Text>
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
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionText}>Set Alerts</Text>
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
          tintColor={Colors.role.admin.primary}
        />
      }
    >
      {renderPerformanceMetrics()}
      {renderWorkerAnalytics()}
      {renderBuildingAnalytics()}
      {renderSystemAnalytics()}
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
  workerAnalyticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  workerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.role.admin.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  workerRankText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  workerAnalyticInfo: {
    flex: 1,
  },
  workerAnalyticName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  workerAnalyticMetrics: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  workerAnalyticMetric: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  workerAnalyticScore: {
    alignItems: 'center',
  },
  workerAnalyticScoreValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  complianceTrends: {
    gap: Spacing.md,
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
  systemMetrics: {
    gap: Spacing.md,
  },
  systemMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  systemMetricLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  systemMetricValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  systemMetricStatus: {
    ...Typography.caption,
    color: Colors.text.secondary,
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

export default AdminAnalyticsOverlayContent;
