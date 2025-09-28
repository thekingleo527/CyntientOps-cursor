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
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  IntelligenceInsight, 
  ContextualTask, 
  WorkerProfile,
  NamedCoordinate,
  UserRole 
} from '@cyntientops/domain-schema';

export interface WorkerIntelligencePanelProps {
  insights: IntelligenceInsight[];
  todaysTasks: ContextualTask[];
  worker?: WorkerProfile;
  portfolioBuildings: NamedCoordinate[];
  currentBuilding?: NamedCoordinate;
  onTaskPress?: (task: ContextualTask) => void;
  onBuildingPress?: (building: NamedCoordinate) => void;
  onPortfolioMapPress?: () => void;
  onInsightPress?: (insight: IntelligenceInsight) => void;
  isLoading?: boolean;
}

export enum WorkerIntelTab {
  OPERATIONS = 'Operations',
  TASKS = 'Tasks', 
  COMPLIANCE = 'Compliance',
  PERFORMANCE = 'Performance',
  PORTFOLIO = 'Portfolio'
}

export interface RouteSequence {
  id: string;
  buildingName: string;
  arrivalTime: Date;
  status: 'active' | 'upcoming' | 'completed';
}

export const WorkerIntelligencePanel: React.FC<WorkerIntelligencePanelProps> = ({
  insights,
  todaysTasks,
  worker,
  portfolioBuildings,
  currentBuilding,
  onTaskPress,
  onBuildingPress,
  onPortfolioMapPress,
  onInsightPress,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<WorkerIntelTab>(WorkerIntelTab.OPERATIONS);
  const [activeSequences, setActiveSequences] = useState<RouteSequence[]>([]);
  const [upcomingSequences, setUpcomingSequences] = useState<RouteSequence[]>([]);
  const [recentTasks, setRecentTasks] = useState<ContextualTask[]>([]);

  useEffect(() => {
    loadSequences();
    loadRecentTasks();
  }, [worker, todaysTasks]);

  const loadSequences = () => {
    // TODO: Load from RouteManager
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

  const renderOperationsPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Today's Routines</Text>
      
      {activeSequences.length === 0 && upcomingSequences.length === 0 ? (
        <Text style={styles.emptyText}>No active routines right now.</Text>
      ) : (
        <View>
          {activeSequences.length > 0 && (
            <View style={styles.sequenceSection}>
              <Text style={styles.sectionTitle}>Active</Text>
              {activeSequences.map(sequence => (
                <View key={sequence.id} style={styles.sequenceItem}>
                  <Text style={styles.sequenceBuilding}>{sequence.buildingName}</Text>
                  <Text style={styles.sequenceTime}>
                    {sequence.arrivalTime.toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {upcomingSequences.length > 0 && (
            <View style={styles.sequenceSection}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              {upcomingSequences.map(sequence => (
                <View key={sequence.id} style={styles.sequenceItem}>
                  <Text style={styles.sequenceBuilding}>{sequence.buildingName}</Text>
                  <Text style={styles.sequenceTime}>
                    {sequence.arrivalTime.toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderTasksPanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Tasks & Maintenance History</Text>
      
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.text.primary} />
      ) : recentTasks.length === 0 ? (
        <Text style={styles.emptyText}>No recent tasks</Text>
      ) : (
        <View>
          {recentTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => onTaskPress?.(task)}
            >
              <View style={styles.taskItemContent}>
                <View style={[styles.urgencyIndicator, { backgroundColor: getUrgencyColor(task.priority) }]} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.dueDate && (
                    <Text style={styles.taskDueDate}>
                      Due: {task.dueDate.toLocaleDateString()}
                    </Text>
                  )}
                  {task.buildingName && (
                    <Text style={styles.taskBuilding}>{task.buildingName}</Text>
                  )}
                </View>
                <View style={styles.taskStatus}>
                  {task.status === 'completed' && (
                    <Text style={styles.completedIcon}>✓</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderCompliancePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Compliance Summary</Text>
      
      <View style={styles.complianceStats}>
        <Text style={styles.complianceStat}>
          Sanitation Tasks Today: {getSanitationTaskCount()}
        </Text>
        <Text style={styles.complianceStat}>
          DSNY Bin Tasks: {getDSNYBinTaskCount()}
        </Text>
      </View>
      
      <View style={styles.complianceDivider} />
      
      <Text style={styles.sectionTitle}>Documentation</Text>
      <View style={styles.documentationList}>
        <View style={styles.documentationItem}>
          <Text style={styles.documentationIcon}>📄</Text>
          <Text style={styles.documentationText}>Sanitation (DSNY) Guidance</Text>
        </View>
        <View style={styles.documentationItem}>
          <Text style={styles.documentationIcon}>🛡️</Text>
          <Text style={styles.documentationText}>Safety Procedures</Text>
        </View>
        <View style={styles.documentationItem}>
          <Text style={styles.documentationIcon}>✅</Text>
          <Text style={styles.documentationText}>Compliance Checklists</Text>
        </View>
      </View>
    </View>
  );

  const renderPerformancePanel = () => (
    <View style={styles.panelContent}>
      <Text style={styles.panelTitle}>Performance Metrics</Text>
      
      {/* TODO: Integrate with PerformanceMetricsView component */}
      <View style={styles.performancePlaceholder}>
        <Text style={styles.placeholderText}>
          Performance metrics will be displayed here
        </Text>
        <Text style={styles.placeholderSubtext}>
          Completion rates, efficiency scores, and trends
        </Text>
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
      case WorkerIntelTab.OPERATIONS:
        return renderOperationsPanel();
      case WorkerIntelTab.TASKS:
        return renderTasksPanel();
      case WorkerIntelTab.COMPLIANCE:
        return renderCompliancePanel();
      case WorkerIntelTab.PERFORMANCE:
        return renderPerformancePanel();
      case WorkerIntelTab.PORTFOLIO:
        return renderPortfolioPanel();
      default:
        return renderOperationsPanel();
    }
  };

  return (
    <GlassCard style={styles.container}>
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
  
  // Operations Panel Styles
  sequenceSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  sequenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  sequenceBuilding: {
    ...Typography.caption,
    color: Colors.text.primary,
    flex: 1,
  },
  sequenceTime: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  
  // Tasks Panel Styles
  taskItem: {
    marginBottom: Spacing.sm,
  },
  taskItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  urgencyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
    marginTop: 4,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  taskDueDate: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  taskBuilding: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  taskStatus: {
    marginLeft: Spacing.sm,
  },
  completedIcon: {
    ...Typography.subheadline,
    color: Colors.status.success,
    fontWeight: '600',
  },
  
  // Compliance Panel Styles
  complianceStats: {
    marginBottom: Spacing.md,
  },
  complianceStat: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  complianceDivider: {
    height: 1,
    backgroundColor: Colors.glass.medium,
    marginVertical: Spacing.md,
  },
  documentationList: {
    marginTop: Spacing.sm,
  },
  documentationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  documentationIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  documentationText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  
  // Performance Panel Styles
  performancePlaceholder: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
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
