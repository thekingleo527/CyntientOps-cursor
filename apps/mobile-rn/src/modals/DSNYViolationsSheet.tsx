/**
 * 🗑️ DSNY Violations Detail Sheet
 * Displays DSNY violations/tickets from NYC Open Data (NOT collection schedules)
 * Purpose: Show sanitation violations and tickets for a specific building
 * Note: Collection schedules belong in BuildingDetail Sanitation tab
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplianceService } from '@cyntientops/business-core';
import { ServiceContainer } from '@cyntientops/business-core';
import { nycAPIService } from '@cyntientops/api-clients';
import type { DSNYViolation as APIDSNYViolation } from '@cyntientops/api-clients';

interface DSNYViolation {
  id: string;
  violationType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dateIssued: Date;
  status: 'open' | 'closed' | 'pending';
  fineAmount: number;
  buildingId: string;
  address: string;
}

interface DSNYViolationsSheetProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  onClose: () => void;
}

type ViolationFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'PENDING';

export const DSNYViolationsSheet: React.FC<DSNYViolationsSheetProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  onClose
}) => {
  const [violations, setViolations] = useState<DSNYViolation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<DSNYViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ViolationFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadViolations();
  }, [buildingId]);

  useEffect(() => {
    applyFilter();
  }, [violations, selectedFilter]);

  const loadViolations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch real DSNY violations from NYC Open Data API
      const apiViolations = await nycAPIService.getDSNYViolations(buildingAddress);

      // Transform API violations to UI format
      const transformedViolations: DSNYViolation[] = apiViolations.map((v: APIDSNYViolation) => {
        // Determine severity based on fine amount
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        const fineAmount = parseFloat(v.penalty_imposed || v.total_violation_amount || '0');
        if (fineAmount >= 500) severity = 'critical';
        else if (fineAmount >= 200) severity = 'high';
        else if (fineAmount >= 100) severity = 'medium';

        // Determine status from hearing_status
        let status: 'open' | 'closed' | 'pending' = 'pending';
        if (v.hearing_status?.includes('PAID') || v.hearing_status?.includes('DISMISSED')) {
          status = 'closed';
        } else if (v.hearing_status?.includes('OPEN') || v.hearing_status?.includes('SCHEDULED')) {
          status = 'open';
        }

        return {
          id: v.ticket_number,
          violationType: v.charge_1_code_description || 'Unknown Violation',
          description: `${v.charge_1_code_section || ''} - ${v.charge_1_code_description || 'No description available'}`,
          severity,
          dateIssued: new Date(v.violation_date),
          status,
          fineAmount: parseFloat(v.penalty_imposed || v.total_violation_amount || '0') / 100, // Convert cents to dollars
          buildingId,
          address: `${v.violation_location_house} ${v.violation_location_street_name}`
        };
      });

      setViolations(transformedViolations);
    } catch (err) {
      console.error('Failed to load DSNY violations:', err);
      setError('Failed to load violations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...violations];

    switch (selectedFilter) {
      case 'OPEN':
        filtered = filtered.filter(v => v.status === 'open');
        break;
      case 'CLOSED':
        filtered = filtered.filter(v => v.status === 'closed');
        break;
      case 'PENDING':
        filtered = filtered.filter(v => v.status === 'pending');
        break;
      case 'ALL':
      default:
        // No filtering
        break;
    }

    setFilteredViolations(filtered);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'closed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {(['ALL', 'OPEN', 'CLOSED', 'PENDING'] as ViolationFilter[]).map((filter) => (
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
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderViolationCard = (violation: DSNYViolation) => (
    <View key={violation.id} style={styles.violationCard}>
      <View style={styles.violationHeader}>
        <View>
          <Text style={styles.violationType}>{violation.violationType}</Text>
          <View style={styles.badgeRow}>
            <View style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(violation.severity) }
            ]}>
              <Text style={styles.badgeText}>{violation.severity.toUpperCase()}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(violation.status) }
            ]}>
              <Text style={styles.badgeText}>{violation.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={styles.fineContainer}>
          <Text style={styles.fineLabel}>Fine</Text>
          <Text style={styles.fineAmount}>${violation.fineAmount}</Text>
        </View>
      </View>

      <Text style={styles.violationDescription}>{violation.description}</Text>

      <View style={styles.violationDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date Issued:</Text>
          <Text style={styles.detailValue}>
            {violation.dateIssued.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Violation ID:</Text>
          <Text style={styles.detailValue}>{violation.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, { color: getStatusColor(violation.status) }]}>
            {violation.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DSNY Violations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading violations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DSNY Violations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadViolations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalFines = violations.reduce((sum, v) => sum + v.fineAmount, 0);
  const openViolations = violations.filter(v => v.status === 'open').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DSNY Violations</Text>
          <Text style={styles.subtitle}>{buildingName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{violations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {openViolations}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            ${totalFines}
          </Text>
          <Text style={styles.statLabel}>Total Fines</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {violations.filter(v => v.status === 'closed').length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {renderFilterButtons()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredViolations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'ALL'
                ? 'No violations found for this building'
                : `No ${selectedFilter} violations found`}
            </Text>
          </View>
        ) : (
          filteredViolations.map(renderViolationCard)
        )}
      </ScrollView>

      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          💡 Note: For collection schedules, see the Sanitation tab in Building Details
        </Text>
      </View>
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
  violationCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  violationType: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  fineContainer: {
    alignItems: 'flex-end',
  },
  fineLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginBottom: 2,
  },
  fineAmount: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '700',
  },
  violationDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  violationDetails: {
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
  noteContainer: {
    padding: 16,
    backgroundColor: '#1f1f1f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  noteText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DSNYViolationsSheet;
