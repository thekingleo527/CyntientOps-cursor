/**
 * @cyntientops/ui-components
 * 
 * Worker Assignments Component
 * Mirrors Swift WorkerAssignments.swift
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '../../../../glass';
import { WorkerProfile } from '@cyntientops/domain-schema';
import { ServiceContainer } from '@cyntientops/business-core';

export interface WorkerAssignment {
  workerId: string;
  buildingId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

export interface WorkerAssignmentsProps {
  clientId: string;
  onWorkerPress?: (workerId: string) => void;
}

export const WorkerAssignments: React.FC<WorkerAssignmentsProps> = ({
  clientId,
  onWorkerPress,
}) => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const services = ServiceContainer.getInstance();

  useEffect(() => {
    loadWorkerAssignments();
  }, [clientId]);

  const loadWorkerAssignments = () => {
    try {
      // Get all workers assigned to buildings for this client
      const allWorkers = services.operationalData.getWorkers();
      const clientBuildings = services.building.getBuildingsByClient(clientId);
      
      // Filter workers who are assigned to client buildings
      const assignedWorkers = allWorkers.filter(worker => {
        const workerTasks = services.operationalData.getTasksForWorker(worker.id);
        return workerTasks.some(task => 
          clientBuildings.some(building => building.id === task.buildingId)
        );
      });
      
      setWorkers(assignedWorkers);
    } catch (error) {
      console.error('Error loading worker assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerStatus = (workerId: string) => {
    const clockInData = services.worker.getClockInData(workerId);
    return clockInData ? 'Clocked In' : 'Available';
  };

  const getWorkerStatusColor = (workerId: string) => {
    const clockInData = services.worker.getClockInData(workerId);
    return clockInData ? Colors.status.success : Colors.text.tertiary;
  };

  const getWorkerTaskCount = (workerId: string) => {
    const tasks = services.operationalData.getTodaysTasksForWorker(workerId);
    return tasks.length;
  };

  const getWorkerPerformance = (workerId: string) => {
    const metrics = services.worker.getWorkerPerformanceMetrics(workerId);
    return Math.round(metrics.completionRate * 100);
  };

  if (loading) {
    return (
      <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.loadingText}>Loading worker assignments...</Text>
      </GlassCard>
    );
  }

  if (workers.length === 0) {
    return (
      <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
        <Text style={styles.sectionTitle}>Worker Assignments</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Workers Assigned</Text>
          <Text style={styles.emptySubtitle}>
            No workers are currently assigned to this client's buildings.
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container} intensity={GlassIntensity.REGULAR} cornerRadius={CornerRadius.CARD}>
      <Text style={styles.sectionTitle}>Worker Assignments</Text>
      
      {workers.map((worker) => (
        <TouchableOpacity
          key={worker.id}
          style={styles.workerItem}
          onPress={() => onWorkerPress?.(worker.id)}
        >
          <View style={styles.workerHeader}>
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerRole}>{worker.role}</Text>
            </View>
            
            <View style={styles.workerStatus}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getWorkerStatusColor(worker.id) }
              ]}>
                <Text style={styles.statusText}>
                  {getWorkerStatus(worker.id)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.workerMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {getWorkerTaskCount(worker.id)}
              </Text>
              <Text style={styles.metricLabel}>Today's Tasks</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {getWorkerPerformance(worker.id)}%
              </Text>
              <Text style={styles.metricLabel}>Performance</Text>
            </View>
            
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                ${worker.hourlyRate}
              </Text>
              <Text style={styles.metricLabel}>Hourly Rate</Text>
            </View>
          </View>
          
          {worker.skills && (
            <View style={styles.skillsContainer}>
              <Text style={styles.skillsLabel}>Skills:</Text>
              <Text style={styles.skillsText} numberOfLines={2}>
                {worker.skills}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Assignment Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Assignment Summary</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{workers.length}</Text>
            <Text style={styles.summaryLabel}>Total Workers</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[
              styles.summaryValue,
              { color: Colors.status.success }
            ]}>
              {workers.filter(w => services.worker.getClockInData(w.id)).length}
            </Text>
            <Text style={styles.summaryLabel}>Clocked In</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {workers.reduce((total, worker) => total + getWorkerTaskCount(worker.id), 0)}
            </Text>
            <Text style={styles.summaryLabel}>Total Tasks</Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  workerItem: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  workerRole: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  workerStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...Typography.labelSmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  workerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...Typography.titleSmall,
    color: Colors.role.worker.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  skillsContainer: {
    marginTop: Spacing.sm,
  },
  skillsLabel: {
    ...Typography.labelMedium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  skillsText: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    lineHeight: 18,
  },
  summaryContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  summaryTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...Typography.titleLarge,
    color: Colors.role.client.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.labelSmall,
    color: Colors.text.tertiary,
  },
});
