/**
 * 🏠 HPD Violations Detail Sheet
 * Displays real-time HPD violation data from NYC Open Data API
 * Purpose: Show detailed HPD violations for a specific building
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComplianceService } from '@cyntientops/business-core';
import { ServiceContainer } from '@cyntientops/business-core';
import { HPDViolation } from '@cyntientops/api-clients';

interface HPDViolationsSheetProps {
  buildingId: string;
  buildingName: string;
  onClose: () => void;
}

type ViolationFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'CLASS_A' | 'CLASS_B' | 'CLASS_C';

export const HPDViolationsSheet: React.FC<HPDViolationsSheetProps> = ({
  buildingId,
  buildingName,
  onClose
}) => {
  const [violations, setViolations] = useState<HPDViolation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<HPDViolation[]>([]);
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

      const container = ServiceContainer.getInstance();
      const complianceService = ComplianceService.getInstance(container);

      // Fetch real HPD violations from NYC Open Data API
      const hpdViolations = await complianceService.getHPDViolationsForBuilding(buildingId);
      setViolations(hpdViolations);
    } catch (err) {
      console.error('Failed to load HPD violations:', err);
      setError('Failed to load violations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...violations];

    switch (selectedFilter) {
      case 'OPEN':
        filtered = filtered.filter(v => v.currentstatus === 'OPEN' || v.currentstatus === 'ACTIVE');
        break;
      case 'CLOSED':
        filtered = filtered.filter(v => v.currentstatus === 'CLOSED' || v.currentstatus === 'RESOLVED');
        break;
      case 'CLASS_A':
        filtered = filtered.filter(v => v.violationclass === 'A');
        break;
      case 'CLASS_B':
        filtered = filtered.filter(v => v.violationclass === 'B');
        break;
      case 'CLASS_C':
        filtered = filtered.filter(v => v.violationclass === 'C');
        break;
      case 'ALL':
      default:
        // No filtering
        break;
    }

    setFilteredViolations(filtered);
  };

  const getViolationClassColor = (violationClass: string): string => {
    switch (violationClass?.toUpperCase()) {
      case 'A': return '#ef4444'; // Critical - Red
      case 'B': return '#f59e0b'; // High - Orange
      case 'C': return '#3b82f6'; // Medium - Blue
      default: return '#6b7280';  // Unknown - Gray
    }
  };

  const getViolationClassLabel = (violationClass: string): string => {
    switch (violationClass?.toUpperCase()) {
      case 'A': return 'CRITICAL';
      case 'B': return 'HAZARDOUS';
      case 'C': return 'NON-HAZARDOUS';
      default: return 'UNKNOWN';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'ACTIVE': return '#ef4444';
      case 'PENDING': return '#f59e0b';
      case 'CLOSED':
      case 'RESOLVED': return '#10b981';
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
      {(['ALL', 'OPEN', 'CLOSED', 'CLASS_A', 'CLASS_B', 'CLASS_C'] as ViolationFilter[]).map((filter) => (
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

  const renderViolationCard = (violation: HPDViolation) => (
    <View key={violation.violationid} style={styles.violationCard}>
      <View style={styles.violationHeader}>
        <View style={[
          styles.classBadge,
          { backgroundColor: getViolationClassColor(violation.violationclass) }
        ]}>
          <Text style={styles.classText}>
            {getViolationClassLabel(violation.violationclass)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(violation.currentstatus) }
        ]}>
          <Text style={styles.statusText}>{violation.currentstatus}</Text>
        </View>
      </View>

      <Text style={styles.violationDescription}>{violation.novdescription}</Text>

      <View style={styles.violationDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Violation ID:</Text>
          <Text style={styles.detailValue}>{violation.violationid}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order #:</Text>
          <Text style={styles.detailValue}>{violation.ordernumber || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Inspection Date:</Text>
          <Text style={styles.detailValue}>
            {violation.inspectiondate ? new Date(violation.inspectiondate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Original Correct By:</Text>
          <Text style={styles.detailValue}>
            {violation.originalcorrectbydate ? new Date(violation.originalcorrectbydate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        {violation.newcorrectbydate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>New Correct By:</Text>
            <Text style={styles.detailValue}>
              {new Date(violation.newcorrectbydate).toLocaleDateString()}
            </Text>
          </View>
        )}
        {violation.certifieddate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Certified Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(violation.certifieddate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>HPD Violations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading violations from NYC Open Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>HPD Violations</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>HPD Violations</Text>
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
            {violations.filter(v => v.currentstatus === 'OPEN').length}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {violations.filter(v => v.violationclass === 'A').length}
          </Text>
          <Text style={styles.statLabel}>Class A</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {violations.filter(v => v.violationclass === 'B').length}
          </Text>
          <Text style={styles.statLabel}>Class B</Text>
        </View>
      </View>

      {renderFilterButtons()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredViolations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'ALL'
                ? 'No violations found for this building'
                : `No ${selectedFilter.replace('_', ' ')} violations found`}
            </Text>
          </View>
        ) : (
          filteredViolations.map(renderViolationCard)
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
    marginBottom: 12,
  },
  classBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  classText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
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
});

export default HPDViolationsSheet;
