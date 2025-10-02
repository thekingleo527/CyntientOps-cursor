/**
 * 📊 Reporting Dashboard
 * Purpose: Analytics and performance monitoring system
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { UserRole, OperationalDataTaskAssignment, NamedCoordinate } from '@cyntientops/domain-schema';

export interface ReportingDashboardProps {
  userRole: UserRole;
  tasks: OperationalDataTaskAssignment[];
  buildings: NamedCoordinate[];
  workers: any[];
  onExportReport?: (reportType: ReportType) => void;
  onViewDetailedReport?: (reportType: ReportType) => void;
  isLoading?: boolean;
}

export enum ReportType {
  TASK_COMPLETION = 'task_completion',
  WORKER_PERFORMANCE = 'worker_performance',
  BUILDING_METRICS = 'building_metrics',
  COMPLIANCE_STATUS = 'compliance_status',
  WEATHER_IMPACT = 'weather_impact',
  COST_ANALYSIS = 'cost_analysis',
  TIME_TRACKING = 'time_tracking',
  QUALITY_METRICS = 'quality_metrics'
}

export interface ReportData {
  type: ReportType;
  title: string;
  description: string;
  metrics: ReportMetric[];
  trends: TrendData[];
  insights: string[];
  lastUpdated: Date;
}

export interface ReportMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  icon: string;
  color: string;
}

export interface TrendData {
  period: string;
  value: number;
  label: string;
}

export const ReportingDashboard: React.FC<ReportingDashboardProps> = ({
  userRole,
  tasks,
  buildings,
  workers,
  onExportReport,
  onViewDetailedReport,
  isLoading = false,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>(ReportType.TASK_COMPLETION);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    generateReportData();
  }, [selectedReport, timeRange, tasks, buildings, workers]);

  const generateReportData = () => {
    const data = generateReportForType(selectedReport);
    setReportData(data);
  };

  const generateReportForType = (type: ReportType): ReportData => {
    switch (type) {
      case ReportType.TASK_COMPLETION:
        return generateTaskCompletionReport();
      case ReportType.WORKER_PERFORMANCE:
        return generateWorkerPerformanceReport();
      case ReportType.BUILDING_METRICS:
        return generateBuildingMetricsReport();
      case ReportType.COMPLIANCE_STATUS:
        return generateComplianceReport();
      case ReportType.WEATHER_IMPACT:
        return generateWeatherImpactReport();
      case ReportType.COST_ANALYSIS:
        return generateCostAnalysisReport();
      case ReportType.TIME_TRACKING:
        return generateTimeTrackingReport();
      case ReportType.QUALITY_METRICS:
        return generateQualityMetricsReport();
      default:
        return generateTaskCompletionReport();
    }
  };

  const generateTaskCompletionReport = (): ReportData => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'Completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgCompletionTime = calculateAverageCompletionTime();

    return {
      type: ReportType.TASK_COMPLETION,
      title: 'Task Completion Report',
      description: 'Overview of task completion rates and performance metrics',
      metrics: [
        {
          label: 'Completion Rate',
          value: `${completionRate}%`,
          change: 5,
          changeType: 'increase',
          icon: '✅',
          color: Colors.status.success
        },
        {
          label: 'Total Tasks',
          value: totalTasks,
          change: 12,
          changeType: 'increase',
          icon: '📋',
          color: Colors.primary.blue
        },
        {
          label: 'Overdue Tasks',
          value: overdueTasks,
          change: -3,
          changeType: 'decrease',
          icon: '⚠️',
          color: Colors.status.error
        },
        {
          label: 'Avg. Completion Time',
          value: `${avgCompletionTime}h`,
          change: -0.5,
          changeType: 'decrease',
          icon: '⏱️',
          color: Colors.primary.green
        }
      ],
      trends: generateTaskTrends(),
      insights: [
        `Task completion rate improved by 5% this period`,
        `Average completion time decreased by 30 minutes`,
        `Overdue tasks reduced by 3 compared to last period`,
        `Focus on high-priority tasks for better efficiency`
      ],
      lastUpdated: new Date()
    };
  };

  const generateWorkerPerformanceReport = (): ReportData => {
    const workerStats = workers.map(worker => {
      const workerTasks = tasks.filter(t => t.assigned_worker_id === worker.id);
      const completed = workerTasks.filter(t => t.status === 'Completed').length;
      const total = workerTasks.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        completionRate,
        totalTasks: total,
        completedTasks: completed
      };
    });

    const avgCompletionRate = workerStats.length > 0 
      ? Math.round(workerStats.reduce((sum, w) => sum + w.completionRate, 0) / workerStats.length)
      : 0;

    const topPerformer = workerStats.reduce((top, current) => 
      current.completionRate > top.completionRate ? current : top, workerStats[0] || { completionRate: 0 });

    return {
      type: ReportType.WORKER_PERFORMANCE,
      title: 'Worker Performance Report',
      description: 'Individual and team performance metrics',
      metrics: [
        {
          label: 'Avg. Completion Rate',
          value: `${avgCompletionRate}%`,
          change: 3,
          changeType: 'increase',
          icon: '👥',
          color: Colors.primary.blue
        },
        {
          label: 'Active Workers',
          value: workers.length,
          change: 0,
          changeType: 'stable',
          icon: '👷',
          color: Colors.primary.green
        },
        {
          label: 'Top Performer',
          value: topPerformer.workerName || 'N/A',
          change: 0,
          changeType: 'stable',
          icon: '🏆',
          color: Colors.primary.yellow
        },
        {
          label: 'Total Tasks Assigned',
          value: tasks.length,
          change: 8,
          changeType: 'increase',
          icon: '📊',
          color: Colors.primary.purple
        }
      ],
      trends: generateWorkerTrends(),
      insights: [
        `Average worker performance improved by 3%`,
        `${topPerformer.workerName} leads with ${topPerformer.completionRate}% completion rate`,
        `Team productivity increased across all metrics`,
        `Consider additional training for workers below 80% completion rate`
      ],
      lastUpdated: new Date()
    };
  };

  const generateBuildingMetricsReport = (): ReportData => {
    const buildingStats = buildings.map(building => {
      const buildingTasks = tasks.filter(t => t.assigned_building_id === building.id);
      const completed = buildingTasks.filter(t => t.status === 'Completed').length;
      const total = buildingTasks.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        completionRate,
        totalTasks: total,
        completedTasks: completed
      };
    });

    const avgBuildingCompletion = buildingStats.length > 0
      ? Math.round(buildingStats.reduce((sum, b) => sum + b.completionRate, 0) / buildingStats.length)
      : 0;

    const mostActiveBuilding = buildingStats.reduce((most, current) =>
      current.totalTasks > most.totalTasks ? current : most, buildingStats[0] || { totalTasks: 0 });

    return {
      type: ReportType.BUILDING_METRICS,
      title: 'Building Metrics Report',
      description: 'Performance metrics by building location',
      metrics: [
        {
          label: 'Avg. Building Completion',
          value: `${avgBuildingCompletion}%`,
          change: 4,
          changeType: 'increase',
          icon: '🏢',
          color: Colors.primary.blue
        },
        {
          label: 'Total Buildings',
          value: buildings.length,
          change: 0,
          changeType: 'stable',
          icon: '📍',
          color: Colors.primary.green
        },
        {
          label: 'Most Active Building',
          value: mostActiveBuilding.buildingName || 'N/A',
          change: 0,
          changeType: 'stable',
          icon: '🔥',
          color: Colors.primary.yellow
        },
        {
          label: 'Tasks per Building',
          value: Math.round(tasks.length / buildings.length) || 0,
          change: 2,
          changeType: 'increase',
          icon: '📈',
          color: Colors.primary.purple
        }
      ],
      trends: generateBuildingTrends(),
      insights: [
        `Building completion rates improved by 4% overall`,
        `${mostActiveBuilding.buildingName} has the most active task schedule`,
        `Average tasks per building increased by 2`,
        `Consider resource allocation optimization for high-activity buildings`
      ],
      lastUpdated: new Date()
    };
  };

  const generateComplianceReport = (): ReportData => {
    // Mock compliance data - in real implementation, this would come from compliance service
    const complianceScore = 87;
    const violations = 3;
    const inspections = 12;
    const resolved = 8;

    return {
      type: ReportType.COMPLIANCE_STATUS,
      title: 'Compliance Status Report',
      description: 'Regulatory compliance and inspection metrics',
      metrics: [
        {
          label: 'Compliance Score',
          value: `${complianceScore}%`,
          change: 2,
          changeType: 'increase',
          icon: '✅',
          color: Colors.status.success
        },
        {
          label: 'Active Violations',
          value: violations,
          change: -1,
          changeType: 'decrease',
          icon: '⚠️',
          color: Colors.status.warning
        },
        {
          label: 'Inspections This Month',
          value: inspections,
          change: 3,
          changeType: 'increase',
          icon: '🔍',
          color: Colors.primary.blue
        },
        {
          label: 'Issues Resolved',
          value: resolved,
          change: 2,
          changeType: 'increase',
          icon: '🔧',
          color: Colors.primary.green
        }
      ],
      trends: generateComplianceTrends(),
      insights: [
        `Compliance score improved by 2% this period`,
        `Resolved 2 more issues than last period`,
        `3 active violations require immediate attention`,
        `Inspection frequency increased by 25%`
      ],
      lastUpdated: new Date()
    };
  };

  const generateWeatherImpactReport = (): ReportData => {
    // Mock weather impact data
    const weatherDelays = 5;
    const indoorTaskIncrease = 12;
    const outdoorTaskDecrease = 8;
    const weatherScore = 78;

    return {
      type: ReportType.WEATHER_IMPACT,
      title: 'Weather Impact Report',
      description: 'Analysis of weather effects on task completion',
      metrics: [
        {
          label: 'Weather Score',
          value: `${weatherScore}%`,
          change: -5,
          changeType: 'decrease',
          icon: '🌤️',
          color: Colors.primary.blue
        },
        {
          label: 'Weather Delays',
          value: weatherDelays,
          change: 2,
          changeType: 'increase',
          icon: '⏰',
          color: Colors.status.warning
        },
        {
          label: 'Indoor Task Increase',
          value: `+${indoorTaskIncrease}%`,
          change: 5,
          changeType: 'increase',
          icon: '🏠',
          color: Colors.primary.green
        },
        {
          label: 'Outdoor Task Decrease',
          value: `-${outdoorTaskDecrease}%`,
          change: -3,
          changeType: 'decrease',
          icon: '🌳',
          color: Colors.primary.yellow
        }
      ],
      trends: generateWeatherTrends(),
      insights: [
        `Weather conditions caused 5 task delays this period`,
        `Indoor task completion increased by 12% due to weather`,
        `Outdoor work decreased by 8% due to conditions`,
        `Consider weather-based task scheduling optimization`
      ],
      lastUpdated: new Date()
    };
  };

  const generateCostAnalysisReport = (): ReportData => {
    // Mock cost data
    const totalCost = 15420;
    const laborCost = 12300;
    const materialCost = 3120;
    const costPerTask = Math.round(totalCost / tasks.length) || 0;

    return {
      type: ReportType.COST_ANALYSIS,
      title: 'Cost Analysis Report',
      description: 'Financial performance and cost breakdown',
      metrics: [
        {
          label: 'Total Cost',
          value: `$${totalCost.toLocaleString()}`,
          change: 5,
          changeType: 'increase',
          icon: '💰',
          color: Colors.primary.green
        },
        {
          label: 'Labor Cost',
          value: `$${laborCost.toLocaleString()}`,
          change: 3,
          changeType: 'increase',
          icon: '👷',
          color: Colors.primary.blue
        },
        {
          label: 'Material Cost',
          value: `$${materialCost.toLocaleString()}`,
          change: 8,
          changeType: 'increase',
          icon: '🔧',
          color: Colors.primary.yellow
        },
        {
          label: 'Cost per Task',
          value: `$${costPerTask}`,
          change: -2,
          changeType: 'decrease',
          icon: '📊',
          color: Colors.primary.purple
        }
      ],
      trends: generateCostTrends(),
      insights: [
        `Total operational cost increased by 5%`,
        `Cost per task decreased by $2 due to efficiency gains`,
        `Material costs increased by 8% this period`,
        `Labor cost optimization opportunities identified`
      ],
      lastUpdated: new Date()
    };
  };

  const generateTimeTrackingReport = (): ReportData => {
    const totalHours = 1240;
    const avgHoursPerWorker = Math.round(totalHours / workers.length) || 0;
    const overtimeHours = 85;
    const efficiency = 92;

    return {
      type: ReportType.TIME_TRACKING,
      title: 'Time Tracking Report',
      description: 'Work hours and efficiency analysis',
      metrics: [
        {
          label: 'Total Hours',
          value: `${totalHours}h`,
          change: 45,
          changeType: 'increase',
          icon: '⏱️',
          color: Colors.primary.blue
        },
        {
          label: 'Avg. Hours/Worker',
          value: `${avgHoursPerWorker}h`,
          change: 2,
          changeType: 'increase',
          icon: '👥',
          color: Colors.primary.green
        },
        {
          label: 'Overtime Hours',
          value: `${overtimeHours}h`,
          change: -5,
          changeType: 'decrease',
          icon: '⏰',
          color: Colors.status.warning
        },
        {
          label: 'Efficiency Rate',
          value: `${efficiency}%`,
          change: 3,
          changeType: 'increase',
          icon: '📈',
          color: Colors.status.success
        }
      ],
      trends: generateTimeTrends(),
      insights: [
        `Total work hours increased by 45 hours`,
        `Efficiency improved by 3% this period`,
        `Overtime hours decreased by 5 hours`,
        `Average worker productivity increased`
      ],
      lastUpdated: new Date()
    };
  };

  const generateQualityMetricsReport = (): ReportData => {
    const qualityScore = 94;
    const reworkRate = 3;
    const customerSatisfaction = 4.7;
    const defectRate = 1.2;

    return {
      type: ReportType.QUALITY_METRICS,
      title: 'Quality Metrics Report',
      description: 'Quality assurance and customer satisfaction metrics',
      metrics: [
        {
          label: 'Quality Score',
          value: `${qualityScore}%`,
          change: 2,
          changeType: 'increase',
          icon: '⭐',
          color: Colors.status.success
        },
        {
          label: 'Rework Rate',
          value: `${reworkRate}%`,
          change: -1,
          changeType: 'decrease',
          icon: '🔄',
          color: Colors.primary.green
        },
        {
          label: 'Customer Rating',
          value: `${customerSatisfaction}/5`,
          change: 0.2,
          changeType: 'increase',
          icon: '😊',
          color: Colors.primary.yellow
        },
        {
          label: 'Defect Rate',
          value: `${defectRate}%`,
          change: -0.3,
          changeType: 'decrease',
          icon: '🔍',
          color: Colors.primary.blue
        }
      ],
      trends: generateQualityTrends(),
      insights: [
        `Quality score improved by 2% to 94%`,
        `Rework rate decreased by 1%`,
        `Customer satisfaction increased to 4.7/5`,
        `Defect rate reduced by 0.3%`
      ],
      lastUpdated: new Date()
    };
  };

  // Helper functions for trend generation
  const generateTaskTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 75, label: 'Completion Rate' },
      { period: 'Week 2', value: 78, label: 'Completion Rate' },
      { period: 'Week 3', value: 82, label: 'Completion Rate' },
      { period: 'Week 4', value: 85, label: 'Completion Rate' },
    ];
  };

  const generateWorkerTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 80, label: 'Avg Performance' },
      { period: 'Week 2', value: 82, label: 'Avg Performance' },
      { period: 'Week 3', value: 85, label: 'Avg Performance' },
      { period: 'Week 4', value: 87, label: 'Avg Performance' },
    ];
  };

  const generateBuildingTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 70, label: 'Building Completion' },
      { period: 'Week 2', value: 74, label: 'Building Completion' },
      { period: 'Week 3', value: 78, label: 'Building Completion' },
      { period: 'Week 4', value: 82, label: 'Building Completion' },
    ];
  };

  const generateComplianceTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 85, label: 'Compliance Score' },
      { period: 'Week 2', value: 86, label: 'Compliance Score' },
      { period: 'Week 3', value: 87, label: 'Compliance Score' },
      { period: 'Week 4', value: 87, label: 'Compliance Score' },
    ];
  };

  const generateWeatherTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 85, label: 'Weather Score' },
      { period: 'Week 2', value: 82, label: 'Weather Score' },
      { period: 'Week 3', value: 78, label: 'Weather Score' },
      { period: 'Week 4', value: 78, label: 'Weather Score' },
    ];
  };

  const generateCostTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 14000, label: 'Total Cost' },
      { period: 'Week 2', value: 14500, label: 'Total Cost' },
      { period: 'Week 3', value: 15000, label: 'Total Cost' },
      { period: 'Week 4', value: 15420, label: 'Total Cost' },
    ];
  };

  const generateTimeTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 1200, label: 'Total Hours' },
      { period: 'Week 2', value: 1220, label: 'Total Hours' },
      { period: 'Week 3', value: 1230, label: 'Total Hours' },
      { period: 'Week 4', value: 1240, label: 'Total Hours' },
    ];
  };

  const generateQualityTrends = (): TrendData[] => {
    return [
      { period: 'Week 1', value: 92, label: 'Quality Score' },
      { period: 'Week 2', value: 93, label: 'Quality Score' },
      { period: 'Week 3', value: 94, label: 'Quality Score' },
      { period: 'Week 4', value: 94, label: 'Quality Score' },
    ];
  };

  const calculateAverageCompletionTime = (): number => {
    // Mock calculation - in real implementation, this would calculate from actual data
    return 2.5;
  };

  const renderReportSelector = () => (
    <View style={styles.reportSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.values(ReportType).map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.reportButton,
              selectedReport === type && styles.selectedReportButton,
            ]}
            onPress={() => setSelectedReport(type)}
          >
            <Text style={[
              styles.reportButtonText,
              selectedReport === type && styles.selectedReportButtonText,
            ]}>
              {type.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      {(['7d', '30d', '90d', '1y'] as const).map(range => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.selectedTimeRangeButton,
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeButtonText,
            timeRange === range && styles.selectedTimeRangeButtonText,
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      {reportData?.metrics.map((metric, index) => (
        <View key={index} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
          <Text style={[styles.metricValue, { color: metric.color }]}>
            {metric.value}
          </Text>
          {metric.change !== undefined && (
            <View style={styles.metricChange}>
              <Text style={[
                styles.metricChangeText,
                { color: metric.changeType === 'increase' ? Colors.status.success : 
                         metric.changeType === 'decrease' ? Colors.status.error : Colors.text.secondary }
              ]}>
                {metric.changeType === 'increase' ? '+' : ''}{metric.change}%
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderInsights = () => (
    <View style={styles.insightsContainer}>
      <Text style={styles.insightsTitle}>Key Insights</Text>
      {reportData?.insights.map((insight, index) => (
        <View key={index} style={styles.insightItem}>
          <Text style={styles.insightBullet}>•</Text>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onExportReport?.(selectedReport)}
      >
        <Text style={styles.actionButtonText}>📊 Export Report</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => onViewDetailedReport?.(selectedReport)}
      >
        <Text style={styles.actionButtonText}>📈 View Details</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.blue} />
        <Text style={styles.loadingText}>Generating reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Performance monitoring and insights</Text>
      </View>

      {renderTimeRangeSelector()}
      {renderReportSelector()}

      {reportData && (
        <>
          <GlassCard style={styles.reportCard} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>{reportData.title}</Text>
              <Text style={styles.reportDescription}>{reportData.description}</Text>
              <Text style={styles.lastUpdated}>
                Last updated: {reportData.lastUpdated.toLocaleString()}
              </Text>
            </View>

            {renderMetrics()}
            {renderInsights()}
            {renderActions()}
          </GlassCard>
        </>
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  selectedTimeRangeButton: {
    backgroundColor: Colors.primary.blue + '20',
    borderColor: Colors.primary.blue,
  },
  timeRangeButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedTimeRangeButtonText: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  reportSelector: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  reportButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glass.thin,
  },
  selectedReportButton: {
    backgroundColor: Colors.primary.blue + '20',
    borderColor: Colors.primary.blue,
  },
  reportButtonText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  selectedReportButtonText: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  reportCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
  },
  reportHeader: {
    marginBottom: Spacing.lg,
  },
  reportTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  reportDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  lastUpdated: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: (width - Spacing.lg * 4) / 2,
    backgroundColor: Colors.glass.thin,
    borderRadius: 8,
    padding: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    flex: 1,
  },
  metricValue: {
    ...Typography.titleLarge,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricChangeText: {
    ...Typography.captionSmall,
    fontWeight: '600',
  },
  insightsContainer: {
    marginBottom: Spacing.lg,
  },
  insightsTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insightBullet: {
    ...Typography.body,
    color: Colors.primary.blue,
    marginRight: Spacing.sm,
  },
  insightText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.primary.green,
  },
  actionButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
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
});

export default ReportingDashboard;
