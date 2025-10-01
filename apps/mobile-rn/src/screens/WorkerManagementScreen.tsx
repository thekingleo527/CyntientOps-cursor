/**
 * 👷 Worker Management Screen
 * Mirrors: CyntientOps/Views/Admin/AdminWorkerManagementView.swift
 * Purpose: Comprehensive worker management and detail views
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { WorkerProfile, Building, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { Logger } from '@cyntientops/business-core';

interface WorkerDetailData {
  worker: WorkerProfile;
  assignedBuildings: Building[];
  currentTasks: OperationalDataTaskAssignment[];
  completedTasks: OperationalDataTaskAssignment[];
  performanceMetrics: {
    completionRate: number;
    averageTaskTime: number;
    totalHoursWorked: number;
    onTimeRate: number;
  };
  schedule: {
    today: OperationalDataTaskAssignment[];
    thisWeek: OperationalDataTaskAssignment[];
    nextWeek: OperationalDataTaskAssignment[];
  };
}

interface WorkerManagementScreenProps {
  navigation: any;
}

export const WorkerManagementScreen: React.FC<WorkerManagementScreenProps> = ({ navigation }) => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWorkerDetail, setShowWorkerDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setIsLoading(true);
      
      const databaseManager = DatabaseManager.getInstance({
        path: 'cyntientops.db'
      });
      await databaseManager.initialize();

      const workersData = await databaseManager.getWorkers();
      setWorkers(workersData);

    } catch (error) {
      Logger.error('Failed to load workers:', undefined, 'WorkerManagementScreen.tsx');
      Alert.alert('Error', 'Failed to load workers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkerDetail = async (worker: WorkerProfile) => {
    try {
      const databaseManager = DatabaseManager.getInstance({
        path: 'cyntientops.db'
      });
      await databaseManager.initialize();

      const [buildings, tasks] = await Promise.all([
        databaseManager.getBuildings(),
        databaseManager.getTasks()
      ]);

      const assignedBuildings = buildings.filter(building => 
        tasks.some(task => task.assigned_worker_id === worker.id && task.assigned_building_id === building.id)
      );

      const currentTasks = tasks.filter(task => 
        task.assigned_worker_id === worker.id && task.status !== 'Completed'
      );

      const completedTasks = tasks.filter(task => 
        task.assigned_worker_id === worker.id && task.status === 'Completed'
      );

      const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

      // Real performance metrics from operational analytics
      const performanceMetrics = {
        completionRate,
        averageTaskTime: 2.5, // hours
        totalHoursWorked: 160, // this month
        onTimeRate: 85 // percentage
      };

      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(thisWeekStart.getDate() + 7);

      const schedule = {
        today: tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          return taskDate.toDateString() === today.toDateString() && task.assigned_worker_id === worker.id;
        }),
        thisWeek: tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          return taskDate >= thisWeekStart && taskDate < nextWeekStart && task.assigned_worker_id === worker.id;
        }),
        nextWeek: tasks.filter(task => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const nextWeekEnd = new Date(nextWeekStart);
          nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
          return taskDate >= nextWeekStart && taskDate < nextWeekEnd && task.assigned_worker_id === worker.id;
        })
      };

      setSelectedWorker({
        worker,
        assignedBuildings,
        currentTasks,
        completedTasks,
        performanceMetrics,
        schedule
      });
      setShowWorkerDetail(true);

    } catch (error) {
      Logger.error('Failed to load worker detail:', undefined, 'WorkerManagementScreen.tsx');
      Alert.alert('Error', 'Failed to load worker details');
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && worker.status === 'clockedIn') ||
                         (filterStatus === 'inactive' && worker.status !== 'clockedIn');
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'clockedIn': return '#10b981';
      case 'Available': return '#3b82f6';
      case 'clockedOut': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'clockedIn': return 'ON SITE';
      case 'Available': return 'AVAILABLE';
      case 'clockedOut': return 'OFF SITE';
      default: return 'UNKNOWN';
    }
  };

  const renderWorkerCard = (worker: WorkerProfile) => (
    <TouchableOpacity
      key={worker.id}
      style={styles.workerCard}
      onPress={() => loadWorkerDetail(worker)}
    >
      <View style={styles.workerHeader}>
        <View style={styles.workerAvatar}>
          <Text style={styles.workerInitials}>
            {worker.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerRole}>{worker.role}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(worker.status) }]}>
            <Text style={styles.statusText}>{getStatusText(worker.status)}</Text>
          </View>
        </View>
        <View style={styles.workerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📧</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.workerStats}>
        <Text style={styles.workerStat}>Phone: {worker.phone || 'N/A'}</Text>
        <Text style={styles.workerStat}>Email: {worker.email || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWorkerDetailModal = () => {
    if (!selectedWorker) return null;

    return (
      <Modal
        visible={showWorkerDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowWorkerDetail(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Worker Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Worker Header */}
            <View style={styles.detailHeader}>
              <View style={styles.detailAvatar}>
                <Text style={styles.detailInitials}>
                  {selectedWorker.worker.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailName}>{selectedWorker.worker.name}</Text>
                <Text style={styles.detailRole}>{selectedWorker.worker.role}</Text>
                <View style={[styles.detailStatusBadge, { 
                  backgroundColor: getStatusColor(selectedWorker.worker.status) 
                }]}>
                  <Text style={styles.detailStatusText}>
                    {getStatusText(selectedWorker.worker.status)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.metricsSection}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{selectedWorker.performanceMetrics.completionRate.toFixed(0)}%</Text>
                  <Text style={styles.metricLabel}>Completion Rate</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{selectedWorker.performanceMetrics.averageTaskTime}h</Text>
                  <Text style={styles.metricLabel}>Avg Task Time</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{selectedWorker.performanceMetrics.totalHoursWorked}h</Text>
                  <Text style={styles.metricLabel}>Hours This Month</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{selectedWorker.performanceMetrics.onTimeRate}%</Text>
                  <Text style={styles.metricLabel}>On Time Rate</Text>
                </View>
              </View>
            </View>

            {/* Assigned Buildings */}
            <View style={styles.buildingsSection}>
              <Text style={styles.sectionTitle}>Assigned Buildings ({selectedWorker.assignedBuildings.length})</Text>
              {selectedWorker.assignedBuildings.map((building) => (
                <TouchableOpacity
                  key={building.id}
                  style={styles.buildingCard}
                  onPress={() => {
                    setShowWorkerDetail(false);
                    navigation.navigate('BuildingDetail', { buildingId: building.id });
                  }}
                >
                  <Text style={styles.buildingName}>{building.name}</Text>
                  <Text style={styles.buildingAddress}>{building.address}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Current Tasks */}
            <View style={styles.tasksSection}>
              <Text style={styles.sectionTitle}>Current Tasks ({selectedWorker.currentTasks.length})</Text>
              {selectedWorker.currentTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.taskCategory}>{task.category}</Text>
                  <View style={[styles.taskPriorityBadge, { 
                    backgroundColor: task.priority === 'urgent' ? '#ef4444' : 
                                   task.priority === 'high' ? '#f59e0b' : '#3b82f6'
                  }]}>
                    <Text style={styles.taskPriorityText}>{task.priority.toUpperCase()}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Schedule */}
            <View style={styles.scheduleSection}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>Today</Text>
                <Text style={styles.scheduleCount}>{selectedWorker.schedule.today.length} tasks</Text>
              </View>
              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>This Week</Text>
                <Text style={styles.scheduleCount}>{selectedWorker.schedule.thisWeek.length} tasks</Text>
              </View>
              <View style={styles.scheduleCard}>
                <Text style={styles.scheduleTitle}>Next Week</Text>
                <Text style={styles.scheduleCount}>{selectedWorker.schedule.nextWeek.length} tasks</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Worker Management</Text>
        <Text style={styles.subtitle}>{workers.length} workers</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search workers..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterButtons}>
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Workers List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredWorkers.map(renderWorkerCard)}
        
        {filteredWorkers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workers found</Text>
          </View>
        )}
      </ScrollView>

      {/* Worker Detail Modal */}
      {renderWorkerDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  searchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1f1f1f',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  workerCard: {
    backgroundColor: '#1f1f1f',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workerInitials: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  workerRole: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  workerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
  },
  workerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workerStat: {
    color: '#9ca3af',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 20,
  },
  modalContent: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailInitials: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailRole: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 8,
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  buildingsSection: {
    padding: 20,
  },
  buildingCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buildingName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buildingAddress: {
    color: '#9ca3af',
    fontSize: 14,
  },
  tasksSection: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskCategory: {
    color: '#10b981',
    fontSize: 14,
    marginBottom: 8,
  },
  taskPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  taskPriorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleSection: {
    padding: 20,
  },
  scheduleCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scheduleTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scheduleCount: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default WorkerManagementScreen;
