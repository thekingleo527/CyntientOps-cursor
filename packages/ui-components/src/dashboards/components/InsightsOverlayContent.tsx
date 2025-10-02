/**
 * @cyntientops/ui-components
 *
 * Insights Overlay Content - Nova AI insights and analytics view
 * Contains: Nova AI recommendations, current building details, performance analytics
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
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { LegacyAnalyticsDashboard } from '../LegacyAnalyticsDashboard';
import type { OperationalDataBuilding } from '@cyntientops/domain-schema';

export interface NovaInsights {
  recommendations: string[];
  predictions: string[];
  nextMaintenance?: string;
}

export interface AnalyticsData {
  tasksCompleted: number;
  avgCompletionTime: number;
  compliance: number;
  efficiency: number;
}

export interface InsightsOverlayContentProps {
  workerId: string;
  workerName: string;
  novaInsights?: NovaInsights;
  currentBuilding?: OperationalDataBuilding;
  analytics?: AnalyticsData;
  onBuildingPress?: (buildingId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const InsightsOverlayContent: React.FC<InsightsOverlayContentProps> = ({
  workerId,
  workerName,
  novaInsights,
  currentBuilding,
  analytics,
  onBuildingPress,
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

  const renderNovaInsights = () => {
    if (!novaInsights || novaInsights.recommendations.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 AI Insights</Text>
          <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No AI insights available at the moment</Text>
          </GlassCard>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Nova AI Insights</Text>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsHeaderText}>Recommendations for {workerName}</Text>
          </View>
          {novaInsights.recommendations.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={styles.insightBullet} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
          {novaInsights.nextMaintenance && (
            <View style={styles.maintenanceAlert}>
              <Text style={styles.maintenanceIcon}>🔧</Text>
              <Text style={styles.maintenanceText}>
                Next maintenance: {novaInsights.nextMaintenance}
              </Text>
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  const renderCurrentBuilding = () => {
    if (!currentBuilding) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Current Building</Text>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.buildingCard}>
          <View style={styles.buildingHeader}>
            <Text style={styles.buildingName}>{currentBuilding.name}</Text>
            <View style={styles.buildingStatusBadge}>
              <Text style={styles.buildingStatusText}>Active</Text>
            </View>
          </View>
          <Text style={styles.buildingAddress}>{currentBuilding.address}</Text>
          <Text style={styles.buildingDetails}>
            {currentBuilding.city}, {currentBuilding.state} {currentBuilding.zip_code}
          </Text>

          <View style={styles.buildingStats}>
            <View style={styles.buildingStat}>
              <Text style={styles.buildingStatLabel}>Type</Text>
              <Text style={styles.buildingStatValue}>{currentBuilding.building_type || 'Mixed Use'}</Text>
            </View>
            <View style={styles.buildingStat}>
              <Text style={styles.buildingStatLabel}>Floors</Text>
              <Text style={styles.buildingStatValue}>{currentBuilding.number_of_floors || 'N/A'}</Text>
            </View>
            <View style={styles.buildingStat}>
              <Text style={styles.buildingStatLabel}>Units</Text>
              <Text style={styles.buildingStatValue}>{currentBuilding.number_of_units || 'N/A'}</Text>
            </View>
          </View>

          {onBuildingPress && (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => onBuildingPress(currentBuilding.id)}
            >
              <Text style={styles.viewDetailsText}>View Full Details</Text>
              <Text style={styles.viewDetailsArrow}>→</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Performance Analytics</Text>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.analyticsCard}>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{analytics.tasksCompleted}</Text>
              <Text style={styles.analyticLabel}>Tasks Completed</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{analytics.avgCompletionTime}m</Text>
              <Text style={styles.analyticLabel}>Avg Time</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={[styles.analyticValue, { color: Colors.status.success }]}>
                {analytics.compliance}%
              </Text>
              <Text style={styles.analyticLabel}>Compliance</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={[styles.analyticValue, { color: Colors.role.worker.primary }]}>
                {analytics.efficiency}%
              </Text>
              <Text style={styles.analyticLabel}>Efficiency</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.worker.primary}
        />
      }
    >
      {renderNovaInsights()}
      {renderCurrentBuilding()}
      {renderAnalytics()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  insightsCard: {
    padding: Spacing.md,
  },
  insightsHeader: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  insightsHeaderText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.role.worker.primary,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  maintenanceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.regular,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  maintenanceIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  maintenanceText: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  buildingCard: {
    padding: Spacing.md,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  buildingName: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
  },
  buildingStatusBadge: {
    backgroundColor: Colors.status.success + '20',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  buildingStatusText: {
    fontSize: Typography.fontSize.xSmall,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.status.success,
  },
  buildingAddress: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  buildingDetails: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  buildingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  buildingStat: {
    alignItems: 'center',
  },
  buildingStatLabel: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  buildingStatValue: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.role.worker.primary + '20',
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.role.worker.primary + '40',
  },
  viewDetailsText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.role.worker.primary,
    marginRight: Spacing.xs,
  },
  viewDetailsArrow: {
    fontSize: Typography.fontSize.medium,
    color: Colors.role.worker.primary,
  },
  analyticsCard: {
    padding: Spacing.md,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticItem: {
    width: '48%',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  analyticValue: {
    fontSize: Typography.fontSize.xLarge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  analyticLabel: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default InsightsOverlayContent;