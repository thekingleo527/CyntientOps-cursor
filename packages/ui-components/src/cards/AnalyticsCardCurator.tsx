/**
 * 🎯 Analytics Card Curator
 * Purpose: Intelligently curate analytics cards for different user types and mobile optimization
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { 
  RouteEfficiencyCard, 
  TimeAllocationCard, 
  GeographicCoverageCard, 
  WorkloadBalanceCard,
  StatCard 
} from '@cyntientops/ui-components';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

export interface AnalyticsCardCuratorProps {
  userType: 'admin' | 'client' | 'worker';
  workerName?: string;
  showAdvanced?: boolean;
  compactMode?: boolean;
}

export const AnalyticsCardCurator: React.FC<AnalyticsCardCuratorProps> = ({
  userType,
  workerName,
  showAdvanced = false,
  compactMode = isMobile,
}) => {
  
  // Admin Dashboard - Full Analytics Suite
  const renderAdminDashboard = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* System Overview - Enhanced StatCards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Performance</Text>
        <View style={compactMode ? styles.compactGrid : styles.grid}>
          <StatCard
            title="Portfolio Efficiency"
            value="94%"
            subtitle="Average across all workers"
            icon="📊"
            trend={{ direction: 'up', value: '+3%', period: 'this month' }}
            color="success"
            size={compactMode ? 'small' : 'medium'}
            analytics={{
              routeEfficiency: 0.83,
              geographicClustering: 0.85,
              buildingCoverage: 23
            }}
          />
          <StatCard
            title="Time Optimization"
            value="50m"
            subtitle="Daily time saved"
            icon="⏰"
            trend={{ direction: 'up', value: '+15m', period: 'vs last month' }}
            color="info"
            size={compactMode ? 'small' : 'medium'}
          />
        </View>
      </View>

      {/* Workload Balance - Admin Priority */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Workload</Text>
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

      {/* Route Efficiency - Top Performers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Optimization</Text>
        <RouteEfficiencyCard
          workerName="Shawn Magloire"
          routeEfficiency={0.90}
          averageTravelTime={8}
          buildingsPerRoute={5}
          timeSaved={30}
          routeScore="excellent"
        />
        <RouteEfficiencyCard
          workerName="Kevin Dutan"
          routeEfficiency={0.85}
          averageTravelTime={12}
          buildingsPerRoute={7}
          timeSaved={15}
          routeScore="good"
        />
      </View>

      {/* Advanced Analytics - Collapsible */}
      {showAdvanced && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Analytics</Text>
          <GeographicCoverageCard
            workerName="Edwin Lema"
            buildingsCovered={8}
            geographicClustering={0.75}
            averageDistanceBetweenBuildings={1.2}
            routeOptimization={8}
            primaryArea="Cross-Portfolio"
          />
        </View>
      )}
    </ScrollView>
  );

  // Client Dashboard - Building-Focused Analytics
  const renderClientDashboard = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Building Service Quality */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Quality</Text>
        <View style={compactMode ? styles.compactGrid : styles.grid}>
          <StatCard
            title="Service Score"
            value="4.8/5"
            subtitle="Average building rating"
            icon="⭐"
            trend={{ direction: 'up', value: '+0.2', period: 'this month' }}
            color="success"
            size={compactMode ? 'small' : 'medium'}
          />
          <StatCard
            title="Response Time"
            value="2.3h"
            subtitle="Average service response"
            icon="⚡"
            trend={{ direction: 'down', value: '-0.5h', period: 'vs last month' }}
            color="info"
            size={compactMode ? 'small' : 'medium'}
          />
        </View>
      </View>

      {/* Building Coverage - Client Priority */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Building Coverage</Text>
        <GeographicCoverageCard
          workerName="Portfolio Coverage"
          buildingsCovered={12}
          geographicClustering={0.88}
          averageDistanceBetweenBuildings={0.6}
          routeOptimization={22}
          primaryArea="JMR Portfolio"
        />
      </View>

      {/* Worker Performance - Client View */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Team</Text>
        <View style={compactMode ? styles.compactGrid : styles.grid}>
          <StatCard
            title="Primary Workers"
            value="3"
            subtitle="Active team members"
            icon="👥"
            color="primary"
            size={compactMode ? 'small' : 'medium'}
          />
          <StatCard
            title="Specialist Access"
            value="24/7"
            subtitle="Emergency response"
            icon="🚨"
            color="warning"
            size={compactMode ? 'small' : 'medium'}
          />
        </View>
      </View>
    </ScrollView>
  );

  // Worker Dashboard - Personal Performance
  const renderWorkerDashboard = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Personal Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Performance</Text>
        <View style={compactMode ? styles.compactGrid : styles.grid}>
          <StatCard
            title="Efficiency"
            value="94%"
            subtitle="This week"
            icon="📈"
            trend={{ direction: 'up', value: '+2%', period: 'vs last week' }}
            color="success"
            size={compactMode ? 'small' : 'medium'}
          />
          <StatCard
            title="Tasks Today"
            value="8/12"
            subtitle="Completed"
            icon="✅"
            color="info"
            size={compactMode ? 'small' : 'medium'}
          />
        </View>
      </View>

      {/* Personal Route Efficiency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Route</Text>
        <RouteEfficiencyCard
          workerName={workerName || "Your Route"}
          routeEfficiency={0.88}
          averageTravelTime={10}
          buildingsPerRoute={4}
          timeSaved={20}
          routeScore="good"
        />
      </View>

      {/* Personal Time Allocation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Breakdown</Text>
        <TimeAllocationCard
          workerName={workerName || "Your Schedule"}
          dailyHours={8}
          taskDistribution={{
            cleaning: 4,
            maintenance: 2,
            sanitation: 1,
            inspection: 1
          }}
          efficiencyScore={0.94}
          overtimeHours={0}
        />
      </View>
    </ScrollView>
  );

  // Render based on user type
  switch (userType) {
    case 'admin':
      return renderAdminDashboard();
    case 'client':
      return renderClientDashboard();
    case 'worker':
      return renderWorkerDashboard();
    default:
      return renderAdminDashboard();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  compactGrid: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
});

export default AnalyticsCardCurator;

