/**
 * 🏠 HPD Violations View
 * Mirrors: CyntientOps/Views/Compliance/HPDViolationsView.swift
 * Purpose: Display HPD violations with real NYC API data
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
import { HPDViolation } from '@cyntientops/api-clients';
import { ServiceContainer } from '@cyntientops/business-core';

export interface HPDViolationsViewProps {
  buildingId: string;
  buildingName: string;
  container: ServiceContainer;
  onViolationPress?: (violation: HPDViolation) => void;
}

export enum HPDViolationClass {
  ALL = 'all',
  CLASS_A = 'A',
  CLASS_B = 'B',
  CLASS_C = 'C'
}

export const HPDViolationsView: React.FC<HPDViolationsViewProps> = ({
  buildingId,
  buildingName,
  container,
  onViolationPress,
}) => {
  const [violations, setViolations] = useState<HPDViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState<HPDViolationClass>(HPDViolationClass.ALL);
  const [totalViolations, setTotalViolations] = useState(0);
  const [classCCount, setClassCCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    loadViolations();
  }, [buildingId]);

  const loadViolations = async () => {
    setIsLoading(true);
    try {
      const complianceService = new (container as any).ComplianceService(container);
      const hpdViolations = await complianceService.getHPDViolationsForBuilding(buildingId);
      
      setViolations(hpdViolations);
      setTotalViolations(hpdViolations.length);
      setClassCCount(hpdViolations.filter(v => v.violationclass === 'C').length);
      
      // Calculate overdue violations (open for more than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const overdue = hpdViolations.filter(v => 
        v.currentstatus === 'OPEN' && new Date(v.novissueddate) < thirtyDaysAgo
      ).length;
      setOverdueCount(overdue);
      
    } catch (error) {
      console.error('Failed to load HPD violations:', error);
      Alert.alert('Error', 'Failed to load HPD violations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadViolations();
    setIsRefreshing(false);
  };

  const handleViolationPress = useCallback((violation: HPDViolation) => {
    onViolationPress?.(violation);
  }, [onViolationPress]);

  const handleClassFilter = useCallback((violationClass: HPDViolationClass) => {
    setSelectedClass(violationClass);
  }, []);

  const getViolationClassCount = (violationClass: HPDViolationClass): number => {
    if (violationClass === HPDViolationClass.ALL) {
      return totalViolations;
    }
    return violations.filter(v => v.violationclass === violationClass).length;
  };

  const getViolationClassColor = (violationClass: string): string => {
    switch (violationClass) {
      case 'A': return Colors.status.error;
      case 'B': return Colors.status.warning;
      case 'C': return Colors.status.info;
      default: return Colors.text.secondary;
    }
  };

  const getViolationStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'ACTIVE': return Colors.status.error;
      case 'CERTIFIED':
      case 'RESOLVED': return Colors.status.success;
      case 'PENDING': return Colors.status.warning;
      default: return Colors.text.secondary;
    }
  };

  const filteredViolations = violations.filter(violation => {
    if (selectedClass === HPDViolationClass.ALL) return true;
    return violation.violationclass === selectedClass;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading HPD violations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.buildingName}>{buildingName}</Text>
        <Text style={styles.headerSubtitle}>HPD Violations</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={styles.summaryValue}>{totalViolations}</Text>
          <Text style={styles.summaryLabel}>Total Violations</Text>
        </GlassCard>
        
        <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={[styles.summaryValue, { color: Colors.status.error }]}>{overdueCount}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </GlassCard>
        
        <GlassCard style={styles.summaryCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <Text style={[styles.summaryValue, { color: Colors.status.warning }]}>{classCCount}</Text>
          <Text style={styles.summaryLabel}>Class C</Text>
        </GlassCard>
      </View>

      {/* Class Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classFilter}>
        {Object.values(HPDViolationClass).map((violationClass) => (
          <TouchableOpacity
            key={violationClass}
            style={[
              styles.classButton,
              {
                backgroundColor: selectedClass === violationClass 
                  ? Colors.base.primary 
                  : Colors.glass.thin
              }
            ]}
            onPress={() => handleClassFilter(violationClass)}
          >
            <Text style={[
              styles.classButtonText,
              { color: selectedClass === violationClass ? Colors.text.primary : Colors.text.secondary }
            ]}>
              {violationClass === HPDViolationClass.ALL ? 'All' : `Class ${violationClass}`}
            </Text>
            <Text style={styles.classCount}>
              ({getViolationClassCount(violationClass)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Violations List */}
      <ScrollView 
        style={styles.violationsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.status.info}
          />
        }
      >
        {filteredViolations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✅</Text>
            <Text style={styles.emptyStateTitle}>No Violations Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedClass === HPDViolationClass.ALL 
                ? 'This building has no HPD violations'
                : `No Class ${selectedClass} violations found`
              }
            </Text>
          </View>
        ) : (
          filteredViolations.map((violation) => (
            <HPDViolationCard
              key={violation.violationid}
              violation={violation}
              onPress={() => handleViolationPress(violation)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

// MARK: - HPD Violation Card Component

interface HPDViolationCardProps {
  violation: HPDViolation;
  onPress: () => void;
}

const HPDViolationCard: React.FC<HPDViolationCardProps> = ({ violation, onPress }) => {
  const getViolationClassColor = (violationClass: string): string => {
    switch (violationClass) {
      case 'A': return Colors.status.error;
      case 'B': return Colors.status.warning;
      case 'C': return Colors.status.info;
      default: return Colors.text.secondary;
    }
  };

  const getViolationStatusColor = (status: string): string => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'ACTIVE': return Colors.status.error;
      case 'CERTIFIED':
      case 'RESOLVED': return Colors.status.success;
      case 'PENDING': return Colors.status.warning;
      default: return Colors.text.secondary;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const isOverdue = (): boolean => {
    if (violation.currentstatus !== 'OPEN') return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(violation.novissueddate) < thirtyDaysAgo;
  };

  return (
    <TouchableOpacity style={styles.violationCard} onPress={onPress}>
      <View style={styles.violationHeader}>
        <View style={styles.violationClassBadge}>
          <Text style={[
            styles.violationClassText,
            { color: getViolationClassColor(violation.violationclass) }
          ]}>
            Class {violation.violationclass}
          </Text>
        </View>
        
        <View style={styles.violationStatusBadge}>
          <Text style={[
            styles.violationStatusText,
            { color: getViolationStatusColor(violation.currentstatus) }
          ]}>
            {violation.currentstatus}
          </Text>
        </View>
      </View>

      <Text style={styles.violationDescription} numberOfLines={3}>
        {violation.novdescription}
      </Text>

      <View style={styles.violationDetails}>
        <View style={styles.violationDetailItem}>
          <Text style={styles.violationDetailLabel}>Issued:</Text>
          <Text style={styles.violationDetailValue}>
            {formatDate(violation.novissueddate)}
          </Text>
        </View>
        
        <View style={styles.violationDetailItem}>
          <Text style={styles.violationDetailLabel}>Due:</Text>
          <Text style={styles.violationDetailValue}>
            {formatDate(violation.originalcorrectbydate || violation.newcorrectbydate || '')}
          </Text>
        </View>
        
        {violation.certifieddate && (
          <View style={styles.violationDetailItem}>
            <Text style={styles.violationDetailLabel}>Certified:</Text>
            <Text style={styles.violationDetailValue}>
              {formatDate(violation.certifieddate)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.violationFooter}>
        <Text style={styles.violationId}>
          NOV ID: {violation.novid}
        </Text>
        {isOverdue() && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueText}>OVERDUE</Text>
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
  classFilter: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.thin,
  },
  classButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  classButtonText: {
    ...Typography.caption,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  classCount: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
  },
  violationsList: {
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
  violationCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  violationClassBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.glass.thin,
  },
  violationClassText: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  violationStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.glass.thin,
  },
  violationStatusText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  violationDescription: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  violationDetails: {
    marginBottom: Spacing.sm,
  },
  violationDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  violationDetailLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  violationDetailValue: {
    ...Typography.caption,
    color: Colors.text.primary,
  },
  violationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  violationId: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
  },
  overdueBadge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  overdueText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
});

export default HPDViolationsView;
