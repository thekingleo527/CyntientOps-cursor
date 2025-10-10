/**
 * 🏠 Building Compliance Detail Component
 * 
 * Detailed compliance view for a specific building showing all violations,
 * inspections, and compliance data from NYC APIs
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BuildingComplianceData } from '@cyntientops/compliance-engine';
import { HPDViolation, DSNYViolation, FDNYInspection, Complaints311 } from '@cyntientops/api-clients';

interface BuildingComplianceDetailProps {
  building: BuildingComplianceData;
  onClose?: () => void;
  onViolationPress?: (violation: any) => void;
}

export const BuildingComplianceDetail: React.FC<BuildingComplianceDetailProps> = ({
  building,
  onClose,
  onViolationPress
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'financial' | 'inspections'>('overview');

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Compliance Score</Text>
          <Text style={[styles.overviewValue, getScoreColor(building.score)]}>
            {building.score}%
          </Text>
          <Text style={[styles.overviewGrade, getGradeColor(building.grade)]}>
            Grade: {building.grade}
          </Text>
        </View>
        
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Status</Text>
          <Text style={[styles.overviewStatus, getStatusColor(building.status)]}>
            {building.status.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Total Violations</Text>
          <Text style={styles.overviewValue}>
            {building.violations.hpd.length + building.violations.dsny.length}
          </Text>
        </View>
        
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Outstanding Fines</Text>
          <Text style={[styles.overviewValue, styles.financialValue]}>
            ${building.financial.outstandingFines.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>HPD Violations</Text>
            <Text style={styles.statValue}>{building.violations.hpd.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DSNY Violations</Text>
            <Text style={styles.statValue}>{building.violations.dsny.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>FDNY Inspections</Text>
            <Text style={styles.statValue}>{building.violations.fdny.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>311 Complaints</Text>
            <Text style={styles.statValue}>{building.violations.complaints311.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection Schedule</Text>
        <View style={styles.inspectionCard}>
          <View style={styles.inspectionItem}>
            <Text style={styles.inspectionLabel}>Last Inspection</Text>
            <Text style={styles.inspectionValue}>
              {building.inspections.lastInspection 
                ? building.inspections.lastInspection.toLocaleDateString()
                : 'No recent inspections'
              }
            </Text>
          </View>
          <View style={styles.inspectionItem}>
            <Text style={styles.inspectionLabel}>Next Inspection</Text>
            <Text style={styles.inspectionValue}>
              {building.inspections.nextInspection 
                ? building.inspections.nextInspection.toLocaleDateString()
                : 'Not scheduled'
              }
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderViolations = () => (
    <View style={styles.tabContent}>
      {/* HPD Violations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HPD Violations ({building.violations.hpd.length})</Text>
        {building.violations.hpd.length === 0 ? (
          <Text style={styles.emptyText}>No HPD violations found</Text>
        ) : (
          building.violations.hpd.map((violation, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.violationCard, getViolationColor(violation.class)]}
              onPress={() => onViolationPress?.(violation)}
            >
              <View style={styles.violationHeader}>
                <Text style={styles.violationType}>{violation.type}</Text>
                <Text style={[styles.violationClass, getViolationColor(violation.class)]}>
                  Class {violation.class}
                </Text>
              </View>
              <Text style={styles.violationDescription}>{violation.description}</Text>
              <View style={styles.violationDetails}>
                <Text style={styles.violationDetail}>
                  Found: {violation.dateFound.toLocaleDateString()}
                </Text>
                <Text style={styles.violationDetail}>
                  Status: {violation.status}
                </Text>
                {violation.penalty > 0 && (
                  <Text style={styles.violationDetail}>
                    Penalty: ${violation.penalty.toLocaleString()}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* DSNY Violations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DSNY Violations ({building.violations.dsny.length})</Text>
        {building.violations.dsny.length === 0 ? (
          <Text style={styles.emptyText}>No DSNY violations found</Text>
        ) : (
          building.violations.dsny.map((violation, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.violationCard, getViolationColor(violation.status)]}
              onPress={() => onViolationPress?.(violation)}
            >
              <View style={styles.violationHeader}>
                <Text style={styles.violationType}>{violation.type}</Text>
                <Text style={[styles.violationClass, getViolationColor(violation.status)]}>
                  {violation.status}
                </Text>
              </View>
              <Text style={styles.violationDescription}>{violation.description}</Text>
              <View style={styles.violationDetails}>
                <Text style={styles.violationDetail}>
                  Issued: {violation.dateIssued.toLocaleDateString()}
                </Text>
                <Text style={styles.violationDetail}>
                  Fine: ${violation.fineAmount.toLocaleString()}
                </Text>
                <Text style={styles.violationDetail}>
                  Paid: ${violation.paidAmount.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* FDNY Inspections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FDNY Inspections ({building.violations.fdny.length})</Text>
        {building.violations.fdny.length === 0 ? (
          <Text style={styles.emptyText}>No FDNY inspections found</Text>
        ) : (
          building.violations.fdny.map((inspection, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.violationCard, getViolationColor(inspection.status)]}
              onPress={() => onViolationPress?.(inspection)}
            >
              <View style={styles.violationHeader}>
                <Text style={styles.violationType}>{inspection.type}</Text>
                <Text style={[styles.violationClass, getViolationColor(inspection.status)]}>
                  {inspection.status}
                </Text>
              </View>
              <Text style={styles.violationDescription}>
                Inspector: {inspection.inspector}
              </Text>
              <View style={styles.violationDetails}>
                <Text style={styles.violationDetail}>
                  Date: {inspection.date.toLocaleDateString()}
                </Text>
                {inspection.issues.length > 0 && (
                  <Text style={styles.violationDetail}>
                    Issues: {inspection.issues.join(', ')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* 311 Complaints */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>311 Complaints ({building.violations.complaints311.length})</Text>
        {building.violations.complaints311.length === 0 ? (
          <Text style={styles.emptyText}>No 311 complaints found</Text>
        ) : (
          building.violations.complaints311.map((complaint, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.violationCard, getViolationColor(complaint.status)]}
              onPress={() => onViolationPress?.(complaint)}
            >
              <View style={styles.violationHeader}>
                <Text style={styles.violationType}>{complaint.type}</Text>
                <Text style={[styles.violationClass, getViolationColor(complaint.status)]}>
                  {complaint.status}
                </Text>
              </View>
              <Text style={styles.violationDescription}>{complaint.description}</Text>
              <View style={styles.violationDetails}>
                <Text style={styles.violationDetail}>
                  Created: {complaint.dateCreated.toLocaleDateString()}
                </Text>
                <Text style={styles.violationDetail}>
                  Agency: {complaint.agency}
                </Text>
                <Text style={styles.violationDetail}>
                  Reporter: {complaint.reporter}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderFinancial = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.financialGrid}>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Total Fines</Text>
            <Text style={styles.financialValue}>${building.financial.totalFines.toLocaleString()}</Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Outstanding</Text>
            <Text style={[styles.financialValue, styles.outstandingValue]}>
              ${building.financial.outstandingFines.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Paid</Text>
            <Text style={[styles.financialValue, styles.paidValue]}>
              ${building.financial.paidFines.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Estimated Resolution</Text>
            <Text style={[styles.financialValue, styles.estimatedValue]}>
              ${building.financial.estimatedResolution.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        <View style={styles.paymentCard}>
          <Text style={styles.paymentText}>
            Payment history and detailed financial breakdown will be displayed here
          </Text>
        </View>
      </View>
    </View>
  );

  const renderInspections = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inspection History</Text>
        {building.inspections.inspectionHistory.length === 0 ? (
          <Text style={styles.emptyText}>No inspection history available</Text>
        ) : (
          building.inspections.inspectionHistory.map((inspection, index) => (
            <View key={index} style={styles.inspectionCard}>
              <View style={styles.inspectionHeader}>
                <Text style={styles.inspectionType}>{inspection.type}</Text>
                <Text style={[styles.inspectionResult, getInspectionColor(inspection.result)]}>
                  {inspection.result}
                </Text>
              </View>
              <Text style={styles.inspectionDate}>
                {inspection.date.toLocaleDateString()}
              </Text>
              <View style={styles.inspectionDetails}>
                <Text style={styles.inspectionDetail}>
                  Score: {inspection.score}/100
                </Text>
                <Text style={styles.inspectionDetail}>
                  Violations: {inspection.violations}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Inspections</Text>
        <View style={styles.upcomingCard}>
          <Text style={styles.upcomingText}>
            Next inspection scheduled for {building.inspections.nextInspection?.toLocaleDateString() || 'TBD'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.buildingName}>{building.name}</Text>
          <Text style={styles.buildingAddress}>{building.address}</Text>
          <View style={styles.headerStats}>
            <Text style={[styles.headerScore, getScoreColor(building.score)]}>
              {building.score}%
            </Text>
            <Text style={[styles.headerGrade, getGradeColor(building.grade)]}>
              {building.grade}
            </Text>
            <Text style={[styles.headerStatus, getStatusColor(building.status)]}>
              {building.status.toUpperCase()}
            </Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'violations' && styles.activeTab]}
          onPress={() => setActiveTab('violations')}
        >
          <Text style={[styles.tabText, activeTab === 'violations' && styles.activeTabText]}>
            Violations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'financial' && styles.activeTab]}
          onPress={() => setActiveTab('financial')}
        >
          <Text style={[styles.tabText, activeTab === 'financial' && styles.activeTabText]}>
            Financial
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inspections' && styles.activeTab]}
          onPress={() => setActiveTab('inspections')}
        >
          <Text style={[styles.tabText, activeTab === 'inspections' && styles.activeTabText]}>
            Inspections
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'violations' && renderViolations()}
        {activeTab === 'financial' && renderFinancial()}
        {activeTab === 'inspections' && renderInspections()}
      </ScrollView>
    </View>
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

const getViolationColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'critical':
    case 'open':
    case 'failed':
      return styles.violationCritical;
    case 'high':
    case 'warning':
    case 'pending':
      return styles.violationWarning;
    case 'medium':
    case 'info':
    case 'passed':
      return styles.violationInfo;
    default:
      return styles.violationDefault;
  }
};

