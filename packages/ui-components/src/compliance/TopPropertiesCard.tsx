/**
 * 🏆 Top Properties Card
 * Shows top properties by market value with compliance scores
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GlassCard, GlassIntensity } from '../glass';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';

export interface PropertySummary {
  id: string;
  name: string;
  marketValue: number;
  complianceScore: number;
  violations: number;
}

export interface TopPropertiesCardProps {
  properties: PropertySummary[];
  onPropertyPress?: (propertyId: string) => void;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return Colors.success;
  if (score >= 70) return '#f59e0b';
  if (score >= 50) return '#f97316';
  return Colors.error;
};

const PropertyItem: React.FC<{
  rank: number;
  property: PropertySummary;
  onPress?: () => void;
}> = ({ rank, property, onPress }) => {
  const scoreColor = getScoreColor(property.complianceScore);

  return (
    <TouchableOpacity
      style={styles.propertyItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyValue}>{formatCurrency(property.marketValue)}</Text>
      </View>

      <View style={styles.propertyStats}>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20', borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {property.complianceScore}
          </Text>
        </View>
        {property.violations > 0 && (
          <View style={styles.violationBadge}>
            <Text style={styles.violationText}>{property.violations}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const TopPropertiesCard: React.FC<TopPropertiesCardProps> = ({
  properties,
  onPropertyPress
}) => {
  return (
    <GlassCard intensity={GlassIntensity.Medium} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Properties</Text>
        <Text style={styles.subtitle}>By Market Value</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {properties.map((property, index) => (
          <PropertyItem
            key={property.id}
            rank={index + 1}
            property={property}
            onPress={() => onPropertyPress?.(property.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Score 90+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Score 70-89</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={styles.legendText}>Score &lt;50</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  scrollContent: {
    paddingRight: Spacing.md,
  },
  propertyItem: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: Spacing.md,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rankText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    color: Colors.background,
  },
  propertyInfo: {
    marginBottom: Spacing.md,
  },
  propertyName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  propertyValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
  },
  propertyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  scoreText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
  },
  violationBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  violationText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold as any,
    color: Colors.background,
  },
  legend: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
});
