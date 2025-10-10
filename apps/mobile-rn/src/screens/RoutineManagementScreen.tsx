/**
 * 📋 Routine Management Screen
 * Purpose: Create, edit, and manage routine tasks
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataManager, CanonicalIDs } from '@cyntientops/business-core';

interface Routine {
  id: string;
  name: string;
  description?: string;
  building_id: string;
  assigned_worker_id?: string;
  schedule_type: string;
  schedule_days?: string;
  start_time?: string;
  estimated_duration?: number;
  priority: string;
  is_active: number;
}

export const RoutineManagementScreen: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBuildingId, setFormBuildingId] = useState('');
  const [formWorkerId, setFormWorkerId] = useState('');
  const [formScheduleType, setFormScheduleType] = useState('daily');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formDuration, setFormDuration] = useState('60');
  const [formPriority, setFormPriority] = useState('medium');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setIsLoading(true);
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const rows = await db.getAll(
        `SELECT * FROM routines ORDER BY building_id, name`,
        []
      );

      setRoutines(rows as Routine[]);
    } catch (error) {
      console.error('Failed to load routines:', error);
      Alert.alert('Error', 'Failed to load routines');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setEditingRoutine(null);
    setShowAddModal(true);
  };

  const openEditModal = (routine: Routine) => {
    setFormName(routine.name);
    setFormDescription(routine.description || '');
    setFormBuildingId(routine.building_id);
    setFormWorkerId(routine.assigned_worker_id || '');
    setFormScheduleType(routine.schedule_type);
    setFormStartTime(routine.start_time || '08:00');
    setFormDuration(String(routine.estimated_duration || 60));
    setFormPriority(routine.priority);
    setFormIsActive(Boolean(routine.is_active));
    setEditingRoutine(routine);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormBuildingId('');
    setFormWorkerId('');
    setFormScheduleType('daily');
    setFormStartTime('08:00');
    setFormDuration('60');
    setFormPriority('medium');
    setFormIsActive(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formBuildingId) {
      Alert.alert('Validation Error', 'Name and Building are required');
      return;
    }

    try {
      const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
      await db.initialize();

      const now = new Date().toISOString();

      if (editingRoutine) {
        // Update existing routine
        await db.run(
          `UPDATE routines SET
            name = ?,
            description = ?,
            building_id = ?,
            assigned_worker_id = ?,
            schedule_type = ?,
            start_time = ?,
            estimated_duration = ?,
            priority = ?,
            is_active = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            formName,
            formDescription || null,
            formBuildingId,
            formWorkerId || null,
            formScheduleType,
            formStartTime,
            parseInt(formDuration),
            formPriority,
            formIsActive ? 1 : 0,
            now,
            editingRoutine.id
          ]
        );
      } else {
        // Create new routine
        const id = `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.run(
          `INSERT INTO routines (
            id, name, description, building_id, assigned_worker_id,
            schedule_type, start_time, estimated_duration, priority,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            formName,
            formDescription || null,
            formBuildingId,
            formWorkerId || null,
            formScheduleType,
            formStartTime,
            parseInt(formDuration),
            formPriority,
            formIsActive ? 1 : 0,
            now,
            now
          ]
        );
      }

      setShowAddModal(false);
      await loadRoutines();
      Alert.alert('Success', `Routine ${editingRoutine ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    }
  };

  const handleDelete = async (routine: Routine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = DatabaseManager.getInstance({ path: 'cyntientops.db' });
              await db.initialize();
              await db.run('DELETE FROM routines WHERE id = ?', [routine.id]);
              await loadRoutines();
              Alert.alert('Success', 'Routine deleted successfully');
            } catch (error) {
              console.error('Failed to delete routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
  };

  const filteredRoutines = routines.filter(routine =>
    routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    routine.building_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRoutine = ({ item }: { item: Routine }) => {
    const buildingName = CanonicalIDs.Buildings.getName(item.building_id) || item.building_id;
    const workerName = item.assigned_worker_id
      ? CanonicalIDs.Workers.getName(item.assigned_worker_id) || item.assigned_worker_id
      : 'Unassigned';

    return (
      <TouchableOpacity
        style={styles.routineCard}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.routineHeader}>
          <Text style={styles.routineName}>{item.name}</Text>
          <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>
              {item.is_active ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.routineDescription}>{item.description}</Text>
        )}

        <View style={styles.routineDetails}>
          <Text style={styles.detailText}>🏢 {buildingName}</Text>
          <Text style={styles.detailText}>👷 {workerName}</Text>
        </View>

        <View style={styles.routineDetails}>
          <Text style={styles.detailText}>📅 {item.schedule_type}</Text>
          <Text style={styles.detailText}>⏰ {item.start_time || 'Not set'}</Text>
          <Text style={styles.detailText}>⏱️ {item.estimated_duration || 60}m</Text>
        </View>

        <View style={styles.priorityContainer}>
          <Text style={[styles.priorityBadge, getPriorityColor(item.priority)]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return styles.priorityMedium;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Routine Management</Text>
        <Text style={styles.headerSubtitle}>{routines.length} routines</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search routines..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredRoutines}
        keyExtractor={item => item.id}
        renderItem={renderRoutine}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No routines found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingRoutine ? 'Edit Routine' : 'New Routine'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Routine name"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Optional description"
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Building ID *</Text>
              <TextInput
                style={styles.input}
                value={formBuildingId}
                onChangeText={setFormBuildingId}
                placeholder="e.g., 1, 3, 14"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Worker ID</Text>
              <TextInput
                style={styles.input}
                value={formWorkerId}
                onChangeText={setFormWorkerId}
                placeholder="e.g., 1, 2, 4"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Schedule Type</Text>
              <View style={styles.scheduleButtons}>
                {['daily', 'weekly', 'monthly'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.scheduleButton,
                      formScheduleType === type && styles.scheduleButtonActive
                    ]}
                    onPress={() => setFormScheduleType(type)}
                  >
                    <Text
                      style={[
                        styles.scheduleButtonText,
                        formScheduleType === type && styles.scheduleButtonTextActive
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={formStartTime}
                onChangeText={setFormStartTime}
                placeholder="HH:MM (e.g., 08:00)"
                placeholderTextColor="#6b7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formDuration}
                onChangeText={setFormDuration}
                placeholder="60"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.scheduleButtons}>
                {['low', 'medium', 'high'].map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.scheduleButton,
                      formPriority === priority && styles.scheduleButtonActive
                    ]}
                    onPress={() => setFormPriority(priority)}
                  >
                    <Text
                      style={[
                        styles.scheduleButtonText,
                        formPriority === priority && styles.scheduleButtonTextActive
                      ]}
                    >
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formIsActive}
                  onValueChange={setFormIsActive}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                  thumbColor={formIsActive ? '#fff' : '#9ca3af'}
                />
              </View>
            </View>
          </ScrollView>
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  routineCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  routineDescription: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
  },
  routineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailText: {
    color: '#d1d5db',
    fontSize: 13,
  },
  priorityContainer: {
    marginTop: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
  },
  priorityHigh: {
    backgroundColor: '#ef4444',
    color: '#000',
  },
  priorityMedium: {
    backgroundColor: '#f59e0b',
    color: '#000',
  },
  priorityLow: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '300',
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  scheduleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scheduleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonActive: {
    backgroundColor: '#10b981',
  },
  scheduleButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scheduleButtonTextActive: {
    color: '#000',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default RoutineManagementScreen;
