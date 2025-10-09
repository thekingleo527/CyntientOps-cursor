/**
 * 🗺️ Geographic Coverage Card
 * Purpose: Display geographic efficiency and building coverage analytics
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface GeographicCoverageCardProps {
  workerName: string;
  buildingsCovered: number;
  geographicClustering: number; // 0-1 efficiency score
  averageDistanceBetweenBuildings: number; // miles
  routeOptimization: number; // percentage improvement
  primaryArea: string; // e.g., "West Side", "East Village", "Financial District"
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const GeographicCoverageCard: React.FC<GeographicCoverageCardProps> = ({
  workerName,
  buildingsCovered,
  geographicClustering,
  averageDistanceBetweenBuildings,
  routeOptimization,
  primaryArea,
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const getClusteringColor = (score: number) => {
    if (score >= 0.8) return Colors.status.success;
    if (score >= 0.6) return Colors.status.info;
    if (score >= 0.4) return Colors.status.warning;
    return Colors.status.error;
  };

  const getClusteringStatus = (score: number) => {
    if (score >= 0.8) return 'EXCELLENT';
    if (score >= 0.6) return 'GOOD';
    if (score >= 0.4) return 'FAIR';
    return 'NEEDS IMPROVEMENT';
  };

  const formatClustering = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getAreaIcon = (area: string) => {
    if (area.toLowerCase().includes('west')) return '🌆';
    if (area.toLowerCase().includes('east')) return '🏙️';
    if (area.toLowerCase().includes('financial')) return '🏦';
    if (area.toLowerCase().includes('village')) return '🏘️';
    return '📍';
  };

  const renderContent = () => (
    <GlassCard 
      style={[styles.container, { backgroundColor }]} 
      intensity={GlassIntensity.REGULAR} 
      cornerRadius={CornerRadius.CARD}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Geographic Coverage</Text>
          <Text style={styles.workerName}>{workerName}</Text>
        </View>
        <View style={styles.areaContainer}>
          <Text style={styles.areaIcon}>{getAreaIcon(primaryArea)}</Text>
          <Text style={styles.areaText}>{primaryArea}</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{buildingsCovered}</Text>
            <Text style={styles.metricLabel}>Buildings</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{averageDistanceBetweenBuildings.toFixed(1)}mi</Text>
            <Text style={styles.metricLabel}>Avg Distance</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: getClusteringColor(geographicClustering) }]}>
              {formatClustering(geographicClustering)}
            </Text>
            <Text style={styles.metricLabel}>Clustering</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: Colors.status.success }]}>
              +{routeOptimization}%
            </Text>
            <Text style={styles.metricLabel}>Optimization</Text>
          </View>
        </View>
      </View>

      <View style={styles.clusteringContainer}>
        <Text style={styles.clusteringTitle}>Geographic Clustering</Text>
        <View style={styles.clusteringBar}>
          <View style={styles.clusteringBarBackground}>
            <View 
              style={[
                styles.clusteringBarFill, 
                { 
                  width: `${geographicClustering * 100}%`,
                  backgroundColor: getClusteringColor(geographicClustering)
                }
              ]} 
            />
          </View>
          <Text style={styles.clusteringLabel}>
            {formatClustering(geographicClustering)} Efficiency
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getClusteringColor(geographicClustering) }]}>
          {getClusteringStatus(geographicClustering)}
        </Text>
      </View>
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
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  workerName: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  areaContainer: {
    alignItems: 'center',
  },
  areaIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  areaText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  metricsContainer: {
    marginBottom: Spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  clusteringContainer: {
    marginBottom: Spacing.lg,
  },
  clusteringTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  clusteringBar: {
    marginTop: Spacing.sm,
  },
  clusteringBarBackground: {
    height: 8,
    backgroundColor: Colors.glass.thin,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  clusteringBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  clusteringLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

export default GeographicCoverageCard;

