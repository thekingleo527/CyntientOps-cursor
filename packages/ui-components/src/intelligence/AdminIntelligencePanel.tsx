/**
 * 👑 Admin Intelligence Panel
 * Mirrors: CyntientOps/Views/Main/AdminDashboardView.swift intelligence tabs
 * Purpose: Admin-focused intelligence with Analytics, Workforce, Compliance, Performance tabs
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { 
  IntelligenceInsight, 
  WorkerProfile,
  ComplianceIssue,
  AdminAlert,
  UserRole 
} from '@cyntientops/domain-schema';

export interface AdminIntelligencePanelProps {
  insights: IntelligenceInsight[];
  allWorkers: WorkerProfile[];
  activeWorkers: WorkerProfile[];
  criticalIssues: ComplianceIssue[];
  adminAlerts: AdminAlert[];
  onWorkerPress?: (worker: WorkerProfile) => void;
  onIssuePress?: (issue: ComplianceIssue) => void;
  onAlertPress?: (alert: AdminAlert) => void;
  onInsightPress?: (insight: IntelligenceInsight) => void;
  isLoading?: boolean;
}

export enum AdminIntelTab {
  ANALYTICS = 'Analytics',
  WORKFORCE = 'Workforce',
  COMPLIANCE = 'Compliance',
  PERFORMANCE = 'Performance'
}

export interface AdminMetrics {
  totalActiveWorkers: number;
  totalBuildings: number;
  todaysTasksCompleted: number;
  todaysTasksTotal: number;
  overallCompletionRate: number;
  criticalIssues: number;
  overdueTasks: number;
}

export const AdminIntelligencePanel: React.FC<AdminIntelligencePanelProps> = ({
  insights,
  allWorkers,
  activeWorkers,
  criticalIssues,
  adminAlerts,
  onWorkerPress,
  onIssuePress,
  onAlertPress,
  onInsightPress,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<AdminIntelTab>(AdminIntelTab.ANALYTICS);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalActiveWorkers: 0,
    totalBuildings: 0,
    todaysTasksCompleted: 0,
    todaysTasksTotal: 0,
    overallCompletionRate: 0,
    criticalIssues: 0,
    overdueTasks: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [allWorkers, activeWorkers, criticalIssues, adminAlerts]);

  const calculateTodaysTasksCompleted = (): number => {
    // Get from tasks data - placeholder implementation
    return Math.floor(Math.random() * 20) + 30; // 30-50 range
  };

  const calculateTodaysTasksTotal = (): number => {
    // Get from tasks data - placeholder implementation
    return Math.floor(Math.random() * 10) + 60; // 60-70 range
  };

  const calculateOverallCompletionRate = (): number => {
    // Calculate - placeholder implementation
    return Math.floor(Math.random() * 20) + 75; // 75-95% range
  };

  const calculateMetrics = () => {
    // Load real buildings data
    const buildingsData = require('@cyntientops/data-seed/buildings.json');

    const newMetrics: AdminMetrics = {
      totalActiveWorkers: activeWorkers.length,
      totalBuildings: buildingsData.length, // Real count: 18 locations
      todaysTasksCompleted: calculateTodaysTasksCompleted(), // Get from tasks data
      todaysTasksTotal: calculateTodaysTasksTotal(), // Get from tasks data
      overallCompletionRate: calculateOverallCompletionRate(), // Calculate
      criticalIssues: criticalIssues.length,
      overdueTasks: adminAlerts.filter(alert => alert.type === 'task').length
    };
    
    setMetrics(newMetrics);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.text.tertiary;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.text.tertiary;
    }
  };

  const renderTabButton = (tab: AdminIntelTab) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        selectedTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[
        styles.tabText,
        selectedTab === tab && styles.tabTextActive
      ]}>
        {tab}
      </Text>
    </TouchableOpacity>
  );

  const renderAnalyticsPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>System Analytics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalActiveWorkers}</Text>
          <Text style={styles.metricLabel}>Active Workers</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalBuildings}</Text>
          <Text style={styles.metricLabel}>Total Buildings</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.overallCompletionRate.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>Completion Rate</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: Colors.status.error }]}>
            {metrics.criticalIssues}
          </Text>
          <Text style={styles.metricLabel}>Critical Issues</Text>
        </View>
      </View>
      
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        {insights.slice(0, 3).map(insight => (
          <TouchableOpacity
            key={insight.id}
            style={styles.insightItem}
            onPress={() => onInsightPress?.(insight)}
          >
            <View style={styles.insightHeader}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(insight.priority) }]} />
            </View>
            <Text style={styles.insightDescription} numberOfLines={2}>
              {insight.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderWorkforcePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Workforce Management</Text>
      
      <View style={styles.workforceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{allWorkers.length}</Text>
          <Text style={styles.statLabel}>Total Workers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeWorkers.length}</Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>
      </View>
      
      <View style={styles.workersList}>
        <Text style={styles.sectionTitle}>Active Workers</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.text.primary} />
        ) : activeWorkers.length === 0 ? (
          <Text style={styles.emptyText}>No active workers</Text>
        ) : (
          activeWorkers.slice(0, 5).map(worker => (
            <TouchableOpacity
              key={worker.id}
              style={styles.workerItem}
              onPress={() => onWorkerPress?.(worker)}
            >
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerRole}>{worker.role}</Text>
              </View>
              <View style={styles.workerStatus}>
                <View style={styles.activeIndicator} />
                <Text style={styles.workerStatusText}>Active</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderCompliancePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Compliance Overview</Text>
      
      <View style={styles.complianceStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.status.error }]}>
            {criticalIssues.length}
          </Text>
          <Text style={styles.statLabel}>Critical Issues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.status.warning }]}>
            {metrics.overdueTasks}
          </Text>
          <Text style={styles.statLabel}>Overdue Tasks</Text>
        </View>
      </View>
      
      <View style={styles.issuesList}>
        <Text style={styles.sectionTitle}>Critical Issues</Text>
        {criticalIssues.length === 0 ? (
          <Text style={styles.emptyText}>No critical issues</Text>
        ) : (
          criticalIssues.slice(0, 3).map(issue => (
            <TouchableOpacity
              key={issue.id}
              style={styles.issueItem}
              onPress={() => onIssuePress?.(issue)}
            >
              <View style={styles.issueHeader}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getPriorityColor(issue.severity) }]}>
                  <Text style={styles.severityText}>{issue.severity}</Text>
                </View>
              </View>
              <Text style={styles.issueDescription} numberOfLines={2}>
                {issue.description}
              </Text>
              {issue.buildingName && (
                <Text style={styles.issueBuilding}>📍 {issue.buildingName}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderPerformancePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Performance Analytics</Text>
      
      <View style={styles.performanceMetrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.todaysTasksCompleted}</Text>
          <Text style={styles.metricLabel}>Tasks Completed Today</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.todaysTasksTotal}</Text>
          <Text style={styles.metricLabel}>Total Tasks Today</Text>
        </View>
      </View>
      
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {adminAlerts.length === 0 ? (
          <Text style={styles.emptyText}>No recent alerts</Text>
        ) : (
          adminAlerts.slice(0, 3).map(alert => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertItem}
              onPress={() => onAlertPress?.(alert)}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <View style={[styles.alertSeverity, { backgroundColor: getAlertSeverityColor(alert.severity) }]}>
                  <Text style={styles.alertSeverityText}>{alert.severity}</Text>
                </View>
              </View>
              <Text style={styles.alertMessage} numberOfLines={2}>
                {alert.message}
              </Text>
              <Text style={styles.alertTimestamp}>
                {alert.timestamp.toLocaleTimeString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case AdminIntelTab.ANALYTICS:
        return renderAnalyticsPanel();
      case AdminIntelTab.WORKFORCE:
        return renderWorkforcePanel();
      case AdminIntelTab.COMPLIANCE:
        return renderCompliancePanel();
      case AdminIntelTab.PERFORMANCE:
        return renderPerformancePanel();
      default:
        return renderAnalyticsPanel();
    }
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.tabContainer}>
        {Object.values(AdminIntelTab).map(renderTabButton)}
      </View>
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.glass.medium,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  // Content Styles
  contentContainer: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    padding: Spacing.md,
  },
  panelContent: {
    minHeight: 200,
  },
  panelTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  
  // Analytics Panel Styles
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: '48%',
    padding: Spacing.md,
    marginRight: '2%',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  
  // Insights Section
  insightsSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  insightItem: {
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  insightTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  
  // Workforce Panel Styles
  workforceStats: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  workersList: {
    marginTop: Spacing.md,
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  workerRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  workerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.success,
    marginRight: Spacing.xs,
  },
  workerStatusText: {
    ...Typography.caption,
    color: Colors.status.success,
    fontWeight: '500',
  },
  
  // Compliance Panel Styles
  complianceStats: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  issuesList: {
    marginTop: Spacing.md,
  },
  issueItem: {
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  issueTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  severityText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  issueDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  issueBuilding: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  
  // Performance Panel Styles
  performanceMetrics: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  alertsSection: {
    marginTop: Spacing.md,
  },
  alertItem: {
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  alertTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  alertSeverity: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  alertSeverityText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  alertMessage: {
    ...Typography.caption,
    color: Colors.text.secondary,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  alertTimestamp: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'right',
  },
});
