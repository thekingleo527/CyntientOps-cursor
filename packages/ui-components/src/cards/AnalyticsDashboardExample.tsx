/**
 * 📊 Analytics Dashboard Example
 * Purpose: Example implementation of analytics cards in admin dashboard
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  RouteEfficiencyCard, 
  TimeAllocationCard, 
  GeographicCoverageCard, 
  WorkloadBalanceCard,
  StatCard 
} from '@cyntientops/ui-components';

// Example data based on our analytics
const analyticsData = {
  kevin: {
    name: 'Kevin Dutan',
    routeEfficiency: 0.85,
    averageTravelTime: 12,
    buildingsPerRoute: 7,
    timeSaved: 15,
    routeScore: 'good' as const,
    dailyHours: 10,
    taskDistribution: {
      cleaning: 35,
      maintenance: 4,
      sanitation: 6,
      inspection: 1
    },
    efficiencyScore: 0.98,
    overtimeHours: 0,
    buildingsCovered: 7,
    geographicClustering: 0.85,
    averageDistanceBetweenBuildings: 0.8,
    routeOptimization: 15,
    primaryArea: 'West Side'
  },
  shawn: {
    name: 'Shawn Magloire',
    routeEfficiency: 0.90,
    averageTravelTime: 8,
    buildingsPerRoute: 5,
    timeSaved: 30,
    routeScore: 'excellent' as const,
    dailyHours: 3.15,
    taskDistribution: {
      cleaning: 4,
      maintenance: 4,
      sanitation: 8,
      inspection: 4
    },
    efficiencyScore: 0.94,
    overtimeHours: 0,
    buildingsCovered: 8,
    geographicClustering: 0.90,
    averageDistanceBetweenBuildings: 0.6,
    routeOptimization: 25,
    primaryArea: 'Financial District'
  },
  edwin: {
    name: 'Edwin Lema',
    routeEfficiency: 0.75,
    averageTravelTime: 18,
    buildingsPerRoute: 8,
    timeSaved: 5,
    routeScore: 'needs_improvement' as const,
    dailyHours: 7,
    taskDistribution: {
      cleaning: 6,
      maintenance: 12,
      sanitation: 2,
      inspection: 3
    },
    efficiencyScore: 0.95,
    overtimeHours: 0,
    buildingsCovered: 8,
    geographicClustering: 0.75,
    averageDistanceBetweenBuildings: 1.2,
    routeOptimization: 8,
    primaryArea: 'Cross-Portfolio'
  }
};

const workloadData = {
  workers: [
    {
      name: 'Kevin Dutan',
      taskCount: 47,
      dailyHours: 10,
      efficiency: 0.98,
      buildingsCovered: 7,
      role: 'generalist' as const
    },
    {
      name: 'Shawn Magloire',
      taskCount: 20,
      dailyHours: 3.15,
      efficiency: 0.94,
      buildingsCovered: 8,
      role: 'admin' as const
    },
    {
      name: 'Edwin Lema',
      taskCount: 23,
      dailyHours: 7,
      efficiency: 0.95,
      buildingsCovered: 8,
      role: 'floating' as const
    }
  ],
  totalTasks: 90,
  averageEfficiency: 0.96,
  balanceScore: 0.82
};

export const AnalyticsDashboardExample: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Analytics Dashboard</Text>
      <Text style={styles.subtitle}>Real-time performance metrics and optimization insights</Text>

      {/* Route Efficiency Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Efficiency</Text>
        <RouteEfficiencyCard
          workerName={analyticsData.kevin.name}
          routeEfficiency={analyticsData.kevin.routeEfficiency}
          averageTravelTime={analyticsData.kevin.averageTravelTime}
          buildingsPerRoute={analyticsData.kevin.buildingsPerRoute}
          timeSaved={analyticsData.kevin.timeSaved}
          routeScore={analyticsData.kevin.routeScore}
        />
        <RouteEfficiencyCard
          workerName={analyticsData.shawn.name}
          routeEfficiency={analyticsData.shawn.routeEfficiency}
          averageTravelTime={analyticsData.shawn.averageTravelTime}
          buildingsPerRoute={analyticsData.shawn.buildingsPerRoute}
          timeSaved={analyticsData.shawn.timeSaved}
          routeScore={analyticsData.shawn.routeScore}
        />
        <RouteEfficiencyCard
          workerName={analyticsData.edwin.name}
          routeEfficiency={analyticsData.edwin.routeEfficiency}
          averageTravelTime={analyticsData.edwin.averageTravelTime}
          buildingsPerRoute={analyticsData.edwin.buildingsPerRoute}
          timeSaved={analyticsData.edwin.timeSaved}
          routeScore={analyticsData.edwin.routeScore}
        />
      </View>

      {/* Time Allocation Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Allocation</Text>
        <TimeAllocationCard
          workerName={analyticsData.kevin.name}
          dailyHours={analyticsData.kevin.dailyHours}
          taskDistribution={analyticsData.kevin.taskDistribution}
          efficiencyScore={analyticsData.kevin.efficiencyScore}
          overtimeHours={analyticsData.kevin.overtimeHours}
        />
        <TimeAllocationCard
          workerName={analyticsData.shawn.name}
          dailyHours={analyticsData.shawn.dailyHours}
          taskDistribution={analyticsData.shawn.taskDistribution}
          efficiencyScore={analyticsData.shawn.efficiencyScore}
          overtimeHours={analyticsData.shawn.overtimeHours}
        />
        <TimeAllocationCard
          workerName={analyticsData.edwin.name}
          dailyHours={analyticsData.edwin.dailyHours}
          taskDistribution={analyticsData.edwin.taskDistribution}
          efficiencyScore={analyticsData.edwin.efficiencyScore}
          overtimeHours={analyticsData.edwin.overtimeHours}
        />
      </View>

      {/* Geographic Coverage Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Geographic Coverage</Text>
        <GeographicCoverageCard
          workerName={analyticsData.kevin.name}
          buildingsCovered={analyticsData.kevin.buildingsCovered}
          geographicClustering={analyticsData.kevin.geographicClustering}
          averageDistanceBetweenBuildings={analyticsData.kevin.averageDistanceBetweenBuildings}
          routeOptimization={analyticsData.kevin.routeOptimization}
          primaryArea={analyticsData.kevin.primaryArea}
        />
        <GeographicCoverageCard
          workerName={analyticsData.shawn.name}
          buildingsCovered={analyticsData.shawn.buildingsCovered}
          geographicClustering={analyticsData.shawn.geographicClustering}
          averageDistanceBetweenBuildings={analyticsData.shawn.averageDistanceBetweenBuildings}
          routeOptimization={analyticsData.shawn.routeOptimization}
          primaryArea={analyticsData.shawn.primaryArea}
        />
        <GeographicCoverageCard
          workerName={analyticsData.edwin.name}
          buildingsCovered={analyticsData.edwin.buildingsCovered}
          geographicClustering={analyticsData.edwin.geographicClustering}
          averageDistanceBetweenBuildings={analyticsData.edwin.averageDistanceBetweenBuildings}
          routeOptimization={analyticsData.edwin.routeOptimization}
          primaryArea={analyticsData.edwin.primaryArea}
        />
      </View>

      {/* Workload Balance Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workload Balance</Text>
        <WorkloadBalanceCard
          workers={workloadData.workers}
          totalTasks={workloadData.totalTasks}
          averageEfficiency={workloadData.averageEfficiency}
          balanceScore={workloadData.balanceScore}
        />
      </View>

      {/* Enhanced Stat Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <View style={styles.statRow}>
          <StatCard
            title="Total Efficiency"
            value="96%"
            subtitle="Portfolio Average"
            icon="📊"
            trend={{ direction: 'up', value: '+3%', period: 'this month' }}
            color="success"
            size="medium"
            analytics={{
              routeEfficiency: 0.83,
              geographicClustering: 0.83,
              buildingCoverage: 23
            }}
          />
          <StatCard
            title="Time Saved"
            value="50m"
            subtitle="Daily Optimization"
            icon="⏰"
            trend={{ direction: 'up', value: '+15m', period: 'vs last month' }}
            color="info"
            size="medium"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default AnalyticsDashboardExample;

