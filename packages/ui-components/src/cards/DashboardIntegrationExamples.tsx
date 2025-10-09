/**
 * 🎯 Dashboard Integration Examples
 * Purpose: Show how to integrate analytics cards into existing dashboards
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  AnalyticsCardCurator,
  MobileOptimizedCard,
  RouteEfficiencyCard,
  TimeAllocationCard,
  WorkloadBalanceCard,
  StatCard
} from '@cyntientops/ui-components';

// Admin Dashboard Integration
export const AdminDashboardWithAnalytics: React.FC = () => (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    {/* Existing Hero Cards Section */}
    <View style={styles.heroSection}>
      <Text style={styles.heroTitle}>Admin Dashboard</Text>
      {/* Existing hero cards would go here */}
    </View>

    {/* NEW: Analytics Integration */}
    <AnalyticsCardCurator 
      userType="admin" 
      showAdvanced={true}
      compactMode={false}
    />

    {/* Existing Intelligence Panel Tabs */}
    <View style={styles.intelligenceSection}>
      <Text style={styles.sectionTitle}>Intelligence Panel</Text>
      {/* Existing intelligence tabs would go here */}
    </View>
  </ScrollView>
);

// Client Dashboard Integration
export const ClientDashboardWithAnalytics: React.FC = () => (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    {/* Existing Hero Cards Section */}
    <View style={styles.heroSection}>
      <Text style={styles.heroTitle}>Client Dashboard</Text>
      {/* Existing portfolio overview cards would go here */}
    </View>

    {/* NEW: Client-Focused Analytics */}
    <AnalyticsCardCurator 
      userType="client" 
      showAdvanced={false}
      compactMode={true}
    />

    {/* Existing Building Portfolio Card */}
    <View style={styles.portfolioSection}>
      <Text style={styles.sectionTitle}>Building Portfolio</Text>
      {/* Existing building cards would go here */}
    </View>
  </ScrollView>
);

// Worker Dashboard Integration
export const WorkerDashboardWithAnalytics: React.FC<{ workerName: string }> = ({ workerName }) => (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    {/* Existing Worker Info Cards */}
    <View style={styles.heroSection}>
      <Text style={styles.heroTitle}>Worker Dashboard</Text>
      {/* Existing worker info and today's stats would go here */}
    </View>

    {/* NEW: Personal Performance Analytics */}
    <AnalyticsCardCurator 
      userType="worker" 
      workerName={workerName}
      showAdvanced={false}
      compactMode={true}
    />

    {/* Existing Weather Dashboard */}
    <View style={styles.weatherSection}>
      <Text style={styles.sectionTitle}>Weather & Recommendations</Text>
      {/* Existing weather dashboard would go here */}
    </View>
  </ScrollView>
);

// Mobile-Optimized Analytics View
export const MobileAnalyticsView: React.FC<{ userType: 'admin' | 'client' | 'worker' }> = ({ userType }) => (
  <ScrollView style={styles.mobileContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.mobileHeader}>
      <Text style={styles.mobileTitle}>Analytics</Text>
      <Text style={styles.mobileSubtitle}>Performance insights</Text>
    </View>

    {/* Mobile-Optimized Cards */}
    <MobileOptimizedCard 
      title="Route Efficiency" 
      priority="high"
      compact={true}
    >
      <RouteEfficiencyCard
        workerName="Shawn Magloire"
        routeEfficiency={0.90}
        averageTravelTime={8}
        buildingsPerRoute={5}
        timeSaved={30}
        routeScore="excellent"
      />
    </MobileOptimizedCard>

    <MobileOptimizedCard 
      title="Time Allocation" 
      priority="medium"
      compact={true}
    >
      <TimeAllocationCard
        workerName="Kevin Dutan"
        dailyHours={10}
        taskDistribution={{
          cleaning: 35,
          maintenance: 4,
          sanitation: 6,
          inspection: 1
        }}
        efficiencyScore={0.98}
        overtimeHours={0}
      />
    </MobileOptimizedCard>

    {userType === 'admin' && (
      <MobileOptimizedCard 
        title="Team Workload" 
        priority="high"
        compact={true}
        fullWidth={true}
      >
        <WorkloadBalanceCard
          workers={[
            { name: 'Kevin Dutan', taskCount: 47, dailyHours: 10, efficiency: 0.98, buildingsCovered: 7, role: 'generalist' },
            { name: 'Shawn Magloire', taskCount: 20, dailyHours: 3.15, efficiency: 0.94, buildingsCovered: 8, role: 'admin' },
            { name: 'Edwin Lema', taskCount: 23, dailyHours: 7, efficiency: 0.95, buildingsCovered: 8, role: 'floating' }
          ]}
          totalTasks={90}
          averageEfficiency={0.96}
          balanceScore={0.82}
        />
      </MobileOptimizedCard>
    )}
  </ScrollView>
);

// Tab-Based Analytics Integration
export const TabBasedAnalytics: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Performance Overview</Text>
            <View style={styles.statGrid}>
              <StatCard
                title="Efficiency"
                value="94%"
                subtitle="Portfolio average"
                icon="📊"
                color="success"
                size="small"
              />
              <StatCard
                title="Time Saved"
                value="50m"
                subtitle="Daily optimization"
                icon="⏰"
                color="info"
                size="small"
              />
            </View>
          </View>
        );
      
      case 'workers':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Worker Analytics</Text>
            <WorkloadBalanceCard
              workers={[
                { name: 'Kevin Dutan', taskCount: 47, dailyHours: 10, efficiency: 0.98, buildingsCovered: 7, role: 'generalist' },
                { name: 'Shawn Magloire', taskCount: 20, dailyHours: 3.15, efficiency: 0.94, buildingsCovered: 8, role: 'admin' },
                { name: 'Edwin Lema', taskCount: 23, dailyHours: 7, efficiency: 0.95, buildingsCovered: 8, role: 'floating' }
              ]}
              totalTasks={90}
              averageEfficiency={0.96}
              balanceScore={0.82}
            />
          </View>
        );
      
      case 'routes':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Route Optimization</Text>
            <RouteEfficiencyCard
              workerName="Shawn Magloire"
              routeEfficiency={0.90}
              averageTravelTime={8}
              buildingsPerRoute={5}
              timeSaved={30}
              routeScore="excellent"
            />
          </View>
        );
      
      default:
        return <View style={styles.tabContent}><Text>Select a tab</Text></View>;
    }
  };

  return renderTabContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.sm,
  },
  heroSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.glass.thin,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mobileHeader: {
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mobileTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  mobileSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  intelligenceSection: {
    padding: Spacing.md,
  },
  portfolioSection: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  tabContent: {
    padding: Spacing.md,
  },
  tabTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
});

export default {
  AdminDashboardWithAnalytics,
  ClientDashboardWithAnalytics,
  WorkerDashboardWithAnalytics,
  MobileAnalyticsView,
  TabBasedAnalytics,
};

