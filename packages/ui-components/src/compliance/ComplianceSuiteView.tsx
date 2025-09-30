/**
 * 🛡️ Compliance Suite View
 * Mirrors: CyntientOps/Views/Compliance/ComplianceSuiteView.swift
 * Purpose: Complete compliance management with drilling capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../glass';
import { 
  ComplianceIssue, 
  ComplianceSeverity, 
  ComplianceCategory,
  ComplianceDeadline,
  ComplianceMetrics,
  ComplianceDashboardData
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface ComplianceSuiteViewProps {
  buildings: any[];
  container: ServiceContainer;
  onViolationPress?: (violation: ComplianceIssue) => void;
  onBuildingPress?: (buildingId: string) => void;
}

export const ComplianceSuiteView: React.FC<ComplianceSuiteViewProps> = ({
  buildings,
  container,
  onViolationPress,
  onBuildingPress,
}) => {
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ComplianceCategory>(ComplianceCategory.ALL);
  const [showingViolationDetails, setShowingViolationDetails] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<ComplianceIssue | null>(null);
  const [showingDeadlineAlert, setShowingDeadlineAlert] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setIsLoading(true);
    try {
      const buildingIds = buildings.map(b => b.id);
      const complianceService = new (container as any).ComplianceService(container);
      const data = await complianceService.loadComplianceData(buildingIds);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      Alert.alert('Error', 'Failed to load compliance data. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViolationPress = useCallback((violation: ComplianceIssue) => {
    setSelectedViolation(violation);
    setShowingViolationDetails(true);
    onViolationPress?.(violation);
  }, [onViolationPress]);

  const handleCategoryChange = useCallback((category: ComplianceCategory) => {
    setSelectedCategory(category);
  }, []);

  const getCategoryIcon = (category: ComplianceCategory): string => {
    switch (category) {
      case ComplianceCategory.ALL: return '📋';
      case ComplianceCategory.HPD: return '🏠';
      case ComplianceCategory.DOB: return '🏢';
      case ComplianceCategory.FDNY: return '🔥';
      case ComplianceCategory.LL97: return '🌱';
      case ComplianceCategory.LL11: return '🛡️';
      case ComplianceCategory.DEP: return '💧';
      default: return '📋';
    }
  };

  const getCategoryColor = (category: ComplianceCategory): string => {
    switch (category) {
      case ComplianceCategory.ALL: return Colors.base.primary;
      case ComplianceCategory.HPD: return Colors.status.warning;
      case ComplianceCategory.DOB: return Colors.status.success;
      case ComplianceCategory.FDNY: return Colors.status.error;
      case ComplianceCategory.LL97: return Colors.status.info;
      case ComplianceCategory.LL11: return Colors.base.secondary;
      case ComplianceCategory.DEP: return Colors.status.info;
      default: return Colors.base.primary;
    }
  };

  const getSeverityColor = (severity: ComplianceSeverity): string => {
    switch (severity) {
      case ComplianceSeverity.CRITICAL: return Colors.status.error;
      case ComplianceSeverity.HIGH: return Colors.status.warning;
      case ComplianceSeverity.MEDIUM: return Colors.status.info;
      case ComplianceSeverity.LOW: return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  const getComplianceScoreColor = (score: number): string => {
    if (score >= 0.9) return Colors.status.success;
    if (score >= 0.7) return Colors.status.warning;
    return Colors.status.error;
  };

  const getComplianceScoreIcon = (score: number): string => {
    if (score >= 0.9) return '✅';
    if (score >= 0.7) return '⚠️';
    return '❌';
  };

  const filteredBuildings = buildings.filter(building => {
    if (selectedCategory === ComplianceCategory.ALL) return true;
    // In a real implementation, this would filter based on actual compliance categories
    return true;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading compliance data...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load compliance data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Overall Compliance Score */}
      <View style={[styles.header, { backgroundColor: getComplianceScoreColor(dashboardData.metrics.overallScore) + '20' }]}>
        <View style={styles.headerContent}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Portfolio Compliance Score</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreValue}>
                {Math.round(dashboardData.metrics.overallScore * 100)}%
              </Text>
              <Text style={styles.scoreIcon}>
                {getComplianceScoreIcon(dashboardData.metrics.overallScore)}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📄</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowingDeadlineAlert(true)}
            >
              <Text style={styles.actionIcon}>⏰</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Progress indicators */}
        <View style={styles.progressBars}>
          {Object.entries(dashboardData.metrics.categoryScores).map(([category, score]) => (
            <View key={category} style={styles.progressItem}>
              <Text style={styles.progressLabel}>{category}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${score * 100}%`,
                      backgroundColor: getCategoryColor(category as ComplianceCategory)
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        {Object.values(ComplianceCategory).map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === category 
                  ? getCategoryColor(category) 
                  : Colors.glass.thin
              }
            ]}
            onPress={() => handleCategoryChange(category)}
          >
            <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === category ? Colors.text.primary : Colors.text.secondary }
            ]}>
              {category.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Critical Deadlines Alert */}
      {dashboardData.criticalDeadlines.length > 0 && (
        <View style={styles.deadlineAlert}>
          <Text style={styles.deadlineIcon}>⏰</Text>
          <View style={styles.deadlineContent}>
            <Text style={styles.deadlineTitle}>Critical Deadlines</Text>
            <Text style={styles.deadlineSubtitle}>
              {dashboardData.criticalDeadlines.length} items need attention
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.deadlineButton}
            onPress={() => setShowingDeadlineAlert(true)}
          >
            <Text style={styles.deadlineButtonText}>Review</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Compliance Overview Cards */}
          <View style={styles.overviewGrid}>
            <ComplianceMetricCard
              title="Active Violations"
              value={dashboardData.metrics.activeViolations.toString()}
              trend={dashboardData.metrics.violationsTrend}
              color={Colors.status.error}
              icon="⚠️"
            />
            
            <ComplianceMetricCard
              title="Pending Inspections"
              value={dashboardData.metrics.pendingInspections.toString()}
              trend={dashboardData.metrics.inspectionsTrend}
              color={Colors.status.warning}
              icon="🔍"
            />
            
            <ComplianceMetricCard
              title="Resolved This Month"
              value={dashboardData.metrics.resolvedThisMonth.toString()}
              trend={dashboardData.metrics.resolutionTrend}
              color={Colors.status.success}
              icon="✅"
            />
            
            <ComplianceMetricCard
              title="Compliance Cost"
              value={dashboardData.metrics.formattedComplianceCost}
              trend={dashboardData.metrics.costTrend}
              color={Colors.base.primary}
              icon="💰"
            />
          </View>

          {/* Buildings Compliance Grid */}
          <View style={styles.buildingsSection}>
            <Text style={styles.sectionTitle}>Building Compliance Status</Text>
            <View style={styles.buildingsGrid}>
              {filteredBuildings.map((building) => (
                <BuildingComplianceCard
                  key={building.id}
                  building={building}
                  complianceScore={dashboardData.buildingCompliance[building.id] || 0}
                  criticalIssues={dashboardData.recentViolations.filter(v => v.buildingId === building.id).length}
                  onTap={() => onBuildingPress?.(building.id)}
                />
              ))}
            </View>
          </View>

          {/* Recent Violations */}
          <View style={styles.violationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Violations</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.violationsList}>
              {dashboardData.recentViolations.slice(0, 5).map((violation) => (
                <ViolationRow
                  key={violation.id}
                  violation={violation}
                  onTap={() => handleViolationPress(violation)}
                />
              ))}
            </View>
          </View>

          {/* Predictive Insights */}
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Predictive Insights</Text>
            <View style={styles.insightsList}>
              {dashboardData.predictiveInsights.map((insight) => (
                <PredictiveInsightCard key={insight.id} insight={insight} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Deadline Alert */}
      {showingDeadlineAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Critical Deadlines</Text>
            <Text style={styles.alertMessage}>
              You have {dashboardData.criticalDeadlines.length} critical compliance deadlines approaching within 30 days.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonSecondary]}
                onPress={() => setShowingDeadlineAlert(false)}
              >
                <Text style={styles.alertButtonText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonPrimary]}
                onPress={() => setShowingDeadlineAlert(false)}
              >
                <Text style={styles.alertButtonText}>Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// MARK: - Supporting Components

interface ComplianceMetricCardProps {
  title: string;
  value: string;
  trend: number;
  color: string;
  icon: string;
}

const ComplianceMetricCard: React.FC<ComplianceMetricCardProps> = ({
  title,
  value,
  trend,
  color,
  icon,
}) => (
  <GlassCard style={styles.metricCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.trendIcon, { color: trend > 0 ? Colors.status.success : Colors.status.error }]}>
        {trend > 0 ? '↗️' : '↘️'}
      </Text>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </GlassCard>
);

interface BuildingComplianceCardProps {
  building: any;
  complianceScore: number;
  criticalIssues: number;
  onTap: () => void;
}

const BuildingComplianceCard: React.FC<BuildingComplianceCardProps> = ({
  building,
  complianceScore,
  criticalIssues,
  onTap,
}) => (
  <TouchableOpacity style={styles.buildingCard} onPress={onTap}>
    <View style={styles.buildingHeader}>
      <Text style={styles.buildingName} numberOfLines={1}>{building.name}</Text>
      {criticalIssues > 0 && (
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalBadgeText}>{criticalIssues}</Text>
        </View>
      )}
    </View>
    
    <View style={styles.complianceBar}>
      <View 
        style={[
          styles.complianceFill, 
          { 
            width: `${complianceScore * 100}%`,
            backgroundColor: complianceScore > 0.7 ? Colors.status.success : Colors.status.error
          }
        ]} 
      />
    </View>
    
    <Text style={styles.complianceText}>
      {Math.round(complianceScore * 100)}% Compliant
    </Text>
  </TouchableOpacity>
);

interface ViolationRowProps {
  violation: ComplianceIssue;
  onTap: () => void;
}

const ViolationRow: React.FC<ViolationRowProps> = ({ violation, onTap }) => {
  const getSeverityColor = (severity: ComplianceSeverity): string => {
    switch (severity) {
      case ComplianceSeverity.CRITICAL: return Colors.status.error;
      case ComplianceSeverity.HIGH: return Colors.status.warning;
      case ComplianceSeverity.MEDIUM: return Colors.status.info;
      case ComplianceSeverity.LOW: return Colors.status.success;
      default: return Colors.text.secondary;
    }
  };

  return (
    <TouchableOpacity style={styles.violationRow} onPress={onTap}>
      <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(violation.severity) }]} />
      
      <View style={styles.violationContent}>
        <Text style={styles.violationTitle} numberOfLines={1}>{violation.title}</Text>
        <Text style={styles.violationBuilding} numberOfLines={1}>
          {violation.buildingName || 'Unknown Building'}
        </Text>
      </View>
      
      <View style={styles.violationMeta}>
        <Text style={styles.violationDate}>
          {violation.dueDate.toLocaleDateString()}
        </Text>
        <View style={styles.violationCategory}>
          <Text style={styles.violationCategoryText}>{violation.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface PredictiveInsightCardProps {
  insight: any;
}

const PredictiveInsightCard: React.FC<PredictiveInsightCardProps> = ({ insight }) => (
  <GlassCard style={styles.insightCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
    <View style={styles.insightHeader}>
      <Text style={styles.insightIcon}>🧠</Text>
      <Text style={styles.insightTitle}>{insight.title}</Text>
    </View>
    <Text style={styles.insightDescription} numberOfLines={2}>
      {insight.description}
    </Text>
    <Text style={styles.insightConfidence}>
      Confidence: {Math.round(insight.confidence * 100)}%
    </Text>
  </GlassCard>
);

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  errorText: {
    ...Typography.body,
    color: Colors.status.error,
  },
  header: {
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  scoreSection: {
    flex: 1,
  },
  scoreLabel: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  scoreIcon: {
    fontSize: 24,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.glass.regular,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  progressBars: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.glass.thin,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryFilter: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.thin,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  deadlineAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.status.warning + '20',
    borderLeftWidth: 4,
    borderLeftColor: Colors.status.warning,
  },
  deadlineIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  deadlineSubtitle: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  deadlineButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.status.warning + '20',
    borderRadius: 8,
  },
  deadlineButtonText: {
    ...Typography.caption,
    color: Colors.status.warning,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: '48%',
    padding: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricIcon: {
    fontSize: 20,
  },
  trendIcon: {
    fontSize: 16,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  metricTitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  buildingsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.base.primary,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  buildingCard: {
    width: '48%',
    padding: Spacing.md,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  buildingName: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  criticalBadge: {
    backgroundColor: Colors.status.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  criticalBadgeText: {
    ...Typography.captionSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  complianceBar: {
    height: 4,
    backgroundColor: Colors.glass.thin,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  complianceFill: {
    height: '100%',
    borderRadius: 2,
  },
  complianceText: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  violationsSection: {
    marginBottom: Spacing.lg,
  },
  violationsList: {
    gap: Spacing.xs,
  },
  violationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.glass.regular,
    borderRadius: 8,
  },
  severityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  violationContent: {
    flex: 1,
  },
  violationTitle: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  violationBuilding: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  violationMeta: {
    alignItems: 'flex-end',
  },
  violationDate: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  violationCategory: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.base.primary + '20',
    borderRadius: 4,
    marginTop: 2,
  },
  violationCategoryText: {
    ...Typography.captionSmall,
    color: Colors.base.primary,
  },
  insightsSection: {
    marginBottom: Spacing.lg,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightCard: {
    padding: Spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  insightTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  insightDescription: {
    ...Typography.caption,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  insightConfidence: {
    ...Typography.captionSmall,
    color: Colors.base.primary,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  alertTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  alertMessage: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  alertActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  alertButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonSecondary: {
    backgroundColor: Colors.glass.thin,
  },
  alertButtonPrimary: {
    backgroundColor: Colors.status.warning,
  },
  alertButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});

export default ComplianceSuiteView;
