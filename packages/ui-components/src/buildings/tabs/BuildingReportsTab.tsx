/**
 * 🏢 Building Reports Tab
 * Purpose: Building reports, analysis, and performance metrics
 * Features: Building reports, analysis, standards, maintenance actions, performance
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';

export interface BuildingReportsTabProps {
  building: {
    id: string;
    name: string;
    address: string;
    coordinate: { latitude: number; longitude: number };
  };
  metrics: {
    efficiency: number;
    quality: number;
    compliance: number;
    costPerSqFt: number;
    taskCount: number;
    completionRate: number;
    averageResponseTime: number;
    lastInspection: Date;
    criticalIssues: number;
  };
  compliance: {
    score: number;
    issues: Array<{
      id: string;
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'resolved';
      dueDate?: Date;
    }>;
    lastUpdate: Date;
    nextInspection?: Date;
  };
}

export const BuildingReportsTab: React.FC<BuildingReportsTabProps> = ({
  building,
  metrics,
  compliance,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<string>('overview');

  const reportTypes = [
    { id: 'overview', title: 'Overview', icon: '📊' },
    { id: 'analysis', title: 'Analysis', icon: '📈' },
    { id: 'standards', title: 'Standards', icon: '📋' },
    { id: 'maintenance', title: 'Maintenance', icon: '🔧' },
    { id: 'performance', title: 'Performance', icon: '⚡' }
  ];

  const handleGenerateReport = (reportType: string) => {
    Alert.alert('Generate Report', `Generating ${reportType} report for ${building.name}`);
  };

  const handleExportReport = (reportType: string) => {
    Alert.alert('Export Report', `Exporting ${reportType} report as PDF`);
  };

  const handleShareReport = (reportType: string) => {
    Alert.alert('Share Report', `Sharing ${reportType} report with team`);
  };

  const renderOverviewReport = () => (
    <View style={styles.reportContent}>
      <Text style={styles.reportTitle}>Building Overview Report</Text>
      <Text style={styles.reportDate}>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.metricsGrid}>
        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.metricCard}>
          <Text style={styles.metricTitle}>Efficiency Score</Text>
          <Text style={styles.metricValue}>{Math.round(metrics.efficiency * 100)}%</Text>
          <Text style={styles.metricTrend}>↗️ +5% from last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.metricCard}>
          <Text style={styles.metricTitle}>Quality Score</Text>
          <Text style={styles.metricValue}>{Math.round(metrics.quality * 100)}%</Text>
          <Text style={styles.metricTrend}>↗️ +3% from last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.metricCard}>
          <Text style={styles.metricTitle}>Compliance Score</Text>
          <Text style={styles.metricValue}>{Math.round(metrics.compliance * 100)}%</Text>
          <Text style={styles.metricTrend}>↗️ +2% from last month</Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.metricCard}>
          <Text style={styles.metricTitle}>Cost per Sq Ft</Text>
          <Text style={styles.metricValue}>${metrics.costPerSqFt.toFixed(2)}</Text>
          <Text style={styles.metricTrend}>↘️ -$0.15 from last month</Text>
        </GlassCard>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Key Highlights</Text>
        <View style={styles.highlightsList}>
          <Text style={styles.highlightItem}>✅ {metrics.taskCount} tasks completed this month</Text>
          <Text style={styles.highlightItem}>✅ {Math.round(metrics.completionRate * 100)}% task completion rate</Text>
          <Text style={styles.highlightItem}>✅ {metrics.averageResponseTime}h average response time</Text>
          <Text style={styles.highlightItem}>✅ {metrics.criticalIssues} critical issues resolved</Text>
        </View>
      </View>
    </View>
  );

  const renderAnalysisReport = () => (
    <View style={styles.reportContent}>
      <Text style={styles.reportTitle}>Building Analysis Report</Text>
      <Text style={styles.reportDate}>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.analysisSection}>
        <Text style={styles.sectionTitle}>Performance Trends</Text>
        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Efficiency Trend</Text>
          <Text style={styles.analysisDescription}>
            Building efficiency has improved by 5% over the past month, driven by better task scheduling and worker optimization.
          </Text>
          <Text style={styles.analysisRecommendation}>
            💡 Recommendation: Continue current optimization strategies
          </Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Quality Trend</Text>
          <Text style={styles.analysisDescription}>
            Quality scores have increased by 3% due to improved maintenance procedures and better worker training.
          </Text>
          <Text style={styles.analysisRecommendation}>
            💡 Recommendation: Maintain current quality standards
          </Text>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Cost Analysis</Text>
          <Text style={styles.analysisDescription}>
            Cost per square foot has decreased by $0.15, indicating improved operational efficiency.
          </Text>
          <Text style={styles.analysisRecommendation}>
            💡 Recommendation: Continue cost optimization efforts
          </Text>
        </GlassCard>
      </View>
    </View>
  );

  const renderStandardsReport = () => (
    <View style={styles.reportContent}>
      <Text style={styles.reportTitle}>Building Standards Report</Text>
      <Text style={styles.reportDate}>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.standardsSection}>
        <Text style={styles.sectionTitle}>Compliance Status</Text>
        <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.standardsCard}>
          <Text style={styles.standardsTitle}>Overall Compliance</Text>
          <Text style={styles.standardsScore}>{Math.round(compliance.score)}%</Text>
          <Text style={styles.standardsGrade}>Grade: {getComplianceGrade(compliance.score)}</Text>
        </GlassCard>

        <View style={styles.standardsList}>
          <Text style={styles.standardsItem}>✅ Fire Safety: Compliant</Text>
          <Text style={styles.standardsItem}>✅ Health & Safety: Compliant</Text>
          <Text style={styles.standardsItem}>✅ Building Codes: Compliant</Text>
          <Text style={styles.standardsItem}>✅ Accessibility: Compliant</Text>
          <Text style={styles.standardsItem}>✅ Energy Efficiency: Compliant</Text>
        </View>

        <Text style={styles.sectionTitle}>Next Inspection</Text>
        <Text style={styles.inspectionDate}>
          Scheduled: {compliance.nextInspection?.toLocaleDateString() || 'TBD'}
        </Text>
      </View>
    </View>
  );

  const renderMaintenanceReport = () => (
    <View style={styles.reportContent}>
      <Text style={styles.reportTitle}>Maintenance Actions Report</Text>
      <Text style={styles.reportDate}>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.maintenanceSection}>
        <Text style={styles.sectionTitle}>Recent Maintenance</Text>
        <View style={styles.maintenanceList}>
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.maintenanceCard}>
            <Text style={styles.maintenanceTitle}>Water Filter Change</Text>
            <Text style={styles.maintenanceDate}>Completed: 10/09/2025</Text>
            <Text style={styles.maintenanceWorker}>Worker: Edwin Lema</Text>
            <Text style={styles.maintenanceStatus}>Status: ✅ Completed</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.maintenanceCard}>
            <Text style={styles.maintenanceTitle}>Stairwell Cleaning</Text>
            <Text style={styles.maintenanceDate}>Completed: 10/09/2025</Text>
            <Text style={styles.maintenanceWorker}>Worker: Kevin Dutan</Text>
            <Text style={styles.maintenanceStatus}>Status: ✅ Completed</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.maintenanceCard}>
            <Text style={styles.maintenanceTitle}>Recycling Collection</Text>
            <Text style={styles.maintenanceDate}>Completed: 10/09/2025</Text>
            <Text style={styles.maintenanceWorker}>Worker: Kevin Dutan</Text>
            <Text style={styles.maintenanceStatus}>Status: ✅ Completed</Text>
          </GlassCard>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
        <View style={styles.upcomingList}>
          <Text style={styles.upcomingItem}>🔧 HVAC Filter Change - Due: 10/15/2025</Text>
          <Text style={styles.upcomingItem}>🧹 Deep Cleaning - Due: 10/20/2025</Text>
          <Text style={styles.upcomingItem}>🔍 Safety Inspection - Due: 10/25/2025</Text>
        </View>
      </View>
    </View>
  );

  const renderPerformanceReport = () => (
    <View style={styles.reportContent}>
      <Text style={styles.reportTitle}>Building Performance Report</Text>
      <Text style={styles.reportDate}>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.performanceSection}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.performanceGrid}>
          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Task Completion</Text>
            <Text style={styles.performanceValue}>{Math.round(metrics.completionRate * 100)}%</Text>
            <Text style={styles.performanceTrend}>↗️ +8% this month</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Response Time</Text>
            <Text style={styles.performanceValue}>{metrics.averageResponseTime}h</Text>
            <Text style={styles.performanceTrend}>↘️ -0.5h improvement</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Critical Issues</Text>
            <Text style={styles.performanceValue}>{metrics.criticalIssues}</Text>
            <Text style={styles.performanceTrend}>↘️ -2 resolved</Text>
          </GlassCard>

          <GlassCard intensity={GlassIntensity.THIN} cornerRadius={CornerRadius.MEDIUM} style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Total Tasks</Text>
            <Text style={styles.performanceValue}>{metrics.taskCount}</Text>
            <Text style={styles.performanceTrend}>↗️ +12 this month</Text>
          </GlassCard>
        </View>

        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <Text style={styles.performanceSummary}>
          Building performance has shown consistent improvement across all key metrics. 
          Task completion rates are up 8%, response times have decreased by 0.5 hours, 
          and critical issues have been reduced by 2. The building is operating at 
          optimal efficiency with strong compliance scores.
        </Text>
      </View>
    </View>
  );

  const getComplianceGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    return 'D';
  };

  const renderReportContent = () => {
    switch (selectedReportType) {
      case 'overview': return renderOverviewReport();
      case 'analysis': return renderAnalysisReport();
      case 'standards': return renderStandardsReport();
      case 'maintenance': return renderMaintenanceReport();
      case 'performance': return renderPerformanceReport();
      default: return renderOverviewReport();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Report Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportTypeScroll}>
          {reportTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.reportTypeButton,
                selectedReportType === type.id && styles.selectedReportTypeButton
              ]}
              onPress={() => setSelectedReportType(type.id)}
            >
              <Text style={styles.reportTypeIcon}>{type.icon}</Text>
              <Text style={[
                styles.reportTypeText,
                selectedReportType === type.id && styles.selectedReportTypeText
              ]}>
                {type.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Report Content */}
      <View style={styles.section}>
        {renderReportContent()}
      </View>

      {/* Report Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleGenerateReport(selectedReportType)}
          >
            <Text style={styles.actionButtonText}>📊 Generate Report</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleExportReport(selectedReportType)}
          >
            <Text style={styles.actionButtonText}>📤 Export PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShareReport(selectedReportType)}
          >
            <Text style={styles.actionButtonText}>📤 Share Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  reportTypeScroll: {
    marginBottom: Spacing.lg,
  },
  reportTypeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.glass.regular,
    marginRight: Spacing.sm,
    alignItems: 'center',
    minWidth: 100,
  },
  selectedReportTypeButton: {
    backgroundColor: Colors.base.primary,
  },
  reportTypeIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  reportTypeText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedReportTypeText: {
    color: Colors.text.primary,
  },
  reportContent: {
    gap: Spacing.lg,
  },
  reportTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  reportDate: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  metricTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  metricTrend: {
    ...Typography.caption,
    color: Colors.status.success,
    fontWeight: '500',
  },
  summarySection: {
    marginTop: Spacing.lg,
  },
  highlightsList: {
    gap: Spacing.sm,
  },
  highlightItem: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  analysisSection: {
    gap: Spacing.md,
  },
  analysisCard: {
    padding: Spacing.lg,
  },
  analysisTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  analysisDescription: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  analysisRecommendation: {
    ...Typography.bodyMedium,
    color: Colors.base.primary,
    fontWeight: '500',
  },
  standardsSection: {
    gap: Spacing.md,
  },
  standardsCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  standardsTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  standardsScore: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  standardsGrade: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  standardsList: {
    gap: Spacing.sm,
  },
  standardsItem: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  inspectionDate: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  maintenanceSection: {
    gap: Spacing.md,
  },
  maintenanceList: {
    gap: Spacing.md,
  },
  maintenanceCard: {
    padding: Spacing.lg,
  },
  maintenanceTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  maintenanceDate: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  maintenanceWorker: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  maintenanceStatus: {
    ...Typography.bodyMedium,
    color: Colors.status.success,
    fontWeight: '500',
  },
  upcomingList: {
    gap: Spacing.sm,
  },
  upcomingItem: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
  performanceSection: {
    gap: Spacing.md,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  performanceCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  performanceTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  performanceValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  performanceTrend: {
    ...Typography.caption,
    color: Colors.status.success,
    fontWeight: '500',
  },
  performanceSummary: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.base.primary,
    alignItems: 'center',
    minWidth: 120,
  },
  actionButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
});

export default BuildingReportsTab;
