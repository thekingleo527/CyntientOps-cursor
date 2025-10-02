/**
 * 🗑️ DSNY Collection Schedule View
 * Mirrors: CyntientOps/Views/Compliance/DSNYCollectionView.swift
 * Purpose: Display DSNY collection schedules and waste management
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
import { DSNYRoute } from '@cyntientops/api-clients';
import { ServiceContainer } from '@cyntientops/business-core';

export interface DSNYCollectionViewProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  onSchedulePress?: (schedule: DSNYRoute) => void;
}

export const DSNYCollectionView: React.FC<DSNYCollectionViewProps> = ({
  buildingId,
  buildingName,
  container,
  onSchedulePress,
}) => {
  const [schedule, setSchedule] = useState<DSNYRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [buildingId]);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const complianceService = new (container as any).ComplianceService(container);
      const dsnySchedule = await complianceService.getDSNYCollectionScheduleForBuilding(buildingId);
      setSchedule(dsnySchedule);
    } catch (error) {
      console.error('Failed to load DSNY schedule:', error);
      Alert.alert('Error', 'Failed to load DSNY collection schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSchedule();
    setIsRefreshing(false);
  };

  const handleSchedulePress = useCallback(() => {
    if (schedule) {
      onSchedulePress?.(schedule);
    }
  }, [schedule, onSchedulePress]);

  const getNextCollectionDate = (dayOfWeek: string): Date => {
    const today = new Date();
    const dayMap: Record<string, number> = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
      'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };
    
    const targetDay = dayMap[dayOfWeek] || 1;
    const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + (daysUntilTarget || 7));
    return nextDate;
  };

  const getDaysUntilCollection = (dayOfWeek: string): number => {
    const nextDate = getNextCollectionDate(dayOfWeek);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCollectionStatus = (daysUntil: number): 'today' | 'tomorrow' | 'upcoming' => {
    if (daysUntil === 0) return 'today';
    if (daysUntil === 1) return 'tomorrow';
    return 'upcoming';
  };

  const getStatusColor = (status: 'today' | 'tomorrow' | 'upcoming'): string => {
    switch (status) {
      case 'today': return Colors.status.error;
      case 'tomorrow': return Colors.status.warning;
      case 'upcoming': return Colors.status.info;
    }
  };

  const getStatusText = (status: 'today' | 'tomorrow' | 'upcoming'): string => {
    switch (status) {
      case 'today': return 'TODAY';
      case 'tomorrow': return 'TOMORROW';
      case 'upcoming': return 'UPCOMING';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading DSNY collection schedule...</Text>
      </View>
    );
  }

  if (!schedule || !schedule.bin) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>🗑️</Text>
        <Text style={styles.emptyStateTitle}>No Collection Schedule</Text>
        <Text style={styles.emptyStateSubtitle}>
          No DSNY collection schedule found for this building
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSchedule}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const regularDaysUntil = getDaysUntilCollection(schedule.collection_day || 'Monday');
  const recyclingDaysUntil = getDaysUntilCollection(schedule.recycling_day || 'Monday');
  const organicsDaysUntil = getDaysUntilCollection(schedule.organics_day || 'Monday');
  const bulkDaysUntil = getDaysUntilCollection(schedule.bulk_pickup_day || 'Monday');

  const regularStatus = getCollectionStatus(regularDaysUntil);
  const recyclingStatus = getCollectionStatus(recyclingDaysUntil);
  const organicsStatus = getCollectionStatus(organicsDaysUntil);
  const bulkStatus = getCollectionStatus(bulkDaysUntil);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.buildingName}>{buildingName}</Text>
        <Text style={styles.headerSubtitle}>DSNY Collection Schedule</Text>
        <Text style={styles.binNumber}>BIN: {schedule.bin}</Text>
      </View>

      {/* Collection Schedule Cards */}
      <ScrollView 
        style={styles.scheduleList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.status.info}
          />
        }
      >
        {/* Regular Collection */}
        <CollectionCard
          title="Regular Collection"
          day={schedule.collection_day || 'Monday'}
          frequency={schedule.collection_frequency || 'Weekly'}
          daysUntil={regularDaysUntil}
          status={regularStatus}
          icon="🗑️"
          onPress={handleSchedulePress}
        />

        {/* Recycling Collection */}
        <CollectionCard
          title="Recycling"
          day={schedule.recycling_day || 'Monday'}
          frequency={schedule.recycling_frequency || 'Weekly'}
          daysUntil={recyclingDaysUntil}
          status={recyclingStatus}
          icon="♻️"
          onPress={handleSchedulePress}
        />

        {/* Organics Collection */}
        <CollectionCard
          title="Organics"
          day={schedule.organics_day || 'Monday'}
          frequency={schedule.organics_frequency || 'Weekly'}
          daysUntil={organicsDaysUntil}
          status={organicsStatus}
          icon="🌱"
          onPress={handleSchedulePress}
        />

        {/* Bulk Pickup */}
        <CollectionCard
          title="Bulk Pickup"
          day={schedule.bulk_pickup_day || 'Monday'}
          frequency={schedule.bulk_pickup_frequency || 'As Needed'}
          daysUntil={bulkDaysUntil}
          status={bulkStatus}
          icon="📦"
          onPress={handleSchedulePress}
        />

        {/* Additional Collection Types */}
        {schedule.paper_day && (
          <CollectionCard
            title="Paper Collection"
            day={schedule.paper_day}
            frequency={schedule.paper_frequency || 'Weekly'}
            daysUntil={getDaysUntilCollection(schedule.paper_day)}
            status={getCollectionStatus(getDaysUntilCollection(schedule.paper_day))}
            icon="📄"
            onPress={handleSchedulePress}
          />
        )}

        {schedule.metal_glass_plastic_day && (
          <CollectionCard
            title="Metal/Glass/Plastic"
            day={schedule.metal_glass_plastic_day}
            frequency={schedule.metal_glass_plastic_frequency || 'Weekly'}
            daysUntil={getDaysUntilCollection(schedule.metal_glass_plastic_day)}
            status={getCollectionStatus(getDaysUntilCollection(schedule.metal_glass_plastic_day))}
            icon="🥤"
            onPress={handleSchedulePress}
          />
        )}

        {/* Special Collections */}
        {schedule.leaf_collection_day && (
          <CollectionCard
            title="Leaf Collection"
            day={schedule.leaf_collection_day}
            frequency={schedule.leaf_collection_frequency || 'Seasonal'}
            daysUntil={getDaysUntilCollection(schedule.leaf_collection_day)}
            status={getCollectionStatus(getDaysUntilCollection(schedule.leaf_collection_day))}
            icon="🍂"
            onPress={handleSchedulePress}
          />
        )}

        {schedule.christmas_tree_collection_day && (
          <CollectionCard
            title="Christmas Tree Collection"
            day={schedule.christmas_tree_collection_day}
            frequency={schedule.christmas_tree_collection_frequency || 'Seasonal'}
            daysUntil={getDaysUntilCollection(schedule.christmas_tree_collection_day)}
            status={getCollectionStatus(getDaysUntilCollection(schedule.christmas_tree_collection_day))}
            icon="🎄"
            onPress={handleSchedulePress}
          />
        )}

        {/* District Information */}
        <GlassCard style={styles.districtInfo} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.districtTitle}>District Information</Text>
          <View style={styles.districtDetails}>
            <View style={styles.districtItem}>
              <Text style={styles.districtLabel}>Sanitation District:</Text>
              <Text style={styles.districtValue}>{schedule.sanitation_district || 'N/A'}</Text>
            </View>
            <View style={styles.districtItem}>
              <Text style={styles.districtLabel}>Section:</Text>
              <Text style={styles.districtValue}>{schedule.sanitation_section || 'N/A'}</Text>
            </View>
            <View style={styles.districtItem}>
              <Text style={styles.districtLabel}>Community Board:</Text>
              <Text style={styles.districtValue}>{schedule.community_board || 'N/A'}</Text>
            </View>
            <View style={styles.districtItem}>
              <Text style={styles.districtLabel}>Council District:</Text>
              <Text style={styles.districtValue}>{schedule.council_district || 'N/A'}</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
};

