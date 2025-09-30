/**
 * @cyntientops/ui-components
 * 
 * Client Overview Overlay Content - Portfolio overview and metrics
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

export interface ClientOverviewOverlayContentProps {
  clientId: string;
  clientName: string;
  totalBuildings: number;
  totalUnits: number;
  totalSquareFootage: number;
  averageCompliance: number;
  activeAlerts: number;
  onRefresh?: () => Promise<void>;
}

export const ClientOverviewOverlayContent: React.FC<ClientOverviewOverlayContentProps> = ({
  clientId,
  clientName,
  totalBuildings,
  totalUnits,
  totalSquareFootage,
  averageCompliance,
  activeAlerts,
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
      <Text style={styles.sectionTitle}>📊 Portfolio Metrics</Text>
      <View style={styles.metricsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{totalBuildings}</Text>
            <Text style={styles.metricLabel}>Buildings</Text>
            <Text style={styles.metricSubtext}>All active</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{totalUnits}</Text>
            <Text style={styles.metricLabel}>Total Units</Text>
            <Text style={styles.metricSubtext}>94% occupied</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{Math.round(totalSquareFootage / 1000)}K</Text>
            <Text style={styles.metricLabel}>Sq Ft</Text>
            <Text style={styles.metricSubtext}>Total area</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.metricCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{Math.round(averageCompliance * 100)}%</Text>
            <Text style={styles.metricLabel}>Compliance</Text>
            <Text style={styles.metricSubtext}>Average score</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderPortfolioValue = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 Portfolio Value</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.valueCard}>
        <View style={styles.valueHeader}>
          <Text style={styles.valueTitle}>Total Portfolio Value</Text>
          <Text style={styles.valueAmount}>$2.4M</Text>
        </View>
        
        <View style={styles.valueBreakdown}>
          <View style={styles.valueItem}>
            <Text style={styles.valueItemLabel}>Market Value</Text>
            <Text style={styles.valueItemValue}>$2.1M</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueItemLabel}>Rental Income</Text>
            <Text style={styles.valueItemValue}>$180K/year</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueItemLabel}>Appreciation</Text>
            <Text style={styles.valueItemValue}>+12.5%</Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={styles.valueItemLabel}>ROI</Text>
            <Text style={styles.valueItemValue}>8.7%</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderComplianceStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✅ Compliance Status</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <Text style={styles.complianceTitle}>Overall Compliance</Text>
          <View style={[styles.complianceIndicator, { backgroundColor: averageCompliance > 0.9 ? Colors.status.success : Colors.status.warning }]}>
            <Text style={styles.complianceText}>
              {Math.round(averageCompliance * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.complianceBreakdown}>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceBar, { backgroundColor: Colors.status.success, width: '70%' }]} />
            <Text style={styles.complianceItemText}>
              Excellent (95%+): {Math.floor(totalBuildings * 0.7)} buildings
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceBar, { backgroundColor: Colors.status.warning, width: '25%' }]} />
            <Text style={styles.complianceItemText}>
              Good (90-94%): {Math.floor(totalBuildings * 0.25)} buildings
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceBar, { backgroundColor: Colors.status.error, width: '5%' }]} />
            <Text style={styles.complianceItemText}>
              Needs Attention (<90%): {Math.floor(totalBuildings * 0.05)} buildings
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.activityCard}>
        {[
          'Compliance inspection completed at 131 Perry Street',
          'Maintenance scheduled for Rubin Museum',
          'New tenant move-in at 135 West 17th Street',
          'Monthly report generated successfully',
          'Weather alert triggered for outdoor maintenance',
        ].map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityBullet} />
            <Text style={styles.activityText}>{activity}</Text>
            <Text style={styles.activityTime}>{index < 2 ? '1h ago' : `${index + 1}h ago`}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🏢</Text>
          <Text style={styles.actionText}>Manage Buildings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>✅</Text>
          <Text style={styles.actionText}>Compliance Check</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Contact Team</Text>
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
      {renderPortfolioValue()}
      {renderComplianceStatus()}
      {renderRecentActivity()}
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
  metricSubtext: {
    ...Typography.caption,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  valueCard: {
    padding: Spacing.lg,
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  valueTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  valueAmount: {
    ...Typography.titleLarge,
    color: Colors.status.success,
    fontWeight: 'bold',
  },
  valueBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  valueItem: {
    width: '48%',
    alignItems: 'center',
  },
  valueItemLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  valueItemValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  complianceCard: {
    padding: Spacing.lg,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  complianceTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  complianceIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  complianceText: {
    ...Typography.body,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  complianceBreakdown: {
    gap: Spacing.sm,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complianceBar: {
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
    minWidth: 20,
  },
  complianceItemText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  activityCard: {
    padding: Spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  activityBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.role.client.primary,
    marginRight: Spacing.sm,
  },
  activityText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
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

export default ClientOverviewOverlayContent;
