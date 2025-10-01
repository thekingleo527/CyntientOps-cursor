/**
 * 🏢 DOB Permits Detail Sheet
 * Displays real-time DOB permit data from NYC Open Data API
 * Purpose: Show detailed DOB permits and inspections for a specific building
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplianceService } from '@cyntientops/business-core';
import { ServiceContainer } from '@cyntientops/business-core';
import { DOBPermit } from '@cyntientops/api-clients';

interface DOBPermitsSheetProps {
  buildingId: string;
  buildingName: string;
  onClose: () => void;
}

type PermitFilter = 'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';

export const DOBPermitsSheet: React.FC<DOBPermitsSheetProps> = ({
  buildingId,
  buildingName,
  onClose
}) => {
  const [permits, setPermits] = useState<DOBPermit[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<DOBPermit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<PermitFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermits();
  }, [buildingId]);

  useEffect(() => {
    applyFilter();
  }, [permits, selectedFilter]);

  const loadPermits = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const container = ServiceContainer.getInstance();
      const complianceService = ComplianceService.getInstance(container);

      // Fetch real DOB permits from NYC Open Data API
      const dobPermits = await complianceService.getDOBPermitsForBuilding(buildingId);
      setPermits(dobPermits);
    } catch (err) {
      console.error('Failed to load DOB permits:', err);
      setError('Failed to load permits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...permits];

    switch (selectedFilter) {
      case 'ACTIVE':
        filtered = filtered.filter(p => p.job_status === 'ACTIVE');
        break;
      case 'IN_PROGRESS':
        filtered = filtered.filter(p => p.job_status === 'IN PROGRESS');
        break;
      case 'COMPLETED':
        filtered = filtered.filter(p => p.job_status === 'COMPLETED' || p.job_status === 'APPROVED');
        break;
      case 'EXPIRED':
        filtered = filtered.filter(p => p.job_status === 'EXPIRED');
        break;
      case 'REVOKED':
        filtered = filtered.filter(p => p.job_status === 'REVOKED');
        break;
      case 'ALL':
      default:
        // No filtering
        break;
    }

    setFilteredPermits(filtered);
  };

  const getPermitStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'IN PROGRESS': return '#10b981';
      case 'COMPLETED':
      case 'APPROVED': return '#3b82f6';
      case 'EXPIRED':
      case 'REVOKED': return '#ef4444';
      case 'PENDING': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getJobTypeLabel = (jobType: string): string => {
    const typeMap: Record<string, string> = {
      'A1': 'ALTERATION TYPE 1',
      'A2': 'ALTERATION TYPE 2',
      'A3': 'ALTERATION TYPE 3',
      'NB': 'NEW BUILDING',
      'DM': 'DEMOLITION',
      'SG': 'SIGN',
      'EQ': 'EQUIPMENT',
      'PL': 'PLUMBING',
      'EW': 'ELECTRICAL WORK'
    };
    return typeMap[jobType?.toUpperCase()] || jobType || 'UNKNOWN';
  };

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {(['ALL', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'REVOKED'] as PermitFilter[]).map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            selectedFilter === filter && styles.filterButtonActive
          ]}
          onPress={() => setSelectedFilter(filter)}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === filter && styles.filterTextActive
          ]}>
            {filter.replace('_', ' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPermitCard = (permit: DOBPermit) => (
    <View key={permit.job_filing_number} style={styles.permitCard}>
      <View style={styles.permitHeader}>
        <View>
          <Text style={styles.jobNumber}>Job #{permit.job_filing_number}</Text>
          <Text style={styles.jobType}>{getJobTypeLabel(permit.job_type)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getPermitStatusColor(permit.job_status) }
        ]}>
          <Text style={styles.statusText}>{permit.job_status}</Text>
        </View>
      </View>

      <Text style={styles.permitDescription}>{permit.job_status_descrp || 'No description available'}</Text>

      <View style={styles.permitDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Job Type:</Text>
          <Text style={styles.detailValue}>{permit.job_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Filing Date:</Text>
          <Text style={styles.detailValue}>
            {permit.job_start_date ? new Date(permit.job_start_date).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        {permit.job_end_date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completion Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(permit.job_end_date).toLocaleDateString()}
            </Text>
          </View>
        )}
        {permit.job_status_date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(permit.job_status_date).toLocaleDateString()}
            </Text>
          </View>
        )}
        {permit.applicant_business_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Applicant:</Text>
            <Text style={styles.detailValue}>{permit.applicant_business_name}</Text>
          </View>
        )}
        {!permit.applicant_business_name && (permit.applicant_first_name || permit.applicant_last_name) && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Applicant:</Text>
            <Text style={styles.detailValue}>
              {`${permit.applicant_first_name || ''} ${permit.applicant_last_name || ''}`.trim()}
            </Text>
          </View>
        )}
        {permit.job_cost && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Est. Cost:</Text>
            <Text style={styles.detailValue}>${parseFloat(permit.job_cost).toLocaleString()}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DOB Permits</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading permits from NYC Open Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DOB Permits</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPermits}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DOB Permits</Text>
          <Text style={styles.subtitle}>{buildingName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{permits.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {permits.filter(p => p.job_status === 'ACTIVE').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>
            {permits.filter(p => p.job_status === 'COMPLETED').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {permits.filter(p => p.job_status === 'EXPIRED').length}
          </Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {renderFilterButtons()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredPermits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'ALL'
                ? 'No permits found for this building'
                : `No ${selectedFilter.replace('_', ' ')} permits found`}
            </Text>
          </View>
        ) : (
          filteredPermits.map(renderPermitCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  permitCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  permitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  jobType: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  permitDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  permitDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DOBPermitsSheet;
