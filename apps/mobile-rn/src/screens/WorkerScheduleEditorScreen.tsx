/**
 * 👷 Worker Schedule Editor Screen
 * Purpose: Assign and manage worker schedules
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataManager, CanonicalIDs } from '@cyntientops/business-core';

interface Worker {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface WorkerAssignment {
  workerId: string;
  workerName: string;
  routineId: string;
  routineName: string;
  buildingId: string;
  buildingName: string;
  scheduleType: string;
  startTime?: string;
  estimatedDuration?: number;
}

export const WorkerScheduleEditorScreen: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [availableRoutines, setAvailableRoutines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      loadWorkerAssignments(selectedWorker.id);
    }
  }, [selectedWorker]);

  const loadWorkers = async () => {
    try {
      setIsLoading(true);
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const rows = await db.getAll(
        `SELECT id, name, role, status FROM workers WHERE is_active = 1 ORDER BY name`,
        []
      );

      setWorkers(rows as Worker[]);

      if (rows.length > 0 && !selectedWorker) {
        setSelectedWorker(rows[0] as Worker);
      }
    } catch (error) {
      console.error('Failed to load workers:', error);
      Alert.alert('Error', 'Failed to load workers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkerAssignments = async (workerId: string) => {
    try {
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const routines = await db.getAll(
        `SELECT
          r.id as routineId,
          r.name as routineName,
          r.building_id as buildingId,
          r.schedule_type as scheduleType,
          r.start_time as startTime,
          r.estimated_duration as estimatedDuration,
          r.assigned_worker_id as workerId
        FROM routines r
        WHERE r.assigned_worker_id = ? AND r.is_active = 1
        ORDER BY r.building_id, r.start_time`,
        [workerId]
      );

      const workerName = CanonicalIDs.Workers.getName(workerId) || 'Unknown';

      const mapped: WorkerAssignment[] = routines.map(r => ({
        workerId,
        workerName,
        routineId: r.routineId,
        routineName: r.routineName,
        buildingId: r.buildingId,
        buildingName: CanonicalIDs.Buildings.getName(r.buildingId) || r.buildingId,
        scheduleType: r.scheduleType,
        startTime: r.startTime,
        estimatedDuration: r.estimatedDuration
      }));

      setAssignments(mapped);
    } catch (error) {
      console.error('Failed to load worker assignments:', error);
    }
  };

  const loadAvailableRoutines = async () => {
    try {
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      // Load unassigned routines or routines assigned to current worker
      const routines = await db.getAll(
        `SELECT
          id, name, building_id, schedule_type,
          start_time, estimated_duration, assigned_worker_id
        FROM routines
        WHERE is_active = 1 AND (assigned_worker_id IS NULL OR assigned_worker_id = ?)
        ORDER BY building_id, name`,
        [selectedWorker?.id || '']
      );

      setAvailableRoutines(routines);
    } catch (error) {
      console.error('Failed to load available routines:', error);
    }
  };

  const openAssignModal = async () => {
    await loadAvailableRoutines();
    setShowAssignModal(true);
  };

  const handleAssignRoutine = async () => {
    if (!selectedRoutine || !selectedWorker) return;

    try {
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      await db.run(
        `UPDATE routines SET assigned_worker_id = ?, updated_at = ? WHERE id = ?`,
        [selectedWorker.id, new Date().toISOString(), selectedRoutine]
      );

      setShowAssignModal(false);
      setSelectedRoutine(null);
      await loadWorkerAssignments(selectedWorker.id);
      Alert.alert('Success', 'Routine assigned successfully');
    } catch (error) {
      console.error('Failed to assign routine:', error);
      Alert.alert('Error', 'Failed to assign routine');
    }
  };

  const handleUnassignRoutine = async (routineId: string, routineName: string) => {
    Alert.alert(
      'Unassign Routine',
      `Remove "${routineName}" from ${selectedWorker?.name}'s schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
              await db.initialize();

              await db.run(
                `UPDATE routines SET assigned_worker_id = NULL, updated_at = ? WHERE id = ?`,
                [new Date().toISOString(), routineId]
              );

              if (selectedWorker) {
                await loadWorkerAssignments(selectedWorker.id);
              }
              Alert.alert('Success', 'Routine unassigned successfully');
            } catch (error) {
              console.error('Failed to unassign routine:', error);
              Alert.alert('Error', 'Failed to unassign routine');
            }
          }
        }
      ]
    );
  };

  const renderWorker = ({ item }: { item: Worker }) => (
    <TouchableOpacity
      style={[
        styles.workerCard,
        selectedWorker?.id === item.id && styles.workerCardSelected
      ]}
      onPress={() => setSelectedWorker(item)}
    >
      <Text style={styles.workerName}>{item.name}</Text>
      <Text style={styles.workerRole}>{item.role}</Text>
      <View style={[styles.statusBadge, getStatusColor(item.status)]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAssignment = ({ item }: { item: WorkerAssignment }) => (
    <TouchableOpacity
      style={styles.assignmentCard}
      onLongPress={() => handleUnassignRoutine(item.routineId, item.routineName)}
    >
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentName}>{item.routineName}</Text>
        <Text style={styles.assignmentSchedule}>{item.scheduleType}</Text>
      </View>

      <Text style={styles.assignmentBuilding}>🏢 {item.buildingName}</Text>

      <View style={styles.assignmentDetails}>
        {item.startTime && (
          <Text style={styles.assignmentDetail}>⏰ {item.startTime}</Text>
        )}
        {item.estimatedDuration && (
          <Text style={styles.assignmentDetail}>⏱️ {item.estimatedDuration}m</Text>
        )}
      </View>

      <Text style={styles.assignmentHint}>Long press to unassign</Text>
    </TouchableOpacity>
  );

  const renderAvailableRoutine = ({ item }: { item: any }) => {
    const buildingName = CanonicalIDs.Buildings.getName(item.building_id) || item.building_id;
    const isAssigned = item.assigned_worker_id === selectedWorker?.id;

    return (
      <TouchableOpacity
        style={[
          styles.availableRoutineCard,
          selectedRoutine === item.id && styles.availableRoutineCardSelected,
          isAssigned && styles.availableRoutineCardAssigned
        ]}
        onPress={() => setSelectedRoutine(item.id)}
      >
        <Text style={styles.availableRoutineName}>{item.name}</Text>
        <Text style={styles.availableRoutineBuilding}>🏢 {buildingName}</Text>
        <View style={styles.availableRoutineDetails}>
          <Text style={styles.availableRoutineDetail}>{item.schedule_type}</Text>
          {item.start_time && (
            <Text style={styles.availableRoutineDetail}>⏰ {item.start_time}</Text>
          )}
        </View>
        {isAssigned && (
          <Text style={styles.assignedLabel}>Currently Assigned</Text>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return styles.statusAvailable;
      case 'busy':
        return styles.statusBusy;
      case 'off':
        return styles.statusOff;
      default:
        return styles.statusDefault;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading workers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Worker Schedule Editor</Text>
        <Text style={styles.headerSubtitle}>
          {selectedWorker ? `${selectedWorker.name} - ${assignments.length} assignments` : 'Select a worker'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Workers List */}
        <View style={styles.workersSection}>
          <Text style={styles.sectionTitle}>Workers</Text>
          <FlatList
            data={workers}
            keyExtractor={item => item.id}
            renderItem={renderWorker}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workersListContent}
          />
        </View>

        {/* Assignments List */}
        {selectedWorker && (
          <View style={styles.assignmentsSection}>
            <View style={styles.assignmentsHeader}>
              <Text style={styles.sectionTitle}>Assigned Routines</Text>
              <TouchableOpacity style={styles.addButton} onPress={openAssignModal}>
                <Text style={styles.addButtonText}>+ Assign</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={assignments}
              keyExtractor={item => item.routineId}
              renderItem={renderAssignment}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No assignments yet</Text>
                  <TouchableOpacity style={styles.emptyButton} onPress={openAssignModal}>
                    <Text style={styles.emptyButtonText}>Assign First Routine</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Assign Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assign Routine</Text>
            <TouchableOpacity
              onPress={handleAssignRoutine}
              disabled={!selectedRoutine}
            >
              <Text
                style={[
                  styles.modalSave,
                  !selectedRoutine && styles.modalSaveDisabled
                ]}
              >
                Assign
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableRoutines}
            keyExtractor={item => item.id}
            renderItem={renderAvailableRoutine}
            contentContainerStyle={styles.modalListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No available routines</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
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
    color: '#9ca3af',
    marginTop: 12,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  workersSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
  },
  workersListContent: {
    paddingHorizontal: 16,
  },
  workerCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
  },
  workerCardSelected: {
    backgroundColor: '#10b981',
  },
  workerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workerRole: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  statusAvailable: {
    backgroundColor: '#10b981',
  },
  statusBusy: {
    backgroundColor: '#f59e0b',
  },
  statusOff: {
    backgroundColor: '#6b7280',
  },
  statusDefault: {
    backgroundColor: '#9ca3af',
  },
  assignmentsSection: {
    flex: 1,
    padding: 16,
  },
  assignmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  assignmentCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  assignmentSchedule: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  assignmentBuilding: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
  },
  assignmentDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  assignmentDetail: {
    color: '#9ca3af',
    fontSize: 13,
  },
  assignmentHint: {
    color: '#6b7280',
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  modalCancel: {
    color: '#9ca3af',
    fontSize: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#6b7280',
  },
  modalListContent: {
    padding: 16,
  },
  availableRoutineCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  availableRoutineCardSelected: {
    borderColor: '#10b981',
  },
  availableRoutineCardAssigned: {
    backgroundColor: '#374151',
  },
  availableRoutineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  availableRoutineBuilding: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
  },
  availableRoutineDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  availableRoutineDetail: {
    color: '#9ca3af',
    fontSize: 13,
  },
  assignedLabel: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default WorkerScheduleEditorScreen;