const getInspectionColor = (result: string) => {
  switch (result.toLowerCase()) {
    case 'passed':
      return styles.inspectionPassed;
    case 'failed':
      return styles.inspectionFailed;
    default:
      return styles.inspectionPending;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  buildingName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buildingAddress: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerGrade: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  overviewCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overviewLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  overviewValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overviewGrade: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overviewStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inspectionCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inspectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectionLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  inspectionValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  violationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  violationType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  violationClass: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  violationDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  violationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  violationDetail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
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
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  financialLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  financialValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  outstandingValue: {
    color: '#FF6B6B',
  },
  paidValue: {
    color: '#10B981',
  },
  estimatedValue: {
    color: '#F59E0B',
  },
  paymentCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  upcomingCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  upcomingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  inspectionType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inspectionResult: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inspectionDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  inspectionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  inspectionDetail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
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
    color: '#EF4444'
  },
  statusHigh: { 
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#F59E0B'
  },
  statusMedium: { 
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#3B82F6'
  },
  statusLow: { 
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981'
  },
  // Violation colors
  violationCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: '#EF4444'
  },
  violationWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    color: '#F59E0B'
  },
  violationInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    color: '#3B82F6'
  },
  violationDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  // Inspection colors
  inspectionPassed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981'
  },
  inspectionFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#EF4444'
  },
  inspectionPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#F59E0B'
  },
});

export default BuildingComplianceDetail;
