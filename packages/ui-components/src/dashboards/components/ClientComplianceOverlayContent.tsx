/**
 * @cyntientops/ui-components
 * 
 * Client Compliance Overlay Content - Compliance monitoring and management
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
import { LinearGradient } from 'expo-linear-gradient';

export interface ClientComplianceOverlayContentProps {
  clientId: string;
  clientName: string;
  onBuildingPress?: (buildingId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const ClientComplianceOverlayContent: React.FC<ClientComplianceOverlayContentProps> = ({
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

  // Mock compliance data - in real app, this would come from props or state
  const complianceData = [
    { building: '131 Perry Street', score: 95, status: 'excellent', lastInspection: '2024-01-15', nextInspection: '2024-04-15', violations: 0 },
    { building: '145 15th Street', score: 92, status: 'good', lastInspection: '2024-01-10', nextInspection: '2024-04-10', violations: 1 },
    { building: 'Rubin Museum', score: 98, status: 'excellent', lastInspection: '2024-01-20', nextInspection: '2024-04-20', violations: 0 },
    { building: '135 West 17th Street', score: 89, status: 'needs_attention', lastInspection: '2024-01-05', nextInspection: '2024-04-05', violations: 3 },
    { building: '200 5th Avenue', score: 96, status: 'excellent', lastInspection: '2024-01-18', nextInspection: '2024-04-18', violations: 0 },
    { building: '100 Central Park South', score: 91, status: 'good', lastInspection: '2024-01-12', nextInspection: '2024-04-12', violations: 2 },
  ];

  const renderComplianceOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✅ Compliance Overview</Text>
      <View style={styles.overviewGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.overviewGradient}
          >
            <Text style={styles.overviewValue}>
              {Math.round(complianceData.reduce((sum, b) => sum + b.score, 0) / complianceData.length)}%
            </Text>
            <Text style={styles.overviewLabel}>Overall Score</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.overviewGradient}
          >
            <Text style={styles.overviewValue}>
              {complianceData.filter(b => b.status === 'excellent').length}
            </Text>
            <Text style={styles.overviewLabel}>Excellent</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.overviewGradient}
          >
            <Text style={styles.overviewValue}>
              {complianceData.reduce((sum, b) => sum + b.violations, 0)}
            </Text>
            <Text style={styles.overviewLabel}>Total Violations</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.overviewGradient}
          >
            <Text style={styles.overviewValue}>
              {complianceData.filter(b => b.status === 'needs_attention').length}
            </Text>
            <Text style={styles.overviewLabel}>Need Attention</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderComplianceList = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Building Compliance Status</Text>
      {complianceData.map((building, index) => (
        <TouchableOpacity
          key={index}
          style={styles.complianceCard}
          onPress={() => onBuildingPress?.(building.building)}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.complianceCardContent}>
            <View style={styles.complianceHeader}>
              <View style={styles.complianceInfo}>
                <View style={styles.complianceIcon}>
                  <Text style={styles.complianceIconText}>🏢</Text>
                </View>
                <View style={styles.complianceDetails}>
                  <Text style={styles.complianceBuildingName}>{building.building}</Text>
                  <Text style={styles.complianceLastInspection}>
                    Last inspection: {new Date(building.lastInspection).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.complianceScore}>
                <View style={[
                  styles.scoreIndicator,
                  { backgroundColor: building.status === 'excellent' ? Colors.status.success : 
                                    building.status === 'good' ? Colors.status.warning : Colors.status.error }
                ]} />
                <Text style={styles.scoreText}>{building.score}%</Text>
              </View>
            </View>
            
            <View style={styles.complianceMetrics}>
              <View style={styles.complianceMetric}>
                <Text style={styles.complianceMetricLabel}>Status</Text>
                <Text style={[styles.complianceMetricValue, { 
                  color: building.status === 'excellent' ? Colors.status.success : 
                        building.status === 'good' ? Colors.status.warning : Colors.status.error 
                }]}>
                  {building.status === 'excellent' ? 'Excellent' : 
                   building.status === 'good' ? 'Good' : 'Needs Attention'}
                </Text>
              </View>
              <View style={styles.complianceMetric}>
                <Text style={styles.complianceMetricLabel}>Violations</Text>
                <Text style={[styles.complianceMetricValue, { 
                  color: building.violations === 0 ? Colors.status.success : Colors.status.error 
                }]}>
                  {building.violations}
                </Text>
              </View>
              <View style={styles.complianceMetric}>
                <Text style={styles.complianceMetricLabel}>Next Inspection</Text>
                <Text style={styles.complianceMetricValue}>
                  {new Date(building.nextInspection).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderViolationsSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚠️ Violations Summary</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.violationsCard}>
        <View style={styles.violationsHeader}>
          <Text style={styles.violationsTitle}>Active Violations</Text>
          <Text style={styles.violationsCount}>
            {complianceData.reduce((sum, b) => sum + b.violations, 0)} total
          </Text>
        </View>
        
        {complianceData
          .filter(building => building.violations > 0)
          .map((building, index) => (
            <View key={index} style={styles.violationItem}>
              <View style={styles.violationInfo}>
                <Text style={styles.violationBuilding}>{building.building}</Text>
                <Text style={styles.violationDetails}>
                  {building.violations} violation{building.violations > 1 ? 's' : ''} • Score: {building.score}%
                </Text>
              </View>
              <TouchableOpacity style={styles.violationAction}>
                <Text style={styles.violationActionText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        
        {complianceData.filter(building => building.violations > 0).length === 0 && (
          <View style={styles.noViolations}>
            <Text style={styles.noViolationsText}>🎉 No active violations!</Text>
            <Text style={styles.noViolationsSubtext}>All buildings are in compliance</Text>
          </View>
        )}
      </GlassCard>
    </View>
  );

  const renderUpcomingInspections = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Upcoming Inspections</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.inspectionsCard}>
        {complianceData
          .sort((a, b) => new Date(a.nextInspection).getTime() - new Date(b.nextInspection).getTime())
          .slice(0, 4)
          .map((building, index) => (
            <View key={index} style={styles.inspectionItem}>
              <View style={styles.inspectionDate}>
                <Text style={styles.inspectionDay}>
                  {new Date(building.nextInspection).getDate()}
                </Text>
                <Text style={styles.inspectionMonth}>
                  {new Date(building.nextInspection).toLocaleDateString('en', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.inspectionInfo}>
                <Text style={styles.inspectionBuilding}>{building.building}</Text>
                <Text style={styles.inspectionType}>Routine Inspection</Text>
              </View>
              <View style={styles.inspectionStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: building.status === 'excellent' ? Colors.status.success : 
                                    building.status === 'good' ? Colors.status.warning : Colors.status.error }
                ]} />
                <Text style={styles.inspectionStatusText}>
                  {building.status === 'excellent' ? 'Ready' : 
                   building.status === 'good' ? 'Preparing' : 'Needs Work'}
                </Text>
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
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Schedule Inspection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Compliance Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚠️</Text>
          <Text style={styles.actionText}>View Violations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>Inspection Calendar</Text>
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
      {renderComplianceOverview()}
      {renderComplianceList()}
      {renderViolationsSummary()}
      {renderUpcomingInspections()}
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  overviewCard: {
    width: '48%',
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  overviewValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 24,
  },
  overviewLabel: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  complianceCard: {
    marginBottom: Spacing.md,
  },
  complianceCardContent: {
    padding: Spacing.lg,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  complianceInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  complianceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.role.client.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  complianceIconText: {
    fontSize: 24,
  },
  complianceDetails: {
    flex: 1,
  },
  complianceBuildingName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  complianceLastInspection: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  complianceScore: {
    alignItems: 'center',
  },
  scoreIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  scoreText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  complianceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  complianceMetric: {
    alignItems: 'center',
  },
  complianceMetricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  complianceMetricValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  violationsCard: {
    padding: Spacing.lg,
  },
  violationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  violationsTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  violationsCount: {
    ...Typography.body,
    color: Colors.status.error,
    fontWeight: 'bold',
  },
  violationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  violationInfo: {
    flex: 1,
  },
  violationBuilding: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  violationDetails: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  violationAction: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.status.warning,
    borderRadius: 6,
  },
  violationActionText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  noViolations: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noViolationsText: {
    ...Typography.titleMedium,
    color: Colors.status.success,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  noViolationsSubtext: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  inspectionsCard: {
    padding: Spacing.lg,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  inspectionDate: {
    width: 50,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  inspectionDay: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  inspectionMonth: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  inspectionInfo: {
    flex: 1,
  },
  inspectionBuilding: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  inspectionType: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  inspectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  inspectionStatusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
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

export default ClientComplianceOverlayContent;
