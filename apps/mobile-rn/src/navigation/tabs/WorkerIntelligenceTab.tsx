/**
 * @cyntientops/mobile-rn
 * 
 * Worker Intelligence Tab - Nova AI and Analytics
 * Features: Nova insights, performance analytics, predictions, alerts
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
import { LinearGradient } from '@cyntientops/ui-components/src/mocks/expo-linear-gradient';
import { LegacyAnalyticsDashboard, AnalyticsData } from '@cyntientops/ui-components/src/analytics/components/AnalyticsDashboard';
import { PredictiveMaintenanceService, MaintenancePrediction } from '@cyntientops/intelligence-services';

// Types
export interface WorkerIntelligenceTabProps {
  userId: string;
  userName: string;
  userRole: string;
}

export interface NovaInsight {
  id: string;
  type: 'routine' | 'insight' | 'alert' | 'prediction';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  actionable: boolean;
  actionText?: string;
  onAction?: () => void;
}

export interface IntelligenceTab {
  id: 'routines' | 'insights' | 'alerts' | 'predictions' | 'quickactions';
  title: string;
  icon: string;
}

const INTELLIGENCE_TABS: IntelligenceTab[] = [
  { id: 'routines', title: 'Routines', icon: '🔄' },
  { id: 'insights', title: 'Insights', icon: '💡' },
  { id: 'alerts', title: 'Alerts', icon: '⚠️' },
  { id: 'predictions', title: 'Predictions', icon: '🔮' },
  { id: 'quickactions', title: 'Quick Actions', icon: '⚡' },
];

export interface QuickActionType {
  id: 'photo' | 'vendor_log' | 'quick_note' | 'emergency';
  title: string;
  icon: string;
  color: string;
}

const QUICK_ACTIONS: QuickActionType[] = [
  { id: 'photo', title: 'Take Photo', icon: '📸', color: Colors.role.worker.primary },
  { id: 'vendor_log', title: 'Vendor Log', icon: '📝', color: Colors.status.info },
  { id: 'quick_note', title: 'Quick Note', icon: '📋', color: Colors.status.warning },
  { id: 'emergency', title: 'Emergency', icon: '🚨', color: Colors.status.error },
];

export const WorkerIntelligenceTab: React.FC<WorkerIntelligenceTabProps> = ({
  userId,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'routines' | 'insights' | 'alerts' | 'predictions' | 'quickactions'>('insights');
  const [novaInsights, setNovaInsights] = useState<NovaInsight[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [maintenancePredictions, setMaintenancePredictions] = useState<MaintenancePrediction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIntelligenceData();
  }, [userId]);

  const loadIntelligenceData = async () => {
    try {
      // Load Nova insights
      const insights = generateNovaInsights(userId);
      setNovaInsights(insights);

      // Load analytics data
      const analytics = generateAnalyticsData(userId);
      setAnalyticsData(analytics);

      // Load maintenance predictions
      const predictions = await loadMaintenancePredictions();
      setMaintenancePredictions(predictions);
    } catch (error) {
      console.error('Failed to load intelligence data:', error);
    }
  };

  const generateNovaInsights = (workerId: string): NovaInsight[] => {
    return [
      {
        id: '1',
        type: 'insight',
        title: 'Efficiency Opportunity',
        description: 'Your morning routine at 131 Perry Street could be optimized by 15 minutes if you start with the exterior cleaning first.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'View Optimization',
        onAction: () => console.log('View optimization'),
      },
      {
        id: '2',
        type: 'alert',
        title: 'Weather Impact',
        description: 'Rain expected in 2 hours. Consider rescheduling outdoor tasks at Rubin Museum.',
        priority: 'high',
        timestamp: new Date(),
        actionable: true,
        actionText: 'Reschedule Tasks',
        onAction: () => console.log('Reschedule tasks'),
      },
      {
        id: '3',
        type: 'prediction',
        title: 'Maintenance Alert',
        description: 'Boiler at 135 West 17th Street may need attention within 2 weeks based on usage patterns.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'Schedule Inspection',
        onAction: () => console.log('Schedule inspection'),
      },
      {
        id: '4',
        type: 'routine',
        title: 'Routine Optimization',
        description: 'Your DSNY collection route could be improved by visiting buildings in a different order.',
        priority: 'low',
        timestamp: new Date(),
        actionable: true,
        actionText: 'View Route',
        onAction: () => console.log('View route'),
      },
    ];
  };

  const generateAnalyticsData = (workerId: string): AnalyticsData => {
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
        { id: '1', title: 'Perfect Week', description: '100% completion rate', date: new Date() },
        { id: '2', title: 'Efficiency Master', description: 'Consistently under time estimates', date: new Date() },
        { id: '3', title: 'Weather Warrior', description: 'Adapted to 5 weather changes', date: new Date() },
      ],
    };
  };

  const loadMaintenancePredictions = async (): Promise<MaintenancePrediction[]> => {
    try {
      const service = new PredictiveMaintenanceService();
      return await service.getMaintenancePredictions(userId);
    } catch (error) {
      console.error('Failed to load maintenance predictions:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIntelligenceData();
    setRefreshing(false);
  };

  const renderTabButton = (tab: IntelligenceTab) => {
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

  const renderInsight = (insight: NovaInsight) => {
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
        case 'insight': return '💡';
        case 'alert': return '⚠️';
        case 'prediction': return '🔮';
        case 'routine': return '🔄';
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
              colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>{insight.actionText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </GlassCard>
    );
  };

  const renderRoutinesView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Routine Intelligence</Text>
      {novaInsights.filter(insight => insight.type === 'routine').map(renderInsight)}
    </View>
  );

  const renderInsightsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Nova Insights</Text>
      {novaInsights.filter(insight => insight.type === 'insight').map(renderInsight)}
    </View>
  );

  const renderAlertsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Active Alerts</Text>
      {novaInsights.filter(insight => insight.type === 'alert').map(renderInsight)}
    </View>
  );

  const renderPredictionsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Predictive Analytics</Text>
      {novaInsights.filter(insight => insight.type === 'prediction').map(renderInsight)}
      
      {maintenancePredictions.length > 0 && (
        <View style={styles.predictionsSection}>
          <Text style={styles.subsectionTitle}>Maintenance Predictions</Text>
          {maintenancePredictions.map(prediction => (
            <GlassCard
              key={prediction.id}
              intensity={GlassIntensity.regular}
              cornerRadius={CornerRadius.medium}
              style={styles.predictionCard}
            >
              <Text style={styles.predictionTitle}>{prediction.equipmentName}</Text>
              <Text style={styles.predictionDescription}>{prediction.description}</Text>
              <Text style={styles.predictionDate}>
                Predicted: {new Date(prediction.predictedDate).toLocaleDateString()}
              </Text>
            </GlassCard>
          ))}
        </View>
      )}
    </View>
  );

  const renderQuickActionsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      {/* Quick Actions Grid with + in center */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionButton,
                { backgroundColor: action.color + '20' }
              ]}
              onPress={() => handleQuickAction(action.id)}
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
            onPress={() => handleAddQuickAction()}
          >
            <LinearGradient
              colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
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

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'photo':
        Alert.alert('Take Photo', 'Opening camera to capture photo evidence...');
        break;
      case 'vendor_log':
        Alert.alert('Vendor Log', 'Opening vendor log entry form...');
        break;
      case 'quick_note':
        Alert.alert('Quick Note', 'Opening quick note entry...');
        break;
      case 'emergency':
        Alert.alert('Emergency', 'Emergency protocols activated!');
        break;
    }
  };

  const handleAddQuickAction = () => {
    Alert.alert('Add Quick Action', 'Custom quick action creation coming soon...');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'routines':
        return renderRoutinesView();
      case 'insights':
        return renderInsightsView();
      case 'alerts':
        return renderAlertsView();
      case 'predictions':
        return renderPredictionsView();
      case 'quickactions':
        return renderQuickActionsView();
      default:
        return renderInsightsView();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {INTELLIGENCE_TABS.map(renderTabButton)}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.role.worker.primary}
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
    backgroundColor: Colors.role.worker.primary,
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 12,
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
  predictionsSection: {
    marginTop: 16,
  },
  predictionCard: {
    padding: 16,
    marginBottom: 12,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  predictionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  predictionDate: {
    fontSize: 12,
    color: Colors.text.tertiary,
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

export default WorkerIntelligenceTab;
