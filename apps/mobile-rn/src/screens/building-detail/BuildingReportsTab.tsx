/**
 * 🏢 Building Reports Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingReportsTab.swift
 * Purpose: Report generation, compliance summaries, and export functionality
 *
 * 🧾 Reports: Compliance summary and export helpers
 * ✅ Uses NYCDataCoordinator for comprehensive reports
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { Colors, Spacing, Typography } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { NYCDataCoordinator } from '@cyntientops/api-clients/src/nyc';

interface BuildingComplianceReport {
  complianceScore: number;
  totalHPDViolations: number;
  activeHPDViolations: number;
  totalDSNYViolations: number;
  activeDSNYViolations: number;
  total311Complaints: number;
  recent311Complaints: number;
  totalDOBPermits: number;
  expiredDOBPermits: number;
  dataStartDate: string;
  dataEndDate: string;
}

interface BuildingReportsTabProps {
  buildingId: string;
  buildingName: string;
}

export const BuildingReportsTab: React.FC<BuildingReportsTabProps> = ({
  buildingId,
  buildingName,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<BuildingComplianceReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [buildingId]);

  const loadReport = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const coordinator = NYCDataCoordinator.getInstance();
      const reportData = await coordinator.getBuildingComplianceReport(buildingId);

      if (reportData) {
        setReport(reportData);
      } else {
        setErrorMessage('No data available');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setErrorMessage(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMarkdown = (r: BuildingComplianceReport): string => {
    return `# Building Compliance Report — ${buildingName}

- Score: ${Math.round(r.complianceScore)}
- Active HPD Violations: ${r.activeHPDViolations} / Total: ${r.totalHPDViolations}
- Active DSNY Violations: ${r.activeDSNYViolations} / Total: ${r.totalDSNYViolations}
- Recent 311 (90d): ${r.recent311Complaints} / Total: ${r.total311Complaints}
- DOB Permits: ${r.totalDOBPermits} (Expired: ${r.expiredDOBPermits})
- Data Window: ${r.dataStartDate} → ${r.dataEndDate}`;
  };

  const copyMarkdownReport = () => {
    if (!report) return;

    const markdown = generateMarkdown(report);
    Clipboard.setString(markdown);
    Alert.alert('Copied', 'Report copied to clipboard', [{ text: 'OK' }]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.info} />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  if (errorMessage || !report) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to generate report</Text>
        <Text style={styles.errorMessage}>{errorMessage || 'Unknown error'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReport}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Building Reports</Text>
          <Text style={styles.headerSubtitle}>{buildingName}</Text>
        </View>

        {/* Compliance Summary */}
        <Text style={styles.sectionTitle}>Compliance Summary</Text>
        <View style={styles.summaryGrid}>
          <StatCard
            title="Score"
            value={String(Math.round(report.complianceScore))}
            icon="✅"
          />
          <StatCard
            title="Active HPD"
            value={String(report.activeHPDViolations)}
            icon="⚠️"
          />
          <StatCard
            title="Active DSNY"
            value={String(report.activeDSNYViolations)}
            icon="🗑️"
          />
        </View>

        <View style={styles.summaryGrid}>
          <StatCard
            title="311 (3mo)"
            value={String(report.recent311Complaints)}
            icon="📞"
          />
          <StatCard
            title="DOB Permits"
            value={String(report.totalDOBPermits)}
            icon="🔧"
          />
          <StatCard
            title="Expired Permits"
            value={String(report.expiredDOBPermits)}
            icon="📅"
          />
        </View>

        <Text style={styles.dataWindow}>
          Data window: {report.dataStartDate} → {report.dataEndDate}
        </Text>

        {/* Export Actions */}
        <Text style={styles.sectionTitle}>Export Options</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={copyMarkdownReport}
        >
          <Text style={styles.exportButtonIcon}>📋</Text>
          <Text style={styles.exportButtonText}>Copy Markdown Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: string;
}> = ({ title, value, icon }) => (
  <GlassCard
    intensity={GlassIntensity.THIN}
    cornerRadius={CornerRadius.SMALL}
    style={styles.statCard}
  >
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </GlassCard>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    ...Typography.bodyMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    backgroundColor: Colors.info + '33',
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.info,
    fontWeight: '600',
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: '#ffffff',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.titleLarge,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  dataWindow: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 12,
    backgroundColor: Colors.info + '20',
    marginBottom: Spacing.xl,
  },
  exportButtonIcon: {
    fontSize: 24,
  },
  exportButtonText: {
    ...Typography.titleMedium,
    color: Colors.info,
    fontWeight: '600',
  },
});

export default BuildingReportsTab;
