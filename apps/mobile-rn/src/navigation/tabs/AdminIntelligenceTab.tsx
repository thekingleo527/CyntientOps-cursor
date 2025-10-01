/**
 * @cyntientops/mobile-rn
 * 
 * Admin Intelligence Tab - System management and analytics
 * Features: System insights, worker management, analytics, admin quick actions
 */

import React, { useState, useEffect } from 'react';
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
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';
import { LinearGradient } from 'expo-linear-gradient';
import { LegacyAnalyticsDashboard, AnalyticsData } from '@cyntientops/ui-components/src/analytics/components/AnalyticsDashboard';
import { PredictiveMaintenanceService, MaintenancePrediction } from '@cyntientops/intelligence-services';

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

export interface AdminIntelligenceTab {
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
  const [adminInsights, setAdminInsights] = useState<AdminInsight[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [maintenancePredictions, setMaintenancePredictions] = useState<MaintenancePrediction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminIntelligenceData();
  }, [adminId]);

  const loadAdminIntelligenceData = async () => {
    try {
      // Load admin insights
      const insights = generateAdminInsights(adminId);
      setAdminInsights(insights);

      // Load analytics data
      const analytics = generateAnalyticsData(adminId);
      setAnalyticsData(analytics);

      // Load maintenance predictions
      const predictions = await loadMaintenancePredictions();
      setMaintenancePredictions(predictions);
    } catch (error) {
      console.error('Failed to load admin intelligence data:', error);
    }
  };

  const generateAdminInsights = (adminId: string): AdminInsight[] => {
    return [
      {
        id: '1',
        type: 'system',
        title: 'System Performance',
        description: 'System is running at 98% efficiency. All services are operational.',
        priority: 'low',
        timestamp: new Date(),
        actionable: false,
      },
      {
        id: '2',
        type: 'worker',
        title: 'Worker Performance Alert',
        description: 'Kevin Dutan has completed 94% of assigned tasks this week.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'View Details',
        onAction: () => console.log('View worker details'),
      },
      {
        id: '3',
        type: 'building',
        title: 'Maintenance Schedule',
        description: '3 buildings require maintenance attention within the next 2 weeks.',
        priority: 'high',
        timestamp: new Date(),
        actionable: true,
        actionText: 'Schedule Maintenance',
        onAction: () => console.log('Schedule maintenance'),
      },
      {
        id: '4',
        type: 'alert',
        title: 'Weather Impact',
        description: 'Rain expected tomorrow may affect outdoor tasks at 5 buildings.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'Reschedule Tasks',
        onAction: () => console.log('Reschedule tasks'),
      },
    ];
  };

  const generateAnalyticsData = (adminId: string): AnalyticsData => {
    return {
      performance: {
        completionRate: 94,
        averageTaskTime: 45,
        efficiencyScore: 87,
        qualityRating: 4.8,
      },
      trends: {
        weeklyCompletion: [85, 88, 92, 89, 94, 91, 94],
        monthlyEfficiency: [82, 85, 87, 89, 87, 90, 87],
        taskCategories: {
          'Cleaning': 45,
          'Maintenance': 30,
          'DSNY': 15,
          'Inspection': 10,
        },
      },
      achievements: [
        { id: '1', title: 'System Uptime', description: '99.9% uptime this month', date: new Date() },
        { id: '2', title: 'Worker Efficiency', description: 'Average 94% task completion', date: new Date() },
        { id: '3', title: 'Client Satisfaction', description: '4.8/5 average rating', date: new Date() },
      ],
    };
  };

  const loadMaintenancePredictions = async (): Promise<MaintenancePrediction[]> => {
    try {
      const service = new PredictiveMaintenanceService();
      return await service.getMaintenancePredictions(adminId);
    } catch (error) {
      console.error('Failed to load maintenance predictions:', error);
      return [];
    }
  };

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
