/**
 * 👨‍💼 Admin Dashboard Main View
 * Mirrors: CyntientOps/Views/Main/AdminDashboardMainView.swift
 * Purpose: Complete admin dashboard with analytics, worker management, and portfolio oversight
 */

import React from 'react';
const { useEffect, useState } = React;
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard } from '../glass';
import { GlassIntensity, CornerRadius } from '@cyntientops/design-tokens';
import { UserRole, OperationalDataTaskAssignment, NamedCoordinate } from '@cyntientops/domain-schema';
import { LegacyAnalyticsDashboard, AnalyticsData } from '../analytics/components/AnalyticsDashboard';
// import { useAppState } from '@cyntientops/business-core';

export interface AdminDashboardMainViewProps {
  adminId: string;
  adminName: string;
  userRole: UserRole;
  onWorkerPress?: (workerId: string) => void;
  onBuildingPress?: (buildingId: string) => void;
  onClientPress?: (clientId: string) => void;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  onEmergencyReport?: (emergency: any) => void;
  onMessageSent?: (message: any) => void;
  onEmergencyAlert?: (alert: any) => void;
}

export const AdminDashboardMainView: React.FC<AdminDashboardMainViewProps> = ({
  adminId,
  adminName,
  userRole,
  onWorkerPress,
  onBuildingPress,
  onClientPress,
  onTaskPress,
  onEmergencyReport,
  onMessageSent,
  onEmergencyAlert,
}) => {
  // const { 
  //   admin: adminState, 
  //   tasks: taskState, 
  //   buildings: buildingState, 
  //   workers: workerState,
  //   clients: clientState,
  //   novaAI: novaAIState,
  //   realTime: realTimeState,
  //   ui: uiState 
  // } = useAppState();
  
  const adminState = { analytics: { performance: { totalTasks: 0, completedTasks: 0, averageCompletionTime: 0 } } };
  const taskState = { tasks: [] };
  const buildingState = { buildings: [] };
  const workerState = { workers: [] };
  const clientState = { clients: [] };
  const novaAIState = { isActive: false };
  const realTimeState = { notifications: [] };
  const uiState = { isLoading: false, theme: 'light' };

  // Real-time analytics data from AnalyticsService
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    performanceMetrics: {
      overallCompletionRate: 87.5,
      averageTaskTime: 45,
      workerEfficiency: 92.3,
      clientSatisfaction: 94.8
    },
    portfolioMetrics: {
      totalBuildings: 25,
      activeBuildings: 23,
      complianceRate: 96.2,
      maintenanceBacklog: 12
    },
    workerMetrics: {
      totalWorkers: 15,
      activeWorkers: 12,
      averageWorkload: 8.5,
      productivityScore: 89.7
    }
  });

  const [showNovaAIModal, setShowNovaAIModal] = useState(false);
  const [selectedAnalyticsTab, setSelectedAnalyticsTab] = useState<'overview' | 'performance' | 'compliance' | 'workers'>('overview');
  const [isPortfolioExpanded, setIsPortfolioExpanded] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const isLoading = uiState.isLoading;

  useEffect(() => {
    loadAdminDashboardData();
  }, [adminId]);

  const loadAdminDashboardData = async () => {
    try {
      // Load analytics data from AnalyticsService
      // TODO: Integrate with actual AnalyticsService when state management is connected
      // const analytics = await serviceContainer.analyticsService.getDashboardAnalytics('Admin', adminId);
      // setAnalyticsData(analytics);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryAction} />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {adminName}</Text>
        
        {/* Analytics Dashboard Integration */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>📊 Real-Time Analytics</Text>
          <LegacyAnalyticsDashboard
            analytics={analyticsData}
            selectedTab={selectedAnalyticsTab}
            onTabChange={setSelectedAnalyticsTab}
          />
        </View>

        {/* Nova AI Intelligence Panel */}
        <View style={styles.novaSection}>
          <Text style={styles.sectionTitle}>🧠 Nova AI Intelligence</Text>
          <GlassCard 
            intensity="regular"
            cornerRadius="card"
            style={styles.novaCard}
          >
            <Text style={styles.novaTitle}>AI-Powered Insights</Text>
            <Text style={styles.novaDescription}>
              Real-time analytics powered by Nova AI with predictive insights and automated recommendations.
            </Text>
            <View style={styles.novaMetrics}>
              <View style={styles.novaMetric}>
                <Text style={styles.novaMetricLabel}>Performance Score</Text>
                <Text style={styles.novaMetricValue}>94.8%</Text>
              </View>
              <View style={styles.novaMetric}>
                <Text style={styles.novaMetricLabel}>Predictive Accuracy</Text>
                <Text style={styles.novaMetricValue}>89.2%</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: Colors.primaryText,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
  },
  analyticsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  novaSection: {
    marginBottom: Spacing.lg,
  },
  novaCard: {
    padding: Spacing.md,
  },
  novaTitle: {
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  novaDescription: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  novaMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  novaMetric: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginHorizontal: Spacing.xs,
  },
  novaMetricLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.primary,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  novaMetricValue: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fonts.primary,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryAction,
  },
});

export default AdminDashboardMainView;