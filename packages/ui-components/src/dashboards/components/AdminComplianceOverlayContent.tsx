/**
 * @cyntientops/ui-components
 * 
 * Admin Compliance Overlay Content
 * Full-screen compliance management for admin dashboard
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceContainer } from '@cyntientops/business-core';
import { ViolationHistoryView } from '../../compliance/ViolationHistoryView';
import { MobileViolationHistoryView } from '../../compliance/MobileViolationHistoryView';

export interface AdminComplianceOverlayContentProps {
  adminId: string;
  adminName: string;
  onRefresh?: () => void;
}

export const AdminComplianceOverlayContent: React.FC<AdminComplianceOverlayContentProps> = ({
  adminId,
  adminName,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedViolationType, setSelectedViolationType] = useState<'hpd' | 'dsny' | null>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadComplianceData();
  }, [adminId]);

  const loadComplianceData = async () => {
    try {
      // Load all buildings for admin view
      const allBuildings = await services.buildingDataHydration.getBuildings();
      setBuildings(allBuildings);

      // Load compliance data for all buildings
      const compliance = await services.compliance.loadComplianceData();
      setComplianceData(compliance);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComplianceData();
    onRefresh?.();
    setRefreshing(false);
  };

  const renderComplianceOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛡️ Portfolio Compliance Overview</Text>
      
      <View style={styles.overviewGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>
              {complianceData ? Math.round(complianceData.overallComplianceScore * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Overall Compliance</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.overviewCard}>
          <LinearGradient
            colors={[Colors.status.error, Colors.status.warning]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>
              {complianceData ? complianceData.totalViolations : 0}
            </Text>
            <Text style={styles.statLabel}>Open Violations</Text>
          </LinearGradient>
        </GlassCard>
      </View>

      <View style={styles.overviewGrid}>
        <TouchableOpacity 
          style={styles.overviewCard}
          onPress={() => setSelectedViolationType('hpd')}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.clickableCard}>
            <LinearGradient
              colors={[Colors.status.warning, Colors.status.error]}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>
                {complianceData ? complianceData.hpdViolations : 0}
              </Text>
              <Text style={styles.statLabel}>HPD Violations</Text>
              <Text style={styles.clickHint}>Tap to view history</Text>
            </LinearGradient>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.overviewCard}
          onPress={() => setSelectedViolationType('dsny')}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.clickableCard}>
            <LinearGradient
              colors={[Colors.status.info, Colors.status.warning]}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>
                {complianceData ? complianceData.dsnyViolations : 0}
              </Text>
              <Text style={styles.statLabel}>DSNY Violations</Text>
              <Text style={styles.clickHint}>Tap to view history</Text>
            </LinearGradient>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBuildingList = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏢 Building Compliance Status</Text>
      
      {buildings.map((building) => (
        <TouchableOpacity
          key={building.id}
          style={styles.buildingItem}
          onPress={() => setSelectedBuilding(building.id)}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.buildingCard}>
            <View style={styles.buildingHeader}>
              <View style={styles.buildingInfo}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={styles.buildingAddress}>{building.address}</Text>
              </View>
              
              <View style={styles.buildingStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: building.compliance_score >= 0.95 ? Colors.status.success : 
                                    building.compliance_score >= 0.90 ? Colors.status.warning : Colors.status.error }
                ]} />
                <Text style={styles.statusText}>
                  {building.compliance_score >= 0.95 ? 'Excellent' : 
                   building.compliance_score >= 0.90 ? 'Good' : 'Needs Attention'}
                </Text>
              </View>
            </View>
            
            <View style={styles.buildingMetrics}>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>Compliance</Text>
                <Text style={[styles.buildingMetricValue, { 
                  color: building.compliance_score >= 0.95 ? Colors.status.success : 
                        building.compliance_score >= 0.90 ? Colors.status.warning : Colors.status.error 
                }]}>{Math.round(building.compliance_score * 100)}%</Text>
              </View>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>HPD Issues</Text>
                <Text style={[styles.buildingMetricValue, { color: Colors.status.error }]}>0</Text>
              </View>
              <View style={styles.buildingMetric}>
                <Text style={styles.buildingMetricLabel}>DSNY Issues</Text>
                <Text style={[styles.buildingMetricValue, { color: Colors.status.warning }]}>0</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderViolationHistory = () => {
    if (selectedViolationType) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📋 {selectedViolationType.toUpperCase()} Violation History
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedViolationType(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {buildings.map((building) => (
            <View key={building.id} style={styles.buildingViolationSection}>
              <Text style={styles.buildingViolationTitle}>{building.name}</Text>
              <MobileViolationHistoryView
                buildingId={building.id}
                buildingName={building.name}
                buildingAddress={building.address}
                filterType={selectedViolationType}
              />
            </View>
          ))}
        </View>
      );
    }

    if (!selectedBuilding) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Violation History</Text>
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>Select a building or violation type to view history</Text>
          </GlassCard>
        </View>
      );
    }

    const building = buildings.find(b => b.id === selectedBuilding);
    if (!building) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Violation History - {building.name}</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedBuilding(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <MobileViolationHistoryView
          buildingId={building.id}
          buildingName={building.name}
          buildingAddress={building.address}
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.admin.primary}
        />
      }
    >
      {renderComplianceOverview()}
      {renderBuildingList()}
      {renderViolationHistory()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  overviewCard: {
    flex: 1,
    overflow: 'hidden',
  },
  clickableCard: {
    flex: 1,
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.bodyMedium,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  clickHint: {
    ...Typography.caption,
    color: Colors.text.inverse,
    opacity: 0.7,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    backgroundColor: Colors.border.light,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  buildingViolationSection: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  buildingViolationTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  buildingItem: {
    marginBottom: Spacing.md,
  },
  buildingCard: {
    padding: Spacing.lg,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  buildingAddress: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  buildingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  buildingMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buildingMetric: {
    alignItems: 'center',
  },
  buildingMetricLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  buildingMetricValue: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
  },
  emptyStateCard: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyStateText: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
