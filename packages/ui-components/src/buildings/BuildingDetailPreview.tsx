/**
 * 🏢 Building Detail Preview
 * Purpose: Smart preview for workers to review building details before clocking in
 * Features: Overview, routines, compliance status, quick actions
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { 
  Building, 
  ContextualTask,
  ComplianceIssue,
  CollectionScheduleSummary
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface BuildingDetailPreviewProps {
  building: Building;
  workerId: string;
  onClockIn: (buildingId: string) => void;
  onViewFullDetails: () => void;
  onClose: () => void;
}

export const BuildingDetailPreview: React.FC<BuildingDetailPreviewProps> = ({
  building,
  workerId,
  onClockIn,
  onViewFullDetails,
  onClose
}) => {
  const [todaysRoutines, setTodaysRoutines] = useState<ContextualTask[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [collectionSchedule, setCollectionSchedule] = useState<CollectionScheduleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadBuildingDetails();
  }, [building.id, workerId]);

  const loadBuildingDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load today's routines for this building
      const routines = await services.task.getTodaysRoutinesForBuilding(building.id, workerId);
      setTodaysRoutines(routines);
      
      // Load compliance issues
      const issues = await services.compliance.getComplianceIssuesForBuilding(building.id);
      setComplianceIssues(issues);
      
      // Load collection schedule
      const schedule = await services.building.getCollectionSchedule(building.id);
      setCollectionSchedule(schedule);
      
    } catch (error) {
      console.error('Error loading building details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockIn = () => {
    Alert.alert(
      'Clock In',
      `Are you ready to clock in at ${building.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clock In', 
          style: 'default',
          onPress: () => {
            onClockIn(building.id);
            onClose();
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.buildingName}>{building.name}</Text>
        <Text style={styles.buildingAddress}>{building.address}</Text>
        <Text style={styles.buildingType}>{building.type}</Text>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickStats = () => (
    <GlassCard style={styles.statsCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Quick Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todaysRoutines.length}</Text>
          <Text style={styles.statLabel}>Today's Routines</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{complianceIssues.length}</Text>
          <Text style={styles.statLabel}>Active Issues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{building.sqFt.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Sq Ft</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{building.floors}</Text>
          <Text style={styles.statLabel}>Floors</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderTodaysRoutines = () => (
    <GlassCard style={styles.routinesCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Today's Routines</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading routines...</Text>
      ) : todaysRoutines.length === 0 ? (
        <Text style={styles.emptyText}>No routines scheduled for today</Text>
      ) : (
        <View style={styles.routinesList}>
          {todaysRoutines.slice(0, 3).map(routine => (
            <View key={routine.id} style={styles.routineItem}>
              <View style={styles.routineIcon}>
                <Text style={styles.routineIconText}>
                  {routine.category === 'cleaning' ? '🧹' :
                   routine.category === 'maintenance' ? '🔧' :
                   routine.category === 'inspection' ? '🔍' : '📋'}
                </Text>
              </View>
              <View style={styles.routineContent}>
                <Text style={styles.routineTitle}>{routine.title}</Text>
                <Text style={styles.routineTime}>
                  {routine.dueDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[
                styles.routineStatus,
                { backgroundColor: getPriorityColor(routine.priority) }
              ]}>
                <Text style={styles.routineStatusText}>{routine.priority}</Text>
              </View>
            </View>
          ))}
          {todaysRoutines.length > 3 && (
            <TouchableOpacity style={styles.viewMoreButton} onPress={onViewFullDetails}>
              <Text style={styles.viewMoreText}>View {todaysRoutines.length - 3} more routines</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </GlassCard>
  );

  const renderComplianceStatus = () => (
    <GlassCard style={styles.complianceCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Compliance Status</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      ) : complianceIssues.length === 0 ? (
        <View style={styles.complianceGood}>
          <Text style={styles.complianceGoodIcon}>✅</Text>
          <Text style={styles.complianceGoodText}>All Clear</Text>
        </View>
      ) : (
        <View style={styles.complianceIssues}>
          {complianceIssues.slice(0, 2).map(issue => (
            <View key={issue.id} style={styles.issueItem}>
              <View style={[
                styles.issueSeverity,
                { backgroundColor: getSeverityColor(issue.severity) }
              ]}>
                <Text style={styles.issueSeverityText}>{issue.severity}</Text>
              </View>
              <View style={styles.issueContent}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDescription}>{issue.description}</Text>
              </View>
            </View>
          ))}
          {complianceIssues.length > 2 && (
            <TouchableOpacity style={styles.viewMoreButton} onPress={onViewFullDetails}>
              <Text style={styles.viewMoreText}>View {complianceIssues.length - 2} more issues</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </GlassCard>
  );

  const renderCollectionSchedule = () => {
    if (!collectionSchedule) return null;

    return (
      <GlassCard style={styles.collectionCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.sectionTitle}>Collection Schedule</Text>
        <View style={styles.collectionInfo}>
          <View style={styles.collectionItem}>
            <Text style={styles.collectionLabel}>Regular Collection:</Text>
            <Text style={styles.collectionValue}>{collectionSchedule.regularCollectionDay}</Text>
          </View>
          <View style={styles.collectionItem}>
            <Text style={styles.collectionLabel}>Recycling:</Text>
            <Text style={styles.collectionValue}>{collectionSchedule.recyclingDay}</Text>
          </View>
          <View style={styles.collectionItem}>
            <Text style={styles.collectionLabel}>Next Collection:</Text>
            <Text style={styles.collectionValue}>
              {collectionSchedule.nextCollectionDate.toLocaleDateString()}
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewFullDetails}>
        <Text style={styles.viewDetailsButtonText}>View Full Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.clockInButton} onPress={handleClockIn}>
        <Text style={styles.clockInButtonText}>Clock In</Text>
      </TouchableOpacity>
    </View>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return Colors.status.error;
      case 'medium': return Colors.status.warning;
      case 'low': return Colors.status.success;
      default: return Colors.glass.medium;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return Colors.status.error;
      case 'high': return Colors.status.error;
      case 'medium': return Colors.status.warning;
      case 'low': return Colors.status.success;
      default: return Colors.glass.medium;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderQuickStats()}
        {renderTodaysRoutines()}
        {renderComplianceStatus()}
        {renderCollectionSchedule()}
        {renderActions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.medium,
  },
  headerContent: {
    flex: 1,
  },
  buildingName: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  buildingAddress: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  buildingType: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
  },
  
  // Stats
  statsCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Routines
  routinesCard: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  routinesList: {
    gap: Spacing.sm,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  routineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  routineIconText: {
    fontSize: 16,
  },
  routineContent: {
    flex: 1,
  },
  routineTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  routineTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  routineStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routineStatusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  
  // Compliance
  complianceCard: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
  },
  complianceGood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  complianceGoodIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  complianceGoodText: {
    ...Typography.subheadline,
    color: Colors.status.success,
    fontWeight: '600',
  },
  complianceIssues: {
    gap: Spacing.sm,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  issueSeverity: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  issueSeverityText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  issueContent: {
    flex: 1,
  },
  issueTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  issueDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  
  // Collection
  collectionCard: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
  },
  collectionInfo: {
    gap: Spacing.sm,
  },
  collectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  collectionLabel: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  collectionValue: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  viewDetailsButton: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  clockInButton: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.primary.green,
    borderRadius: 12,
    alignItems: 'center',
  },
  clockInButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // View More
  viewMoreButton: {
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  viewMoreText: {
    ...Typography.caption,
    color: Colors.primary.blue,
    fontWeight: '500',
  },
});
