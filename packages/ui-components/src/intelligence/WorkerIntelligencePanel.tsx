/**
 * 👷 Worker Intelligence Panel
 * Mirrors: CyntientOps/Views/Components/Worker/WorkerIntelligencePanel.swift
 * Purpose: Worker-focused intelligence with Operations, Tasks, Compliance, Performance, Portfolio tabs
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
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { 
  IntelligenceInsight, 
  ContextualTask, 
  WorkerProfile,
  NamedCoordinate,
  UserRole 
} from '@cyntientops/domain-schema';
import { RealTimeOrchestrator, RealTimeEventType } from '@cyntientops/business-core';

export interface WorkerIntelligencePanelProps {
  todaysTasks: ContextualTask[];
  todaysRoutines: ContextualTask[];
  weeklySchedule: Array<{
    day: string;
    tasks: Array<{
      id: string;
      title: string;
      time: string;
      building: string;
      status: string;
    }>;
  }>;
  worker?: WorkerProfile;
  portfolioBuildings: NamedCoordinate[];
  currentBuilding?: NamedCoordinate;
  onTaskPress?: (task: ContextualTask) => void;
  onBuildingPress?: (building: NamedCoordinate) => void;
  onPortfolioMapPress?: () => void;
  onSiteDeparturePress?: () => void;
  onQuickActionPress?: (action: QuickActionType) => void;
  isLoading?: boolean;
}

export enum QuickActionType {
  PHOTO = 'photo',
  VENDOR_LOG = 'vendor_log',
  QUICK_NOTE = 'quick_note',
  EMERGENCY = 'emergency'
}

export enum WorkerIntelTab {
  ROUTINES = 'Routines',
  PORTFOLIO = 'Portfolio',
  SITE_DEPARTURE = 'Site Departure',
  SCHEDULE = 'Schedule',
  QUICK_ACTION = '(+)'
}

export interface RouteSequence {
  id: string;
  buildingName: string;
  arrivalTime: Date;
  status: 'active' | 'upcoming' | 'completed';
}

export const WorkerIntelligencePanel: React.FC<WorkerIntelligencePanelProps> = ({
  todaysTasks,
  todaysRoutines,
  weeklySchedule,
  worker,
  portfolioBuildings,
  currentBuilding,
  onTaskPress,
  onBuildingPress,
  onPortfolioMapPress,
  onSiteDeparturePress,
  onQuickActionPress,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<WorkerIntelTab>(WorkerIntelTab.ROUTINES);
  const [activeSequences, setActiveSequences] = useState<RouteSequence[]>([]);
  const [upcomingSequences, setUpcomingSequences] = useState<RouteSequence[]>([]);
  const [recentTasks, setRecentTasks] = useState<ContextualTask[]>([]);
  const [realTimeOrchestrator, setRealTimeOrchestrator] = useState<RealTimeOrchestrator | null>(null);

  useEffect(() => {
    loadSequences();
    loadRecentTasks();
    initializeRealTimeOrchestrator();
  }, [worker, todaysTasks]);

  const initializeRealTimeOrchestrator = async () => {
    try {
      // Get from ServiceContainer
      const serviceContainer = ServiceContainer.getInstance();
      const orchestrator = RealTimeOrchestrator.getInstance();
      setRealTimeOrchestrator(orchestrator);
      
      // Subscribe to real-time events
      orchestrator.subscribe(RealTimeEventType.TASK_ASSIGNED, 'worker', handleTaskAssigned);
      orchestrator.subscribe(RealTimeEventType.SCHEDULE_UPDATED, 'worker', handleScheduleUpdated);
      orchestrator.subscribe(RealTimeEventType.ALERT_CREATED, 'worker', handleAlertCreated);
      
    } catch (error) {
      console.error('Failed to initialize real-time orchestrator:', error);
    }
  };

  const handleTaskAssigned = (event: any) => {
    // Update local state when task is assigned
    console.log('Task assigned:', event.data);
    // Update todaysTasks or todaysRoutines
    console.log('Task assigned:', event);
  };

  const handleScheduleUpdated = (event: any) => {
    // Update local state when schedule changes
    console.log('Schedule updated:', event.data);
    // Update weeklySchedule
    console.log('Schedule updated:', event);
  };

  const handleAlertCreated = (event: any) => {
    // Show alert to worker
    console.log('Alert created:', event.data);
    // Show notification or update UI
    console.log('Alert created:', event);
  };

  const loadSequences = () => {
    // Load from RouteManager
    const serviceContainer = ServiceContainer.getInstance();
    const routeManager = serviceContainer.routeManager;
    const mockActiveSequences: RouteSequence[] = [
      {
        id: '1',
        buildingName: '123 Main St',
        arrivalTime: new Date(),
        status: 'active'
      }
    ];
    
    const mockUpcomingSequences: RouteSequence[] = [
      {
        id: '2', 
        buildingName: '456 Oak Ave',
        arrivalTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'upcoming'
      }
    ];
    
    setActiveSequences(mockActiveSequences);
    setUpcomingSequences(mockUpcomingSequences);
  };

  const loadRecentTasks = () => {
    // Sort tasks by due date, most recent first
    const sorted = todaysTasks
      .sort((a, b) => (b.dueDate?.getTime() || 0) - (a.dueDate?.getTime() || 0))
      .slice(0, 20);
    
    setRecentTasks(sorted);
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'low': return Colors.status.success;
      case 'medium':
      case 'normal': return Colors.primary.blue;
      case 'high': return Colors.status.warning;
      case 'urgent':
      case 'critical':
      case 'emergency': return Colors.status.error;
      default: return Colors.primary.blue;
    }
  };

  const getSanitationTaskCount = () => {
    return todaysTasks.filter(task => 
      task.category?.toLowerCase().includes('sanitation')
    ).length;
  };

  const getDSNYBinTaskCount = () => {
    return todaysTasks.filter(task => 
      task.category?.toLowerCase().includes('dsny') ||
      task.category?.toLowerCase().includes('bin')
    ).length;
  };

  const renderTabButton = (tab: WorkerIntelTab) => (
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

  const renderRoutinesPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Today's Routines</Text>
      
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.text.primary} />
      ) : todaysRoutines.length === 0 ? (
        <Text style={styles.emptyText}>No routines scheduled for today.</Text>
      ) : (
        <ScrollView style={styles.routinesList} showsVerticalScrollIndicator={false}>
          {todaysRoutines.map(routine => (
            <TouchableOpacity
              key={routine.id}
              style={styles.routineItem}
              onPress={() => onTaskPress?.(routine)}
            >
              <View style={styles.routineItemContent}>
                <View style={[styles.urgencyIndicator, { backgroundColor: getUrgencyColor(routine.priority) }]} />
                <View style={styles.routineInfo}>
                  <Text style={styles.routineTitle}>{routine.title}</Text>
                  <Text style={styles.routineBuilding}>{routine.buildingName}</Text>
                  {routine.dueDate && (
                    <Text style={styles.routineTime}>
                      Due: {routine.dueDate.toLocaleTimeString()}
                    </Text>
                  )}
                </View>
                <View style={styles.routineStatus}>
                  {routine.status === 'completed' && (
                    <Text style={styles.completedIcon}>✓</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderSchedulePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Weekly Schedule</Text>
      
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.text.primary} />
      ) : weeklySchedule.length === 0 ? (
        <Text style={styles.emptyText}>No schedule available</Text>
      ) : (
        <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
          {weeklySchedule.map((scheduleItem, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleDate}>
                  {scheduleItem.date?.toLocaleDateString() || 'Today'}
                </Text>
                <Text style={styles.scheduleTaskCount}>
                  {scheduleItem.tasks?.length || 0} tasks
                </Text>
              </View>
              {scheduleItem.tasks?.slice(0, 3).map((task: any) => (
                <View key={task.id} style={styles.scheduleTaskItem}>
                  <Text style={styles.scheduleTaskTitle}>{task.title}</Text>
                  <Text style={styles.scheduleTaskTime}>
                    {task.startTime} - {task.endTime}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderSiteDeparturePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Site Departure</Text>
      
      <View style={styles.departureContent}>
        <Text style={styles.departureDescription}>
          Complete your site departure checklist before leaving.
        </Text>
        
        <TouchableOpacity
          style={styles.departureButton}
          onPress={onSiteDeparturePress}
        >
          <Text style={styles.departureButtonIcon}>🚪</Text>
          <Text style={styles.departureButtonText}>Start Site Departure</Text>
        </TouchableOpacity>
        
        {currentBuilding && (
          <View style={styles.currentSiteInfo}>
            <Text style={styles.currentSiteLabel}>Current Site:</Text>
            <Text style={styles.currentSiteName}>{currentBuilding.name}</Text>
            <Text style={styles.currentSiteAddress}>{currentBuilding.address}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderQuickActionPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Quick Actions</Text>
      
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => onQuickActionPress?.(QuickActionType.PHOTO)}
        >
          <Text style={styles.quickActionIcon}>📸</Text>
          <Text style={styles.quickActionText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => onQuickActionPress?.(QuickActionType.VENDOR_LOG)}
        >
          <Text style={styles.quickActionIcon}>📝</Text>
          <Text style={styles.quickActionText}>Vendor Log</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => onQuickActionPress?.(QuickActionType.QUICK_NOTE)}
        >
          <Text style={styles.quickActionIcon}>📋</Text>
          <Text style={styles.quickActionText}>Quick Note</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, styles.emergencyButton]}
          onPress={() => onQuickActionPress?.(QuickActionType.EMERGENCY)}
        >
          <Text style={styles.quickActionIcon}>🚨</Text>
          <Text style={styles.quickActionText}>Emergency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPortfolioPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Portfolio Map</Text>
      <Text style={styles.portfolioDescription}>
        View all buildings and navigate quickly to details.
      </Text>
      
      <TouchableOpacity
        style={styles.portfolioButton}
        onPress={onPortfolioMapPress}
      >
        <Text style={styles.portfolioButtonIcon}>🗺️</Text>
        <Text style={styles.portfolioButtonText}>Open Portfolio Map</Text>
      </TouchableOpacity>
      
      {portfolioBuildings.length > 0 && (
        <View style={styles.portfolioStats}>
          <Text style={styles.portfolioStat}>
            {portfolioBuildings.length} buildings in portfolio
          </Text>
          {currentBuilding && (
            <Text style={styles.portfolioStat}>
              Currently at: {currentBuilding.name}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case WorkerIntelTab.ROUTINES:
        return renderRoutinesPanel();
      case WorkerIntelTab.PORTFOLIO:
        return renderPortfolioPanel();
      case WorkerIntelTab.SITE_DEPARTURE:
        return renderSiteDeparturePanel();
      case WorkerIntelTab.SCHEDULE:
        return renderSchedulePanel();
      case WorkerIntelTab.QUICK_ACTION:
        return renderQuickActionPanel();
      default:
        return renderRoutinesPanel();
    }
  };

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <View style={styles.tabContainer}>
        {Object.values(WorkerIntelTab).map(renderTabButton)}
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
  
  // Routines Panel Styles
  routinesList: {
    maxHeight: 200,
  },
  routineItem: {
    marginBottom: Spacing.sm,
  },
  routineItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  routineBuilding: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  routineTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  routineStatus: {
    marginLeft: Spacing.sm,
  },
  
  // Schedule Panel Styles
  scheduleList: {
    maxHeight: 200,
  },
  scheduleItem: {
    padding: Spacing.sm,
    backgroundColor: Colors.glass.medium,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleDate: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  scheduleTaskCount: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  scheduleTaskItem: {
    marginBottom: Spacing.xs,
  },
  scheduleTaskTitle: {
    ...Typography.caption,
    color: Colors.text.primary,
  },
  scheduleTaskTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  
  // Site Departure Panel Styles
  departureContent: {
    alignItems: 'center',
  },
  departureDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  departureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  departureButtonIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  departureButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  currentSiteInfo: {
    alignItems: 'center',
  },
  currentSiteLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  currentSiteName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  currentSiteAddress: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  
  // Quick Actions Panel Styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.glass.medium,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  emergencyButton: {
    backgroundColor: Colors.status.error + '20',
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.caption,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Portfolio Panel Styles
  portfolioDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  portfolioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  portfolioButtonIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  portfolioButtonText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  portfolioStats: {
    marginTop: Spacing.sm,
  },
  portfolioStat: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
});
