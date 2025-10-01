/**
 * @cyntientops/ui-components
 * 
 * Admin Workers Overlay Content - Worker management and monitoring
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../glass';
import { LinearGradient } from 'expo-linear-gradient';

export interface AdminWorkersOverlayContentProps {
  adminId: string;
  adminName: string;
  onWorkerPress?: (workerId: string) => void;
  onRefresh?: () => Promise<void>;
}

export const AdminWorkersOverlayContent: React.FC<AdminWorkersOverlayContentProps> = ({
  adminId,
  adminName,
  onWorkerPress,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  // Mock worker data - in real app, this would come from props or state
  const workers = [
    { id: '1', name: 'Kevin Dutan', role: 'Maintenance Specialist', status: 'active', completionRate: 94, currentBuilding: '131 Perry Street', tasksToday: 8 },
    { id: '2', name: 'Greg Hutson', role: 'Cleaning Specialist', status: 'active', completionRate: 89, currentBuilding: '145 15th Street', tasksToday: 6 },
    { id: '3', name: 'Moises Farhat', role: 'Building Manager', status: 'active', completionRate: 96, currentBuilding: 'Rubin Museum', tasksToday: 4 },
    { id: '4', name: 'John Smith', role: 'Maintenance Worker', status: 'break', completionRate: 87, currentBuilding: '135 West 17th Street', tasksToday: 5 },
    { id: '5', name: 'Sarah Johnson', role: 'Cleaning Worker', status: 'active', completionRate: 92, currentBuilding: '131 Perry Street', tasksToday: 7 },
    { id: '6', name: 'Mike Wilson', role: 'Maintenance Worker', status: 'offline', completionRate: 85, currentBuilding: null, tasksToday: 0 },
  ];

  const renderWorkerStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👥 Worker Statistics</Text>
      <View style={styles.statsGrid}>
        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.success, Colors.status.info]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{workers.filter(w => w.status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active Now</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.admin.primary, Colors.role.admin.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{Math.round(workers.reduce((sum, w) => sum + w.completionRate, 0) / workers.length)}%</Text>
            <Text style={styles.statLabel}>Avg Completion</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.status.warning, Colors.status.error]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>{workers.reduce((sum, w) => sum + w.tasksToday, 0)}</Text>
            <Text style={styles.statLabel}>Tasks Today</Text>
          </LinearGradient>
        </GlassCard>

        <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.statCard}>
          <LinearGradient
            colors={[Colors.role.client.primary, Colors.role.client.secondary]}
            style={styles.statGradient}
          >
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Quality Score</Text>
          </LinearGradient>
        </GlassCard>
      </View>
    </View>
  );

  const renderWorkerList = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👷 Worker Management</Text>
      {workers.map((worker) => (
        <TouchableOpacity
          key={worker.id}
          style={styles.workerCard}
          onPress={() => onWorkerPress?.(worker.id)}
        >
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.workerCardContent}>
            <View style={styles.workerHeader}>
              <View style={styles.workerInfo}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>
                    {worker.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.workerDetails}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerRole}>{worker.role}</Text>
                  <Text style={styles.workerLocation}>
                    📍 {worker.currentBuilding || 'Not assigned'}
                  </Text>
                </View>
              </View>
              <View style={styles.workerStatus}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: worker.status === 'active' ? Colors.status.success : 
                                    worker.status === 'break' ? Colors.status.warning : Colors.status.error }
                ]} />
                <Text style={styles.statusText}>
                  {worker.status === 'active' ? 'Active' : 
                   worker.status === 'break' ? 'On Break' : 'Offline'}
                </Text>
              </View>
            </View>
            
            <View style={styles.workerMetrics}>
              <View style={styles.workerMetric}>
                <Text style={styles.workerMetricLabel}>Completion Rate</Text>
                <Text style={styles.workerMetricValue}>{worker.completionRate}%</Text>
              </View>
              <View style={styles.workerMetric}>
                <Text style={styles.workerMetricLabel}>Tasks Today</Text>
                <Text style={styles.workerMetricValue}>{worker.tasksToday}</Text>
              </View>
              <View style={styles.workerMetric}>
                <Text style={styles.workerMetricLabel}>Quality Score</Text>
                <Text style={styles.workerMetricValue}>4.{worker.completionRate % 10}</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTopPerformers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
      <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.performersCard}>
        {workers
          .sort((a, b) => b.completionRate - a.completionRate)
          .slice(0, 3)
          .map((worker, index) => (
            <View key={worker.id} style={styles.performerItem}>
              <View style={styles.performerRank}>
                <Text style={styles.performerRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{worker.name}</Text>
                <Text style={styles.performerRole}>{worker.role}</Text>
              </View>
              <View style={styles.performerScore}>
                <Text style={styles.performerScoreValue}>{worker.completionRate}%</Text>
                <Text style={styles.performerScoreLabel}>Completion</Text>
              </View>
            </View>
          ))}
      </GlassCard>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Add Worker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Performance Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>Schedule Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.role.admin.primary}
        />
      }
    >
      {renderWorkerStats()}
      {renderWorkerList()}
      {renderTopPerformers()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '48%',
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLarge,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 24,
  },
  statLabel: {
    ...Typography.body,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  workerCard: {
    marginBottom: Spacing.md,
  },
  workerCardContent: {
    padding: Spacing.lg,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.role.admin.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  workerAvatarText: {
    ...Typography.subheadline,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  workerRole: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  workerLocation: {
    ...Typography.caption,
    color: Colors.text.tertiary,
  },
  workerStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  workerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  workerMetric: {
    alignItems: 'center',
  },
  workerMetricLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  workerMetricValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  performersCard: {
    padding: Spacing.lg,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  performerRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.role.admin.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  performerRankText: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  performerRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  performerScore: {
    alignItems: 'center',
  },
  performerScoreValue: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  performerScoreLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '48%',
    padding: Spacing.lg,
    backgroundColor: Colors.glass.regular,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AdminWorkersOverlayContent;
