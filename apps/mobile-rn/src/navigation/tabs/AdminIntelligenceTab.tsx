/**
 * @cyntientops/mobile-rn
 * 
 * Admin Intelligence Tab - System management and analytics
 * Features: System insights, worker management, analytics, admin quick actions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsDashboard, AnalyticsData } from '@cyntientops/ui-components';
import type { MaintenancePrediction } from '@cyntientops/intelligence-services';
import { Logger } from '@cyntientops/business-core';
import { RealDataService } from '@cyntientops/business-core/src/services/RealDataService';

// Types
export interface AdminIntelligenceTabProps {
  adminId: string;
  adminName: string;
  userRole: string;
}

export interface AdminInsight {
  id: string;
  type: 'system' | 'worker' | 'building' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  actionable: boolean;
  actionText?: string;
  onAction?: () => void;
}

export interface AdminIntelligenceTabData {
  id: 'overview' | 'workers' | 'buildings' | 'analytics' | 'quickactions';
  title: string;
  icon: string;
}

const ADMIN_INTELLIGENCE_TABS: AdminIntelligenceTab[] = [
  { id: 'overview', title: 'Overview', icon: '📊' },
  { id: 'workers', title: 'Workers', icon: '👥' },
  { id: 'buildings', title: 'Buildings', icon: '🏢' },
  { id: 'analytics', title: 'Analytics', icon: '📈' },
  { id: 'quickactions', title: 'Quick Actions', icon: '⚡' },
];

export interface AdminQuickActionType {
  id: 'create_task' | 'add_worker' | 'generate_report' | 'system_alert';
  title: string;
  icon: string;
  color: string;
}

const ADMIN_QUICK_ACTIONS: AdminQuickActionType[] = [
  { id: 'create_task', title: 'Create Task', icon: '📋', color: Colors.role.admin.primary },
  { id: 'add_worker', title: 'Add Worker', icon: '👥', color: Colors.status.info },
  { id: 'generate_report', title: 'Generate Report', icon: '📊', color: Colors.status.warning },
  { id: 'system_alert', title: 'System Alert', icon: '🚨', color: Colors.status.error },
];

export const AdminIntelligenceTab: React.FC<AdminIntelligenceTabProps> = ({
  adminId,
  adminName,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'buildings' | 'analytics' | 'quickactions'>('overview');
  const realDataService = useMemo(() => RealDataService.getInstance(), []);
  const [adminInsights, setAdminInsights] = useState<AdminInsight[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [maintenancePredictions, setMaintenancePredictions] = useState<MaintenancePrediction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const buildAdminInsights = useCallback((): AdminInsight[] => {
    const workers = realDataService.getWorkers();
    const buildings = realDataService.getBuildings();
    const routines = realDataService.getRoutines();

    if (!workers.length || !routines.length) {
      return [];
    }

    const workerStats = workers.map(worker => ({
      worker,
      stats: realDataService.getTaskStatsForWorker(worker.id),
    }));

    const averageCompletion = Math.round(
      workerStats.reduce((sum, entry) => sum + (entry.stats?.completionRate ?? 0), 0) /
        workerStats.length
    );

    const topPerformer = workerStats.reduce((best, entry) => {
      if (!best) return entry;
      return (entry.stats?.completionRate ?? 0) > (best.stats?.completionRate ?? 0) ? entry : best;
    }, workerStats[0]);

    const maintenanceTasks = routines.filter(
      routine => (routine.category || '').toLowerCase() === 'maintenance'
    );

    const maintenanceByBuilding = maintenanceTasks.reduce(
      (map, routine) => {
        const id = routine.buildingId;
        if (!id) return map;
        const existing = map.get(id) ?? {
          count: 0,
          name:
            routine.building ||
            buildings.find(building => building.id === id)?.name ||
            'Building',
        };
        existing.count += 1;
        map.set(id, existing);
        return map;
      },
      new Map<string, { count: number; name: string }>()
    );

    const maintenanceHotspot = Array.from(maintenanceByBuilding.entries()).sort(
      (a, b) => b[1].count - a[1].count
    )[0];

    const outdoorTasks = routines.filter(routine => {
      const category = (routine.category || '').toLowerCase();
      return ['sanitation', 'cleaning', 'dsny', 'operations'].includes(category);
    });

    const impactedBuildings = new Set(outdoorTasks.map(task => task.buildingId));
    const photoTasks = routines.filter(routine => routine.requiresPhoto).length;

    return [
      {
        id: 'system_performance',
        type: 'system',
        title: 'System Performance',
        description: `Average completion rate is ${averageCompletion}% across ${workers.length} active workers covering ${routines.length} recurring routines.`,
        priority: averageCompletion >= 92 ? 'low' : averageCompletion >= 85 ? 'medium' : 'high',
        timestamp: new Date(),
        actionable: averageCompletion < 90,
        actionText: averageCompletion < 90 ? 'Review Task Load' : undefined,
        onAction:
          averageCompletion < 90
            ? () =>
                Logger.debug(
                  'Admin reviewing task allocation',
                  undefined,
                  'AdminIntelligenceTab.tsx'
                )
            : undefined,
      },
      {
        id: 'worker_leaderboard',
        type: 'worker',
        title: 'Worker Performance Spotlight',
        description: topPerformer
          ? `${topPerformer.worker.name} leads with ${topPerformer.stats.completedTasks} completions (${topPerformer.stats.completionRate}%).`
          : 'Worker performance data is loading.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'Open Worker Dashboard',
        onAction: () =>
          Logger.debug('Navigating to worker analytics', undefined, 'AdminIntelligenceTab.tsx'),
      },
      {
        id: 'maintenance_focus',
        type: 'building',
        title: 'Maintenance Hotspot',
        description: maintenanceHotspot
          ? `${maintenanceHotspot[1].name} has ${maintenanceHotspot[1].count} active maintenance routines awaiting scheduling.`
          : 'No maintenance bottlenecks detected.',
        priority: maintenanceHotspot && maintenanceHotspot[1].count > 5 ? 'high' : 'medium',
        timestamp: new Date(),
        actionable: !!maintenanceHotspot,
        actionText: maintenanceHotspot ? 'Schedule Crew' : undefined,
        onAction: maintenanceHotspot
          ? () =>
              Logger.debug(
                `Scheduling maintenance for ${maintenanceHotspot[1].name}`,
                undefined,
                'AdminIntelligenceTab.tsx'
              )
          : undefined,
      },
      {
        id: 'weather_readiness',
        type: 'alert',
        title: 'Weather Sensitivity',
        description: `${impactedBuildings.size} properties have ${outdoorTasks.length} outdoor or sanitation tasks in the next window. ${photoTasks} require photo verification.`,
        priority: impactedBuildings.size > 4 ? 'medium' : 'low',
        timestamp: new Date(),
        actionable: outdoorTasks.length > 0,
        actionText: outdoorTasks.length > 0 ? 'Review Schedule' : undefined,
        onAction:
          outdoorTasks.length > 0
            ? () =>
                Logger.debug(
                  'Adjusting outdoor task schedules based on weather',
                  undefined,
                  'AdminIntelligenceTab.tsx'
                )
            : undefined,
      },
    ];
  }, [realDataService]);

  const buildAnalyticsData = useCallback((): AnalyticsData => {
    const workers = realDataService.getWorkers();
    const routines = realDataService.getRoutines();

    const workerStats = workers.map(worker =>
      realDataService.getTaskStatsForWorker(worker.id)
    );

    const totalTasks = routines.length;
    const completedTasks = workerStats.reduce(
      (sum, stats) => sum + (stats?.completedTasks ?? 0),
      0
    );
    const completionRate = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const averageTaskTime = totalTasks
      ? Math.round(
          routines.reduce((sum, routine) => sum + (routine.estimatedDuration ?? 45), 0) /
            totalTasks
        )
      : 0;

    const workerEfficiency = workerStats.length
      ? Math.round(
          workerStats.reduce((sum, stats) => sum + (stats?.completionRate ?? 0), 0) /
            workerStats.length
        )
      : 0;

    const photoRate = totalTasks
      ? Math.round(
          (routines.filter(routine => routine.requiresPhoto).length / totalTasks) * 100
        )
      : 0;

    const maintenanceBacklog = routines.filter(
      routine => (routine.category || '').toLowerCase() === 'maintenance'
    ).length;

    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyCompletion = Array(7).fill(0);
    routines.forEach(routine => {
      const tokens = (routine.daysOfWeek || '')
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);

      if (tokens.length === 0) {
        // Default to Monday-Friday if no schedule specified
        for (const index of [1, 2, 3, 4, 5]) {
          weeklyCompletion[index] += 1;
        }
        return;
      }

      tokens.forEach(token => {
        const normalized = token.slice(0, 3).toLowerCase();
        const index = dayOrder.findIndex(day =>
          day.toLowerCase().startsWith(normalized)
        );
        if (index >= 0) {
          weeklyCompletion[index] += 1;
        }
      });
    });

    const monthlyEfficiency = Array.from({ length: 6 }).map((_, idx) => {
      const variance = (idx - 2) * 1.5;
      return Math.max(
        70,
        Math.min(100, Math.round(workerEfficiency + variance))
      );
    });

    const taskCategories = routines.reduce<Record<string, number>>((acc, routine) => {
      const category = routine.category || 'General';
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});

    const achievements = [
      {
        id: 'uptime',
        title: 'High Completion',
        description: `${completedTasks} of ${totalTasks} routines completed this cycle.`,
        date: new Date(),
      },
      {
        id: 'compliance',
        title: 'Compliance Coverage',
        description: `${photoRate}% of routines captured with photo verification.`,
        date: new Date(),
      },
      {
        id: 'maintenance',
        title: 'Maintenance Readiness',
        description: `${maintenanceBacklog} scheduled maintenance routines pending assignment.`,
        date: new Date(),
      },
    ];

    return {
      performance: {
        completionRate,
        averageTaskTime,
        efficiencyScore: workerEfficiency,
        qualityRating: Number(
          Math.min(5, Math.max(3.5, 3 + photoRate / 25)).toFixed(1)
        ),
      },
      trends: {
        weeklyCompletion,
        monthlyEfficiency,
        taskCategories,
      },
      achievements,
    };
  }, [realDataService]);

  const buildMaintenancePredictions = useCallback((): MaintenancePrediction[] => {
    const buildings = realDataService.getBuildings();
    const routines = realDataService.getRoutines();

    const maintenanceTasks = routines.filter(
      routine => (routine.category || '').toLowerCase() === 'maintenance'
    );

    if (!maintenanceTasks.length) {
      return [];
    }

    const grouped = maintenanceTasks.reduce(
      (map, routine) => {
        const id = routine.buildingId;
        if (!id) return map;
        const entry = map.get(id) ?? {
          tasks: 0,
          totalDuration: 0,
          requiresPhoto: 0,
          buildingName:
            routine.building ||
            buildings.find(building => building.id === id)?.name ||
            'Building',
        };
        entry.tasks += 1;
        entry.totalDuration += routine.estimatedDuration ?? 45;
        if (routine.requiresPhoto) {
          entry.requiresPhoto += 1;
        }
        map.set(id, entry);
        return map;
      },
      new Map<
        string,
        { tasks: number; totalDuration: number; requiresPhoto: number; buildingName: string }
      >()
    );

    const entries = Array.from(grouped.entries()).sort(
      (a, b) => b[1].tasks - a[1].tasks
    );
    const maxTasks = entries[0][1].tasks || 1;

    return entries.slice(0, 3).map(([buildingId, data]) => {
      const averageDuration = data.totalDuration / data.tasks;
      const likelihood = Math.min(0.95, 0.4 + (data.tasks / maxTasks) * 0.5);
      const estimatedDays = Math.max(2, Math.round(averageDuration / 45));

      return {
        buildingId,
        buildingName: data.buildingName,
        predictedIssue: 'Upcoming maintenance saturation',
        likelihood,
        estimatedDays,
        recommendedActions: [
          'Schedule maintenance window within the next week',
          data.requiresPhoto > 0
            ? 'Capture compliance photos for high-risk equipment'
            : 'Confirm checklist completion with crew lead',
          `Allocate ${Math.max(1, Math.ceil(data.tasks / 3))} crew members`,
        ],
        factors: [
          { name: 'Open routines', importance: Number((data.tasks / maxTasks).toFixed(2)) },
          { name: 'Avg duration (hrs)', importance: Number((averageDuration / 60).toFixed(2)) },
          {
            name: 'Photo-required tasks',
            importance: Number((data.requiresPhoto / data.tasks).toFixed(2)),
          },
        ],
        historicalPatterns: {
          openTasks: data.tasks,
          photoRequired: data.requiresPhoto,
          averageDurationMinutes: Math.round(averageDuration),
        },
      };
    });
  }, [realDataService]);

  const loadAdminIntelligenceData = useCallback(async () => {
    try {
      setAdminInsights(buildAdminInsights());
      setAnalyticsData(buildAnalyticsData());
      setMaintenancePredictions(buildMaintenancePredictions());
    } catch (error) {
      Logger.error('Failed to load admin intelligence data:', error, 'AdminIntelligenceTab.tsx');
    }
  }, [buildAdminInsights, buildAnalyticsData, buildMaintenancePredictions]);

  useEffect(() => {
    void loadAdminIntelligenceData();
  }, [adminId, loadAdminIntelligenceData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdminIntelligenceData();
    setRefreshing(false);
  };

  const renderTabButton = (tab: AdminIntelligenceTab) => {
    const isActive = activeTab === tab.id;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab.id)}
      >
        <Text style={styles.tabIcon}>{tab.icon}</Text>
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderInsight = (insight: AdminInsight) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent': return Colors.status.error;
        case 'high': return Colors.status.warning;
        case 'medium': return Colors.status.info;
        case 'low': return Colors.status.success;
        default: return Colors.text.tertiary;
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'system': return '⚙️';
        case 'worker': return '👥';
        case 'building': return '🏢';
        case 'alert': return '⚠️';
        default: return '📋';
      }
    };

    return (
      <GlassCard
        key={insight.id}
        intensity={GlassIntensity.regular}
        cornerRadius={CornerRadius.medium}
        style={[styles.insightCard, { borderLeftColor: getPriorityColor(insight.priority), borderLeftWidth: 4 }]}
      >
        <View style={styles.insightHeader}>
          <Text style={styles.insightIcon}>{getTypeIcon(insight.type)}</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}>
            <Text style={styles.priorityText}>{insight.priority.toUpperCase()}</Text>
          </View>
        </View>
        
        {insight.actionable && insight.actionText && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={insight.onAction}
          >
            <LinearGradient
              colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>{insight.actionText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </GlassCard>
      );
  };

  const renderPrediction = (prediction: MaintenancePrediction) => (
    <GlassCard
      key={prediction.buildingId}
      intensity={GlassIntensity.thin}
      cornerRadius={CornerRadius.medium}
      style={styles.predictionCard}
    >
      <View style={styles.predictionHeader}>
        <Text style={styles.predictionTitle}>{prediction.buildingName}</Text>
        <Text style={styles.predictionLikelihood}>
          {(prediction.likelihood * 100).toFixed(0)}% likelihood
        </Text>
      </View>
      <Text style={styles.predictionIssue}>{prediction.predictedIssue}</Text>
      <Text style={styles.predictionDetail}>
        Estimated resolution: {prediction.estimatedDays} day{prediction.estimatedDays === 1 ? '' : 's'}
      </Text>
      <View style={styles.predictionActions}>
        {prediction.recommendedActions.slice(0, 2).map((action, index) => (
          <View key={index} style={styles.predictionActionBadge}>
            <Text style={styles.predictionActionText}>{action}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );

  const renderOverviewView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>System Overview</Text>
      {adminInsights.filter(insight => insight.type === 'system').map(renderInsight)}
    </View>
  );

  const renderWorkersView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Worker Management</Text>
      {adminInsights.filter(insight => insight.type === 'worker').map(renderInsight)}
    </View>
  );

  const renderBuildingsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Building Management</Text>
      {adminInsights.filter(insight => insight.type === 'building').map(renderInsight)}
      {maintenancePredictions.length > 0 && (
        <View style={styles.predictionSection}>
          <Text style={styles.sectionSubtitle}>Maintenance Forecast</Text>
          {maintenancePredictions.map(renderPrediction)}
        </View>
      )}
    </View>
  );

  const renderAnalyticsView = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>System Analytics</Text>
        <LegacyAnalyticsDashboard
          analytics={analyticsData}
          selectedTab="performance"
          onTabChange={() => {}}
        />
      </View>
    );
  };

  const renderQuickActionsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Admin Quick Actions</Text>
      
      {/* Admin Quick Actions Grid with + in center */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsGrid}>
          {ADMIN_QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionButton,
                { backgroundColor: action.color + '20' }
              ]}
              onPress={() => handleAdminQuickAction(action.id)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Center + Button */}
        <View style={styles.centerPlusContainer}>
          <TouchableOpacity
            style={styles.centerPlusButton}
            onPress={() => handleAddAdminQuickAction()}
          >
            <LinearGradient
              colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
              style={styles.centerPlusGradient}
            >
              <Text style={styles.centerPlusText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.centerPlusLabel}>Add Action</Text>
        </View>
      </View>
    </View>
  );

  const handleAdminQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'create_task':
        Alert.alert('Create Task', 'Opening task creation form for workers...');
        break;
      case 'add_worker':
        Alert.alert('Add Worker', 'Opening worker registration form...');
        break;
      case 'generate_report':
        Alert.alert('Generate Report', 'Opening report generation options...');
        break;
      case 'system_alert':
        Alert.alert('System Alert', 'Opening system-wide alert composer...');
        break;
    }
  };

  const handleAddAdminQuickAction = () => {
    Alert.alert('Add Admin Action', 'Custom admin quick action creation coming soon...');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewView();
      case 'workers':
        return renderWorkersView();
      case 'buildings':
        return renderBuildingsView();
      case 'analytics':
        return renderAnalyticsView();
      case 'quickactions':
        return renderQuickActionsView();
      default:
        return renderOverviewView();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {ADMIN_INTELLIGENCE_TABS.map(renderTabButton)}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.role.admin.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: Colors.glass.regular,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: Colors.role.admin.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  insightCard: {
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  predictionSection: {
    marginTop: 16,
  },
  predictionCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  predictionLikelihood: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.status.warning,
  },
  predictionIssue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  predictionDetail: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginBottom: 12,
  },
  predictionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  predictionActionBadge: {
    backgroundColor: `${Colors.role.admin.primary}1A`,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  predictionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.role.admin.primary,
  },
  quickActionsContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
  },
  quickActionButton: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  centerPlusContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerPlusGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlusText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  centerPlusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});

export default AdminIntelligenceTab;
