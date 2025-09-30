/**
 * 🗑️ Building Sanitation Tab
 * Mirrors: SwiftUI BuildingDetailView Sanitation tab functionality
 * Purpose: DSNY compliance, waste management, and sanitation tracking
 * Features: Collection schedules, compliance monitoring, waste tracking, DSNY violations
 */

import React, { useState, useEffect } from 'react';
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
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { ServiceContainer } from '@cyntientops/business-core';

export interface BuildingSanitationTabProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  container: ServiceContainer;
  onSanitationPress?: (sanitation: any) => void;
}

export interface DSNYCollectionSchedule {
  id: string;
  buildingId: string;
  collectionDay: string;
  collectionTime: string;
  wasteType: 'recyclables' | 'organics' | 'refuse' | 'bulk';
  lastCollection: Date;
  nextCollection: Date;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
}

export interface DSNYViolation {
  id: string;
  buildingId: string;
  violationType: string;
  description: string;
  issueDate: Date;
  status: 'open' | 'closed' | 'pending';
  fineAmount?: number;
  resolutionDate?: Date;
  notes?: string;
}

export interface SanitationStats {
  totalCollections: number;
  completedThisWeek: number;
  missedCollections: number;
  activeViolations: number;
  complianceScore: number;
  wasteReduction: number;
}

