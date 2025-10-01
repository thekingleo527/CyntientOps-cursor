/**
 * 🚀 Development Opportunities Card
 * Shows properties with unused FAR and expansion potential
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GlassCard, GlassIntensity } from '../glass';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';

export interface DevelopmentOpportunity {
  id: string;
  name: string;
  unusedFARPercent: number;
  currentFAR: number;
  maxFAR: number;
  estimatedValueIncrease: number;
}

export interface DevelopmentOpportunitiesCardProps {
  opportunities: DevelopmentOpportunity[];
  onOpportunityPress?: (propertyId: string) => void;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

const OpportunityItem: React.FC<{
  opportunity: DevelopmentOpportunity;
  onPress?: () => void;
}> = ({ opportunity, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.opportunityItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.opportunityHeader}>
        <Text style={styles.propertyName}>{opportunity.name}</Text>
        <View style={styles.potentialBadge}>
          <Text style={styles.potentialText}>+{opportunity.unusedFARPercent}%</Text>
        </View>
      </View>

      <View style={styles.farInfo}>
        <View style={styles.farBar}>
          <View
            style={[
              styles.farFilled,
              { width: `${(opportunity.currentFAR / opportunity.maxFAR) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.farText}>
          {opportunity.currentFAR.toFixed(2)} / {opportunity.maxFAR.toFixed(2)} FAR
        </Text>
      </View>

      <View style={styles.valueSection}>
        <Text style={styles.valueLabel}>Potential Value Increase</Text>
        <Text style={styles.valueAmount}>{formatCurrency(opportunity.estimatedValueIncrease)}</Text>
      </View>

      <Text style={styles.expandText}>
        Can expand by {opportunity.unusedFARPercent}%
      </Text>
    </TouchableOpacity>
  );
};

export const DevelopmentOpportunitiesCard: React.FC<DevelopmentOpportunitiesCardProps> = ({
  opportunities,
  onOpportunityPress
}) => {
  const totalPotential = opportunities.reduce((sum, opp) => sum + opp.estimatedValueIncrease, 0);

  return (
    <GlassCard intensity={GlassIntensity.Medium} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Development Opportunities</Text>
        <Text style={styles.subtitle}>
          {opportunities.length} properties • {formatCurrency(totalPotential)} potential
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {opportunities.map((opportunity) => (
          <OpportunityItem
            key={opportunity.id}
            opportunity={opportunity}
            onPress={() => onOpportunityPress?.(opportunity.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.infoFooter}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Unused FAR = Floor Area Ratio available for vertical expansion
        </Text>
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
  opportunityItem: {
    width: 240,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: Spacing.md,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  propertyName: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  potentialBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  potentialText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
    color: Colors.background,
  },
  farInfo: {
    marginBottom: Spacing.md,
  },
  farBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  farFilled: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  farText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  valueSection: {
    marginBottom: Spacing.sm,
  },
  valueLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  valueAmount: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold as any,
    color: Colors.success,
  },
  expandText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontStyle: 'italic',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
});
