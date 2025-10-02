/**
 * @cyntientops/ui-components
 *
 * Predictions Overlay Content - AI-powered predictions and trends view
 * Contains: Maintenance predictions, task predictions, trend analysis, forecasts
 */

import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

export interface MaintenancePrediction {
  id: string;
  buildingId: string;
  buildingName: string;
  component: string;
  predictedDate: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface TaskPrediction {
  taskType: string;
  estimatedTime: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface TrendData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PredictionsOverlayContentProps {
  workerId: string;
  workerName: string;
  maintenancePredictions?: MaintenancePrediction[];
  taskPredictions?: TaskPrediction[];
  trends?: TrendData[];
  onPredictionPress?: (prediction: MaintenancePrediction) => void;
  onRefresh?: () => Promise<void>;
}

export const PredictionsOverlayContent: React.FC<PredictionsOverlayContentProps> = ({
  workerId,
  workerName,
  maintenancePredictions = [],
  taskPredictions = [],
  trends = [],
  onPredictionPress,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'high':
        return Colors.status.error;
      case 'medium':
        return Colors.status.warning;
      case 'low':
        return Colors.status.info;
      default:
        return Colors.text.secondary;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up':
        return Colors.status.success;
      case 'down':
        return Colors.status.error;
      case 'stable':
        return Colors.status.info;
      default:
        return Colors.text.secondary;
    }
  };

  const renderMaintenancePredictions = () => {
    if (maintenancePredictions.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Maintenance Predictions</Text>
          <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.emptyCard}>
            <Text style={styles.emptyText}>No maintenance predictions at this time</Text>
            <Text style={styles.emptySubtext}>We'll notify you when predictions are available</Text>
          </GlassCard>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔧 Maintenance Predictions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{maintenancePredictions.length}</Text>
          </View>
        </View>
        <View style={styles.predictionsContainer}>
          {maintenancePredictions.map(prediction => (
            <TouchableOpacity
              key={prediction.id}
              onPress={() => onPredictionPress?.(prediction)}
            >
              <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(prediction.severity) + '20' }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(prediction.severity) }]}>
                      {prediction.severity.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{Math.round(prediction.confidence * 100)}% confident</Text>
                  </View>
                </View>

                <Text style={styles.predictionComponent}>{prediction.component}</Text>
                <Text style={styles.predictionBuilding}>📍 {prediction.buildingName}</Text>
                <Text style={styles.predictionDescription}>{prediction.description}</Text>

                <View style={styles.predictionFooter}>
                  <Text style={styles.predictionDate}>
                    Predicted: {new Date(prediction.predictedDate).toLocaleDateString()}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTaskPredictions = () => {
    if (taskPredictions.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏱️ Task Duration Predictions</Text>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.taskPredictionsCard}>
          {taskPredictions.map((prediction, index) => (
            <View key={index} style={styles.taskPredictionItem}>
              <View style={styles.taskPredictionHeader}>
                <Text style={styles.taskPredictionType}>{prediction.taskType}</Text>
                <View style={styles.trendIndicator}>
                  <Text style={[styles.trendArrow, { color: getTrendColor(prediction.trend === 'increasing' ? 'up' : prediction.trend === 'decreasing' ? 'down' : 'stable') }]}>
                    {getTrendIcon(prediction.trend === 'increasing' ? 'up' : prediction.trend === 'decreasing' ? 'down' : 'stable')}
                  </Text>
                </View>
              </View>
              <View style={styles.taskPredictionDetails}>
                <View style={styles.taskPredictionStat}>
                  <Text style={styles.taskPredictionLabel}>Est. Time</Text>
                  <Text style={styles.taskPredictionValue}>{prediction.estimatedTime}min</Text>
                </View>
                <View style={styles.taskPredictionStat}>
                  <Text style={styles.taskPredictionLabel}>Confidence</Text>
                  <Text style={styles.taskPredictionValue}>{Math.round(prediction.confidence * 100)}%</Text>
                </View>
                <View style={styles.taskPredictionStat}>
                  <Text style={styles.taskPredictionLabel}>Trend</Text>
                  <Text style={[styles.taskPredictionValue, {
                    color: prediction.trend === 'increasing' ? Colors.status.warning :
                           prediction.trend === 'decreasing' ? Colors.status.success : Colors.text.secondary
                  }]}>
                    {prediction.trend}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </GlassCard>
      </View>
    );
  };

  const renderTrends = () => {
    if (trends.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Performance Trends</Text>
        <View style={styles.trendsGrid}>
          {trends.map((trend, index) => (
            <GlassCard
              key={index}
              intensity={GlassIntensity.regular}
              cornerRadius={CornerRadius.medium}
              style={styles.trendCard}
            >
              <LinearGradient
                colors={[getTrendColor(trend.trend) + '20', getTrendColor(trend.trend) + '05']}
                style={styles.trendGradient}
              >
                <Text style={styles.trendLabel}>{trend.label}</Text>
                <View style={styles.trendValueContainer}>
                  <Text style={styles.trendValue}>{trend.value}</Text>
                  <Text style={[styles.trendIcon, { color: getTrendColor(trend.trend) }]}>
                    {getTrendIcon(trend.trend)}
                  </Text>
                </View>
                <View style={styles.trendChange}>
                  <Text style={[styles.trendChangeText, { color: getTrendColor(trend.trend) }]}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </Text>
                  <Text style={styles.trendChangePeriod}>vs last week</Text>
                </View>
              </LinearGradient>
            </GlassCard>
          ))}
        </View>
      </View>
    );
  };

  const renderPredictionInfo = () => (
    <View style={styles.section}>
      <GlassCard intensity={GlassIntensity.thin} cornerRadius={CornerRadius.medium} style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoIcon}>🔮</Text>
          <Text style={styles.infoTitle}>AI-Powered Predictions</Text>
        </View>
        <Text style={styles.infoText}>
          Our AI analyzes historical data, weather patterns, and building characteristics to predict maintenance needs and optimize task scheduling.
        </Text>
        <View style={styles.infoStats}>
          <View style={styles.infoStat}>
            <Text style={styles.infoStatValue}>92%</Text>
            <Text style={styles.infoStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.infoStat}>
            <Text style={styles.infoStatValue}>30 days</Text>
            <Text style={styles.infoStatLabel}>Forecast</Text>
          </View>
          <View style={styles.infoStat}>
            <Text style={styles.infoStatValue}>1000+</Text>
            <Text style={styles.infoStatLabel}>Data Points</Text>
          </View>
        </View>
      </GlassCard>
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
          tintColor={Colors.role.worker.primary}
        />
      }
    >
      {renderPredictionInfo()}
      {renderMaintenancePredictions()}
      {renderTaskPredictions()}
      {renderTrends()}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  countBadge: {
    backgroundColor: Colors.role.worker.primary + '20',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.role.worker.primary,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  predictionsContainer: {
    gap: Spacing.md,
  },
  predictionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  severityBadge: {
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  severityText: {
    fontSize: Typography.fontSize.xSmall,
    fontWeight: Typography.fontWeight.bold,
  },
  confidenceBadge: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.secondary,
  },
  predictionComponent: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  predictionBuilding: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  predictionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  predictionFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
  },
  predictionDate: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
  },
  taskPredictionsCard: {
    padding: Spacing.md,
  },
  taskPredictionItem: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  taskPredictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskPredictionType: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  trendIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.glass.regular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendArrow: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
  },
  taskPredictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskPredictionStat: {
    alignItems: 'center',
  },
  taskPredictionLabel: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  taskPredictionValue: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  trendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendCard: {
    width: '48%',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  trendGradient: {
    padding: Spacing.md,
  },
  trendLabel: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  trendValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  trendValue: {
    fontSize: Typography.fontSize.xLarge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginRight: Spacing.xs,
  },
  trendIcon: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendChangeText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.xs,
  },
  trendChangePeriod: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.tertiary,
  },
  infoCard: {
    padding: Spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  infoText: {
    fontSize: Typography.fontSize.small,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatValue: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.role.worker.primary,
    marginBottom: 2,
  },
  infoStatLabel: {
    fontSize: Typography.fontSize.xSmall,
    color: Colors.text.secondary,
  },
});

export default PredictionsOverlayContent;