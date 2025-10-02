/**
 * 📅 Building History & Maintenance Tab
 * Mirrors: SwiftUI BuildingDetailView History tab functionality
 * Purpose: Unified activity log, maintenance records, and historical data for building operations
 * Features: Task history, maintenance records, compliance updates, performance trends, repair tracking, cost analysis
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
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
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

// Maintenance-specific interfaces
export interface MaintenanceRecord {
  id: string;
  title: string;
  description: string;
  category: 'preventive' | 'repair' | 'inspection' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  completedDate?: Date;
  assignedWorker?: string;
  cost?: number;
  vendor?: string;
  notes?: string;
  photos?: string[];
  buildingId: string;
}

export interface MaintenanceStats {
  totalRecords: number;
  completedThisMonth: number;
  pendingScheduled: number;
  overdueItems: number;
  totalCost: number;
  averageCost: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  costTrend: Array<{
    month: string;
    cost: number;
  }>;
}

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
  
  // Maintenance-specific state
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'maintenance'>('history');

  useEffect(() => {
    initializeWorkCompletionManager();
    loadMaintenanceData();
  }, [container]);

  const loadMaintenanceData = async () => {
    try {
      // Load maintenance records from the database
      const records = await container.database.query(
        'SELECT * FROM maintenance_records WHERE building_id = ? ORDER BY scheduled_date DESC',
        [buildingId]
      );
      
      const maintenanceData: MaintenanceRecord[] = records.map((record: any) => ({
        id: record.id,
        title: record.title,
        description: record.description,
        category: record.category,
        priority: record.priority,
        status: record.status,
        scheduledDate: new Date(record.scheduled_date),
        completedDate: record.completed_date ? new Date(record.completed_date) : undefined,
        assignedWorker: record.assigned_worker,
        cost: record.cost,
        vendor: record.vendor,
        notes: record.notes,
        photos: record.photos ? JSON.parse(record.photos) : [],
        buildingId: record.building_id
      }));
      
      setMaintenanceRecords(maintenanceData);
      
      // Calculate maintenance statistics
      const stats = calculateMaintenanceStats(maintenanceData);
      setMaintenanceStats(stats);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
    }
  };

  const calculateMaintenanceStats = (records: MaintenanceRecord[]): MaintenanceStats => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const completedThisMonth = records.filter(record => 
      record.status === 'completed' && 
      record.completedDate && 
      record.completedDate >= thisMonth
    ).length;
    
    const pendingScheduled = records.filter(record => 
      record.status === 'scheduled' || record.status === 'in_progress'
    ).length;
    
    const overdueItems = records.filter(record => 
      record.status === 'scheduled' && 
      record.scheduledDate < now
    ).length;
    
    const totalCost = records
      .filter(record => record.cost)
      .reduce((sum, record) => sum + (record.cost || 0), 0);
    
    const averageCost = records.filter(record => record.cost).length > 0 
      ? totalCost / records.filter(record => record.cost).length 
      : 0;
    
    // Calculate category distribution
    const categoryCounts = records.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / records.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate cost trend (last 6 months)
    const costTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthCost = records
        .filter(record => 
          record.completedDate && 
          record.completedDate >= month && 
          record.completedDate <= monthEnd &&
          record.cost
        )
        .reduce((sum, record) => sum + (record.cost || 0), 0);
      
      costTrend.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        cost: monthCost
      });
    }
    
    return {
      totalRecords: records.length,
      completedThisMonth,
      pendingScheduled,
      overdueItems,
      totalCost,
      averageCost,
      topCategories,
      costTrend
    };
  };

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
    await Promise.all([
      loadHistoryData(),
      loadMaintenanceData()
    ]);
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
        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'history' && styles.activeTabButtonText]}>
              📅 History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'maintenance' && styles.activeTabButton]}
            onPress={() => setActiveTab('maintenance')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'maintenance' && styles.activeTabButtonText]}>
              🔧 Maintenance
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'history' ? (
          <>
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
          </>
        ) : (
          <>
            {/* Maintenance Stats */}
            {maintenanceStats && (
              <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
                <Text style={styles.sectionTitle}>🔧 Maintenance Overview</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{maintenanceStats.totalRecords}</Text>
                    <Text style={styles.statLabel}>Total Records</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{maintenanceStats.completedThisMonth}</Text>
                    <Text style={styles.statLabel}>Completed This Month</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{maintenanceStats.pendingScheduled}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{maintenanceStats.overdueItems}</Text>
                    <Text style={styles.statLabel}>Overdue</Text>
                  </View>
                </View>
                
                <View style={styles.costSummary}>
                  <Text style={styles.costLabel}>Total Cost: ${maintenanceStats.totalCost.toLocaleString()}</Text>
                  <Text style={styles.costLabel}>Average Cost: ${maintenanceStats.averageCost.toLocaleString()}</Text>
                </View>
              </GlassCard>
            )}

            {/* Maintenance Records */}
            <GlassCard style={styles.recordsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.sectionTitle}>🔧 Maintenance Records</Text>
              
              {maintenanceRecords.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No maintenance records found</Text>
                  <Text style={styles.emptyStateSubtext}>Maintenance records will appear here when created</Text>
                </View>
              ) : (
                maintenanceRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.maintenanceRecord}
                    onPress={() => onHistoryItemPress?.(record as any)}
                  >
                    <View style={styles.maintenanceRecordHeader}>
                      <Text style={styles.maintenanceRecordTitle}>{record.title}</Text>
                      <View style={[styles.priorityBadge, styles[`priority${record.priority.charAt(0).toUpperCase() + record.priority.slice(1)}`]]}>
                        <Text style={styles.priorityText}>{record.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.maintenanceRecordDescription}>{record.description}</Text>
                    
                    <View style={styles.maintenanceRecordMeta}>
                      <Text style={styles.maintenanceRecordCategory}>📂 {record.category}</Text>
                      <Text style={styles.maintenanceRecordStatus}>📅 {record.scheduledDate.toLocaleDateString()}</Text>
                      {record.cost && (
                        <Text style={styles.maintenanceRecordCost}>💰 ${record.cost.toLocaleString()}</Text>
                      )}
                    </View>
                    
                    {record.assignedWorker && (
                      <Text style={styles.maintenanceRecordWorker}>👤 {record.assignedWorker}</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </GlassCard>
          </>
        )}
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
  // Tab Switcher Styles
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.primaryAction,
  },
  tabButtonText: {
    ...Typography.subheadline,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: Colors.primaryText,
    fontWeight: '600',
  },
  // Maintenance Styles
  costSummary: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  recordsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  maintenanceRecord: {
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  maintenanceRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  maintenanceRecordTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  maintenanceRecordDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  maintenanceRecordMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  maintenanceRecordCategory: {
    ...Typography.caption,
    color: Colors.info,
    backgroundColor: Colors.info + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  maintenanceRecordStatus: {
    ...Typography.caption,
    color: Colors.warning,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  maintenanceRecordCost: {
    ...Typography.caption,
    color: Colors.success,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  maintenanceRecordWorker: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  // Priority Badge Styles
  priorityBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityLow: {
    backgroundColor: Colors.info + '20',
  },
  priorityMedium: {
    backgroundColor: Colors.warning + '20',
  },
  priorityHigh: {
    backgroundColor: Colors.error + '20',
  },
  priorityUrgent: {
    backgroundColor: Colors.error + '40',
  },
  priorityText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

export default BuildingHistoryTab;