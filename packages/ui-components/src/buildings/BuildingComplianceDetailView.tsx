/**
 * 🏢 Building Compliance Detail View
 * Mirrors: CyntientOps/Views/Buildings/BuildingComplianceDetailView.swift
 * Purpose: Complete building compliance overview with all NYC API data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { HPDViolation, DOBPermit, DSNYRoute, LL97Emission } from '@cyntientops/api-clients';
import { ServiceContainer } from '@cyntientops/business-core';
import { ComplianceSuiteView } from '../compliance/ComplianceSuiteView';
import { HPDViolationsView } from '../compliance/HPDViolationsView';
import { DOBPermitsView } from '../compliance/DOBPermitsView';
import { DSNYCollectionView } from '../compliance/DSNYCollectionView';

export interface BuildingComplianceDetailViewProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  container: ServiceContainer;
  onBack?: () => void;
}

export enum ComplianceTab {
  OVERVIEW = 'overview',
  HPD = 'hpd',
  DOB = 'dob',
  DSNY = 'dsny',
  LL97 = 'll97'
}

export const BuildingComplianceDetailView: React.FC<BuildingComplianceDetailViewProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  container,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>(ComplianceTab.OVERVIEW);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [complianceSummary, setComplianceSummary] = useState<any>(null);

  useEffect(() => {
    loadComplianceSummary();
  }, [buildingId]);

  const loadComplianceSummary = async () => {
    setIsLoading(true);
    try {
      const complianceService = new (container as any).ComplianceService(container);
      const summary = await complianceService.getBuildingComplianceSummary(buildingId);
      setComplianceSummary(summary);
    } catch (error) {
      console.error('Failed to load compliance summary:', error);
      Alert.alert('Error', 'Failed to load building compliance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadComplianceSummary();
    setIsRefreshing(false);
  };

  const handleTabChange = useCallback((tab: ComplianceTab) => {
    setActiveTab(tab);
  }, []);

  const getTabIcon = (tab: ComplianceTab): string => {
    switch (tab) {
      case ComplianceTab.OVERVIEW: return '📊';
      case ComplianceTab.HPD: return '🏠';
      case ComplianceTab.DOB: return '🏢';
      case ComplianceTab.DSNY: return '🗑️';
      case ComplianceTab.LL97: return '🌱';
      default: return '📋';
    }
  };

  const getTabColor = (tab: ComplianceTab): string => {
    switch (tab) {
      case ComplianceTab.OVERVIEW: return Colors.base.primary;
      case ComplianceTab.HPD: return Colors.status.warning;
      case ComplianceTab.DOB: return Colors.status.info;
      case ComplianceTab.DSNY: return Colors.status.success;
      case ComplianceTab.LL97: return Colors.status.info;
      default: return Colors.text.secondary;
    }
  };

  const getComplianceStatusColor = (status: string): string => {
    switch (status) {
      case 'compliant': return Colors.status.success;
      case 'warning': return Colors.status.warning;
      case 'critical': return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case ComplianceTab.OVERVIEW:
        return (
          <ComplianceSuiteView
            buildings={[{ id: buildingId, name: buildingName, address: buildingAddress }]}
            container={container}
            onViolationPress={(violation) => {
              // Handle violation press
              console.log('Violation pressed:', violation);
            }}
            onBuildingPress={(id) => {
              // Handle building press
              console.log('Building pressed:', id);
            }}
          />
        );
      
      case ComplianceTab.HPD:
        return (
          <HPDViolationsView
            buildingId={buildingId}
            buildingName={buildingName}
            container={container}
            onViolationPress={(violation) => {
              console.log('HPD violation pressed:', violation);
            }}
          />
        );
      
      case ComplianceTab.DOB:
        return (
          <DOBPermitsView
            buildingId={buildingId}
            buildingName={buildingName}
            container={container}
            onPermitPress={(permit) => {
              console.log('DOB permit pressed:', permit);
            }}
          />
        );
      
      case ComplianceTab.DSNY:
        return (
          <DSNYCollectionView
            buildingId={buildingId}
            buildingName={buildingName}
            container={container}
            onSchedulePress={(schedule) => {
              console.log('DSNY schedule pressed:', schedule);
            }}
          />
        );
      
      case ComplianceTab.LL97:
        return <LL97EmissionsView buildingId={buildingId} buildingName={buildingName} container={container} />;
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading building compliance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.buildingName}>{buildingName}</Text>
            <Text style={styles.buildingAddress}>{buildingAddress}</Text>
            {complianceSummary && (
              <View style={styles.complianceStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: getComplianceStatusColor(complianceSummary.complianceStatus) }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: getComplianceStatusColor(complianceSummary.complianceStatus) }
                ]}>
                  {complianceSummary.complianceStatus.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {complianceSummary && (
        <View style={styles.summaryGrid}>
          <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={[styles.summaryValue, { color: Colors.status.error }]}>
              {complianceSummary.totalViolations}
            </Text>
            <Text style={styles.summaryLabel}>Total Violations</Text>
          </GlassCard>
          
          <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={[styles.summaryValue, { color: Colors.status.warning }]}>
              {complianceSummary.openViolations}
            </Text>
            <Text style={styles.summaryLabel}>Open Violations</Text>
          </GlassCard>
          
          <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={[styles.summaryValue, { color: Colors.status.info }]}>
              {complianceSummary.activePermits}
            </Text>
            <Text style={styles.summaryLabel}>Active Permits</Text>
          </GlassCard>
        </View>
      )}

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabNavigation}>
        {Object.values(ComplianceTab).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab 
                  ? getTabColor(tab) 
                  : Colors.glass.thin
              }
            ]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={styles.tabIcon}>{getTabIcon(tab)}</Text>
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? Colors.text.primary : Colors.text.secondary }
            ]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>
    </View>
  );
};

// MARK: - LL97 Emissions View Component

interface LL97EmissionsViewProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
}

const LL97EmissionsView: React.FC<LL97EmissionsViewProps> = ({
  buildingId,
  buildingName,
  container,
}) => {
  const [emissions, setEmissions] = useState<LL97Emission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmissions();
  }, [buildingId]);

  const loadEmissions = async () => {
    setIsLoading(true);
    try {
      const complianceService = new (container as any).ComplianceService(container);
      const ll97Emissions = await complianceService.getLL97EmissionsForBuilding(buildingId);
      setEmissions(ll97Emissions);
    } catch (error) {
      console.error('Failed to load LL97 emissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading LL97 emissions data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.emissionsList}>
      {emissions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🌱</Text>
          <Text style={styles.emptyStateTitle}>No LL97 Data</Text>
          <Text style={styles.emptyStateSubtitle}>
            No Local Law 97 emissions data available for this building
          </Text>
        </View>
      ) : (
        emissions.map((emission) => (
          <GlassCard key={emission.bbl} style={styles.emissionCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.emissionTitle}>
              LL97 Emissions - {emission.year_built}
            </Text>
            <Text style={styles.emissionValue}>
              {parseFloat(emission.total_ghg_emissions || '0').toFixed(2)} kg CO2e/sf
            </Text>
            <Text style={styles.emissionBuildingClass}>
              Building Class: {emission.building_class}
            </Text>
          </GlassCard>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    marginRight: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.base.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  buildingAddress: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  complianceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  tabNavigation: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.thin,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  tabText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  emissionsList: {
    flex: 1,
    padding: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  emptyStateSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emissionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  emissionTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  emissionValue: {
    ...Typography.titleMedium,
    color: Colors.status.info,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  emissionBuildingClass: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});

export default BuildingComplianceDetailView;
