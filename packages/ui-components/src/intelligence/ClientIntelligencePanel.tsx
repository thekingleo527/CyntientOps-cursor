/**
 * 🏢 Client Intelligence Panel
 * Mirrors: CyntientOps/Views/Main/ClientDashboardView.swift intelligence tabs
 * Purpose: Client-focused intelligence with Portfolio, Compliance, Performance, Analytics tabs
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
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  IntelligenceInsight, 
  NamedCoordinate,
  ComplianceIssue,
  UserRole 
} from '@cyntientops/domain-schema';

export interface ClientIntelligencePanelProps {
  insights: IntelligenceInsight[];
  portfolioBuildings: NamedCoordinate[];
  complianceIssues: ComplianceIssue[];
  onBuildingPress?: (building: NamedCoordinate) => void;
  onIssuePress?: (issue: ComplianceIssue) => void;
  onInsightPress?: (insight: IntelligenceInsight) => void;
  isLoading?: boolean;
}

export enum ClientIntelTab {
  PORTFOLIO = 'Portfolio',
  COMPLIANCE = 'Compliance',
  PERFORMANCE = 'Performance',
  ANALYTICS = 'Analytics'
}

export interface ClientMetrics {
  totalBuildings: number;
  buildingsWithIssues: number;
  overallComplianceScore: number;
  monthlyBudgetUtilization: number;
  tasksCompletedThisMonth: number;
  criticalIssues: number;
}

export const ClientIntelligencePanel: React.FC<ClientIntelligencePanelProps> = ({
  insights,
  portfolioBuildings,
  complianceIssues,
  onBuildingPress,
  onIssuePress,
  onInsightPress,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<ClientIntelTab>(ClientIntelTab.PORTFOLIO);
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalBuildings: 0,
    buildingsWithIssues: 0,
    overallComplianceScore: 0,
    monthlyBudgetUtilization: 0,
    tasksCompletedThisMonth: 0,
    criticalIssues: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [portfolioBuildings, complianceIssues]);

  const calculateMetrics = () => {
    const criticalIssues = complianceIssues.filter(issue => issue.severity === 'critical');
    const buildingsWithIssues = new Set(complianceIssues.map(issue => issue.buildingId)).size;
    
    const newMetrics: ClientMetrics = {
      totalBuildings: portfolioBuildings.length,
      buildingsWithIssues,
      overallComplianceScore: 85, // TODO: Calculate from compliance data
      monthlyBudgetUtilization: 72, // TODO: Calculate from budget data
      tasksCompletedThisMonth: 156, // TODO: Calculate from task data
      criticalIssues: criticalIssues.length
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

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return Colors.status.success;
    if (score >= 75) return Colors.status.warning;
    return Colors.status.error;
  };

  const getBudgetUtilizationColor = (utilization: number) => {
    if (utilization <= 80) return Colors.status.success;
    if (utilization <= 95) return Colors.status.warning;
    return Colors.status.error;
  };

  const renderTabButton = (tab: ClientIntelTab) => (
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

  const renderPortfolioPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Portfolio Overview</Text>
      
      <View style={styles.portfolioStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics.totalBuildings}</Text>
          <Text style={styles.statLabel}>Total Buildings</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.status.warning }]}>
            {metrics.buildingsWithIssues}
          </Text>
          <Text style={styles.statLabel}>With Issues</Text>
        </View>
      </View>
      
      <View style={styles.buildingsList}>
        <Text style={styles.sectionTitle}>Recent Buildings</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.text.primary} />
        ) : portfolioBuildings.length === 0 ? (
          <Text style={styles.emptyText}>No buildings in portfolio</Text>
        ) : (
          portfolioBuildings.slice(0, 5).map(building => (
            <TouchableOpacity
              key={building.id}
              style={styles.buildingItem}
              onPress={() => onBuildingPress?.(building)}
            >
              <View style={styles.buildingInfo}>
                <Text style={styles.buildingName}>{building.name}</Text>
                <Text style={styles.buildingAddress}>{building.address}</Text>
              </View>
              <View style={styles.buildingStatus}>
                <Text style={styles.buildingStatusText}>→</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderCompliancePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Compliance Status</Text>
      
      <View style={styles.complianceOverview}>
        <View style={styles.complianceScoreCard}>
          <Text style={[
            styles.complianceScore,
            { color: getComplianceScoreColor(metrics.overallComplianceScore) }
          ]}>
            {metrics.overallComplianceScore}%
          </Text>
          <Text style={styles.complianceScoreLabel}>Overall Score</Text>
        </View>
        
        <View style={styles.complianceStats}>
          <View style={styles.complianceStat}>
            <Text style={[styles.complianceStatValue, { color: Colors.status.error }]}>
              {metrics.criticalIssues}
            </Text>
            <Text style={styles.complianceStatLabel}>Critical Issues</Text>
          </View>
          
          <View style={styles.complianceStat}>
            <Text style={styles.complianceStatValue}>
              {complianceIssues.length}
            </Text>
            <Text style={styles.complianceStatLabel}>Total Issues</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.issuesList}>
        <Text style={styles.sectionTitle}>Recent Issues</Text>
        {complianceIssues.length === 0 ? (
          <Text style={styles.emptyText}>No compliance issues</Text>
        ) : (
          complianceIssues.slice(0, 3).map(issue => (
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
      <Text style={styles.panelTitle}>Performance Metrics</Text>
      
      <View style={styles.performanceGrid}>
        <View style={styles.performanceCard}>
          <Text style={styles.performanceValue}>{metrics.tasksCompletedThisMonth}</Text>
          <Text style={styles.performanceLabel}>Tasks Completed This Month</Text>
        </View>
        
        <View style={styles.performanceCard}>
          <Text style={[
            styles.performanceValue,
            { color: getBudgetUtilizationColor(metrics.monthlyBudgetUtilization) }
          ]}>
            {metrics.monthlyBudgetUtilization}%
          </Text>
          <Text style={styles.performanceLabel}>Budget Utilization</Text>
        </View>
      </View>
      
      <View style={styles.performanceInsights}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        {insights.filter(insight => insight.category === 'performance').slice(0, 3).map(insight => (
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

  const renderAnalyticsPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Portfolio Analytics</Text>
      
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>$2.4M</Text>
          <Text style={styles.analyticsLabel}>Monthly Budget</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>$1.7M</Text>
          <Text style={styles.analyticsLabel}>Spent This Month</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>$700K</Text>
          <Text style={styles.analyticsLabel}>Remaining Budget</Text>
        </View>
        
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>12</Text>
          <Text style={styles.analyticsLabel}>Active Workers</Text>
        </View>
      </View>
      
      <View style={styles.analyticsInsights}>
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

  const renderTabContent = () => {
    switch (selectedTab) {
      case ClientIntelTab.PORTFOLIO:
        return renderPortfolioPanel();
      case ClientIntelTab.COMPLIANCE:
        return renderCompliancePanel();
      case ClientIntelTab.PERFORMANCE:
        return renderPerformancePanel();
      case ClientIntelTab.ANALYTICS:
        return renderAnalyticsPanel();
      default:
        return renderPortfolioPanel();
    }
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.tabContainer}>
        {Object.values(ClientIntelTab).map(renderTabButton)}
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
  
  // Portfolio Panel Styles
  portfolioStats: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  buildingsList: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  buildingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  buildingAddress: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  buildingStatus: {
    marginLeft: Spacing.sm,
  },
  buildingStatusText: {
    ...Typography.subheadline,
    color: Colors.primary.blue,
  },
  
  // Compliance Panel Styles
  complianceOverview: {
    marginBottom: Spacing.md,
  },
  complianceScoreCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  complianceScore: {
    ...Typography.largeTitle,
    fontWeight: '700',
  },
  complianceScoreLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  complianceStats: {
    flexDirection: 'row',
  },
  complianceStat: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  complianceStatValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  complianceStatLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
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
  performanceGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  performanceCard: {
    flex: 1,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  performanceValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  performanceLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  performanceInsights: {
    marginTop: Spacing.md,
  },
  
  // Analytics Panel Styles
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  analyticsCard: {
    width: '48%',
    padding: Spacing.md,
    marginRight: '2%',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  analyticsLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  analyticsInsights: {
    marginTop: Spacing.md,
  },
  
  // Insight Styles
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
});
