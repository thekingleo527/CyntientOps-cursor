/**
 * @cyntientops/mobile-rn
 * 
 * Admin Workers Tab - Worker management and oversight
 * Features: Worker grid, performance metrics, assignments, management tools
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components/src/glass';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkerProfile } from '@cyntientops/domain-schema';
import RealDataService from '@cyntientops/business-core/src/services/RealDataService';

// Types
export interface AdminWorkersTabProps {
  adminId: string;
  adminName: string;
  userRole: string;
}

export interface WorkerManagementData {
  worker: WorkerProfile;
  isActive: boolean;
  currentBuilding: string | null;
  todaysTasks: number;
  completedTasks: number;
  completionRate: number;
  lastActive: Date;
  performance: {
    thisWeek: number;
    lastWeek: number;
    monthlyAverage: number;
    streak: number;
  };
}

export const AdminWorkersTab: React.FC<AdminWorkersTabProps> = ({
  adminId,
  adminName,
}) => {
  const [workers, setWorkers] = useState<WorkerManagementData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkersData();
  }, []);

  const loadWorkersData = async () => {
    try {
      const dataService = RealDataService;
      const workersFromData = dataService.getWorkers();
      const assignments = dataService.getWorkerBuildingAssignments();

      const workersList: WorkerManagementData[] = workersFromData.map((worker: any) => {
        const workerProfile = worker as WorkerProfile;
        const buildingIds = assignments[workerProfile.id] || [];
        const primaryBuilding = buildingIds.length > 0 ? dataService.getBuildingById(buildingIds[0]) : null;
        const stats = dataService.getTaskStatsForWorker(workerProfile.id);
        const performance = dataService.getPerformanceForWorker(workerProfile.id);

        const lastUpdated = workerProfile.updatedAt || worker.updated_at;
        const lastActiveTimestamp = typeof lastUpdated === 'string'
          ? new Date(lastUpdated)
          : lastUpdated instanceof Date
            ? lastUpdated
            : new Date();

        return {
          worker: workerProfile,
          isActive: workerProfile.isActive ?? workerProfile.status === 'Available',
          currentBuilding: primaryBuilding?.name ?? null,
          todaysTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          completionRate: stats.completionRate,
          lastActive: lastActiveTimestamp,
          performance: performance || {
            thisWeek: 0,
            lastWeek: 0,
            monthlyAverage: 0,
            streak: 0,
          },
        };
      });

      setWorkers(workersList);
    } catch (error) {
      console.error('Failed to load workers data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkersData();
    setRefreshing(false);
  };

  const handleWorkerPress = (worker: WorkerManagementData) => {
    console.log('Worker pressed:', worker.worker.name);
  };

  const renderWorkerCard = (workerData: WorkerManagementData) => {
    const { worker, isActive, currentBuilding, todaysTasks, completedTasks, completionRate, performance } = workerData;

    return (
      <TouchableOpacity
        key={worker.id}
        style={styles.workerCard}
        onPress={() => handleWorkerPress(workerData)}
      >
        <GlassCard
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.medium}
          style={styles.workerCardContent}
        >
          <View style={styles.workerHeader}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>
                {worker.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerRole}>{worker.role}</Text>
              <View style={styles.workerStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? Colors.status.success : Colors.text.tertiary }
                ]} />
                <Text style={styles.statusText}>
                  {isActive ? 'Active' : 'Offline'}
                </Text>
              </View>
            </View>
            <View style={styles.workerMetrics}>
              <Text style={styles.completionRate}>{completionRate}%</Text>
              <Text style={styles.completionLabel}>Completion</Text>
            </View>
          </View>

          <View style={styles.workerDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Location:</Text>
              <Text style={styles.detailValue}>
                {currentBuilding || 'Not assigned'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Today's Tasks:</Text>
              <Text style={styles.detailValue}>
                {completedTasks}/{todaysTasks} completed
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Performance:</Text>
              <Text style={styles.detailValue}>
                {performance.thisWeek}% this week
              </Text>
            </View>
          </View>

          <View style={styles.workerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
              <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>Assign Task</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderSummaryCards = () => {
    const activeWorkers = workers.filter(w => w.isActive).length;
    const totalTasks = workers.reduce((sum, w) => sum + w.todaysTasks, 0);
    const completedTasks = workers.reduce((sum, w) => sum + w.completedTasks, 0);
    const avgCompletion = workers.length > 0 ? Math.round(workers.reduce((sum, w) => sum + w.completionRate, 0) / workers.length) : 0;

    return (
      <View style={styles.summarySection}>
        <View style={styles.summaryGrid}>
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{activeWorkers}</Text>
            <Text style={styles.summaryLabel}>Active Workers</Text>
          </GlassCard>
          
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalTasks}</Text>
            <Text style={styles.summaryLabel}>Total Tasks</Text>
          </GlassCard>
          
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{completedTasks}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </GlassCard>
          
          <GlassCard intensity={GlassIntensity.regular} cornerRadius={CornerRadius.medium} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgCompletion}%</Text>
            <Text style={styles.summaryLabel}>Avg Completion</Text>
          </GlassCard>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Worker Management</Text>
        
        {renderSummaryCards()}
        
        <View style={styles.workersSection}>
          <Text style={styles.sectionTitle}>All Workers</Text>
          {workers.map(renderWorkerCard)}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  workersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  workerCard: {
    marginBottom: 16,
  },
  workerCardContent: {
    padding: 16,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.role.admin.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  workerRole: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  workerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  workerMetrics: {
    alignItems: 'center',
  },
  completionRate: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  completionLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
  workerDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  workerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.glass.regular,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  primaryActionButton: {
    backgroundColor: Colors.role.admin.primary,
  },
  primaryActionButtonText: {
    color: Colors.text.inverse,
  },
});

export default AdminWorkersTab;
