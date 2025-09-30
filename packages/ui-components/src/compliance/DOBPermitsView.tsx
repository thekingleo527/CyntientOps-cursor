/**
 * 🏢 DOB Permits View
 * Mirrors: CyntientOps/Views/Compliance/DOBPermitsView.swift
 * Purpose: Display DOB permits and inspections with real NYC API data
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
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { DOBPermit } from '@cyntientops/api-clients';
import { ServiceContainer } from '@cyntientops/business-core';

export interface DOBPermitsViewProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  onPermitPress?: (permit: DOBPermit) => void;
}

export enum DOBPermitStatus {
  ALL = 'all',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN PROGRESS',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

export const DOBPermitsView: React.FC<DOBPermitsViewProps> = ({
  buildingId,
  buildingName,
  container,
  onPermitPress,
}) => {
  const [permits, setPermits] = useState<DOBPermit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<DOBPermitStatus>(DOBPermitStatus.ALL);
  const [totalPermits, setTotalPermits] = useState(0);
  const [activePermits, setActivePermits] = useState(0);
  const [recentPermits, setRecentPermits] = useState(0);

  useEffect(() => {
    loadPermits();
  }, [buildingId]);

  const loadPermits = async () => {
    setIsLoading(true);
    try {
      const complianceService = new (container as any).ComplianceService(container);
      const dobPermits = await complianceService.getDOBPermitsForBuilding(buildingId);
      
      setPermits(dobPermits);
      setTotalPermits(dobPermits.length);
      setActivePermits(dobPermits.filter(p => 
        p.job_status === 'ACTIVE' || p.job_status === 'IN PROGRESS'
      ).length);
      
      // Calculate recent permits (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recent = dobPermits.filter(p => {
        try {
          return new Date(p.job_status_date) > thirtyDaysAgo;
        } catch {
          return false;
        }
      }).length;
      setRecentPermits(recent);
      
    } catch (error) {
      console.error('Failed to load DOB permits:', error);
      Alert.alert('Error', 'Failed to load DOB permits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPermits();
    setIsRefreshing(false);
  };

  const handlePermitPress = useCallback((permit: DOBPermit) => {
    onPermitPress?.(permit);
  }, [onPermitPress]);

  const handleStatusFilter = useCallback((status: DOBPermitStatus) => {
    setSelectedStatus(status);
  }, []);

  const getPermitStatusCount = (status: DOBPermitStatus): number => {
    if (status === DOBPermitStatus.ALL) {
      return totalPermits;
    }
    return permits.filter(p => p.job_status === status).length;
  };

  const getPermitStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'IN PROGRESS': return Colors.status.info;
      case 'COMPLETED':
      case 'APPROVED': return Colors.status.success;
      case 'EXPIRED':
      case 'REVOKED': return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getPermitTypeIcon = (jobType: string): string => {
    const type = jobType?.toLowerCase() || '';
    if (type.includes('electrical')) return '⚡';
    if (type.includes('plumbing')) return '🚰';
    if (type.includes('construction')) return '🏗️';
    if (type.includes('demolition')) return '💥';
    if (type.includes('roofing')) return '🏠';
    return '📋';
  };

  const filteredPermits = permits.filter(permit => {
    if (selectedStatus === DOBPermitStatus.ALL) return true;
    return permit.job_status === selectedStatus;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading DOB permits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.buildingName}>{buildingName}</Text>
        <Text style={styles.headerSubtitle}>DOB Permits & Inspections</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.summaryValue}>{totalPermits}</Text>
          <Text style={styles.summaryLabel}>Total Permits</Text>
        </GlassCard>
        
        <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={[styles.summaryValue, { color: Colors.status.info }]}>{activePermits}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </GlassCard>
        
        <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={[styles.summaryValue, { color: Colors.status.success }]}>{recentPermits}</Text>
          <Text style={styles.summaryLabel}>Recent</Text>
        </GlassCard>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilter}>
        {Object.values(DOBPermitStatus).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              {
                backgroundColor: selectedStatus === status 
                  ? Colors.base.primary 
                  : Colors.glass.thin
              }
            ]}
            onPress={() => handleStatusFilter(status)}
          >
            <Text style={[
              styles.statusButtonText,
              { color: selectedStatus === status ? Colors.text.primary : Colors.text.secondary }
            ]}>
              {status === DOBPermitStatus.ALL ? 'All' : status.replace('_', ' ')}
            </Text>
            <Text style={styles.statusCount}>
              ({getPermitStatusCount(status)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Permits List */}
      <ScrollView 
        style={styles.permitsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.status.info}
          />
        }
      >
        {filteredPermits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No Permits Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedStatus === DOBPermitStatus.ALL 
                ? 'This building has no DOB permits'
                : `No ${selectedStatus.replace('_', ' ')} permits found`
              }
            </Text>
          </View>
        ) : (
          filteredPermits.map((permit) => (
            <DOBPermitCard
              key={permit.job_filing_number}
              permit={permit}
              onPress={() => handlePermitPress(permit)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// MARK: - DOB Permit Card Component

interface DOBPermitCardProps {
  permit: DOBPermit;
  onPress: () => void;
}

const DOBPermitCard: React.FC<DOBPermitCardProps> = ({ permit, onPress }) => {
  const getPermitStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'IN PROGRESS': return Colors.status.info;
      case 'COMPLETED':
      case 'APPROVED': return Colors.status.success;
      case 'EXPIRED':
      case 'REVOKED': return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getPermitTypeIcon = (jobType: string): string => {
    const type = jobType?.toLowerCase() || '';
    if (type.includes('electrical')) return '⚡';
    if (type.includes('plumbing')) return '🚰';
    if (type.includes('construction')) return '🏗️';
    if (type.includes('demolition')) return '💥';
    if (type.includes('roofing')) return '🏠';
    return '📋';
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: string): string => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return 'N/A';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return 'N/A';
    }
  };

  const isExpired = (): boolean => {
    if (!permit.job_end_date) return false;
    try {
      return new Date(permit.job_end_date) < new Date();
    } catch {
      return false;
    }
  };

  return (
    <TouchableOpacity style={styles.permitCard} onPress={onPress}>
      <View style={styles.permitHeader}>
        <View style={styles.permitTypeSection}>
          <Text style={styles.permitTypeIcon}>
            {getPermitTypeIcon(permit.job_type)}
          </Text>
          <View style={styles.permitTypeInfo}>
            <Text style={styles.permitType} numberOfLines={1}>
              {permit.job_type || 'General Permit'}
            </Text>
            <Text style={styles.permitNumber}>
              #{permit.job_filing_number}
            </Text>
          </View>
        </View>
        
        <View style={styles.permitStatusBadge}>
          <Text style={[
            styles.permitStatusText,
            { color: getPermitStatusColor(permit.job_status) }
          ]}>
            {permit.job_status}
          </Text>
        </View>
      </View>

      {permit.job_status_descrp && (
        <Text style={styles.permitDescription} numberOfLines={2}>
          {permit.job_status_descrp}
        </Text>
      )}

      <View style={styles.permitDetails}>
        <View style={styles.permitDetailItem}>
          <Text style={styles.permitDetailLabel}>Start Date:</Text>
          <Text style={styles.permitDetailValue}>
            {formatDate(permit.job_start_date)}
          </Text>
        </View>
        
        <View style={styles.permitDetailItem}>
          <Text style={styles.permitDetailLabel}>End Date:</Text>
          <Text style={styles.permitDetailValue}>
            {formatDate(permit.job_end_date)}
          </Text>
        </View>
        
        {permit.job_cost && (
          <View style={styles.permitDetailItem}>
            <Text style={styles.permitDetailLabel}>Cost:</Text>
            <Text style={styles.permitDetailValue}>
              {formatCurrency(permit.job_cost)}
            </Text>
          </View>
        )}
      </View>

      {permit.applicant_business_name && (
        <View style={styles.permitApplicant}>
          <Text style={styles.permitApplicantLabel}>Applicant:</Text>
          <Text style={styles.permitApplicantValue} numberOfLines={1}>
            {permit.applicant_business_name || 
             `${permit.applicant_first_name || ''} ${permit.applicant_last_name || ''}`.trim()}
          </Text>
        </View>
      )}

      <View style={styles.permitFooter}>
        <Text style={styles.permitLastAction}>
          Last Action: {formatDate(permit.latest_action_date)}
        </Text>
        {isExpired() && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>EXPIRED</Text>
          </View>
        )}
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
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statusFilter: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.thin,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  statusButtonText: {
    ...Typography.caption,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  statusCount: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
  },
  permitsList: {
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
  permitCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  permitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  permitTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permitTypeIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  permitTypeInfo: {
    flex: 1,
  },
  permitType: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  permitNumber: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  permitStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.glass.thin,
  },
  permitStatusText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  permitDescription: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  permitDetails: {
    marginBottom: Spacing.sm,
  },
  permitDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  permitDetailLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  permitDetailValue: {
    ...Typography.caption,
    color: Colors.text.primary,
  },
  permitApplicant: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  permitApplicantLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  permitApplicantValue: {
    ...Typography.caption,
    color: Colors.text.primary,
    flex: 1,
  },
  permitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permitLastAction: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
  },
  expiredBadge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  expiredText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
});

export default DOBPermitsView;
