/**
 * 🛡️ Building Compliance Tab
 * Mirrors: CyntientOps/Views/Components/Buildings/Optimized/BuildingComplianceTab.swift
 * Purpose: Compliance management with NYC API integration
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { ComplianceIssue } from '@cyntientops/domain-schema';

export interface BuildingComplianceTabProps {
  compliance: {
    score: number;
    issues: ComplianceIssue[];
    lastUpdate: Date;
    nextInspection?: Date;
  };
  onCompliancePress?: (issue: ComplianceIssue) => void;
}

export const BuildingComplianceTab: React.FC<BuildingComplianceTabProps> = ({
  compliance,
  onCompliancePress,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.status.info;
      case 'low': return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HPD': return '🏠';
      case 'DOB': return '🏗️';
      case 'HPD_VIOLATION': return '🏠';
      case 'DSNY_VIOLATION': return '🗑️';
      case 'FDNY_INSPECTION_FAILURE': return '🚒';
      case '311_COMPLAINT': return '📞';
      case 'DSNY': return '🗑️';
      case 'LL97': return '🌱';
      case 'FDNY': return '🚒';
      case 'DEP': return '💧';
      default: return '📋';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return Colors.status.success;
    if (score >= 80) return Colors.status.info;
    if (score >= 70) return Colors.status.warning;
    return Colors.status.error;
  };

  const renderComplianceIssue = (issue: ComplianceIssue) => (
    <TouchableOpacity
      key={issue.id}
      style={styles.issueCard}
      onPress={() => onCompliancePress?.(issue)}
    >
      <View style={styles.issueHeader}>
        <View style={styles.issueInfo}>
          <Text style={styles.issueTitle}>{issue.title}</Text>
          <View style={styles.issueCategory}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(issue.category)}</Text>
            <Text style={styles.categoryText}>{issue.category}</Text>
          </View>
        </View>
        <View style={[
          styles.severityBadge,
          { backgroundColor: getSeverityColor(issue.severity) }
        ]}>
          <Text style={styles.severityIcon}>{getSeverityIcon(issue.severity)}</Text>
        </View>
      </View>

      <Text style={styles.issueDescription} numberOfLines={2}>
        {issue.description}
      </Text>

      <View style={styles.issueFooter}>
        <Text style={styles.issueDueDate}>
          Due: {formatDate(issue.dueDate)}
        </Text>
        <Text style={styles.issueCost}>
          ${issue.estimatedCost.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Compliance Score Card */}
        <GlassCard style={styles.scoreCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Compliance Score</Text>
            <Text style={styles.scoreSubtitle}>Last updated: {formatDate(compliance.lastUpdate)}</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <View style={[
              styles.scoreCircle,
              { borderColor: getScoreColor(compliance.score) }
            ]}>
              <Text style={[
                styles.scoreValue,
                { color: getScoreColor(compliance.score) }
              ]}>
                {compliance.score}%
              </Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={styles.scoreDescription}>
                {compliance.score >= 90 ? 'Excellent' :
                 compliance.score >= 80 ? 'Good' :
                 compliance.score >= 70 ? 'Fair' : 'Needs Attention'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Next Inspection */}
        {compliance.nextInspection && (
          <GlassCard style={styles.inspectionCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <View style={styles.inspectionHeader}>
              <Text style={styles.inspectionIcon}>🔍</Text>
              <Text style={styles.inspectionTitle}>Next Inspection</Text>
            </View>
            <Text style={styles.inspectionDate}>
              {formatDate(compliance.nextInspection)}
            </Text>
            <Text style={styles.inspectionDays}>
              {Math.ceil((compliance.nextInspection.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
            </Text>
          </GlassCard>
        )}

        {/* Issues Summary */}
        <View style={styles.issuesSection}>
          <Text style={styles.sectionTitle}>Compliance Issues</Text>
          
          {compliance.issues.length === 0 ? (
            <View style={styles.noIssuesCard}>
              <Text style={styles.noIssuesIcon}>✅</Text>
              <Text style={styles.noIssuesTitle}>No Issues</Text>
              <Text style={styles.noIssuesText}>
                This building is in full compliance with all regulations.
              </Text>
            </View>
          ) : (
            <View style={styles.issuesList}>
              {compliance.issues.map(renderComplianceIssue)}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>Generate Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>🔄</Text>
            <Text style={styles.quickActionText}>Refresh Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>Schedule Inspection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  content: {
    padding: Spacing.lg,
  },
  scoreCard: {
    marginBottom: Spacing.lg,
  },
  scoreHeader: {
    marginBottom: Spacing.md,
  },
  scoreTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  scoreSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  scoreValue: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  scoreDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  inspectionCard: {
    marginBottom: Spacing.lg,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inspectionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  inspectionTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  inspectionDate: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  inspectionDays: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  issuesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  noIssuesCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  noIssuesIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  noIssuesTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  noIssuesText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  issuesList: {
    gap: Spacing.md,
  },
  issueCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  issueInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  issueTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  issueCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityIcon: {
    fontSize: 16,
  },
  issueDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueDueDate: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  issueCost: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default BuildingComplianceTab;

