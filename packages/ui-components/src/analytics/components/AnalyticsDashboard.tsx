/**
 * 📊 Analytics Dashboard Component
 * Mirrors: CyntientOps/Views/Admin/AdminPerformanceMetrics.swift
 * Purpose: Advanced analytics dashboard with multiple chart types and real-time data
 * Features: KPI cards, trend charts, performance matrices, AI insights, benchmarking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { PerformanceChart, ChartDataPoint, ChartConfig } from './PerformanceChart';

export interface KPICard {
  id: string;
  title: string;
  value: number;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  color: string;
}

export interface TrendData {
  id: string;
  title: string;
  data: ChartDataPoint[];
  config: ChartConfig;
  insights: string[];
}

export interface PerformanceMatrix {
  id: string;
  title: string;
  buildings: Array<{
    id: string;
    name: string;
    efficiency: number;
    quality: number;
    compliance: number;
    cost: number;
  }>;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'improvement' | 'warning' | 'opportunity' | 'risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  confidence: number;
  actionable: boolean;
}

// Compatibility interface for existing dashboard components
export interface AnalyticsData {
  performanceMetrics: {
    overallCompletionRate: number;
    averageTaskTime: number;
    workerEfficiency: number;
    clientSatisfaction: number;
  };
  portfolioMetrics: {
    totalBuildings: number;
    activeBuildings: number;
    complianceRate: number;
    maintenanceBacklog: number;
  };
  workerMetrics: {
    totalWorkers: number;
    activeWorkers: number;
    averageWorkload: number;
    productivityScore: number;
  };
}

export interface AnalyticsDashboardProps {
  kpis: KPICard[];
  trends: TrendData[];
  performanceMatrix: PerformanceMatrix;
  insights: AIInsight[];
  onKPIPress?: (kpi: KPICard) => void;
  onTrendPress?: (trend: TrendData) => void;
  onBuildingPress?: (buildingId: string) => void;
  onInsightPress?: (insight: AIInsight) => void;
  onRefresh?: () => Promise<void>;
}

// Legacy compatibility props for existing dashboard components
export interface LegacyAnalyticsDashboardProps {
  analytics: AnalyticsData;
  selectedTab: 'overview' | 'performance' | 'compliance' | 'workers';
  onTabChange: (tab: 'overview' | 'performance' | 'compliance' | 'workers') => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  kpis,
  trends,
  performanceMatrix,
  insights,
  onKPIPress,
  onTrendPress,
  onBuildingPress,
  onInsightPress,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'efficiency' | 'quality' | 'compliance' | 'cost'>('efficiency');

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up': return Colors.status.success;
      case 'down': return Colors.status.error;
      case 'stable': return Colors.text.secondary;
      default: return Colors.text.secondary;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return Colors.text.secondary;
      case 'medium': return Colors.status.info;
      case 'high': return Colors.status.warning;
      case 'critical': return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getInsightTypeIcon = (type: string): string => {
    switch (type) {
      case 'improvement': return '📈';
      case 'warning': return '⚠️';
      case 'opportunity': return '💡';
      case 'risk': return '🚨';
      default: return 'ℹ️';
    }
  };

  const getInsightTypeColor = (type: string): string => {
    switch (type) {
      case 'improvement': return Colors.status.success;
      case 'warning': return Colors.status.warning;
      case 'opportunity': return Colors.status.info;
      case 'risk': return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === '$') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${value.toFixed(0)}`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const renderKPICard = (kpi: KPICard) => (
    <TouchableOpacity
      key={kpi.id}
      style={styles.kpiCard}
      onPress={() => onKPIPress?.(kpi)}
    >
      <View style={styles.kpiHeader}>
        <View style={styles.kpiIconContainer}>
          <Text style={styles.kpiIcon}>{kpi.icon}</Text>
        </View>
        <View style={[
          styles.priorityIndicator,
          { backgroundColor: getPriorityColor(kpi.priority) }
        ]} />
      </View>
      
      <View style={styles.kpiContent}>
        <Text style={styles.kpiValue}>
          {formatValue(kpi.value, kpi.unit)}
        </Text>
        <Text style={styles.kpiTitle}>{kpi.title}</Text>
        <View style={styles.kpiTrend}>
          <Text style={[styles.trendIcon, { color: getTrendColor(kpi.trend) }]}>
            {getTrendIcon(kpi.trend)}
          </Text>
          <Text style={[styles.trendText, { color: getTrendColor(kpi.trend) }]}>
            {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.kpiTarget}>
        <Text style={styles.targetLabel}>Target</Text>
        <Text style={styles.targetValue}>
          {formatValue(kpi.target, kpi.unit)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrendChart = (trend: TrendData) => (
    <PerformanceChart
      key={trend.id}
      data={trend.data}
      config={trend.config}
      onChartPress={() => onTrendPress?.(trend)}
    />
  );

  const renderPerformanceMatrix = () => (
    <GlassCard style={styles.matrixCard}>
      <View style={styles.matrixHeader}>
        <Text style={styles.matrixTitle}>Building Performance Matrix</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.matrixGrid}>
        {performanceMatrix.buildings.map((building) => {
          const overallScore = (building.efficiency + building.quality + building.compliance) / 3;
          const getScoreColor = (score: number) => {
            if (score >= 0.8) return Colors.status.success;
            if (score >= 0.6) return Colors.status.warning;
            return Colors.status.error;
          };

          return (
            <TouchableOpacity
              key={building.id}
              style={styles.buildingCard}
              onPress={() => onBuildingPress?.(building.id)}
            >
              <Text style={styles.buildingName} numberOfLines={1}>
                {building.name}
              </Text>
              
              <View style={styles.buildingMetrics}>
                <View style={styles.buildingMetric}>
                  <Text style={styles.metricLabel}>Efficiency</Text>
                  <View style={styles.metricBar}>
                    <View 
                      style={[
                        styles.metricBarFill,
                        { 
                          width: `${building.efficiency * 100}%`,
                          backgroundColor: Colors.status.info
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.buildingMetric}>
                  <Text style={styles.metricLabel}>Quality</Text>
                  <View style={styles.metricBar}>
                    <View 
                      style={[
                        styles.metricBarFill,
                        { 
                          width: `${building.quality * 100}%`,
                          backgroundColor: Colors.status.warning
                        }
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.buildingMetric}>
                  <Text style={styles.metricLabel}>Compliance</Text>
                  <View style={styles.metricBar}>
                    <View 
                      style={[
                        styles.metricBarFill,
                        { 
                          width: `${building.compliance * 100}%`,
                          backgroundColor: Colors.base.primary
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.buildingOverall}>
                <View style={[
                  styles.overallIndicator,
                  { backgroundColor: getScoreColor(overallScore) }
                ]} />
                <Text style={styles.overallText}>
                  Overall: {Math.round(overallScore * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );

  const renderAIInsight = (insight: AIInsight) => (
    <TouchableOpacity
      key={insight.id}
      style={styles.insightCard}
      onPress={() => onInsightPress?.(insight)}
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightIconContainer}>
          <Text style={styles.insightIcon}>{getInsightTypeIcon(insight.type)}</Text>
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightDescription} numberOfLines={2}>
            {insight.description}
          </Text>
        </View>
        <View style={styles.insightPriority}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(insight.priority) + '20' }
          ]}>
            <Text style={[
              styles.priorityText,
              { color: getPriorityColor(insight.priority) }
            ]}>
              {insight.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.insightFooter}>
        <View style={styles.insightMetrics}>
          <View style={styles.insightMetric}>
            <Text style={styles.metricLabel}>Impact</Text>
            <Text style={styles.metricValue}>{insight.impact}/10</Text>
          </View>
          <View style={styles.insightMetric}>
            <Text style={styles.metricLabel}>Confidence</Text>
            <Text style={styles.metricValue}>{Math.round(insight.confidence * 100)}%</Text>
          </View>
        </View>
        
        {insight.actionable && (
          <View style={styles.actionableBadge}>
            <Text style={styles.actionableText}>Actionable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.base.primary}
        />
      }
    >
      <View style={styles.content}>
        {/* Timeframe and Metric Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeframeFilter}>
            {(['7d', '30d', '90d', '1y'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.filterButton,
                  { backgroundColor: selectedTimeframe === timeframe ? Colors.base.primary : Colors.glass.thin }
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: selectedTimeframe === timeframe ? Colors.text.primary : Colors.text.secondary }
                ]}>
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricFilter}>
            {(['efficiency', 'quality', 'compliance', 'cost'] as const).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.filterButton,
                  { backgroundColor: selectedMetric === metric ? Colors.base.primary : Colors.glass.thin }
                ]}
                onPress={() => setSelectedMetric(metric)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: selectedMetric === metric ? Colors.text.primary : Colors.text.secondary }
                ]}>
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            {kpis.map(renderKPICard)}
          </View>
        </View>

        {/* Trend Charts */}
        <View style={styles.trendsSection}>
          <Text style={styles.sectionTitle}>Performance Trends</Text>
          {trends.map(renderTrendChart)}
        </View>

        {/* Performance Matrix */}
        {renderPerformanceMatrix()}

        {/* AI Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights & Recommendations</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.insightsList}>
            {insights.map(renderAIInsight)}
          </View>
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
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  timeframeFilter: {
    marginBottom: Spacing.sm,
  },
  metricFilter: {
    marginBottom: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  filterButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  kpiSection: {
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIcon: {
    fontSize: 16,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kpiContent: {
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  kpiTitle: {
    ...Typography.caption,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  trendText: {
    ...Typography.captionSmall,
    fontWeight: '500',
  },
  kpiTarget: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
  },
  targetLabel: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  targetValue: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  trendsSection: {
    marginBottom: Spacing.lg,
  },
  matrixCard: {
    marginBottom: Spacing.lg,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  matrixTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.base.primary,
    fontWeight: '500',
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  buildingCard: {
    width: '48%',
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  buildingName: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  buildingMetrics: {
    marginBottom: Spacing.sm,
  },
  buildingMetric: {
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  metricBar: {
    height: 4,
    backgroundColor: Colors.glass.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  buildingOverall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  overallText: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  insightsSection: {
    marginBottom: Spacing.lg,
  },
  insightsList: {
    gap: Spacing.md,
  },
  insightCard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insightIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.thin,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  insightIcon: {
    fontSize: 16,
  },
  insightContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  insightTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  insightPriority: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  priorityText: {
    ...Typography.captionSmall,
    fontWeight: 'bold',
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightMetrics: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  insightMetric: {
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  actionableBadge: {
    backgroundColor: Colors.status.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  actionableText: {
    ...Typography.captionSmall,
    color: Colors.status.success,
    fontWeight: '500',
  },
});

// Legacy compatibility component for existing dashboard components
export const LegacyAnalyticsDashboard: React.FC<LegacyAnalyticsDashboardProps> = ({
  analytics,
  selectedTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'analytics' },
    { id: 'performance', label: 'Performance', icon: 'trending-up' },
    { id: 'compliance', label: 'Compliance', icon: 'shield-checkmark' },
    { id: 'workers', label: 'Workers', icon: 'people' },
  ] as const;

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.metricsGrid}>
        <GlassCard style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>✅</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
          <Text style={styles.metricValue}>{analytics.performanceMetrics.overallCompletionRate}%</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>⏱️</Text>
            <Text style={styles.metricLabel}>Avg Task Time</Text>
          </View>
          <Text style={styles.metricValue}>{analytics.performanceMetrics.averageTaskTime}m</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>👥</Text>
            <Text style={styles.metricLabel}>Active Workers</Text>
          </View>
          <Text style={styles.metricValue}>{analytics.workerMetrics.activeWorkers}</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>🏢</Text>
            <Text style={styles.metricLabel}>Total Buildings</Text>
          </View>
          <Text style={styles.metricValue}>{analytics.portfolioMetrics.totalBuildings}</Text>
        </GlassCard>
      </View>
    </View>
  );

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Worker Efficiency</Text>
          <Text style={styles.metricValue}>{analytics.performanceMetrics.workerEfficiency}%</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Client Satisfaction</Text>
          <Text style={styles.metricValue}>{analytics.performanceMetrics.clientSatisfaction}%</Text>
        </View>
      </GlassCard>
    </View>
  );

  const renderComplianceTab = () => (
    <View style={styles.tabContent}>
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Compliance Overview</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Compliance Rate</Text>
          <Text style={styles.metricValue}>{analytics.portfolioMetrics.complianceRate}%</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Maintenance Backlog</Text>
          <Text style={styles.metricValue}>{analytics.portfolioMetrics.maintenanceBacklog}</Text>
        </View>
      </GlassCard>
    </View>
  );

  const renderWorkersTab = () => (
    <View style={styles.tabContent}>
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Worker Analytics</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Workers</Text>
          <Text style={styles.metricValue}>{analytics.workerMetrics.totalWorkers}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Workload</Text>
          <Text style={styles.metricValue}>{analytics.workerMetrics.averageWorkload}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Productivity Score</Text>
          <Text style={styles.metricValue}>{analytics.workerMetrics.productivityScore}%</Text>
        </View>
      </GlassCard>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'performance':
        return renderPerformanceTab();
      case 'compliance':
        return renderComplianceTab();
      case 'workers':
        return renderWorkersTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.activeTab
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderTabContent()}
    </View>
  );
};

// Export both components
export default AnalyticsDashboard;

