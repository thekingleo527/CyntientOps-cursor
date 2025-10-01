/**
 * @cyntientops/mobile-rn
 * 
 * Client Intelligence Tab - Portfolio management and analytics
 * Features: Portfolio insights, compliance analytics, team management, client quick actions
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
import { BuildingProfile, ClientProfile } from '@cyntientops/domain-schema';
import buildingsData from '@cyntientops/data-seed/buildings.json';
import clientsData from '@cyntientops/data-seed/clients.json';

// Types
export interface ClientIntelligenceTabProps {
  clientId: string;
  clientName: string;
  userRole: string;
}

export interface ClientInsight {
  id: string;
  type: 'portfolio' | 'compliance' | 'team' | 'alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  actionable: boolean;
  actionText?: string;
  onAction?: () => void;
}

export interface ClientIntelligenceTab {
  id: 'overview' | 'portfolio' | 'compliance' | 'team' | 'quickactions';
  title: string;
  icon: string;
}

const CLIENT_INTELLIGENCE_TABS: ClientIntelligenceTab[] = [
  { id: 'overview', title: 'Overview', icon: '📊' },
  { id: 'portfolio', title: 'Portfolio', icon: '🏢' },
  { id: 'compliance', title: 'Compliance', icon: '✅' },
  { id: 'team', title: 'Team', icon: '👥' },
  { id: 'quickactions', title: 'Quick Actions', icon: '⚡' },
];

export interface ClientQuickActionType {
  id: 'request_service' | 'schedule_inspection' | 'contact_team' | 'view_reports';
  title: string;
  icon: string;
  color: string;
}

const CLIENT_QUICK_ACTIONS: ClientQuickActionType[] = [
  { id: 'request_service', title: 'Request Service', icon: '🔧', color: Colors.role.client.primary },
  { id: 'schedule_inspection', title: 'Schedule Inspection', icon: '🔍', color: Colors.status.info },
  { id: 'contact_team', title: 'Contact Team', icon: '📞', color: Colors.status.warning },
  { id: 'view_reports', title: 'View Reports', icon: '📊', color: Colors.status.success },
];

export const ClientIntelligenceTab: React.FC<ClientIntelligenceTabProps> = ({
  clientId,
  clientName,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'compliance' | 'team' | 'quickactions'>('overview');
  const [clientInsights, setClientInsights] = useState<ClientInsight[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [clientBuildings, setClientBuildings] = useState<BuildingProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadClientIntelligenceData();
  }, [clientId]);

  const loadClientIntelligenceData = async () => {
    try {
      // Load client buildings
      const buildings = buildingsData.filter((building: any) => building.client_id === clientId);
      setClientBuildings(buildings as BuildingProfile[]);

      // Load client insights
      const insights = generateClientInsights(clientId, buildings);
      setClientInsights(insights);

      // Load analytics data
      const analytics = generateAnalyticsData(clientId, buildings);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Failed to load client intelligence data:', error);
    }
  };

  const generateClientInsights = (clientId: string, buildings: any[]): ClientInsight[] => {
    const totalUnits = buildings.reduce((sum, building) => sum + (building.numberOfUnits || 0), 0);
    const avgCompliance = buildings.reduce((sum, building) => sum + (building.compliance_score || 0), 0) / buildings.length || 0;

    return [
      {
        id: '1',
        type: 'portfolio',
        title: 'Portfolio Performance',
        description: `Your ${buildings.length} buildings with ${totalUnits} units are performing well with ${Math.round(avgCompliance * 100)}% average compliance.`,
        priority: 'low',
        timestamp: new Date(),
        actionable: false,
      },
      {
        id: '2',
        type: 'compliance',
        title: 'Compliance Alert',
        description: '2 buildings require attention for upcoming compliance deadlines.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'View Details',
        onAction: () => console.log('View compliance details'),
      },
      {
        id: '3',
        type: 'team',
        title: 'Team Performance',
        description: 'Your assigned workers have maintained 94% task completion rate this month.',
        priority: 'low',
        timestamp: new Date(),
        actionable: true,
        actionText: 'View Team',
        onAction: () => console.log('View team performance'),
      },
      {
        id: '4',
        type: 'alert',
        title: 'Maintenance Schedule',
        description: 'Routine maintenance scheduled for 3 buildings next week.',
        priority: 'medium',
        timestamp: new Date(),
        actionable: true,
        actionText: 'View Schedule',
        onAction: () => console.log('View maintenance schedule'),
      },
    ];
  };

  const generateAnalyticsData = (clientId: string, buildings: any[]): AnalyticsData => {
    const totalUnits = buildings.reduce((sum, building) => sum + (building.numberOfUnits || 0), 0);
    const avgCompliance = buildings.reduce((sum, building) => sum + (building.compliance_score || 0), 0) / buildings.length || 0;

    return {
      performance: {
        completionRate: 94,
        averageTaskTime: 45,
        efficiencyScore: Math.round(avgCompliance * 100),
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
        { id: '1', title: 'Portfolio Growth', description: `${buildings.length} buildings managed`, date: new Date() },
        { id: '2', title: 'Compliance Excellence', description: `${Math.round(avgCompliance * 100)}% average compliance`, date: new Date() },
        { id: '3', title: 'Tenant Satisfaction', description: '4.8/5 average rating', date: new Date() },
      ],
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClientIntelligenceData();
    setRefreshing(false);
  };

  const renderTabButton = (tab: ClientIntelligenceTab) => {
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

  const renderInsight = (insight: ClientInsight) => {
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
        case 'portfolio': return '🏢';
        case 'compliance': return '✅';
        case 'team': return '👥';
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
              colors={[Colors.role.client.primary, Colors.role.client.secondary]}
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
      <Text style={styles.sectionTitle}>Portfolio Overview</Text>
      {clientInsights.filter(insight => insight.type === 'portfolio').map(renderInsight)}
    </View>
  );

  const renderPortfolioView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Building Portfolio</Text>
      {clientBuildings.slice(0, 3).map(building => (
        <GlassCard
          key={building.id}
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.medium}
          style={styles.buildingCard}
        >
          <View style={styles.buildingHeader}>
            <Text style={styles.buildingName}>{building.name}</Text>
            <View style={[
              styles.complianceBadge,
              { backgroundColor: (building.complianceScore || 0.85) > 0.9 ? Colors.status.success : Colors.status.warning }
            ]}>
              <Text style={styles.complianceText}>
                {Math.round((building.complianceScore || 0.85) * 100)}%
              </Text>
            </View>
          </View>
          <Text style={styles.buildingAddress}>{building.address}</Text>
          <Text style={styles.buildingDetails}>
            {building.numberOfUnits || 0} units • Built {building.yearBuilt || 'N/A'}
          </Text>
        </GlassCard>
      ))}
    </View>
  );

  const renderComplianceView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Compliance Status</Text>
      {clientInsights.filter(insight => insight.type === 'compliance').map(renderInsight)}
    </View>
  );

  const renderTeamView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Team Management</Text>
      {clientInsights.filter(insight => insight.type === 'team').map(renderInsight)}
    </View>
  );

  const renderQuickActionsView = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Client Quick Actions</Text>
      
      {/* Client Quick Actions Grid with + in center */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsGrid}>
          {CLIENT_QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.quickActionButton,
                { backgroundColor: action.color + '20' }
              ]}
              onPress={() => handleClientQuickAction(action.id)}
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
            onPress={() => handleAddClientQuickAction()}
          >
            <LinearGradient
              colors={[Colors.role.client.primary, Colors.role.client.secondary]}
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

  const handleClientQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'request_service':
        Alert.alert('Request Service', 'Opening service request form...');
        break;
      case 'schedule_inspection':
        Alert.alert('Schedule Inspection', 'Opening inspection scheduling...');
        break;
      case 'contact_team':
        Alert.alert('Contact Team', 'Opening team contact options...');
        break;
      case 'view_reports':
        Alert.alert('View Reports', 'Opening portfolio reports...');
        break;
    }
  };

  const handleAddClientQuickAction = () => {
    Alert.alert('Add Client Action', 'Custom client quick action creation coming soon...');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewView();
      case 'portfolio':
        return renderPortfolioView();
      case 'compliance':
        return renderComplianceView();
      case 'team':
        return renderTeamView();
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
        {CLIENT_INTELLIGENCE_TABS.map(renderTabButton)}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.role.client.primary}
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
    backgroundColor: Colors.role.client.primary,
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
  buildingCard: {
    padding: 16,
    marginBottom: 12,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  complianceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  buildingAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  buildingDetails: {
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

export default ClientIntelligenceTab;