// MARK: - Collection Card Component

interface CollectionCardProps {
  title: string;
  day: string;
  frequency: string;
  daysUntil: number;
  status: 'today' | 'tomorrow' | 'upcoming';
  icon: string;
  onPress: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  title,
  day,
  frequency,
  daysUntil,
  status,
  icon,
  onPress,
}) => {
  const getStatusColor = (status: 'today' | 'tomorrow' | 'upcoming'): string => {
    switch (status) {
      case 'today': return Colors.status.error;
      case 'tomorrow': return Colors.status.warning;
      case 'upcoming': return Colors.status.info;
    }
  };

  const getStatusText = (status: 'today' | 'tomorrow' | 'upcoming'): string => {
    switch (status) {
      case 'today': return 'TODAY';
      case 'tomorrow': return 'TOMORROW';
      case 'upcoming': return 'UPCOMING';
    }
  };

  const getDaysText = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  return (
    <TouchableOpacity style={styles.collectionCard} onPress={onPress}>
      <View style={styles.collectionHeader}>
        <View style={styles.collectionIconSection}>
          <Text style={styles.collectionIcon}>{icon}</Text>
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionTitle}>{title}</Text>
            <Text style={styles.collectionDay}>{day}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {getStatusText(status)}
          </Text>
        </View>
      </View>

      <View style={styles.collectionDetails}>
        <View style={styles.collectionDetailItem}>
          <Text style={styles.collectionDetailLabel}>Next Collection:</Text>
          <Text style={styles.collectionDetailValue}>{getDaysText(daysUntil)}</Text>
        </View>
        
        <View style={styles.collectionDetailItem}>
          <Text style={styles.collectionDetailLabel}>Frequency:</Text>
          <Text style={styles.collectionDetailValue}>{frequency}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
  buildingName: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  binNumber: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  scheduleList: {
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
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.base.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  collectionCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  collectionIconSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  collectionDay: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  collectionDetails: {
    marginTop: Spacing.sm,
  },
  collectionDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  collectionDetailLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  collectionDetailValue: {
    ...Typography.caption,
    color: Colors.text.primary,
  },
  districtInfo: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  districtTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  districtDetails: {
    gap: Spacing.sm,
  },
  districtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  districtLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  districtValue: {
    ...Typography.caption,
    color: Colors.text.primary,
  },
});

export default DSNYCollectionView;
