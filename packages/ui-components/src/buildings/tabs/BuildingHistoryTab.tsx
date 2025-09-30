/**
 * 📅 Building History Tab
 * Mirrors: SwiftUI BuildingDetailView History tab functionality
 * Purpose: Activity log and historical data for building operations
 * Features: Task history, maintenance records, compliance updates, performance trends
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
import { WorkCompletionManager, WorkCompletionRecord, WorkCompletionStats } from '@cyntientops/managers';

export interface BuildingHistoryTabProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  onHistoryItemPress?: (item: HistoryItem) => void;
}

// Use WorkCompletionRecord and WorkCompletionStats from WorkCompletionManager
export type HistoryItem = WorkCompletionRecord;
export type HistoryStats = WorkCompletionStats;

export const BuildingHistoryTab: React.FC<BuildingHistoryTabProps> = ({
  buildingId,
  buildingName,
  container,
  onHistoryItemPress,
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'routine' | 'task' | 'maintenance' | 'inspection' | 'repair' | 'emergency' | 'departure'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [workCompletionManager, setWorkCompletionManager] = useState<WorkCompletionManager | null>(null);

  useEffect(() => {
    initializeWorkCompletionManager();
  }, [container]);

  useEffect(() => {
    if (workCompletionManager) {
      loadHistoryData();
    }
  }, [buildingId, filterPeriod, workCompletionManager]);

  useEffect(() => {
    applyFilters();
  }, [historyItems, filterType]);

  const initializeWorkCompletionManager = () => {
    const manager = new WorkCompletionManager(container);
    setWorkCompletionManager(manager);
  };

  const loadHistoryData = async () => {
    if (!workCompletionManager) return;
    
    setIsLoading(true);
    try {
      // Calculate date range based on filter period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - getDaysOffset(filterPeriod));

      // Load unified work completion history
      const history = await workCompletionManager.getBuildingHistory(
        buildingId,
        startDate,
        endDate
      );

      setHistoryItems(history);
      
      // Load unified statistics
      const historyStats = await workCompletionManager.getWorkCompletionStats(
        buildingId,
        startDate,
        endDate
      );
      setStats(historyStats);
    } catch (error) {
      console.error('Failed to load history data:', error);
      Alert.alert('Error', 'Failed to load building history');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysOffset = (period: string): number => {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  };

  const applyFilters = () => {
    // Filter logic is handled in the render method
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHistoryData();
    setIsRefreshing(false);
  };

  const getTypeIcon = (workType: string) => {
    switch (workType) {
      case 'routine': return '🔄';
      case 'task': return '📋';
      case 'maintenance': return '🔧';
      case 'inspection': return '🏢';
      case 'repair': return '🛠️';
      case 'emergency': return '🚨';
      case 'departure': return '🚚';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.info;
      case 'pending': return Colors.warning;
      case 'failed': return Colors.critical;
      case 'cancelled': return Colors.secondaryText;
      default: return Colors.secondaryText;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return Colors.critical;
      case 'high': return Colors.warning;
      case 'medium': return Colors.info;
      case 'low': return Colors.success;
      default: return Colors.secondaryText;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const filteredItems = historyItems.filter(item => 
    filterType === 'all' || item.workType === filterType
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading building history...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* History Stats */}
        {stats && (
          <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <Text style={styles.sectionTitle}>📊 Activity Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalCompletions}</Text>
                <Text style={styles.statLabel}>Total Completions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completionsToday}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completionsThisWeek}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(stats.verificationRate)}%</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Filters */}
        <GlassCard style={styles.filtersCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.sectionTitle}>🔍 Filters</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Type</Text>
            <View style={styles.filterOptions}>
              {(['all', 'routine', 'task', 'maintenance', 'inspection', 'repair', 'emergency', 'departure'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    filterType === type && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterType === type && styles.filterOptionTextSelected
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Period</Text>
            <View style={styles.filterOptions}>
              {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.filterOption,
                    filterPeriod === period && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilterPeriod(period)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filterPeriod === period && styles.filterOptionTextSelected
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>

        {/* History Items */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>📅 Activity History</Text>
          
          {filteredItems.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyText}>No activities found for the selected period</Text>
            </GlassCard>
          ) : (
            filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => onHistoryItemPress?.(item)}
              >
                <View style={styles.historyItemHeader}>
                  <View style={styles.historyItemInfo}>
                    <Text style={styles.historyItemIcon}>{getTypeIcon(item.workType)}</Text>
                    <View style={styles.historyItemText}>
                      <Text style={styles.historyItemTitle}>{item.title}</Text>
                      <Text style={styles.historyItemDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <View style={styles.historyItemMeta}>
                    <Text style={styles.historyItemTime}>{formatTimestamp(item.completedAt)}</Text>
                    <View style={[
                      styles.historyItemStatus,
                      { backgroundColor: getStatusColor(item.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.historyItemStatusText,
                        { color: getStatusColor(item.status) }
                      ]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.historyItemWorker}>👤 {item.workerName}</Text>
                
                {item.location && (
                  <Text style={styles.historyItemLocation}>📍 {item.location}</Text>
                )}
                
                {item.verificationMethod && (
                  <View style={styles.historyItemVerification}>
                    <Text style={styles.historyItemVerificationText}>
                      ✓ Verified via {item.verificationMethod}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: Spacing.md,
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
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '48%',
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  filtersCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.glassOverlay,
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
  historySection: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: Colors.glassOverlay,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  historyItemInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacing.md,
  },
  historyItemIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  historyItemText: {
    flex: 1,
  },
  historyItemTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  historyItemDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
  },
  historyItemMeta: {
    alignItems: 'flex-end',
  },
  historyItemTime: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    marginBottom: Spacing.xs,
  },
  historyItemStatus: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyItemStatusText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  historyItemWorker: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  historyItemLocation: {
    ...Typography.caption,
    color: Colors.tertiaryText,
    marginBottom: Spacing.xs,
  },
  historyItemVerification: {
    alignSelf: 'flex-start',
  },
  historyItemVerificationText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
});

export default BuildingHistoryTab;