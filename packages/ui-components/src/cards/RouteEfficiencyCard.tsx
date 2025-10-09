/**
 * 🗺️ Route Efficiency Card
 * Purpose: Display route optimization metrics and geographic efficiency
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface RouteEfficiencyCardProps {
  workerName: string;
  routeEfficiency: number; // 0-1 (85%, 90%, 75%)
  averageTravelTime: number; // minutes
  buildingsPerRoute: number;
  timeSaved: number; // minutes saved through optimization
  routeScore: 'excellent' | 'good' | 'needs_improvement';
  onPress?: () => void;
  showBlur?: boolean;
  backgroundColor?: string;
}

export const RouteEfficiencyCard: React.FC<RouteEfficiencyCardProps> = ({
  workerName,
  routeEfficiency,
  averageTravelTime,
  buildingsPerRoute,
  timeSaved,
  routeScore,
  onPress,
  showBlur = true,
  backgroundColor = Colors.glass.regular,
}) => {
  const getRouteScoreColor = () => {
    switch (routeScore) {
      case 'excellent':
        return Colors.status.success;
      case 'good':
        return Colors.status.info;
      case 'needs_improvement':
        return Colors.status.warning;
      default:
        return Colors.text.secondary;
    }
  };

  const getRouteScoreIcon = () => {
    switch (routeScore) {
      case 'excellent':
        return '🚀';
      case 'good':
        return '✅';
      case 'needs_improvement':
        return '⚠️';
      default:
        return '📊';
    }
  };

  const formatEfficiency = (efficiency: number) => {
    return `${Math.round(efficiency * 100)}%`;
  };

  const renderContent = () => (
    <GlassCard 
      style={[styles.container, { backgroundColor }]} 
      intensity={GlassIntensity.REGULAR} 
      cornerRadius={CornerRadius.CARD}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Route Efficiency</Text>
          <Text style={styles.workerName}>{workerName}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreIcon}>{getRouteScoreIcon()}</Text>
          <Text style={[styles.scoreText, { color: getRouteScoreColor() }]}>
            {routeScore.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatEfficiency(routeEfficiency)}</Text>
            <Text style={styles.metricLabel}>Efficiency</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{averageTravelTime}m</Text>
            <Text style={styles.metricLabel}>Avg Travel</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{buildingsPerRoute}</Text>
            <Text style={styles.metricLabel}>Buildings</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: Colors.status.success }]}>
              +{timeSaved}m
            </Text>
            <Text style={styles.metricLabel}>Time Saved</Text>
          </View>
        </View>
      </View>

      <View style={styles.efficiencyBar}>
        <View style={styles.efficiencyBarBackground}>
          <View 
            style={[
              styles.efficiencyBarFill, 
              { 
                width: `${routeEfficiency * 100}%`,
                backgroundColor: getRouteScoreColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.efficiencyLabel}>
          {formatEfficiency(routeEfficiency)} Route Optimization
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
  scoreContainer: {
    alignItems: 'center',
  },
  scoreIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  scoreText: {
    ...Typography.caption,
    fontWeight: '600',
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
  efficiencyBar: {
    marginTop: Spacing.sm,
  },
  efficiencyBarBackground: {
    height: 8,
    backgroundColor: Colors.glass.thin,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  efficiencyBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  efficiencyLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default RouteEfficiencyCard;

