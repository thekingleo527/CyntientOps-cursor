/**
 * 📊 Today's Progress Detail View
 * Mirrors: CyntientOps/Components/Common/TodaysProgressDetailView.swift
 * Purpose: Detailed progress analytics with completed vs pending tasks grid
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { OperationalDataTaskAssignment, Building } from '@cyntientops/domain-schema';
import { TaskTimelineRow } from '../timeline/TaskTimelineRow';

interface TodaysProgressDetailViewProps {
  tasks: OperationalDataTaskAssignment[];
  buildings: Building[];
  workerId?: string;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onBuildingPress?: (building: Building) => void;
}

enum ProgressMetric {
  OVERVIEW = 'overview',
  BY_BUILDING = 'byBuilding',
  BY_TIME = 'byTime',
  BY_PRIORITY = 'byPriority'
}

interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  averageCompletionTime: number;
  buildingStats: BuildingStats[];
  priorityStats: PriorityStats[];
  timeStats: TimeStats[];
}

interface BuildingStats {
  buildingId: string;
  buildingName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface PriorityStats {
  priority: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface TimeStats {
  timeSlot: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

const { width } = Dimensions.get('window');

export const TodaysProgressDetailView: React.FC<TodaysProgressDetailViewProps> = ({
  tasks,
  buildings,
  workerId,
  onTaskPress,
  onBuildingPress
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ProgressMetric>(ProgressMetric.OVERVIEW);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);

  useEffect(() => {
    calculateProgressStats();
  }, [tasks, buildings]);

  const calculateProgressStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completedTasks = tasks.filter(task => task.status === 'Completed');
    const pendingTasks = tasks.filter(task => task.status !== 'Completed');
    const overdueTasks = pendingTasks.filter(task => 
      task.due_date && new Date(task.due_date) < now
    );

    const completionPercentage = tasks.length > 0 
      ? (completedTasks.length / tasks.length) * 100 
      : 0;

    // Calculate building stats
    const buildingStats: BuildingStats[] = buildings.map(building => {
      const buildingTasks = tasks.filter(task => task.assigned_building_id === building.id);
      const buildingCompleted = buildingTasks.filter(task => task.status === 'Completed');
      
      return {
        buildingId: building.id,
        buildingName: building.name,
        totalTasks: buildingTasks.length,
        completedTasks: buildingCompleted.length,
        completionRate: buildingTasks.length > 0 
          ? (buildingCompleted.length / buildingTasks.length) * 100 
          : 0
      };
    }).filter(stat => stat.totalTasks > 0);

    // Calculate priority stats
    const priorityStats: PriorityStats[] = ['urgent', 'high', 'medium', 'low'].map(priority => {
      const priorityTasks = tasks.filter(task => task.priority === priority);
      const priorityCompleted = priorityTasks.filter(task => task.status === 'Completed');
      
      return {
        priority,
        totalTasks: priorityTasks.length,
        completedTasks: priorityCompleted.length,
        completionRate: priorityTasks.length > 0 
          ? (priorityCompleted.length / priorityTasks.length) * 100 
          : 0
      };
    }).filter(stat => stat.totalTasks > 0);

    // Calculate time stats (morning, afternoon, evening)
    const timeStats: TimeStats[] = [
      { timeSlot: 'Morning (6AM-12PM)', totalTasks: 0, completedTasks: 0, completionRate: 0 },
      { timeSlot: 'Afternoon (12PM-6PM)', totalTasks: 0, completedTasks: 0, completionRate: 0 },
      { timeSlot: 'Evening (6PM-12AM)', totalTasks: 0, completedTasks: 0, completionRate: 0 }
    ];

    tasks.forEach(task => {
      if (task.due_date) {
        const taskHour = new Date(task.due_date).getHours();
        let timeIndex = 2; // Evening by default
        
        if (taskHour >= 6 && taskHour < 12) timeIndex = 0; // Morning
        else if (taskHour >= 12 && taskHour < 18) timeIndex = 1; // Afternoon
        
        timeStats[timeIndex].totalTasks++;
        if (task.status === 'Completed') {
          timeStats[timeIndex].completedTasks++;
        }
      }
    });

    timeStats.forEach(stat => {
      stat.completionRate = stat.totalTasks > 0 
        ? (stat.completedTasks / stat.totalTasks) * 100 
        : 0;
    });

    setProgressStats({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      completionPercentage,
      averageCompletionTime: 0, // Would need completion timestamps to calculate
      buildingStats,
      priorityStats,
      timeStats: timeStats.filter(stat => stat.totalTasks > 0)
    });
  };

  const getMetricIcon = (metric: ProgressMetric): string => {
    switch (metric) {
      case ProgressMetric.OVERVIEW: return '📊';
      case ProgressMetric.BY_BUILDING: return '🏢';
      case ProgressMetric.BY_TIME: return '⏰';
      case ProgressMetric.BY_PRIORITY: return '⚠️';
      default: return '📊';
    }
  };

  const getMetricTitle = (metric: ProgressMetric): string => {
    switch (metric) {
      case ProgressMetric.OVERVIEW: return 'Overview';
      case ProgressMetric.BY_BUILDING: return 'By Building';
      case ProgressMetric.BY_TIME: return 'By Time';
      case ProgressMetric.BY_PRIORITY: return 'By Priority';
      default: return 'Overview';
    }
  };

  const renderOverview = () => {
    if (!progressStats) return null;

    return (
      <View style={styles.overviewContainer}>
        {/* Progress Circle */}
        <View style={styles.progressCircleContainer}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercentage}>
              {progressStats.completionPercentage.toFixed(0)}%
            </Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progressStats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {progressStats.completedTasks}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {progressStats.pendingTasks}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {progressStats.overdueTasks}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderByBuilding = () => {
    if (!progressStats) return null;

    return (
      <View style={styles.buildingStatsContainer}>
        {progressStats.buildingStats.map((stat) => (
          <TouchableOpacity
            key={stat.buildingId}
            style={styles.buildingStatCard}
            onPress={() => {
              const building = buildings.find(b => b.id === stat.buildingId);
              if (building) onBuildingPress?.(building);
            }}
          >
            <View style={styles.buildingStatHeader}>
              <Text style={styles.buildingStatName}>{stat.buildingName}</Text>
              <Text style={[styles.buildingStatRate, { 
                color: stat.completionRate >= 80 ? '#10b981' : 
                       stat.completionRate >= 60 ? '#f59e0b' : '#ef4444'
              }]}>
                {stat.completionRate.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.buildingStatProgress}>
              <View style={styles.buildingStatProgressBar}>
                <View 
                  style={[
                    styles.buildingStatProgressFill, 
                    { 
                      width: `${stat.completionRate}%`,
                      backgroundColor: stat.completionRate >= 80 ? '#10b981' : 
                                      stat.completionRate >= 60 ? '#f59e0b' : '#ef4444'
                    }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.buildingStatTasks}>
              {stat.completedTasks} of {stat.totalTasks} tasks completed
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderByPriority = () => {
    if (!progressStats) return null;

    return (
      <View style={styles.priorityStatsContainer}>
        {progressStats.priorityStats.map((stat) => (
          <View key={stat.priority} style={styles.priorityStatCard}>
            <View style={styles.priorityStatHeader}>
              <Text style={[styles.priorityStatName, { 
                color: stat.priority === 'urgent' ? '#ef4444' :
                       stat.priority === 'high' ? '#f59e0b' :
                       stat.priority === 'medium' ? '#3b82f6' : '#10b981'
              }]}>
                {stat.priority.toUpperCase()}
              </Text>
              <Text style={styles.priorityStatRate}>
                {stat.completionRate.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.priorityStatProgress}>
              <View style={styles.priorityStatProgressBar}>
                <View 
                  style={[
                    styles.priorityStatProgressFill, 
                    { 
                      width: `${stat.completionRate}%`,
                      backgroundColor: stat.priority === 'urgent' ? '#ef4444' :
                                      stat.priority === 'high' ? '#f59e0b' :
                                      stat.priority === 'medium' ? '#3b82f6' : '#10b981'
                    }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.priorityStatTasks}>
              {stat.completedTasks} of {stat.totalTasks} tasks completed
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderByTime = () => {
    if (!progressStats) return null;

    return (
      <View style={styles.timeStatsContainer}>
        {progressStats.timeStats.map((stat, index) => (
          <View key={index} style={styles.timeStatCard}>
            <Text style={styles.timeStatSlot}>{stat.timeSlot}</Text>
            <View style={styles.timeStatProgress}>
              <View style={styles.timeStatProgressBar}>
                <View 
                  style={[
                    styles.timeStatProgressFill, 
                    { 
                      width: `${stat.completionRate}%`,
                      backgroundColor: stat.completionRate >= 80 ? '#10b981' : 
                                      stat.completionRate >= 60 ? '#f59e0b' : '#ef4444'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.timeStatRate}>
                {stat.completionRate.toFixed(0)}%
              </Text>
            </View>
            <Text style={styles.timeStatTasks}>
              {stat.completedTasks} of {stat.totalTasks} tasks completed
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedMetric) {
      case ProgressMetric.OVERVIEW:
        return renderOverview();
      case ProgressMetric.BY_BUILDING:
        return renderByBuilding();
      case ProgressMetric.BY_PRIORITY:
        return renderByPriority();
      case ProgressMetric.BY_TIME:
        return renderByTime();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Progress</Text>
        <Text style={styles.subtitle}>
          {progressStats?.totalTasks || 0} tasks • {progressStats?.completedTasks || 0} completed
        </Text>
      </View>

      {/* Metric Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.metricSelector}
        contentContainerStyle={styles.metricSelectorContent}
      >
        {Object.values(ProgressMetric).map((metric) => (
          <TouchableOpacity
            key={metric}
            style={[
              styles.metricButton,
              selectedMetric === metric && styles.metricButtonActive
            ]}
            onPress={() => setSelectedMetric(metric)}
          >
            <Text style={styles.metricIcon}>{getMetricIcon(metric)}</Text>
            <Text style={[
              styles.metricText,
              selectedMetric === metric && styles.metricTextActive
            ]}>
              {getMetricTitle(metric)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
        
        {/* Recent Tasks */}
        <View style={styles.recentTasksContainer}>
          <Text style={styles.recentTasksTitle}>Recent Tasks</Text>
          {tasks.slice(0, 5).map((task) => (
            <TaskTimelineRow
              key={task.id}
              task={task}
              onTaskPress={onTaskPress}
              compact={true}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  metricSelector: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricSelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricButtonActive: {
    backgroundColor: '#3b82f6',
  },
  metricIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  metricText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  metricTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: 20,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#3b82f6',
  },
  progressPercentage: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
  buildingStatsContainer: {
    padding: 20,
  },
  buildingStatCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buildingStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buildingStatName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  buildingStatRate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buildingStatProgress: {
    marginBottom: 8,
  },
  buildingStatProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  buildingStatProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  buildingStatTasks: {
    color: '#9ca3af',
    fontSize: 12,
  },
  priorityStatsContainer: {
    padding: 20,
  },
  priorityStatCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  priorityStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityStatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priorityStatRate: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priorityStatProgress: {
    marginBottom: 8,
  },
  priorityStatProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  priorityStatProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  priorityStatTasks: {
    color: '#9ca3af',
    fontSize: 12,
  },
  timeStatsContainer: {
    padding: 20,
  },
  timeStatCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeStatSlot: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeStatProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeStatProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  timeStatProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeStatRate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeStatTasks: {
    color: '#9ca3af',
    fontSize: 12,
  },
  recentTasksContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentTasksTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});

export default TodaysProgressDetailView;
