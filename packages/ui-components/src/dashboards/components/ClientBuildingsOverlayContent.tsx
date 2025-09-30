/**
 * @cyntientops/ui-components
 * 
 * Client Buildings Overlay Content - Building management and monitoring
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

export interface ClientBuildingsOverlayContentProps {
  clientId: string;
  clientName: string;
  onBuildingPress?: (buildingId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const ClientBuildingsOverlayContent: React.FC<ClientBuildingsOverlayContentProps> = ({
  clientId,
  clientName,
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

  // Mock building data - in real app, this would come from props or state
  const buildings = [
    { id: '1', name: '131 Perry Street', address: '131 Perry Street, New York, NY', units: 24, compliance: 95, occupancy: 96, rent: 3200, yearBuilt: 2010 },
    { id: '2', name: '145 15th Street', address: '145 15th Street, New York, NY', units: 18, compliance: 92, occupancy: 94, rent: 2800, yearBuilt: 2008 },
    { id: '3', name: 'Rubin Museum', address: '150 W 17th St, New York, NY', units: 1, compliance: 98, occupancy: 100, rent: 0, yearBuilt: 2004 },
    { id: '4', name: '135 West 17th Street', address: '135 W 17th St, New York, NY', units: 32, compliance: 89, occupancy: 91, rent: 3500, yearBuilt: 2012 },
    { id: '5', name: '200 5th Avenue', address: '200 5th Ave, New York, NY', units: 45, compliance: 96, occupancy: 98, rent: 4200, yearBuilt: 2015 },
    { id: '6', name: '100 Central Park South', address: '100 Central Park S, New York, NY', units: 28, compliance: 91, occupancy: 93, rent: 3800, yearBuilt: 2009 },
  ];

  const renderBuildingStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏢 Building Statistics</Text>
      <View style={styles.statsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{buildings.length}</Text>
            <Text style={styles.statLabel}>Total Buildings</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{Math.round(buildings.reduce((sum, b) => sum + b.occupancy, 0) / buildings.length)}%</Text>
            <Text style={styles.statLabel}>Avg Occupancy</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{Math.round(buildings.reduce((sum, b) => sum + b.compliance, 0) / buildings.length)}%</Text>
            <Text style={styles.statLabel}>Avg Compliance</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>${Math.round(buildings.reduce((sum, b) => sum + b.rent, 0) / buildings.length)}</Text>
            <Text style={styles.statLabel}>Avg Rent</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderBuildingList = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏢 Building Portfolio</Text>
      {buildings.map((building) => (
        <TouchableOpacity
          key={building.id}
          style={styles.buildingCard}
          onPress={() => onBuildingPress?.(building.id)}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.buildingCardContent}>
            <View style={styles.buildingHeader}>
              <View style={styles.buildingInfo}>
                <View style={styles.buildingIcon}>
                  <Text style={styles.buildingIconText}>🏢</Text>
                </View>
                <View style={styles.buildingDetails}>
                  <Text style={styles.buildingName}>{building.name}</Text>
                  <Text style={styles.buildingAddress}>{building.address}</Text>
                  <Text style={styles.buildingUnits}>{building.units} units • Built {building.yearBuilt}</Text>
                </View>
              </View>
              <View style={styles.buildingStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: building.compliance >= 95 ? Colors.status.success : 
                                    building.compliance >= 90 ? Colors.status.warning : Colors.status.error }
                ]} />
                <Text style={styles.statusText}>
                  {building.compliance >= 95 ? 'Excellent' : 
                   building.compliance >= 90 ? 'Good' : 'Needs Attention'}
                </Text>
              </View>
            </View>
            
            <View style={styles.buildingMetrics}>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>Compliance</Text>
                <Text style={[styles.buildingMetricValue, { 
                  color: building.compliance >= 95 ? Colors.status.success : 
                        building.compliance >= 90 ? Colors.status.warning : Colors.status.error 
                }]}>{building.compliance}%</Text>
              </View>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>Occupancy</Text>
                <Text style={styles.buildingMetricValue}>{building.occupancy}%</Text>
              </View>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>Avg Rent</Text>
                <Text style={styles.buildingMetricValue}>
                  {building.rent > 0 ? `$${building.rent}` : 'N/A'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopPerformers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Top Performing Buildings</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.performersCard}>
        {buildings
          .sort((a, b) => b.compliance - a.compliance)
          .slice(0, 3)
          .map((building, index) => (
            <View key={building.id} style={styles.performerItem}>
              <View style={styles.performerRank}>
                <Text style={styles.performerRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{building.name}</Text>
                <Text style={styles.performerAddress}>{building.address}</Text>
              </View>
              <View style={styles.performerScore}>
                <Text style={styles.performerScoreValue}>{building.compliance}%</Text>
                <Text style={styles.performerScoreLabel}>Compliance</Text>
              </View>
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
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Add Building</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Building Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔧</Text>
          <Text style={styles.actionText}>Schedule Maintenance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Inspection Checklist</Text>
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
      {renderBuildingStats()}
      {renderBuildingList()}
      {renderTopPerformers()}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '48%',
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 24,
  },
  statLabel: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  buildingCard: {
    marginBottom: Spacing.md,
  },
  buildingCardContent: {
    padding: Spacing.lg,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  buildingInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  buildingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  buildingIconText: {
    fontSize: 24,
  },
  buildingDetails: {
    flex: 1,
  },
  buildingName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  buildingAddress: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  buildingUnits: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  buildingStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  buildingMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  buildingMetric: {
    alignItems: 'center',
  },
  buildingMetricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  buildingMetricValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  performersCard: {
    padding: Spacing.lg,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  performerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  performerRankText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  performerAddress: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  performerScore: {
    alignItems: 'center',
  },
  performerScoreValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  performerScoreLabel: {
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

export default ClientBuildingsOverlayContent;
