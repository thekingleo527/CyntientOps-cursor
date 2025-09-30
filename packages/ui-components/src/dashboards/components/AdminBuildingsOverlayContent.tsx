/**
 * @cyntientops/ui-components
 * 
 * Admin Buildings Overlay Content - Building portfolio management
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

export interface AdminBuildingsOverlayContentProps {
  adminId: string;
  adminName: string;
  onBuildingPress?: (buildingId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const AdminBuildingsOverlayContent: React.FC<AdminBuildingsOverlayContentProps> = ({
  adminId,
  adminName,
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
    { id: '1', name: '131 Perry Street', address: '131 Perry Street, New York, NY', units: 24, compliance: 95, status: 'active', assignedWorkers: 2, tasksToday: 12 },
    { id: '2', name: '145 15th Street', address: '145 15th Street, New York, NY', units: 18, compliance: 92, status: 'active', assignedWorkers: 1, tasksToday: 8 },
    { id: '3', name: 'Rubin Museum', address: '150 W 17th St, New York, NY', units: 1, compliance: 98, status: 'active', assignedWorkers: 1, tasksToday: 4 },
    { id: '4', name: '135 West 17th Street', address: '135 W 17th St, New York, NY', units: 32, compliance: 89, status: 'maintenance', assignedWorkers: 2, tasksToday: 15 },
    { id: '5', name: '200 5th Avenue', address: '200 5th Ave, New York, NY', units: 45, compliance: 96, status: 'active', assignedWorkers: 3, tasksToday: 18 },
    { id: '6', name: '100 Central Park South', address: '100 Central Park S, New York, NY', units: 28, compliance: 91, status: 'active', assignedWorkers: 2, tasksToday: 10 },
  ];

  const renderBuildingStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏢 Building Statistics</Text>
      <View style={styles.statsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{buildings.length}</Text>
            <Text style={styles.statLabel}>Total Buildings</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{buildings.filter(b => b.status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
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
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{buildings.reduce((sum, b) => sum + b.units, 0)}</Text>
            <Text style={styles.statLabel}>Total Units</Text>
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
                  <Text style={styles.buildingUnits}>{building.units} units</Text>
                </View>
              </View>
              <View style={styles.buildingStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: building.status === 'active' ? Colors.status.success : Colors.status.warning }
                ]} />
                <Text style={styles.statusText}>
                  {building.status === 'active' ? 'Active' : 'Maintenance'}
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
                <Text style={styles.buildingMetricLabel}>Assigned Workers</Text>
                <Text style={styles.buildingMetricValue}>{building.assignedWorkers}</Text>
              </View>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>Tasks Today</Text>
                <Text style={styles.buildingMetricValue}>{building.tasksToday}</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderComplianceOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✅ Compliance Overview</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.complianceCard}>
        <View style={styles.complianceHeader}>
          <Text style={styles.complianceTitle}>Overall Compliance Status</Text>
          <Text style={styles.complianceScore}>
            {Math.round(buildings.reduce((sum, b) => sum + b.compliance, 0) / buildings.length)}%
          </Text>
        </View>
        
        <View style={styles.complianceBreakdown}>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceBar, { backgroundColor: Colors.status.success, width: '70%' }]} />
            <Text style={styles.complianceItemText}>
              Excellent (95%+): {buildings.filter(b => b.compliance >= 95).length} buildings
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceBar, { backgroundColor: Colors.status.warning, width: '25%' }]} />
            <Text style={styles.complianceItemText}>
              Good (90-94%): {buildings.filter(b => b.compliance >= 90 && b.compliance < 95).length} buildings
            </Text>
          </View>
          <View style={styles.complianceItem}>
            <View style={[styles.complianceBar, { backgroundColor: Colors.status.error, width: '5%' }]} />
            <Text style={styles.complianceItemText}>
              Needs Attention (<90%): {buildings.filter(b => b.compliance < 90).length} buildings
            </Text>
          </View>
        </View>
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
          <Text style={styles.actionText}>Compliance Report</Text>
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
          tintColor={Colors.role.admin.primary}
        />
      }
    >
      {renderBuildingStats()}
      {renderBuildingList()}
      {renderComplianceOverview()}
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
    backgroundColor: Colors.role.admin.primary,
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
  complianceScore: {
    ...Typography.titleLarge,
    color: Colors.status.success,
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

export default AdminBuildingsOverlayContent;
