/**
 * CriticalBuildingDetailScreen
 * 
 * React Native component for critical buildings requiring immediate attention
 * Handles emergency compliance issues, HPD violations, and urgent repairs
 * Implements the 6-tab interface with emergency focus
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { useCriticalBuildingDetailViewModel } from '@cyntientops/context-engines';
import { ServiceContainer } from '@cyntientops/business-core';

interface CriticalBuildingDetailScreenProps {
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  container: ServiceContainer;
  onBack?: () => void;
}

export const CriticalBuildingDetailScreen: React.FC<CriticalBuildingDetailScreenProps> = ({
  buildingId,
  buildingName,
  buildingAddress,
  container,
  onBack
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    // State
    complianceScore,
    complianceGrade,
    complianceStatus,
    hpdViolations,
    dsnyViolations,
    outstandingFines,
    dailyPenalties,
    assignedWorkers,
    emergencyContacts,
    isEmergencyMode,
    selectedTab,
    isLoading,
    error,
    
    // Actions
    startEmergencyProtocol,
    assignEmergencyWorker,
    escalateToAdmin,
    startViolationRepair,
    markViolationComplete,
    contactHPD,
    payOutstandingFines,
    switchTab,
    refreshData
  } = useCriticalBuildingDetailViewModel(container, buildingId, buildingName, buildingAddress);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleEmergencyProtocol = () => {
    Alert.alert(
      '🚨 Emergency Protocol',
      'This will activate emergency mode and notify all workers. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Activate', 
          style: 'destructive',
          onPress: () => startEmergencyProtocol()
        }
      ]
    );
  };

  const handleViolationRepair = (violationId: string) => {
    Alert.alert(
      '🔧 Start Violation Repair',
      'This will assign a worker to start repairs immediately. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Repair', 
          onPress: () => startViolationRepair(violationId)
        }
      ]
    );
  };

  const handlePayFines = () => {
    Alert.alert(
      '💰 Pay Outstanding Fines',
      `Pay $${outstandingFines} in outstanding fines?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: () => payOutstandingFines(outstandingFines)
        }
      ]
    );
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return Colors.success;
    if (score >= 80) return Colors.warning;
    if (score >= 70) return Colors.critical;
    return Colors.critical;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return Colors.critical;
      case 'high': return Colors.warning;
      case 'medium': return Colors.info;
      case 'low': return Colors.success;
      default: return Colors.inactive;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.buildingName}>{buildingName}</Text>
      <Text style={styles.buildingAddress}>{buildingAddress}</Text>
      {isEmergencyMode && (
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>🚨 EMERGENCY MODE ACTIVE</Text>
        </View>
      )}
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      {[
        { key: 'overview', label: 'Overview', icon: '🏢' },
        { key: 'operations', label: 'Operations', icon: '🔧' },
        { key: 'compliance', label: 'Compliance', icon: '🚨' },
        { key: 'resources', label: 'Resources', icon: '📦' },
        { key: 'emergency', label: 'Emergency', icon: '🚨' },
        { key: 'reports', label: 'Reports', icon: '📊' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && styles.tabButtonActive
          ]}
          onPress={() => switchTab(tab.key as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            selectedTab === tab.key && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Building Details</Text>
        <Text style={styles.buildingInfo}>🏢 {buildingName}</Text>
        <Text style={styles.buildingInfo}>📍 {buildingAddress}</Text>
        <Text style={styles.buildingInfo}>📊 Compliance: {complianceScore}% ({complianceGrade})</Text>
        <Text style={styles.buildingInfo}>💰 Outstanding Fines: ${outstandingFines}</Text>
      </GlassCard>

      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Critical Compliance Status</Text>
        <View style={styles.complianceStatus}>
          <Text style={[styles.complianceScore, { color: getComplianceColor(complianceScore) }]}>
            {complianceScore}% ({complianceGrade})
          </Text>
          <Text style={styles.complianceStatusText}>
            Status: {complianceStatus.toUpperCase()} • Last Updated: {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.complianceStatusText}>
            Trend: Declining • Next Review: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </Text>
          <Text style={styles.emergencyWarning}>⚠️ IMMEDIATE ACTION REQUIRED</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Assigned Team (Emergency)</Text>
        {assignedWorkers.map(worker => (
          <View key={worker.id} style={styles.workerItem}>
            <Text style={styles.workerName}>👤 {worker.name} - {worker.role}</Text>
            <Text style={styles.workerStatus}>Status: {worker.status.toUpperCase()}</Text>
            <Text style={styles.workerPhone}>📞 {worker.phone}</Text>
            <Text style={styles.workerTask}>Current: {worker.currentTask}</Text>
            {worker.isEmergencyAssigned && (
              <Text style={styles.emergencyAssigned}>🚨 EMERGENCY ASSIGNED</Text>
            )}
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Emergency Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyProtocol}>
            <Text style={styles.emergencyButtonText}>🚨 Start Emergency Protocol</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.payButton} onPress={handlePayFines}>
            <Text style={styles.payButtonText}>💰 Pay Fines (${outstandingFines})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={() => contactHPD('')}>
            <Text style={styles.contactButtonText}>📞 Contact HPD</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </ScrollView>
  );

  const renderOperationsTab = () => (
    <ScrollView style={styles.tabContent}>
      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Emergency Tasks</Text>
        {hpdViolations.map(violation => (
          <View key={violation.violationid} style={styles.violationItem}>
            <Text style={styles.violationTitle}>
              🚨 HPD Violation #{violation.violationid} - Class {violation.violationclass}
            </Text>
            <Text style={styles.violationDescription}>{violation.description}</Text>
            <Text style={styles.violationFine}>Fine: ${violation.penalty || 0}</Text>
            <Text style={styles.violationStatus}>Status: {violation.currentstatus}</Text>
            <TouchableOpacity 
              style={styles.repairButton}
              onPress={() => handleViolationRepair(violation.violationid)}
            >
              <Text style={styles.repairButtonText}>🔧 Start Repair</Text>
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Emergency Team Status</Text>
        {assignedWorkers.map(worker => (
          <View key={worker.id} style={styles.workerItem}>
            <Text style={styles.workerName}>👤 {worker.name} - {worker.role}</Text>
            <Text style={styles.workerStatus}>Status: {worker.status.toUpperCase()}</Text>
            <Text style={styles.workerPhone}>📞 {worker.phone}</Text>
            <Text style={styles.workerTask}>Current: {worker.currentTask}</Text>
            <TouchableOpacity 
              style={styles.assignButton}
              onPress={() => assignEmergencyWorker(worker.id, 'Emergency Task')}
            >
              <Text style={styles.assignButtonText}>Assign Emergency Task</Text>
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );

  const renderComplianceTab = () => (
    <ScrollView style={styles.tabContent}>
      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Critical Compliance Overview</Text>
        <View style={styles.complianceStatus}>
          <Text style={[styles.complianceScore, { color: getComplianceColor(complianceScore) }]}>
            {complianceScore}% ({complianceGrade})
          </Text>
          <Text style={styles.complianceStatusText}>
            Status: {complianceStatus.toUpperCase()} • Last Updated: {new Date().toLocaleDateString()}
          </Text>
          <Text style={styles.complianceStatusText}>
            Trend: Declining • Next Review: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </Text>
          <Text style={styles.emergencyWarning}>⚠️ IMMEDIATE ACTION REQUIRED</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Active Violations (Urgent)</Text>
        {hpdViolations.map(violation => (
          <View key={violation.violationid} style={styles.violationItem}>
            <Text style={styles.violationTitle}>
              🚨 HPD Violation #{violation.violationid} - Class {violation.violationclass}
            </Text>
            <Text style={styles.violationDescription}>{violation.description}</Text>
            <Text style={styles.violationFine}>Fine: ${violation.penalty || 0}</Text>
            <Text style={styles.violationStatus}>Status: {violation.currentstatus}</Text>
            <View style={styles.violationActions}>
              <TouchableOpacity 
                style={styles.repairButton}
                onPress={() => handleViolationRepair(violation.violationid)}
              >
                <Text style={styles.repairButtonText}>🔧 Start Repair</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => contactHPD(violation.violationid)}
              >
                <Text style={styles.contactButtonText}>📞 Contact HPD</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.cardTitle}>Financial Impact (Urgent)</Text>
        <Text style={styles.financialItem}>💰 Outstanding Fines: ${outstandingFines} - URGENT PAYMENT</Text>
        <Text style={styles.financialItem}>💰 Daily Penalty: ${dailyPenalties} - ACCRUING</Text>
        <Text style={styles.financialItem}>💰 Estimated Total: ${outstandingFines + (dailyPenalties * 7)} - PROJECTED</Text>
        <TouchableOpacity style={styles.payButton} onPress={handlePayFines}>
          <Text style={styles.payButtonText}>💰 Pay Fines Now</Text>
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'operations':
        return renderOperationsTab();
      case 'compliance':
        return renderComplianceTab();
      case 'resources':
        return (
          <ScrollView style={styles.tabContent}>
            <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.cardTitle}>Emergency Supplies</Text>
              <Text style={styles.supplyItem}>🔧 Boiler Parts: 2 (MERV-8) • Status: AVAILABLE</Text>
              <Text style={styles.supplyItem}>⚡ Electrical Supplies: 5 (LED) • Status: GOOD</Text>
              <Text style={styles.supplyItem}>🔨 Plumbing Tools: Complete Set • Status: GOOD</Text>
              <Text style={styles.supplyItem}>🚨 Emergency Equipment: 3 (FIRE) • Status: READY</Text>
            </GlassCard>
          </ScrollView>
        );
      case 'emergency':
        return (
          <ScrollView style={styles.tabContent}>
            <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.cardTitle}>Critical Emergency Actions</Text>
              <Text style={styles.emergencyItem}>🚨 HPD Violations: {hpdViolations.length} ACTIVE - IMMEDIATE ACTION</Text>
              <Text style={styles.emergencyItem}>🔧 Boiler Repair: NO HEAT - EMERGENCY</Text>
              <Text style={styles.emergencyItem}>⚡ Electrical Hazard: EXPOSED WIRING - DANGER</Text>
              <Text style={styles.emergencyItem}>💧 Plumbing Leak: WATER DAMAGE - URGENT</Text>
              <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyProtocol}>
                <Text style={styles.emergencyButtonText}>🚨 Start Emergency Protocol</Text>
              </TouchableOpacity>
            </GlassCard>
          </ScrollView>
        );
      case 'reports':
        return (
          <ScrollView style={styles.tabContent}>
            <GlassCard style={styles.card} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
              <Text style={styles.cardTitle}>Critical Analysis</Text>
              <Text style={styles.reportItem}>📊 Compliance Trend: DECLINING (65% → 60%)</Text>
              <Text style={styles.reportItem}>💰 Financial Impact: ${outstandingFines} + ${dailyPenalties}/day penalty</Text>
              <Text style={styles.reportItem}>🚨 Risk Level: CRITICAL - IMMEDIATE ACTION</Text>
              <Text style={styles.reportItem}>📅 Timeline: 7 days to avoid additional fines</Text>
            </GlassCard>
          </ScrollView>
        );
      default:
        return renderOverviewTab();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryAction} />
          <Text style={styles.loadingText}>Loading critical building data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabNavigation()}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primaryAction}
          />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.critical,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.subheadline,
    color: 'white',
    fontWeight: '600',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginBottom: Spacing.md,
  },
  backButtonText: {
    ...Typography.subheadline,
    color: Colors.primaryAction,
    fontWeight: '600',
  },
  buildingName: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  buildingAddress: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  emergencyBanner: {
    backgroundColor: Colors.critical,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyText: {
    ...Typography.subheadline,
    color: 'white',
    fontWeight: 'bold',
  },
  tabNavigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: Spacing.sm,
    margin: Spacing.xs,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryAction,
    borderColor: Colors.primaryAction,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  tabContent: {
    flex: 1,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  buildingInfo: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  complianceStatus: {
    alignItems: 'center',
  },
  complianceScore: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  complianceStatusText: {
    ...Typography.body,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emergencyWarning: {
    ...Typography.subheadline,
    color: Colors.critical,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  workerItem: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
  },
  workerName: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  workerStatus: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  workerPhone: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  workerTask: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  emergencyAssigned: {
    ...Typography.caption,
    color: Colors.critical,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emergencyButton: {
    backgroundColor: Colors.critical,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  emergencyButtonText: {
    ...Typography.subheadline,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  payButtonText: {
    ...Typography.subheadline,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  contactButtonText: {
    ...Typography.subheadline,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  violationItem: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.glassOverlay,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  violationTitle: {
    ...Typography.subheadline,
    color: Colors.critical,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  violationDescription: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  violationFine: {
    ...Typography.body,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  violationStatus: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.sm,
  },
  violationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repairButton: {
    backgroundColor: Colors.primaryAction,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    flex: 1,
    marginRight: Spacing.xs,
  },
  repairButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  assignButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  assignButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  financialItem: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  supplyItem: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  emergencyItem: {
    ...Typography.body,
    color: Colors.critical,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  reportItem: {
    ...Typography.body,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
});

export default CriticalBuildingDetailScreen;