export const BuildingSanitationTab: React.FC<BuildingSanitationTabProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  container,
  onSanitationPress
}) => {
  const [collectionSchedules, setCollectionSchedules] = useState<DSNYCollectionSchedule[]>([]);
  const [dsnyViolations, setDsnyViolations] = useState<DSNYViolation[]>([]);
  const [sanitationStats, setSanitationStats] = useState<SanitationStats>({
    totalCollections: 0,
    completedThisWeek: 0,
    missedCollections: 0,
    activeViolations: 0,
    complianceScore: 0,
    wasteReduction: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DSNYCollectionSchedule | null>(null);
  const [filterWasteType, setFilterWasteType] = useState<'all' | 'recyclables' | 'organics' | 'refuse' | 'bulk'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'missed' | 'cancelled'>('all');

  useEffect(() => {
    loadSanitationData();
  }, [buildingId]);

  const loadSanitationData = async () => {
    setIsLoading(true);
    try {
      // Load DSNY data from API and hardcoded sources
      const [schedules, violations] = await Promise.all([
        generateCollectionSchedules(buildingId),
        generateDSNYViolations(buildingId)
      ]);
      
      setCollectionSchedules(schedules);
      setDsnyViolations(violations);
      calculateSanitationStats(schedules, violations);
    } catch (error) {
      console.error('Failed to load sanitation data:', error);
      Alert.alert('Error', 'Failed to load sanitation data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCollectionSchedules = async (buildingId: string): Promise<DSNYCollectionSchedule[]> => {
    // Generate building-specific collection schedules based on hardcoded data
    const buildingSchedules = {
      '1': [ // 12 West 18th Street
        {
          id: 'dsny_1_1',
          buildingId: buildingId,
          collectionDay: 'Tuesday',
          collectionTime: '6:00 AM',
          wasteType: 'refuse' as const,
          lastCollection: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          nextCollection: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          status: 'scheduled' as const,
          notes: 'Regular weekly collection'
        },
        {
          id: 'dsny_1_2',
          buildingId: buildingId,
          collectionDay: 'Tuesday',
          collectionTime: '6:00 AM',
          wasteType: 'recyclables' as const,
          lastCollection: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          nextCollection: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          status: 'scheduled' as const,
          notes: 'Paper and cardboard recycling'
        },
        {
          id: 'dsny_1_3',
          buildingId: buildingId,
          collectionDay: 'Friday',
          collectionTime: '6:00 AM',
          wasteType: 'organics' as const,
          lastCollection: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          nextCollection: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          status: 'completed' as const,
          notes: 'Food scraps and yard waste'
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area)
        {
          id: 'dsny_4_1',
          buildingId: buildingId,
          collectionDay: 'Monday',
          collectionTime: '7:00 AM',
          wasteType: 'refuse' as const,
          lastCollection: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          nextCollection: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          status: 'scheduled' as const,
          notes: 'Museum area collection - special handling required'
        },
        {
          id: 'dsny_4_2',
          buildingId: buildingId,
          collectionDay: 'Monday',
          collectionTime: '7:00 AM',
          wasteType: 'recyclables' as const,
          lastCollection: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          nextCollection: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          status: 'scheduled' as const,
          notes: 'Mixed recyclables - museum materials'
        },
        {
          id: 'dsny_4_3',
          buildingId: buildingId,
          collectionDay: 'Thursday',
          collectionTime: '7:00 AM',
          wasteType: 'bulk' as const,
          lastCollection: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          nextCollection: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          status: 'completed' as const,
          notes: 'Large items and furniture'
        }
      ]
    };

    return buildingSchedules[buildingId as keyof typeof buildingSchedules] || [];
  };

  const generateDSNYViolations = async (buildingId: string): Promise<DSNYViolation[]> => {
    // Generate building-specific DSNY violations based on hardcoded data
    const buildingViolations = {
      '1': [ // 12 West 18th Street
        {
          id: 'violation_1_1',
          buildingId: buildingId,
          violationType: 'Improper Setout',
          description: 'Trash bags placed outside designated area',
          issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          status: 'closed' as const,
          fineAmount: 100,
          resolutionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          notes: 'Resolved - proper setout procedures implemented'
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area)
        {
          id: 'violation_4_1',
          buildingId: buildingId,
          violationType: 'Recycling Violation',
          description: 'Contaminated recyclables in collection',
          issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          status: 'open' as const,
          fineAmount: 150,
          notes: 'Pending resolution - education program in progress'
        }
      ]
    };

    return buildingViolations[buildingId as keyof typeof buildingViolations] || [];
  };

  const calculateSanitationStats = (schedules: DSNYCollectionSchedule[], violations: DSNYViolation[]) => {
    const totalCollections = schedules.length;
    const completedThisWeek = schedules.filter(s => 
      s.status === 'completed' && 
      s.lastCollection.getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const missedCollections = schedules.filter(s => s.status === 'missed').length;
    const activeViolations = violations.filter(v => v.status === 'open').length;
    const complianceScore = violations.length > 0 
      ? Math.round(((violations.length - activeViolations) / violations.length) * 100)
      : 100;
    const wasteReduction = Math.round(Math.random() * 20 + 10); // Mock data

    setSanitationStats({
      totalCollections,
      completedThisWeek,
      missedCollections,
      activeViolations,
      complianceScore,
      wasteReduction
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSanitationData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'scheduled': return Colors.info;
      case 'missed': return Colors.critical;
      case 'cancelled': return Colors.inactive;
      default: return Colors.inactive;
    }
  };

  const getWasteTypeIcon = (wasteType: string) => {
    switch (wasteType) {
      case 'recyclables': return '♻️';
      case 'organics': return '🍃';
      case 'refuse': return '🗑️';
      case 'bulk': return '📦';
      default: return '🗑️';
    }
  };

  const getWasteTypeColor = (wasteType: string) => {
    switch (wasteType) {
      case 'recyclables': return Colors.info;
      case 'organics': return Colors.success;
      case 'refuse': return Colors.warning;
      case 'bulk': return Colors.primaryAction;
      default: return Colors.inactive;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const renderCollectionSchedule = (schedule: DSNYCollectionSchedule) => {
    const isOverdue = schedule.status === 'scheduled' && schedule.nextCollection < new Date();
    const isSelected = selectedSchedule?.id === schedule.id;

    return (
      <TouchableOpacity
        key={schedule.id}
        onPress={() => {
          setSelectedSchedule(schedule);
          onSanitationPress?.(schedule);
        }}
      >
        <GlassCard 
          style={[
            styles.scheduleCard,
            isOverdue && styles.overdueScheduleCard,
            isSelected && styles.selectedScheduleCard
          ]} 
          intensity={GlassIntensity.REGULAR} 
          cornerRadius={CornerRadius.CARD}
        >
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleHeaderLeft}>
              <Text style={styles.scheduleIcon}>{getWasteTypeIcon(schedule.wasteType)}</Text>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleTitle}>
                  {schedule.wasteType.charAt(0).toUpperCase() + schedule.wasteType.slice(1)} Collection
                </Text>
                <Text style={styles.scheduleDescription}>
                  {schedule.collectionDay} at {schedule.collectionTime}
                </Text>
              </View>
            </View>
            
            <View style={styles.scheduleHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(schedule.status) }]}>
                  {schedule.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.scheduleMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Last Collection</Text>
                <Text style={styles.metaValue}>
                  {formatDate(schedule.lastCollection)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Next Collection</Text>
                <Text style={[styles.metaValue, isOverdue && { color: Colors.critical }]}>
                  {formatDate(schedule.nextCollection)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Time Until</Text>
                <Text style={[styles.metaValue, isOverdue && { color: Colors.critical }]}>
                  {formatTimeUntil(schedule.nextCollection)}
                </Text>
              </View>
            </View>
          </View>

          {schedule.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{schedule.notes}</Text>
            </View>
          )}

          {isOverdue && (
            <View style={styles.overdueWarning}>
              <Text style={styles.overdueText}>⚠️ This collection is overdue</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderViolations = () => {
    if (dsnyViolations.length === 0) return null;

    return (
      <GlassCard style={styles.violationsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.violationsTitle}>DSNY Violations</Text>
        {dsnyViolations.map(violation => (
          <View key={violation.id} style={styles.violationItem}>
            <View style={styles.violationHeader}>
              <Text style={styles.violationType}>{violation.violationType}</Text>
              <View style={[
                styles.violationStatusBadge,
                { backgroundColor: violation.status === 'open' ? Colors.critical + '20' : Colors.success + '20' }
              ]}>
                <Text style={[
                  styles.violationStatusText,
                  { color: violation.status === 'open' ? Colors.critical : Colors.success }
                ]}>
                  {violation.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.violationDescription}>{violation.description}</Text>
            <View style={styles.violationMeta}>
              <Text style={styles.violationDate}>
                Issued: {formatDate(violation.issueDate)}
              </Text>
              {violation.fineAmount && (
                <Text style={styles.violationFine}>
                  Fine: ${violation.fineAmount}
                </Text>
              )}
            </View>
            {violation.notes && (
              <Text style={styles.violationNotes}>{violation.notes}</Text>
            )}
          </View>
        ))}
      </GlassCard>
    );
  };

  const renderStats = () => {
    return (
      <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.statsTitle}>Sanitation Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sanitationStats.totalCollections}</Text>
            <Text style={styles.statLabel}>Total Collections</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{sanitationStats.completedThisWeek}</Text>
            <Text style={styles.statLabel}>Completed This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.critical }]}>{sanitationStats.missedCollections}</Text>
            <Text style={styles.statLabel}>Missed Collections</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{sanitationStats.activeViolations}</Text>
            <Text style={styles.statLabel}>Active Violations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.primaryAction }]}>{sanitationStats.complianceScore}%</Text>
            <Text style={styles.statLabel}>Compliance Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{sanitationStats.wasteReduction}%</Text>
            <Text style={styles.statLabel}>Waste Reduction</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderFilters = () => {
    return (
      <GlassCard style={styles.filtersCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.filtersTitle}>Filters</Text>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Waste Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'recyclables', 'organics', 'refuse', 'bulk'].map(wasteType => (
              <TouchableOpacity
                key={wasteType}
                style={[
                  styles.filterOption,
                  filterWasteType === wasteType && styles.filterOptionSelected
                ]}
                onPress={() => setFilterWasteType(wasteType as any)}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterWasteType === wasteType && styles.filterOptionTextSelected
                ]}>
                  {wasteType.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'scheduled', 'completed', 'missed', 'cancelled'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  filterStatus === status && styles.filterOptionSelected
                ]}
                onPress={() => setFilterStatus(status as any)}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterStatus === status && styles.filterOptionTextSelected
                ]}>
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </GlassCard>
    );
  };

  const filteredSchedules = collectionSchedules.filter(schedule => {
    const wasteTypeMatch = filterWasteType === 'all' || schedule.wasteType === filterWasteType;
    const statusMatch = filterStatus === 'all' || schedule.status === filterStatus;
    return wasteTypeMatch && statusMatch;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading sanitation data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryAction}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🗑️ Sanitation Management</Text>
          <Text style={styles.headerSubtitle}>
            DSNY compliance and waste management for {buildingName}
          </Text>
        </View>

        {renderStats()}
        {renderFilters()}

        <View style={styles.schedulesContainer}>
          <Text style={styles.sectionTitle}>Collection Schedules</Text>
          {filteredSchedules.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyTitle}>No Collection Schedules</Text>
              <Text style={styles.emptyDescription}>
                No collection schedules match the current filters.
              </Text>
            </GlassCard>
          ) : (
            filteredSchedules.map(renderCollectionSchedule)
          )}
        </View>

        {renderViolations()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  statsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  filtersCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  filtersTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  filterRow: {
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.glassOverlay,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  filterOptionText: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  schedulesContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  scheduleCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  overdueScheduleCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  selectedScheduleCard: {
    borderWidth: 2,
    borderColor: Colors.primaryAction,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  scheduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  scheduleHeaderRight: {
    marginLeft: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  scheduleMeta: {
    marginTop: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 6,
  },
  notesLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  notesText: {
    ...Typography.caption,
    color: Colors.primaryText,
  },
  overdueWarning: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.critical + '20',
    borderRadius: 6,
  },
  overdueText: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: '500',
    textAlign: 'center',
  },
  violationsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  violationsTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  violationItem: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  violationType: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  violationStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  violationStatusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  violationDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  violationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  violationDate: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
  },
  violationFine: {
    ...Typography.captionSmall,
    color: Colors.warning,
    fontWeight: '600',
  },
  violationNotes: {
    ...Typography.captionSmall,
    color: Colors.primaryText,
    fontStyle: 'italic',
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
});

export default BuildingSanitationTab;