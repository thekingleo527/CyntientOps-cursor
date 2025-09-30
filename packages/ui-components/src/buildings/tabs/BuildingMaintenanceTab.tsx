/**
 * 🔧 Building Maintenance Tab
 * Mirrors: SwiftUI BuildingDetailView Maintenance tab functionality
 * Purpose: Maintenance records, scheduling, and tracking
 * Features: Maintenance history, scheduled maintenance, repair tracking, cost analysis
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

export interface BuildingMaintenanceTabProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  onMaintenancePress?: (maintenance: any) => void;
}

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
  totalCostThisMonth: number;
  averageCompletionTime: number;
}

export const BuildingMaintenanceTab: React.FC<BuildingMaintenanceTabProps> = ({
  buildingId,
  buildingName,
  container,
  onMaintenancePress
}) => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats>({
    totalRecords: 0,
    completedThisMonth: 0,
    pendingScheduled: 0,
    overdueItems: 0,
    totalCostThisMonth: 0,
    averageCompletionTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'preventive' | 'repair' | 'inspection' | 'emergency'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadMaintenanceRecords();
  }, [buildingId]);

  const loadMaintenanceRecords = async () => {
    setIsLoading(true);
    try {
      // Load maintenance records from database and hardcoded data
      const records = await generateMaintenanceRecords(buildingId);
      setMaintenanceRecords(records);
      calculateMaintenanceStats(records);
    } catch (error) {
      console.error('Failed to load maintenance records:', error);
      Alert.alert('Error', 'Failed to load maintenance records');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMaintenanceRecords = async (buildingId: string): Promise<MaintenanceRecord[]> => {
    // Generate building-specific maintenance records based on hardcoded data
    const buildingMaintenance = {
      '1': [ // 12 West 18th Street
        {
          id: 'maint_1_1',
          title: 'Boiler System Inspection',
          description: 'Annual boiler system inspection and maintenance',
          category: 'preventive' as const,
          priority: 'high' as const,
          status: 'scheduled' as const,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          assignedWorker: 'Greg Hutson',
          cost: 500,
          vendor: 'ABC Heating & Cooling',
          notes: 'Annual inspection required by city code',
          buildingId: buildingId
        },
        {
          id: 'maint_1_2',
          title: 'Elevator Maintenance',
          description: 'Monthly elevator maintenance and safety check',
          category: 'preventive' as const,
          priority: 'medium' as const,
          status: 'completed' as const,
          scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          completedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          assignedWorker: 'Greg Hutson',
          cost: 300,
          vendor: 'Elevator Solutions Inc',
          notes: 'All systems functioning properly',
          buildingId: buildingId
        },
        {
          id: 'maint_1_3',
          title: 'HVAC Filter Replacement',
          description: 'Replace HVAC filters throughout building',
          category: 'preventive' as const,
          priority: 'low' as const,
          status: 'in_progress' as const,
          scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          assignedWorker: 'Greg Hutson',
          cost: 150,
          notes: 'In progress - 3 floors completed',
          buildingId: buildingId
        }
      ],
      '4': [ // 104 Franklin Street (Rubin Museum area)
        {
          id: 'maint_4_1',
          title: 'Museum Climate Control Check',
          description: 'Specialized climate control system maintenance for museum area',
          category: 'preventive' as const,
          priority: 'urgent' as const,
          status: 'scheduled' as const,
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          assignedWorker: 'Kevin Dutan',
          cost: 800,
          vendor: 'Museum Climate Specialists',
          notes: 'Critical for artifact preservation',
          buildingId: buildingId
        },
        {
          id: 'maint_4_2',
          title: 'Security System Update',
          description: 'Update security system software and hardware',
          category: 'repair' as const,
          priority: 'high' as const,
          status: 'completed' as const,
          scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          assignedWorker: 'Kevin Dutan',
          cost: 1200,
          vendor: 'Security Pro Systems',
          notes: 'All cameras and sensors updated',
          buildingId: buildingId
        }
      ]
    };

    return buildingMaintenance[buildingId as keyof typeof buildingMaintenance] || [];
  };

  const calculateMaintenanceStats = (records: MaintenanceRecord[]) => {
    const totalRecords = records.length;
    const completedThisMonth = records.filter(r => 
      r.status === 'completed' && 
      r.completedDate && 
      r.completedDate.getMonth() === new Date().getMonth()
    ).length;
    const pendingScheduled = records.filter(r => r.status === 'scheduled').length;
    const overdueItems = records.filter(r => 
      r.status !== 'completed' && 
      r.scheduledDate < new Date()
    ).length;
    const totalCostThisMonth = records
      .filter(r => 
        r.status === 'completed' && 
        r.completedDate && 
        r.completedDate.getMonth() === new Date().getMonth()
      )
      .reduce((sum, r) => sum + (r.cost || 0), 0);
    
    const completedRecords = records.filter(r => r.status === 'completed' && r.completedDate);
    const averageCompletionTime = completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => {
          const diffDays = Math.ceil((r.completedDate!.getTime() - r.scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }, 0) / completedRecords.length
      : 0;

    setMaintenanceStats({
      totalRecords,
      completedThisMonth,
      pendingScheduled,
      overdueItems,
      totalCostThisMonth,
      averageCompletionTime: Math.round(averageCompletionTime)
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMaintenanceRecords();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'scheduled': return Colors.info;
      case 'cancelled': return Colors.inactive;
      default: return Colors.inactive;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.critical;
      case 'high': return Colors.warning;
      case 'medium': return Colors.info;
      case 'low': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'preventive': return '🛡️';
      case 'repair': return '🔧';
      case 'inspection': return '🔍';
      case 'emergency': return '🚨';
      default: return '📋';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderMaintenanceRecord = (record: MaintenanceRecord) => {
    const isOverdue = record.status !== 'completed' && record.scheduledDate < new Date();
    const isSelected = selectedRecord?.id === record.id;

    return (
      <TouchableOpacity
        key={record.id}
        onPress={() => {
          setSelectedRecord(record);
          onMaintenancePress?.(record);
        }}
      >
        <GlassCard 
          style={[
            styles.recordCard,
            isOverdue && styles.overdueRecordCard,
            isSelected && styles.selectedRecordCard
          ]} 
          intensity={GlassIntensity.REGULAR} 
          cornerRadius={CornerRadius.CARD}
        >
          <View style={styles.recordHeader}>
            <View style={styles.recordHeaderLeft}>
              <Text style={styles.recordIcon}>{getCategoryIcon(record.category)}</Text>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>{record.title}</Text>
                <Text style={styles.recordDescription}>{record.description}</Text>
              </View>
            </View>
            
            <View style={styles.recordHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                  {record.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.recordMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Priority</Text>
                <Text style={[styles.metaValue, { color: getPriorityColor(record.priority) }]}>
                  {record.priority.toUpperCase()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Scheduled</Text>
                <Text style={[styles.metaValue, isOverdue && { color: Colors.critical }]}>
                  {formatDate(record.scheduledDate)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Cost</Text>
                <Text style={styles.metaValue}>
                  {record.cost ? formatCurrency(record.cost) : 'TBD'}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Worker</Text>
                <Text style={styles.metaValue}>
                  {record.assignedWorker || 'Unassigned'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Vendor</Text>
                <Text style={styles.metaValue}>
                  {record.vendor || 'Internal'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>
                  {record.category}
                </Text>
              </View>
            </View>
          </View>

          {record.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{record.notes}</Text>
            </View>
          )}

          {isOverdue && (
            <View style={styles.overdueWarning}>
              <Text style={styles.overdueText}>⚠️ This maintenance item is overdue</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    return (
      <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.statsTitle}>Maintenance Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{maintenanceStats.totalRecords}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{maintenanceStats.completedThisMonth}</Text>
            <Text style={styles.statLabel}>Completed This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{maintenanceStats.pendingScheduled}</Text>
            <Text style={styles.statLabel}>Pending Scheduled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.critical }]}>{maintenanceStats.overdueItems}</Text>
            <Text style={styles.statLabel}>Overdue Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.primaryAction }]}>
              {formatCurrency(maintenanceStats.totalCostThisMonth)}
            </Text>
            <Text style={styles.statLabel}>Cost This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{maintenanceStats.averageCompletionTime}d</Text>
            <Text style={styles.statLabel}>Avg Completion Time</Text>
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
          <Text style={styles.filterLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'preventive', 'repair', 'inspection', 'emergency'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterOption,
                  filterCategory === category && styles.filterOptionSelected
                ]}
                onPress={() => setFilterCategory(category as any)}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterCategory === category && styles.filterOptionTextSelected
                ]}>
                  {category.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
            {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(status => (
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

  const filteredRecords = maintenanceRecords.filter(record => {
    const categoryMatch = filterCategory === 'all' || record.category === filterCategory;
    const statusMatch = filterStatus === 'all' || record.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading maintenance records...</Text>
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
          <Text style={styles.headerTitle}>🔧 Maintenance Management</Text>
          <Text style={styles.headerSubtitle}>
            {filteredRecords.length} maintenance record{filteredRecords.length !== 1 ? 's' : ''} for {buildingName}
          </Text>
        </View>

        {renderStats()}
        {renderFilters()}

        <View style={styles.recordsContainer}>
          {filteredRecords.length === 0 ? (
            <GlassCard style={styles.emptyCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.emptyTitle}>No Maintenance Records</Text>
              <Text style={styles.emptyDescription}>
                No maintenance records match the current filters.
              </Text>
            </GlassCard>
          ) : (
            filteredRecords.map(renderMaintenanceRecord)
          )}
        </View>
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
  recordsContainer: {
    marginBottom: Spacing.lg,
  },
  recordCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  overdueRecordCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  selectedRecordCard: {
    borderWidth: 2,
    borderColor: Colors.primaryAction,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordDescription: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  recordHeaderRight: {
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
  recordMeta: {
    marginTop: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
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

export default BuildingMaintenanceTab;