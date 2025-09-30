/**
 * 📊 Advanced Reporting Dashboard
 * Purpose: Comprehensive analytics and reporting system
 * Features: Real-time metrics, predictive analytics, compliance tracking, performance insights
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from '../mocks/expo-linear-gradient';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { AdvancedGlassmorphism } from '../effects/AdvancedGlassmorphism';

const { width } = Dimensions.get('window');

export interface ReportingMetrics {
  performance: {
    overallCompletionRate: number;
    averageTaskTime: number;
    workerEfficiency: number;
    clientSatisfaction: number;
    onTimeDelivery: number;
    qualityScore: number;
  };
  compliance: {
    safetyCompliance: number;
    regulatoryCompliance: number;
    certificationStatus: number;
    auditScore: number;
    violationCount: number;
    correctiveActions: number;
  };
  financial: {
    revenue: number;
    costs: number;
    profitMargin: number;
    costPerTask: number;
    budgetUtilization: number;
    roi: number;
  };
  operational: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    averageResponseTime: number;
    equipmentUtilization: number;
  };
  predictive: {
    taskCompletionForecast: number;
    resourceDemandForecast: number;
    maintenanceScheduleOptimization: number;
    riskAssessmentScore: number;
    capacityUtilization: number;
    trendAnalysis: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface ReportingData {
  metrics: ReportingMetrics;
  trends: {
    performance: Array<{ date: string; value: number }>;
    compliance: Array<{ date: string; value: number }>;
    financial: Array<{ date: string; value: number }>;
    operational: Array<{ date: string; value: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  insights: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }>;
}

export interface AdvancedReportingDashboardProps {
  data: ReportingData;
  selectedTimeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
  onExportReport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onDrillDown?: (category: string, metric: string) => void;
}

export const AdvancedReportingDashboard: React.FC<AdvancedReportingDashboardProps> = ({
  data,
  selectedTimeRange,
  onTimeRangeChange,
  onExportReport,
  onDrillDown,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'compliance' | 'financial' | 'operational' | 'predictive'>('overview');
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'financial', label: 'Financial', icon: '💰' },
    { id: 'operational', label: 'Operational', icon: '🔧' },
    { id: 'predictive', label: 'Predictive', icon: '🔮' },
  ];

  const toggleMetricExpansion = (metricId: string) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(metricId)) {
      newExpanded.delete(metricId);
    } else {
      newExpanded.add(metricId);
    }
    setExpandedMetrics(newExpanded);
  };

  const getMetricColor = (value: number, type: 'percentage' | 'score' | 'count' | 'currency') => {
    if (type === 'percentage' || type === 'score') {
      if (value >= 90) return Colors.success;
      if (value >= 70) return Colors.warning;
      return Colors.error;
    }
    if (type === 'currency') {
      return value >= 0 ? Colors.success : Colors.error;
    }
    return Colors.info;
  };

  const formatMetricValue = (value: number, type: 'percentage' | 'score' | 'count' | 'currency') => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'score':
        return `${value.toFixed(1)}/100`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'count':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const renderMetricCard = (
    title: string,
    value: number,
    type: 'percentage' | 'score' | 'count' | 'currency',
    trend?: number,
    subtitle?: string
  ) => {
    const color = getMetricColor(value, type);
    const formattedValue = formatMetricValue(value, type);
    const trendIcon = trend ? (trend > 0 ? '📈' : '📉') : '';
    const trendText = trend ? `${Math.abs(trend).toFixed(1)}%` : '';

    return (
      <AdvancedGlassmorphism
        key={title}
        intensity="regular"
        cornerRadius={12}
        animated={true}
        style={styles.metricCard}
      >
        <TouchableOpacity
          onPress={() => onDrillDown?.('metrics', title)}
          style={styles.metricCardContent}
        >
          <Text style={styles.metricTitle}>{title}</Text>
          <View style={styles.metricValueContainer}>
            <Text style={[styles.metricValue, { color }]}>{formattedValue}</Text>
            {trend && (
              <View style={styles.trendContainer}>
                <Text style={styles.trendIcon}>{trendIcon}</Text>
                <Text style={[styles.trendText, { color: trend > 0 ? Colors.success : Colors.error }]}>
                  {trendText}
                </Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </TouchableOpacity>
      </AdvancedGlassmorphism>
    );
  };

  const renderOverviewTab = () => {
    const { metrics } = data;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Key Performance Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Key Performance Indicators</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Completion Rate',
              metrics.performance.overallCompletionRate,
              'percentage',
              5.2,
              'vs last period'
            )}
            {renderMetricCard(
              'Client Satisfaction',
              metrics.performance.clientSatisfaction,
              'score',
              2.1,
              'out of 100'
            )}
            {renderMetricCard(
              'Safety Compliance',
              metrics.compliance.safetyCompliance,
              'percentage',
              -1.3,
              'regulatory score'
            )}
            {renderMetricCard(
              'Profit Margin',
              metrics.financial.profitMargin,
              'percentage',
              3.7,
              'monthly'
            )}
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Recent Alerts</Text>
          {data.alerts.slice(0, 3).map(alert => (
            <AdvancedGlassmorphism
              key={alert.id}
              intensity="thin"
              cornerRadius={8}
              style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}
            >
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTimestamp}>
                  {alert.timestamp.toLocaleDateString()} {alert.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </AdvancedGlassmorphism>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 AI Insights</Text>
          {data.insights.slice(0, 2).map(insight => (
            <AdvancedGlassmorphism
              key={insight.id}
              intensity="regular"
              cornerRadius={8}
              style={styles.insightCard}
            >
              <View style={styles.insightContent}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightCategory}>{insight.category}</Text>
                  <Text style={[styles.insightImpact, { color: getImpactColor(insight.impact) }]}>
                    {insight.impact.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <Text style={styles.insightConfidence}>
                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </AdvancedGlassmorphism>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderPerformanceTab = () => {
    const { metrics } = data;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Overall Completion Rate', metrics.performance.overallCompletionRate, 'percentage')}
            {renderMetricCard('Average Task Time', metrics.performance.averageTaskTime, 'count', undefined, 'minutes')}
            {renderMetricCard('Worker Efficiency', metrics.performance.workerEfficiency, 'percentage')}
            {renderMetricCard('Client Satisfaction', metrics.performance.clientSatisfaction, 'score')}
            {renderMetricCard('On-Time Delivery', metrics.performance.onTimeDelivery, 'percentage')}
            {renderMetricCard('Quality Score', metrics.performance.qualityScore, 'score')}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderComplianceTab = () => {
    const { metrics } = data;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Compliance Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Safety Compliance', metrics.compliance.safetyCompliance, 'percentage')}
            {renderMetricCard('Regulatory Compliance', metrics.compliance.regulatoryCompliance, 'percentage')}
            {renderMetricCard('Certification Status', metrics.compliance.certificationStatus, 'percentage')}
            {renderMetricCard('Audit Score', metrics.compliance.auditScore, 'score')}
            {renderMetricCard('Violation Count', metrics.compliance.violationCount, 'count')}
            {renderMetricCard('Corrective Actions', metrics.compliance.correctiveActions, 'count')}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderFinancialTab = () => {
    const { metrics } = data;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Financial Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Revenue', metrics.financial.revenue, 'currency')}
            {renderMetricCard('Costs', metrics.financial.costs, 'currency')}
            {renderMetricCard('Profit Margin', metrics.financial.profitMargin, 'percentage')}
            {renderMetricCard('Cost Per Task', metrics.financial.costPerTask, 'currency')}
            {renderMetricCard('Budget Utilization', metrics.financial.budgetUtilization, 'percentage')}
            {renderMetricCard('ROI', metrics.financial.roi, 'percentage')}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderOperationalTab = () => {
    const { metrics } = data;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Operational Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Total Tasks', metrics.operational.totalTasks, 'count')}
            {renderMetricCard('Completed Tasks', metrics.operational.completedTasks, 'count')}
            {renderMetricCard('Pending Tasks', metrics.operational.pendingTasks, 'count')}
            {renderMetricCard('Overdue Tasks', metrics.operational.overdueTasks, 'count')}
            {renderMetricCard('Avg Response Time', metrics.operational.averageResponseTime, 'count', undefined, 'minutes')}
            {renderMetricCard('Equipment Utilization', metrics.operational.equipmentUtilization, 'percentage')}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPredictiveTab = () => {
    const { metrics } = data;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 Predictive Analytics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard('Task Completion Forecast', metrics.predictive.taskCompletionForecast, 'percentage')}
            {renderMetricCard('Resource Demand Forecast', metrics.predictive.resourceDemandForecast, 'percentage')}
            {renderMetricCard('Maintenance Optimization', metrics.predictive.maintenanceScheduleOptimization, 'percentage')}
            {renderMetricCard('Risk Assessment Score', metrics.predictive.riskAssessmentScore, 'score')}
            {renderMetricCard('Capacity Utilization', metrics.predictive.capacityUtilization, 'percentage')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Trend Analysis</Text>
          <AdvancedGlassmorphism intensity="regular" cornerRadius={12} style={styles.trendCard}>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>Overall Performance Trend</Text>
              <View style={styles.trendIndicator}>
                <Text style={styles.trendIcon}>
                  {metrics.predictive.trendAnalysis === 'increasing' ? '📈' : 
                   metrics.predictive.trendAnalysis === 'decreasing' ? '📉' : '➡️'}
                </Text>
                <Text style={[styles.trendText, { 
                  color: metrics.predictive.trendAnalysis === 'increasing' ? Colors.success : 
                         metrics.predictive.trendAnalysis === 'decreasing' ? Colors.error : Colors.info 
                }]}>
                  {metrics.predictive.trendAnalysis.toUpperCase()}
                </Text>
              </View>
            </View>
          </AdvancedGlassmorphism>
        </View>
      </ScrollView>
    );
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return Colors.error;
      case 'warning': return Colors.warning;
      case 'success': return Colors.success;
      default: return Colors.info;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return Colors.success;
      case 'negative': return Colors.error;
      default: return Colors.info;
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'performance':
        return renderPerformanceTab();
      case 'compliance':
        return renderComplianceTab();
      case 'financial':
        return renderFinancialTab();
      case 'operational':
        return renderOperationalTab();
      case 'predictive':
        return renderPredictiveTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AdvancedGlassmorphism intensity="thick" cornerRadius={16} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📊 Advanced Reporting Dashboard</Text>
          <View style={styles.headerActions}>
            <View style={styles.timeRangeSelector}>
              {timeRangeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeRangeButton,
                    selectedTimeRange === option.value && styles.selectedTimeRangeButton
                  ]}
                  onPress={() => onTimeRangeChange(option.value as any)}
                >
                  <Text style={[
                    styles.timeRangeButtonText,
                    selectedTimeRange === option.value && styles.selectedTimeRangeButtonText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={() => onExportReport?.('pdf')}>
              <Text style={styles.exportButtonText}>📄 Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AdvancedGlassmorphism>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.selectedTab]}
            onPress={() => setSelectedTab(tab.id as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, selectedTab === tab.id && styles.selectedTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.baseBackground,
  },
  header: {
    margin: Spacing.md,
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.thin,
    borderRadius: 8,
    padding: 2,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  selectedTimeRangeButton: {
    backgroundColor: Colors.primaryAction,
  },
  timeRangeButtonText: {
    ...Typography.caption,
    color: Colors.secondaryText,
  },
  selectedTimeRangeButtonText: {
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  exportButtonText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  tabsContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.thin,
    borderRadius: 8,
  },
  selectedTab: {
    backgroundColor: Colors.primaryAction,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  tabLabel: {
    ...Typography.caption,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  selectedTabLabel: {
    color: Colors.primaryText,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: (width - Spacing.md * 3) / 2,
    marginBottom: Spacing.sm,
  },
  metricCardContent: {
    padding: Spacing.md,
  },
  metricTitle: {
    ...Typography.caption,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricValue: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  trendText: {
    ...Typography.captionSmall,
    fontWeight: 'bold',
  },
  metricSubtitle: {
    ...Typography.captionSmall,
    color: Colors.tertiaryText,
    marginTop: Spacing.xs,
  },
  alertCard: {
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  alertContent: {
    padding: Spacing.md,
  },
  alertTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  alertMessage: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  alertTimestamp: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  insightCard: {
    marginBottom: Spacing.sm,
  },
  insightContent: {
    padding: Spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  insightCategory: {
    ...Typography.caption,
    color: Colors.info,
    fontWeight: 'bold',
  },
  insightImpact: {
    ...Typography.caption,
    fontWeight: 'bold',
  },
  insightTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  insightConfidence: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  trendCard: {
    padding: Spacing.md,
  },
  trendContent: {
    alignItems: 'center',
  },
  trendTitle: {
    ...Typography.subheadline,
    color: Colors.primaryText,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AdvancedReportingDashboard;
