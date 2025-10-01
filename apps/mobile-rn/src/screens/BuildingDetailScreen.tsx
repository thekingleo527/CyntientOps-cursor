/**
 * 🏢 Building Detail Screen
 * Mirrors: CyntientOps/Views/Components/Buildings/BuildingDetailView.swift
 * Purpose: Comprehensive building detail view with overview, compliance, team, and routines
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';
import { ViolationDataService } from '../services/ViolationDataService';
import { PropertyDataService } from '@cyntientops/business-core';
import { RootStackParamList } from '../navigation/AppNavigator';

interface CollectionScheduleSummary {
  bin: string;
  buildingId: string;
  buildingName: string;
  address: string;
  regularCollectionDay: string;
  recyclingDay: string;
  organicsDay: string;
  bulkPickupDay: string;
  nextCollectionDate: Date;
  nextRecyclingDate: Date;
  nextOrganicsDate: Date;
  nextBulkPickupDate: Date;
  collectionFrequency: string;
  specialInstructions: string[];
}

interface ViolationSummary {
  hpd: number;
  dob: number;
  dsny: number;
  outstanding: number;
  score: number;
}

// ✅ REAL NYC VIOLATION DATA - Updated from NYC APIs on 2025-10-01
// Source: HPD, DOB, and ECB violation APIs (DSNY violations are in ECB system)
// Note: DSNY violations are handled through the ECB system, not a separate DSNY API
// Data now sourced from ViolationDataService which uses live NYC API data

class InlineNYCAPIService {
  // ✅ REAL BBL NUMBERS - Updated from NYC PLUTO dataset on 2025-10-01
  private readonly binMap: Record<string, string> = {
    '1': '1008197501.00000000',  // 12 West 18th Street
    '3': '1007930017.00000000',  // 135-139 West 17th Street
    '4': '1001780005.00000000',  // 104 Franklin Street
    '5': '1007927502.00000000',  // 138 West 17th Street
    '6': '1006210051.00000000',  // 68 Perry Street
    '7': 'MOCK',                 // 112 West 18th Street (not found in PLUTO)
    '8': '1002040024.00000000',  // 41 Elizabeth Street
    '9': 'MOCK',                 // 117 West 17th Street (not found in PLUTO)
    '10': '1006330028.00000000', // 131 Perry Street
    '11': '1004490034.00000000', // 123 1st Avenue
    '13': '1007927507.00000000', // 136 West 17th Street
    '14': '1007920064.00000000', // Rubin Museum (150 West 17th)
    '15': '1008710030.00000000', // 133 East 15th Street
    '16': 'MOCK',                // Stuyvesant Cove Park (not in PLUTO)
    '17': '1004880016.00000000', // 178 Spring Street
    '18': '1001940014.00000000', // 36 Walker Street
    '19': 'MOCK',                // 115 7th Avenue (not found in PLUTO)
    '21': '1001377505.00000000', // 148 Chambers Street
  };

  public extractBIN(buildingId: string): string {
    return this.binMap[buildingId] || '';
  }

  public async getCollectionScheduleSummary(
    bin: string,
    buildingName: string,
    address: string,
  ): Promise<CollectionScheduleSummary> {
    const today = new Date();
    const createFutureDate = (offsetDays: number) => {
      const future = new Date(today);
      future.setDate(today.getDate() + offsetDays);
      return future;
    };

    return {
      bin,
      buildingId: bin,
      buildingName,
      address,
      regularCollectionDay: 'Monday',
      recyclingDay: 'Wednesday',
      organicsDay: 'Friday',
      bulkPickupDay: 'Saturday',
      nextCollectionDate: createFutureDate(2),
      nextRecyclingDate: createFutureDate(3),
      nextOrganicsDate: createFutureDate(4),
      nextBulkPickupDate: createFutureDate(5),
      collectionFrequency: 'Weekly',
      specialInstructions: [
        'Place trash out by 6:00 AM on collection day',
        'Separate recycling into blue and green bins',
        'Bulk pickups require 311 appointment scheduling',
      ],
    };
  }
}

const nycAPIService = new InlineNYCAPIService();

const { width } = Dimensions.get('window');

interface RoutineSummary {
  id: string;
  title: string;
  category: string;
  workerName: string;
  startHour: number;
  endHour: number;
  daysOfWeek: string;
  requiresPhoto: boolean;
}

interface WorkerSummary {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  status?: string;
}

type BuildingDetailRoute = RouteProp<RootStackParamList, 'BuildingDetail'>;

export const BuildingDetailScreen: React.FC = () => {
  const route = useRoute<BuildingDetailRoute>();
  const { buildingId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<CollectionScheduleSummary | null>(null);

  const building = useMemo(() => RealDataService.getBuildingById(buildingId), [buildingId]);
  const routines = useMemo(() => RealDataService.getRoutinesByBuildingId(buildingId), [buildingId]);
  const workers = useMemo(() => {
    const workerIds = Array.from(new Set(routines.map((routine) => routine.workerId)));
    return workerIds
      .map((workerId) => RealDataService.getWorkerById(workerId))
      .filter(Boolean) as WorkerSummary[];
  }, [routines]);

  const routineSummaries: RoutineSummary[] = useMemo(
    () =>
      routines.map((routine) => {
        const worker = RealDataService.getWorkerById(routine.workerId);
        return {
          id: routine.id,
          title: routine.title,
          category: routine.category,
          workerName: worker?.name ?? 'Unassigned',
          startHour: routine.startHour,
          endHour: routine.endHour,
          daysOfWeek: routine.daysOfWeek,
          requiresPhoto: routine.requiresPhoto,
        };
      }),
    [routines],
  );

  // Get real violation data from ViolationDataService
  const violationSummary = ViolationDataService.getViolationData(buildingId);

  // Get property details from PropertyDataService
  const propertyDetails = PropertyDataService.getPropertyDetails(buildingId);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!building) {
        setError('Building not found');
        setIsLoading(false);
        return;
      }

      try {
        const bin = nycAPIService.extractBIN(building.id);
        const summary = await nycAPIService.getCollectionScheduleSummary(bin, building.name, building.address);
        setSchedule(summary);
      } catch (scheduleError) {
        console.error('Failed to load collection schedule', scheduleError);
        setSchedule(null);
    } finally {
      setIsLoading(false);
    }
  };

    loadSchedule();
  }, [building]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Loading building details…</Text>
      </SafeAreaView>
    );
  }

  if (error || !building) {
              return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error ?? 'Unable to load building details'}</Text>
      </SafeAreaView>
    );
  }

  const complianceScore = Math.round((building.compliance_score ?? violationSummary.score / 100) * 100);

              return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHero(building, complianceScore)}

        {propertyDetails && (
          <View style={styles.sectionGroup}>
            {renderSectionHeader('Property Information')}
            {renderPropertyDetailsCard(propertyDetails)}
          </View>
        )}

        <View style={styles.sectionGroup}>
          {renderSectionHeader('Compliance Overview')}
          {renderComplianceCard(violationSummary, complianceScore)}
        </View>
        
        {schedule && (
          <View style={styles.sectionGroup}>
            {renderSectionHeader('Sanitation Schedule')}
            {renderScheduleCard(schedule)}
              </View>
        )}

        <View style={styles.sectionGroup}>
          {renderSectionHeader('Assigned Team')}
          {workers.length > 0 ? workers.map(renderWorkerCard) : renderEmptyMessage('No active worker assignments')}
        </View>
        
        <View style={styles.sectionGroup}>
          {renderSectionHeader('Routine Tasks')}
          {routineSummaries.length > 0
            ? routineSummaries.map(renderRoutineCard)
            : renderEmptyMessage('No routines defined for this building')}
              </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const renderHero = (building: any, complianceScore: number) => {
  const imageSource = building.imageAssetName
    ? { uri: `https://images.cyntientops.com/buildings/${building.imageAssetName}.jpg` }
    : undefined;

    return (
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
};

const renderSectionHeader = (title: string) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const renderPropertyDetailsCard = (property: any) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const InfoRow = ({ label, value }: { label: string; value: string | number }) => (
    <View style={styles.propertyInfoRow}>
      <Text style={styles.propertyInfoLabel}>{label}</Text>
      <Text style={styles.propertyInfoValue}>{value}</Text>
    </View>
  );

  return (
    <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.sectionCard}>
      <View style={styles.propertyValuesSection}>
        <View style={styles.propertyValueItem}>
          <Text style={styles.propertyValueLabel}>Market Value</Text>
          <Text style={styles.propertyValueAmount}>{formatCurrency(property.marketValue)}</Text>
          <Text style={styles.propertyValuePerSqFt}>{formatCurrency(property.marketValuePerSqFt)}/sq ft</Text>
        </View>
        <View style={styles.propertyValueItem}>
          <Text style={styles.propertyValueLabel}>Assessed (Tax)</Text>
          <Text style={styles.propertyValueAmount}>{formatCurrency(property.assessedValue)}</Text>
          <Text style={styles.propertyValuePerSqFt}>45% of market</Text>
        </View>
      </View>

      <View style={styles.propertyDivider} />

      <InfoRow label="Year Built" value={property.yearBuilt} />
      {property.yearRenovated && <InfoRow label="Renovated" value={property.yearRenovated} />}
      <InfoRow label="Neighborhood" value={property.neighborhood} />
      {property.historicDistrict && <InfoRow label="Historic District" value={property.historicDistrict} />}

      <View style={styles.propertyDivider} />

      <InfoRow label="Total Units" value={`${property.unitsTotal} (${property.unitsResidential} res, ${property.unitsCommercial} com)`} />
      <InfoRow label="Building Area" value={`${formatNumber(property.buildingArea)} sq ft`} />
      <InfoRow label="Lot Area" value={`${formatNumber(property.lotArea)} sq ft`} />
      <InfoRow label="Floors" value={property.numFloors} />

      <View style={styles.propertyDivider} />

      <InfoRow label="Zoning" value={property.zoning} />
      <InfoRow label="FAR (Built / Max)" value={`${property.builtFAR.toFixed(2)} / ${property.maxFAR.toFixed(2)}`} />
      {property.unusedFARPercent > 0 && (
        <View style={styles.farOpportunityBanner}>
          <Text style={styles.farOpportunityText}>
            ✨ {property.unusedFARPercent}% unused FAR - Development opportunity available
          </Text>
        </View>
      )}

      <View style={styles.propertyDivider} />

      <InfoRow label="Ownership Type" value={property.ownershipType} />
      <InfoRow label="Owner" value={property.ownerName} />
      <InfoRow label="Building Class" value={property.buildingClass} />
    </GlassCard>
  );
};

const renderComplianceCard = (summary: ViolationSummary, complianceScore: number) => (
  <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.sectionCard}>
    <View style={styles.complianceRow}>
      <View style={styles.complianceMetric}>
        <Text style={styles.metricLabel}>Compliance Score</Text>
        <Text style={styles.metricValue}>{complianceScore}%</Text>
        </View>
      <View style={styles.complianceMetric}>
        <Text style={styles.metricLabel}>Outstanding</Text>
        <Text style={styles.metricValue}>{summary.outstanding}</Text>
          </View>
      <View style={styles.complianceMetric}>
        <Text style={styles.metricLabel}>DOB</Text>
        <Text style={styles.metricValue}>{summary.dob}</Text>
          </View>
      <View style={styles.complianceMetric}>
        <Text style={styles.metricLabel}>DSNY</Text>
        <Text style={styles.metricValue}>{summary.dsny}</Text>
          </View>
          </View>
  </GlassCard>
);

const renderScheduleCard = (schedule: CollectionScheduleSummary) => (
  <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.sectionCard}>
    <View style={styles.scheduleRow}>
      <ScheduleColumn header="Trash" day={schedule.regularCollectionDay} nextPickup={schedule.nextCollectionDate} />
      <ScheduleColumn header="Recycling" day={schedule.recyclingDay} nextPickup={schedule.nextRecyclingDate} />
      <ScheduleColumn header="Organics" day={schedule.organicsDay} nextPickup={schedule.nextOrganicsDate} />
      <ScheduleColumn header="Bulk" day={schedule.bulkPickupDay} nextPickup={schedule.nextBulkPickupDate} />
            </View>
    <View style={styles.scheduleNotes}>
      {schedule.specialInstructions.map((instruction, index) => (
        <Text key={instruction} style={styles.scheduleInstruction}>
          {index + 1}. {instruction}
        </Text>
          ))}
        </View>
  </GlassCard>
);

const renderWorkerCard = (worker: WorkerSummary) => (
  <GlassCard
    key={worker.id}
    intensity={GlassIntensity.THIN}
    cornerRadius={CornerRadius.MEDIUM}
    style={styles.sectionCard}
  >
    <View style={styles.workerRow}>
      <View style={styles.workerAvatar}>
        <Text style={styles.workerInitials}>{getInitials(worker.name)}</Text>
        </View>
      <View style={styles.workerDetails}>
        <Text style={styles.workerName}>{worker.name}</Text>
        <Text style={styles.workerMeta}>{worker.role}</Text>
        {worker.phone ? <Text style={styles.workerMeta}>{worker.phone}</Text> : null}
        {worker.email ? <Text style={styles.workerMeta}>{worker.email}</Text> : null}
        </View>
    </View>
  </GlassCard>
);

const renderRoutineCard = (routine: RoutineSummary) => (
  <GlassCard
    key={routine.id}
    intensity={GlassIntensity.THIN}
    cornerRadius={CornerRadius.MEDIUM}
    style={styles.sectionCard}
  >
    <View style={styles.routineRow}>
      <View style={styles.routineInfo}>
        <Text style={styles.routineTitle}>{routine.title}</Text>
        <Text style={styles.routineMeta}>
          {routine.workerName} • {routine.category}
            </Text>
        <Text style={styles.routineMeta}>
          {formatTimeRange(routine.startHour, routine.endHour)} • {routine.daysOfWeek}
        </Text>
        <Text style={styles.routineMeta}>
          Photo Evidence: {routine.requiresPhoto ? 'Required' : 'Optional'}
                  </Text>
                </View>
      <TouchableOpacity style={styles.routineAction}>
        <Text style={styles.routineActionText}>Open</Text>
      </TouchableOpacity>
        </View>
  </GlassCard>
);

const renderEmptyMessage = (message: string) => (
  <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.sectionCard}>
    <Text style={styles.emptyMessage}>{message}</Text>
  </GlassCard>
);

const formatNumber = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
};

const formatTimeRange = (startHour: number, endHour: number) => {
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${normalizedHour} ${period}`;
  };

  return `${formatHour(startHour)} - ${formatHour(endHour)}`;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.statPill}>
    <Text style={styles.statPillValue}>{value}</Text>
    <Text style={styles.statPillLabel}>{label}</Text>
        </View>
);

const ScheduleColumn = ({
  header,
  day,
  nextPickup,
}: {
  header: string;
  day: string;
  nextPickup: Date;
}) => (
  <View style={styles.scheduleColumn}>
    <Text style={styles.scheduleHeader}>{header}</Text>
    <Text style={styles.scheduleDay}>{day}</Text>
    <Text style={styles.scheduleDate}>{nextPickup.toLocaleDateString()}</Text>
      </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    ...Typography.bodyMedium,
  },
  errorText: {
    color: Colors.error,
    ...Typography.bodyLarge,
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
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.bodyMedium,
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
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  complianceMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleHeader: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  scheduleDay: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  scheduleDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  scheduleNotes: {
    marginTop: Spacing.lg,
  },
  scheduleInstruction: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.role.admin.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  workerInitials: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  workerMeta: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  routineTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  routineMeta: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  routineAction: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    backgroundColor: Colors.role.worker.primary,
  },
  routineActionText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  emptyMessage: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.role.worker.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillValue: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statPillLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  propertyValuesSection: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  propertyValueItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  propertyValueLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  propertyValueAmount: {
    ...Typography.titleLarge,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  propertyValuePerSqFt: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  propertyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  propertyInfoLabel: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    flex: 1,
  },
  propertyInfoValue: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  propertyDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  farOpportunityBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  farOpportunityText: {
    ...Typography.bodyMedium,
    color: Colors.success,
    fontWeight: '600',
  },
});

export default BuildingDetailScreen;
