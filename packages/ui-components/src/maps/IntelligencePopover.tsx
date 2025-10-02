/**
 * 🧠 Intelligence Popover
 * Mirrors: CyntientOps/Views/Maps/IntelligencePopover.swift
 * Purpose: Interactive popover with building intelligence and analytics
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Building, WorkerProfile, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

interface IntelligencePopoverProps {
  data: {
    building: Building;
    tasks: OperationalDataTaskAssignment[];
    workers: WorkerProfile[];
    intelligence: any;
    metrics: {
      totalTasks: number;
      completedTasks: number;
      activeWorkers: number;
      complianceRate: number;
    };
  };
  onClose: () => void;
  onViewDetails: () => void;
}

const { width, height } = Dimensions.get('window');

export const IntelligencePopover: React.FC<IntelligencePopoverProps> = ({
  data,
  onClose,
  onViewDetails
}) => {
  const { building, tasks, workers, intelligence, metrics } = data;

  const getComplianceStatus = (rate: number): { status: string; color: string } => {
    if (rate >= 95) return { status: 'Excellent', color: '#10b981' };
    if (rate >= 85) return { status: 'Good', color: '#84cc16' };
    if (rate >= 70) return { status: 'Fair', color: '#f59e0b' };
    return { status: 'Poor', color: '#ef4444' };
  };

  const complianceStatus = getComplianceStatus(metrics.complianceRate);

  const getTaskStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed': return '#10b981';
      case 'In Progress': return '#3b82f6';
      case 'Pending': return '#f59e0b';
      case 'Overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getWorkerStatusColor = (status: string): string => {
    switch (status) {
      case 'clockedIn': return '#10b981';
      case 'Available': return '#3b82f6';
      case 'clockedOut': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.popover}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.buildingName}>{building.name}</Text>
              <Text style={styles.buildingAddress}>{building.address}</Text>
              <View style={styles.complianceBadge}>
                <Text style={[styles.complianceText, { color: complianceStatus.color }]}>
                  {complianceStatus.status} ({metrics.complianceRate.toFixed(1)}%)
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.totalTasks}</Text>
              <Text style={styles.metricLabel}>Total Tasks</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.completedTasks}</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.activeWorkers}</Text>
              <Text style={styles.metricLabel}>Active Workers</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: complianceStatus.color }]}>
                {metrics.complianceRate.toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>Compliance</Text>
            </View>
          </View>

          {/* Intelligence Insights */}
          {intelligence && (
            <View style={styles.intelligenceSection}>
              <Text style={styles.sectionTitle}>🧠 Intelligence Insights</Text>
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>
                  {intelligence.summary || 'No specific insights available for this building.'}
                </Text>
              </View>
              {intelligence.recommendations && intelligence.recommendations.length > 0 && (
                <View style={styles.recommendationsCard}>
                  <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                  {intelligence.recommendations.map((rec: string, index: number) => (
                    <Text key={index} style={styles.recommendationText}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Active Tasks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Active Tasks</Text>
            {tasks.filter(t => t.status !== 'Completed').slice(0, 5).map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getTaskStatusColor(task.status) }]}>
                    <Text style={styles.statusText}>{task.status}</Text>
                  </View>
                </View>
                <Text style={styles.taskCategory}>{task.category}</Text>
                {task.assigned_worker_id && (
                  <Text style={styles.taskWorker}>
                    Assigned to: {workers.find(w => w.id === task.assigned_worker_id)?.name || 'Unknown'}
                  </Text>
                )}
              </View>
            ))}
            {tasks.filter(t => t.status !== 'Completed').length === 0 && (
              <Text style={styles.noTasksText}>No active tasks</Text>
            )}
          </View>

          {/* Active Workers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👷 Active Workers</Text>
            {workers.filter(w => w.status === 'clockedIn' || w.status === 'Available').map((worker) => (
              <View key={worker.id} style={styles.workerItem}>
                <View style={styles.workerHeader}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <View style={[styles.workerStatusBadge, { backgroundColor: getWorkerStatusColor(worker.status) }]}>
                    <Text style={styles.workerStatusText}>{worker.status}</Text>
                  </View>
                </View>
                <Text style={styles.workerRole}>{worker.role}</Text>
                <Text style={styles.workerTasks}>
                  Tasks: {tasks.filter(t => t.assigned_worker_id === worker.id).length}
                </Text>
              </View>
            ))}
            {workers.filter(w => w.status === 'clockedIn' || w.status === 'Available').length === 0 && (
              <Text style={styles.noWorkersText}>No active workers</Text>
            )}
          </View>

          {/* Building Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏢 Building Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{building.building_type || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Management:</Text>
                <Text style={styles.detailValue}>{building.management_company || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Coordinates:</Text>
                <Text style={styles.detailValue}>
                  {building.latitude?.toFixed(6)}, {building.longitude?.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onViewDetails}>
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popover: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  buildingName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buildingAddress: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
  },
  complianceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
  intelligenceSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  insightText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginTop: 8,
  },
  recommendationsTitle: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  taskCategory: {
    color: '#10b981',
    fontSize: 12,
    marginBottom: 4,
  },
  taskWorker: {
    color: '#9ca3af',
    fontSize: 12,
  },
  noTasksText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  workerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  workerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  workerStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  workerRole: {
    color: '#3b82f6',
    fontSize: 12,
    marginBottom: 4,
  },
  workerTasks: {
    color: '#9ca3af',
    fontSize: 12,
  },
  noWorkersText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IntelligencePopover;
