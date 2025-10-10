/**
 * 🏢 Compliance Dashboard Component
 * 
 * Comprehensive compliance dashboard that displays real-time compliance data
 * from all NYC APIs (HPD, DSNY, FDNY, 311) with proper data hydration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { complianceDashboardService, ComplianceDashboardData, BuildingComplianceData } from '@cyntientops/compliance-engine';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

interface ComplianceDashboardProps {
  buildings: Array<{
    id: string;
    name: string;
    address: string;
    bbl: string;
    bin?: string;
  }>;
  onBuildingSelect?: (building: BuildingComplianceData) => void;
  onRefresh?: () => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  buildings,
  onBuildingSelect,
  onRefresh
}) => {
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [buildings]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await complianceDashboardService.getComplianceDashboardData(buildings);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
      console.error('Error loading compliance dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    onRefresh?.();
  };

  const handleBuildingPress = async (buildingId: string) => {
    try {
      const building = buildings.find(b => b.id === buildingId);
      if (!building) return;

      const buildingData = await complianceDashboardService.getBuildingComplianceData(building);
      onBuildingSelect?.(buildingData);
    } catch (err) {
      Alert.alert('Error', 'Failed to load building details');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No compliance data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={
      <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
        <Text style={styles.refreshText}>{refreshing ? 'Refreshing...' : 'Pull to refresh'}</Text>
      </TouchableOpacity>
    }>
      {/* Portfolio Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio Overview</Text>
        <View style={styles.portfolioGrid}>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Total Buildings</Text>
            <Text style={styles.portfolioValue}>{dashboardData.portfolio.totalBuildings}</Text>
          </View>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Critical Issues</Text>
            <Text style={[styles.portfolioValue, styles.criticalValue]}>
              {dashboardData.portfolio.criticalIssues}
            </Text>
          </View>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Overall Score</Text>
            <Text style={[styles.portfolioValue, getScoreColor(dashboardData.portfolio.overallScore)]}>
              {dashboardData.portfolio.overallScore}%
            </Text>
          </View>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioLabel}>Grade</Text>
            <Text style={[styles.portfolioValue, getGradeColor(dashboardData.portfolio.grade)]}>
              {dashboardData.portfolio.grade}
            </Text>
          </View>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Impact</Text>
        <View style={styles.financialGrid}>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Total Fines</Text>
            <Text style={styles.financialValue}>${dashboardData.portfolio.totalFines.toLocaleString()}</Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Outstanding</Text>
            <Text style={[styles.financialValue, styles.outstandingValue]}>
              ${dashboardData.portfolio.outstandingFines.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Paid</Text>
            <Text style={[styles.financialValue, styles.paidValue]}>
              ${dashboardData.portfolio.paidFines.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Critical Buildings */}
      {dashboardData.criticalBuildings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Buildings</Text>
          {dashboardData.criticalBuildings.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={[styles.buildingCard, getStatusColor(building.status)]}
              onPress={() => handleBuildingPress(building.id)}
            >
              <View style={styles.buildingHeader}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={[styles.buildingScore, getScoreColor(building.score)]}>
                  {building.score}%
                </Text>
              </View>
              <Text style={styles.buildingAddress}>{building.address}</Text>
              <View style={styles.buildingDetails}>
                <Text style={styles.buildingDetail}>
                  {building.violations} violations
                </Text>
                <Text style={styles.buildingDetail}>
                  ${building.fines.toLocaleString()} fines
                </Text>
                <Text style={[styles.buildingStatus, getStatusColor(building.status)]}>
                  {building.status.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Violations Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Violations Summary</Text>
        <View style={styles.violationsGrid}>
          <View style={styles.violationCard}>
            <Text style={styles.violationLabel}>HPD Violations</Text>
            <Text style={styles.violationValue}>{dashboardData.violations.hpd.total}</Text>
            <Text style={styles.violationSubtext}>
              {dashboardData.violations.hpd.open} open, {dashboardData.violations.hpd.critical} critical
            </Text>
          </View>
          <View style={styles.violationCard}>
            <Text style={styles.violationLabel}>DSNY Violations</Text>
            <Text style={styles.violationValue}>{dashboardData.violations.dsny.total}</Text>
            <Text style={styles.violationSubtext}>
              ${dashboardData.violations.dsny.outstandingFines.toLocaleString()} outstanding
            </Text>
          </View>
          <View style={styles.violationCard}>
            <Text style={styles.violationLabel}>FDNY Inspections</Text>
            <Text style={styles.violationValue}>{dashboardData.violations.fdny.total}</Text>
            <Text style={styles.violationSubtext}>
              {dashboardData.violations.fdny.compliance.toFixed(1)}% compliance
            </Text>
          </View>
          <View style={styles.violationCard}>
            <Text style={styles.violationLabel}>311 Complaints</Text>
            <Text style={styles.violationValue}>{dashboardData.violations.complaints311.total}</Text>
            <Text style={styles.violationSubtext}>
              {dashboardData.violations.complaints311.satisfaction}/5.0 satisfaction
            </Text>
          </View>
        </View>
      </View>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {dashboardData.alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, getAlertColor(alert.type)]}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={[styles.alertType, getAlertColor(alert.type)]}>
                  {alert.type.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertBuilding}>{alert.buildingName}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Trends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Trends</Text>
        <View style={styles.trendsContainer}>
          <Text style={styles.trendsText}>
            Trends data will be displayed here once historical data is available
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper functions for styling
const getScoreColor = (score: number) => {
  if (score >= 90) return styles.scoreExcellent;
  if (score >= 80) return styles.scoreGood;
  if (score >= 70) return styles.scoreFair;
  return styles.scorePoor;
};

const getGradeColor = (grade: string) => {
  if (grade.startsWith('A')) return styles.gradeA;
  if (grade.startsWith('B')) return styles.gradeB;
  if (grade.startsWith('C')) return styles.gradeC;
  return styles.gradeD;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical': return styles.statusCritical;
    case 'high': return styles.statusHigh;
    case 'medium': return styles.statusMedium;
    default: return styles.statusLow;
  }
};

const getAlertColor = (type: string) => {
  switch (type) {
    case 'critical': return styles.alertCritical;
    case 'warning': return styles.alertWarning;
    default: return styles.alertInfo;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  refreshText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  portfolioCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  portfolioLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  portfolioValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  criticalValue: {
    color: '#FF6B6B',
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 12,
    padding: 16,
    width: '31%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  financialLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  financialValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  outstandingValue: {
    color: '#FF6B6B',
  },
  paidValue: {
    color: '#10B981',
  },
  buildingCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buildingName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  buildingScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buildingAddress: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  buildingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buildingDetail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  buildingStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  violationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  violationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  violationLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  violationValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  violationSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  alertType: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  alertBuilding: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  trendsContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trendsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  // Score colors
  scoreExcellent: { color: '#10B981' },
  scoreGood: { color: '#3B82F6' },
  scoreFair: { color: '#F59E0B' },
  scorePoor: { color: '#EF4444' },
  // Grade colors
  gradeA: { color: '#10B981' },
  gradeB: { color: '#3B82F6' },
  gradeC: { color: '#F59E0B' },
  gradeD: { color: '#EF4444' },
  // Status colors
  statusCritical: { 
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#EF4444'
  },
  statusHigh: { 
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    color: '#F59E0B'
  },
  statusMedium: { 
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    color: '#3B82F6'
  },
  statusLow: { 
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    color: '#10B981'
  },
  // Alert colors
  alertCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#EF4444'
  },
  alertWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    color: '#F59E0B'
  },
  alertInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    color: '#3B82F6'
  },
});

export default ComplianceDashboard;
