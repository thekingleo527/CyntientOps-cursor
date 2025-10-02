/**
 * 📊 Admin Analytics View
 * Mirrors: CyntientOps/Views/Admin/AdminAnalyticsView.swift
 * Purpose: Complete analytics dashboard with performance metrics and charts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { 
  PerformanceData,
  KPIMetric,
  DepartmentMetric,
  BuildingPerformance,
  TimeFrame,
  MetricType,
  Department,
  KPITrend,
  KPIPriority,
  InsightPriority
} from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface AdminAnalyticsViewProps {
  container: ServiceContainer;
  onBack?: () => void;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  container,
  onBack,
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(TimeFrame.MONTH);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>(MetricType.EFFICIENCY);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>(Department.ALL);

  useEffect(() => {
    loadPerformanceData();
  }, [selectedTimeframe, selectedDepartment]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      const analyticsService = new (container as any).AnalyticsService(container);
      const data = await analyticsService.loadPerformanceData({
        timeframe: selectedTimeframe,
        department: selectedDepartment
      });
      setPerformanceData(data);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPerformanceData();
    setIsRefreshing(false);
  };

  const handleTimeframeChange = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
  }, []);

  const handleMetricTypeChange = useCallback((metricType: MetricType) => {
    setSelectedMetricType(metricType);
  }, []);

  const handleDepartmentChange = useCallback((department: Department) => {
    setSelectedDepartment(department);
  }, []);

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

  const getPriorityColor = (priority: KPIPriority): string => {
    switch (priority) {
      case KPIPriority.LOW: return Colors.text.secondary;
      case KPIPriority.MEDIUM: return Colors.status.info;
      case KPIPriority.HIGH: return Colors.status.warning;
      case KPIPriority.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getInsightPriorityColor = (priority: InsightPriority): string => {
    switch (priority) {
      case InsightPriority.LOW: return Colors.text.secondary;
      case InsightPriority.MEDIUM: return Colors.status.info;
      case InsightPriority.HIGH: return Colors.status.warning;
      case InsightPriority.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getInsightPriorityIcon = (priority: InsightPriority): string => {
    switch (priority) {
      case InsightPriority.LOW: return 'ℹ️';
      case InsightPriority.MEDIUM: return '⚠️';
      case InsightPriority.HIGH: return '🔶';
      case InsightPriority.CRITICAL: return '🚨';
      default: return 'ℹ️';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.status.info} />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  if (!performanceData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPerformanceData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Performance Metrics</Text>
            <Text style={styles.headerSubtitle}>KPI Dashboard & Analytics</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.status.info}
          />
        }
      >
        <View style={styles.content}>
          {/* Executive Summary */}
          <View style={styles.executiveSummary}>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>Executive Summary</Text>
              <Text style={styles.sectionSubtitle}>Portfolio-wide performance overview</Text>
            </View>
            
            <View style={styles.overallScoreContainer}>
              <View style={styles.overallScoreCircle}>
                <Text style={styles.overallScoreValue}>
                  {Math.round(performanceData.overallScore)}%
                </Text>
              </View>
            </View>

            <View style={styles.quickMetrics}>
              <PerformanceSummaryItem
                title="Efficiency"
                value={`${Math.round(performanceData.efficiency * 100)}%`}
                trend={performanceData.efficiencyTrend}
                color={Colors.status.info}
              />
              
              <PerformanceSummaryItem
                title="Quality"
                value={`${Math.round(performanceData.quality * 100)}%`}
                trend={performanceData.qualityTrend}
                color={Colors.status.warning}
              />
              
              <PerformanceSummaryItem
                title="Cost Control"
                value={`${Math.round(performanceData.costControl * 100)}%`}
                trend={performanceData.costTrend}
                color={Colors.status.success}
              />
              
              <PerformanceSummaryItem
                title="Compliance"
                value={`${Math.round(performanceData.compliance * 100)}%`}
                trend={performanceData.complianceTrend}
                color={Colors.base.primary}
              />
            </View>
          </View>

          {/* Timeframe Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeframeFilter}>
            {Object.values(TimeFrame).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  {
                    backgroundColor: selectedTimeframe === timeframe 
                      ? Colors.base.primary 
                      : Colors.glass.thin
                  }
                ]}
                onPress={() => handleTimeframeChange(timeframe)}
              >
                <Text style={[
                  styles.timeframeButtonText,
                  { color: selectedTimeframe === timeframe ? Colors.text.primary : Colors.text.secondary }
                ]}>
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* KPI Dashboard */}
          <View style={styles.kpiDashboard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
            </View>
            
            <View style={styles.kpiGrid}>
              {performanceData.kpiMetrics.slice(0, 6).map((kpi) => (
                <KPICard
                  key={kpi.id}
                  kpi={kpi}
                  onPress={() => {
                    // Handle KPI detail press
                    console.log('KPI pressed:', kpi.name);
                  }}
                />
              ))}
            </View>
          </View>

          {/* Performance Charts */}
          <View style={styles.performanceCharts}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Performance Trends</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricTypeFilter}>
                {Object.values(MetricType).map((metricType) => (
                  <TouchableOpacity
                    key={metricType}
                    style={[
                      styles.metricTypeButton,
                      {
                        backgroundColor: selectedMetricType === metricType 
                          ? Colors.base.primary 
                          : Colors.glass.thin
                      }
                    ]}
                    onPress={() => handleMetricTypeChange(metricType)}
                  >
                    <Text style={[
                      styles.metricTypeButtonText,
                      { color: selectedMetricType === metricType ? Colors.text.primary : Colors.text.secondary }
                    ]}>
                      {metricType.charAt(0).toUpperCase() + metricType.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartIcon}>📈</Text>
              <Text style={styles.chartTitle}>{selectedMetricType} Trend</Text>
              <Text style={styles.chartSubtitle}>Chart visualization would appear here</Text>
            </View>
          </View>

          {/* Department Performance */}
          <View style={styles.departmentPerformance}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Department Performance</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.departmentFilter}>
                {Object.values(Department).map((department) => (
                  <TouchableOpacity
                    key={department}
                    style={[
                      styles.departmentButton,
                      {
                        backgroundColor: selectedDepartment === department 
                          ? Colors.base.primary 
                          : Colors.glass.thin
                      }
                    ]}
                    onPress={() => handleDepartmentChange(department)}
                  >
                    <Text style={[
                      styles.departmentButtonText,
                      { color: selectedDepartment === department ? Colors.text.primary : Colors.text.secondary }
                    ]}>
                      {department === Department.ALL ? 'All' : department.charAt(0).toUpperCase() + department.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.departmentCards}>
              {performanceData.departmentMetrics.map((department) => (
                <DepartmentPerformanceCard
                  key={department.id}
                  department={department}
                />
              ))}
            </ScrollView>
          </View>

          {/* Building Performance Matrix */}
          <View style={styles.buildingPerformance}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Building Performance Matrix</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.buildingGrid}>
              {performanceData.buildingPerformances.slice(0, 4).map((building) => (
                <BuildingPerformanceMatrix
                  key={building.id}
                  building={building}
                />
              ))}
            </View>
          </View>

          {/* AI Insights & Recommendations */}
          <View style={styles.insightsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Insights & Recommendations</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.insightsList}>
              {performanceData.aiInsights.slice(0, 3).map((insight) => (
                <PerformanceInsightCard
                  key={insight.id}
                  insight={insight}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// MARK: - Supporting Components

interface PerformanceSummaryItemProps {
  title: string;
  value: string;
  trend: string;
  color: string;
}

const PerformanceSummaryItem: React.FC<PerformanceSummaryItemProps> = ({
  title,
  value,
  trend,
  color,
}) => (
  <View style={styles.summaryItem}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryTitle}>{title}</Text>
    <Text style={[styles.summaryTrend, { color }]}>
      {trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→'}
    </Text>
  </View>
);

interface KPICardProps {
  kpi: KPIMetric;
  onPress: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ kpi, onPress }) => {
  const getPriorityColor = (priority: KPIPriority): string => {
    switch (priority) {
      case KPIPriority.LOW: return Colors.text.secondary;
      case KPIPriority.MEDIUM: return Colors.status.info;
      case KPIPriority.HIGH: return Colors.status.warning;
      case KPIPriority.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getTrendIcon = (trend: KPITrend): string => {
    switch (trend) {
      case KPITrend.UP: return '↗️';
      case KPITrend.DOWN: return '↘️';
      case KPITrend.STABLE: return '→';
      default: return '→';
    }
  };

  const getTrendColor = (trend: KPITrend): string => {
    switch (trend) {
      case KPITrend.UP: return Colors.status.success;
      case KPITrend.DOWN: return Colors.status.error;
      case KPITrend.STABLE: return Colors.text.secondary;
      default: return Colors.text.secondary;
    }
  };

  return (
    <TouchableOpacity style={styles.kpiCard} onPress={onPress}>
      <View style={styles.kpiHeader}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(kpi.priority) }]} />
        <Text style={[styles.trendIcon, { color: getTrendColor(kpi.trend) }]}>
          {getTrendIcon(kpi.trend)}
        </Text>
      </View>
      
      <Text style={styles.kpiValue}>
        {kpi.value.toFixed(1)}{kpi.unit}
      </Text>
      
      <Text style={styles.kpiName} numberOfLines={2}>
        {kpi.name}
      </Text>
      
      <Text style={styles.kpiTarget}>
        Target: {kpi.target.toFixed(1)}{kpi.unit}
      </Text>
    </TouchableOpacity>
  );
};

interface DepartmentPerformanceCardProps {
  department: DepartmentMetric;
}

const DepartmentPerformanceCard: React.FC<DepartmentPerformanceCardProps> = ({ department }) => (
  <View style={styles.departmentCard}>
    <Text style={styles.departmentName}>{department.name}</Text>
    
    <View style={styles.departmentMetrics}>
      <View style={styles.departmentMetric}>
        <Text style={styles.departmentMetricLabel}>Efficiency:</Text>
        <Text style={[styles.departmentMetricValue, { color: Colors.status.info }]}>
          {Math.round(department.efficiency * 100)}%
        </Text>
      </View>
      
      <View style={styles.departmentMetric}>
        <Text style={styles.departmentMetricLabel}>Quality:</Text>
        <Text style={[styles.departmentMetricValue, { color: Colors.status.warning }]}>
          {Math.round(department.quality * 100)}%
        </Text>
      </View>
      
      <View style={styles.departmentMetric}>
        <Text style={styles.departmentMetricLabel}>Cost:</Text>
        <Text style={[styles.departmentMetricValue, { color: Colors.status.success }]}>
          ${Math.round(department.cost)}
        </Text>
      </View>
    </View>
  </View>
);

interface BuildingPerformanceMatrixProps {
  building: BuildingPerformance;
}

const BuildingPerformanceMatrix: React.FC<BuildingPerformanceMatrixProps> = ({ building }) => {
  const overallScore = (building.efficiency + building.quality + building.compliance) / 3 * 100;
  
  return (
    <View style={styles.buildingCard}>
      <Text style={styles.buildingName} numberOfLines={1}>{building.name}</Text>
      
      <View style={styles.buildingMetrics}>
        <View style={styles.buildingMetric}>
          <Text style={styles.buildingMetricLabel}>Efficiency</Text>
          <Text style={[styles.buildingMetricValue, { color: Colors.status.info }]}>
            {Math.round(building.efficiency * 100)}%
          </Text>
        </View>
        
        <View style={styles.buildingMetric}>
          <Text style={styles.buildingMetricLabel}>Quality</Text>
          <Text style={[styles.buildingMetricValue, { color: Colors.status.warning }]}>
            {Math.round(building.quality * 100)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.buildingOverall}>
        <View style={[
          styles.overallIndicator,
          { backgroundColor: overallScore > 85 ? Colors.status.success : overallScore > 70 ? Colors.status.warning : Colors.status.error }
        ]} />
        <Text style={styles.buildingOverallText}>
          Overall: {Math.round(overallScore)}%
        </Text>
      </View>
    </View>
  );
};

interface PerformanceInsightCardProps {
  insight: any;
}

const PerformanceInsightCard: React.FC<PerformanceInsightCardProps> = ({ insight }) => {
  const getPriorityColor = (priority: InsightPriority): string => {
    switch (priority) {
      case InsightPriority.LOW: return Colors.text.secondary;
      case InsightPriority.MEDIUM: return Colors.status.info;
      case InsightPriority.HIGH: return Colors.status.warning;
      case InsightPriority.CRITICAL: return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  const getPriorityIcon = (priority: InsightPriority): string => {
    switch (priority) {
      case InsightPriority.LOW: return 'ℹ️';
      case InsightPriority.MEDIUM: return '⚠️';
      case InsightPriority.HIGH: return '🔶';
      case InsightPriority.CRITICAL: return '🚨';
      default: return 'ℹ️';
    }
  };

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{getPriorityIcon(insight.priority)}</Text>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle} numberOfLines={1}>{insight.title}</Text>
          <Text style={styles.insightDescription} numberOfLines={2}>
            {insight.description}
          </Text>
        </View>
        <Text style={styles.insightChevron}>›</Text>
      </View>
      
      <View style={styles.insightFooter}>
        <Text style={[styles.insightImpact, { color: Colors.status.info }]}>
          Impact: {insight.impact}
        </Text>
        <View style={[styles.insightPriority, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
          <Text style={[styles.insightPriorityText, { color: getPriorityColor(insight.priority) }]}>
            {insight.priority}
          </Text>
        </View>
      </View>
    </View>
  );
};

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
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.base.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.base.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  menuIcon: {
    fontSize: 20,
    color: Colors.base.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  executiveSummary: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  summaryHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  overallScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glass.thin,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.base.primary,
  },
  overallScoreValue: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  quickMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  summaryTrend: {
    fontSize: 16,
  },
  timeframeFilter: {
    marginBottom: Spacing.lg,
  },
  timeframeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  timeframeButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  kpiDashboard: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  kpiCard: {
    width: '30%',
    backgroundColor: Colors.glass.thin,
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
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendIcon: {
    fontSize: 16,
  },
  kpiValue: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  kpiName: {
    ...Typography.caption,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  kpiTarget: {
    ...Typography.captionSmall,
    color: Colors.text.tertiary,
  },
  performanceCharts: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metricTypeFilter: {
    marginBottom: Spacing.md,
  },
  metricTypeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  metricTypeButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  chartTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  chartSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  departmentPerformance: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  departmentFilter: {
    marginBottom: Spacing.md,
  },
  departmentButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginHorizontal: Spacing.xs,
  },
  departmentButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  departmentCards: {
    marginBottom: Spacing.md,
  },
  departmentCard: {
    width: 160,
    height: 120,
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    padding: Spacing.md,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  departmentName: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  departmentMetrics: {
    gap: Spacing.xs,
  },
  departmentMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  departmentMetricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  departmentMetricValue: {
    ...Typography.caption,
    fontWeight: '500',
  },
  buildingPerformance: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.base.primary,
  },
  buildingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  buildingMetricLabel: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  buildingMetricValue: {
    ...Typography.caption,
    fontWeight: '500',
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
  buildingOverallText: {
    ...Typography.captionSmall,
    color: Colors.text.secondary,
  },
  insightsSection: {
    backgroundColor: Colors.glass.regular,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightCard: {
    backgroundColor: Colors.glass.thin,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glass.border,
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
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.titleSmall,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  insightDescription: {
    ...Typography.caption,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  insightChevron: {
    fontSize: 16,
    color: Colors.text.tertiary,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightImpact: {
    ...Typography.captionSmall,
  },
  insightPriority: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  insightPriorityText: {
    ...Typography.captionSmall,
    fontWeight: '500',
  },
});

export default AdminAnalyticsView;

