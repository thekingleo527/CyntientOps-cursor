/**
 * BuildingDetailScreen
 * 
 * Comprehensive building detail view with real-time data integration
 * Features: NYC API integration, violation tracking, compliance scoring
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius, BuildingDetailOverview } from '@cyntientops/ui-components';
import { RealDataService } from '@cyntientops/business-core';
import { NYCService } from '@cyntientops/business-core';
import { useServices } from '../providers/AppProvider';
import { ViolationDataService } from '../services/ViolationDataService';
import config from '../config/app.config';
import { DSNYAPIClient } from '@cyntientops/api-clients';
import { PropertyDataService } from '@cyntientops/business-core';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

// Types
interface ViolationSummary {
  hpd: number;
  dob: number;
  dsny: number;
  outstanding: number;
  score: number;
}

interface BuildingDetailScreenProps {
  route: RouteProp<RootStackParamList, 'BuildingDetail'>;
}

// Helper Components
const StatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statPill}>
    <Text style={styles.statPillLabel}>{label}</Text>
    <Text style={styles.statPillValue}>{value}</Text>
  </View>
);

const ViolationCard: React.FC<{ title: string; count: number; color: string }> = ({ title, count, color }) => (
  <View style={[styles.violationCard, { borderLeftColor: color }]}>
    <Text style={styles.violationTitle}>{title}</Text>
    <Text style={[styles.violationCount, { color }]}>{count}</Text>
  </View>
);

const ComplianceScore: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  return (
    <View style={styles.complianceContainer}>
      <Text style={styles.complianceLabel}>Compliance Score</Text>
      <Text style={[styles.complianceScore, { color: getScoreColor(score) }]}>{score}%</Text>
    </View>
  );
};

const ScheduleCard: React.FC<{ nextPickup: Date }> = ({ nextPickup }) => (
  <View style={styles.scheduleCard}>
    <Text style={styles.scheduleTitle}>Next Pickup</Text>
    <Text style={styles.scheduleDate}>{nextPickup.toLocaleDateString()}</Text>
  </View>
);

// Main Component
export const BuildingDetailScreen: React.FC<BuildingDetailScreenProps> = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'BuildingDetail'>>();
  const { buildingId } = route.params;
  const services = useServices();

  // State
  const [building, setBuilding] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  const [violationSummary, setViolationSummary] = useState<ViolationSummary>({
    hpd: 0,
    dob: 0,
    dsny: 0,
    outstanding: 0,
    score: 100,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPickup, setNextPickup] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Load building data
  useEffect(() => {
    const loadBuildingData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load building and routines
        const buildingData = RealDataService.getBuildingById(buildingId);
        const routinesData = RealDataService.getRoutinesByBuildingId(buildingId);

        if (!buildingData) {
          throw new Error('Building not found');
        }

        setBuilding(buildingData);
        setRoutines(routinesData || []);

        // Load violation data
        const violationData = ViolationDataService.getViolationData(buildingId);
        setViolationSummary(violationData);

      } catch (err) {
        console.error('Error loading building data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load building data');
      } finally {
        setIsLoading(false);
      }
    };

    loadBuildingData();
  }, [buildingId, services.database]);

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        if (buildingId) {
          const inventory = await services.inventory.getInventory(buildingId);
          console.log('Building inventory:', inventory);
        }
      } catch (err) {
        console.error('Error loading inventory:', err);
      }
    };

    loadInventory();
  }, [services.inventory, buildingId]);

  // Attempt live NYC API integration with fallback to local violation data
  useEffect(() => {
    const loadNYC = async () => {
      try {
        const nyc = NYCService.getInstance(services.cacheManager);
        const data = await nyc.getComprehensiveBuildingData(buildingId);
        // Map to ViolationSummary shape
        const hpdCount = Array.isArray(data.violations) ? data.violations.length : 0;
        const dsnyCount = data.dsnyViolations && !data.dsnyViolations.isEmpty ? data.dsnyViolations.summons.length : 0;
        const dobCount = Array.isArray(data.permits) ? data.permits.length : 0;
        const outstanding = (data.dsnyViolations?.summons || []).reduce((sum: number, s: any) => sum + (parseFloat(s.balance_due) || 0), 0);
        const score = Math.max(0, Math.min(100, 100 - Math.round(hpdCount * 2 + dobCount + Math.min(outstanding / 1000, 40) + dsnyCount)));
        setViolationSummary({ hpd: hpdCount, dob: dobCount, dsny: dsnyCount, outstanding, score });
      } catch (err) {
        console.warn('NYC API integration failed, using local data:', err);
      }
    };

    if (config.enableRealTimeSync) {
    loadNYC();
    }
  }, [buildingId, services.cacheManager]);

  // Helper functions
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '—';
    return num.toLocaleString();
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const handleRefresh = useCallback(async () => {
    // Refresh logic here
    console.log('Refreshing building data...');
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Loading building details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !building) {
              return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error ?? 'Unable to load building details'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const complianceScore = violationSummary.score;
  const imageSource = building.imageUrl ? { uri: building.imageUrl } : null;

  const renderHeroSection = () => (
    <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD} style={styles.heroCard}>
      <View style={styles.heroContent}>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{building.name}</Text>
          <Text style={styles.heroSubtitle}>{building.address}</Text>
          <View style={styles.heroStatsRow}>
            <StatPill label="Compliance" value={`${complianceScore}%`} />
            <StatPill label="Units" value={building.numberOfUnits ?? '—'} />
            <StatPill label="Sq Ft" value={formatNumber(building.squareFootage)} />
          </View>
        </View>
        {imageSource ? <Image source={imageSource} style={styles.heroImage} resizeMode="cover" /> : null}
                  </View>
    </GlassCard>
  );

const renderSectionHeader = (title: string) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

  const renderComplianceSection = () => (
    <View style={styles.sectionGroup}>
      {renderSectionHeader('Compliance Overview')}
      <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD} style={styles.sectionCard}>
        <ComplianceScore score={complianceScore} />
        <View style={styles.violationsGrid}>
          <ViolationCard title="HPD Violations" count={violationSummary.hpd} color={Colors.error} />
          <ViolationCard title="DOB Violations" count={violationSummary.dob} color={Colors.warning} />
          <ViolationCard title="DSNY Violations" count={violationSummary.dsny} color={Colors.info} />
        </View>
        {violationSummary.outstanding > 0 && (
          <View style={styles.outstandingContainer}>
            <Text style={styles.outstandingLabel}>Outstanding Fines</Text>
            <Text style={styles.outstandingAmount}>${violationSummary.outstanding.toLocaleString()}</Text>
        </View>
      )}
    </GlassCard>
    </View>
  );

  const renderRoutinesSection = () => (
    <View style={styles.sectionGroup}>
      {renderSectionHeader('Maintenance Routines')}
      <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD} style={styles.sectionCard}>
        {routines.length > 0 ? (
          routines.map((routine, index) => (
            <View key={routine.id || index} style={styles.routineItem}>
              <Text style={styles.routineName}>{routine.name}</Text>
              <Text style={styles.routineFrequency}>{routine.frequency}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No maintenance routines scheduled</Text>
        )}
  </GlassCard>
    </View>
  );

  const renderScheduleSection = () => (
    <View style={styles.sectionGroup}>
      {renderSectionHeader('Upcoming Schedule')}
      <GlassCard intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD} style={styles.sectionCard}>
        <ScheduleCard nextPickup={nextPickup} />
      </GlassCard>
        </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderHeroSection()}
        {renderComplianceSection()}
        {renderRoutinesSection()}
        {renderScheduleSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '400',
  },
  errorText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: '500',
  },
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroImage: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 16,
  },
  sectionGroup: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  complianceContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  complianceLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  complianceScore: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  violationsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  violationCard: {
    flex: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  violationTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  violationCount: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  outstandingContainer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  outstandingAmount: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.error,
  },
  routineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  routineFrequency: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text.secondary,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scheduleCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  scheduleDate: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  statPill: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  statPillLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
});

export default BuildingDetailScreen;