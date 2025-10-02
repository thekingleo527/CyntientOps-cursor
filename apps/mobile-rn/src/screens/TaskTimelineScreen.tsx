/**
 * 📋 Task Timeline Screen
 * Mirrors: CyntientOps/Views/Detail/TaskTimelineView.swift
 * Purpose: Detailed task timeline with progress tracking and photo evidence
 */

import React, { useEffect, useState } from 'react';
import config from '../config/app.config';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DatabaseManager } from '@cyntientops/database';
import { RealDataService } from '@cyntientops/business-core';
import { OperationalDataTaskAssignment, WorkerProfile } from '@cyntientops/domain-schema';
import { Logger } from '@cyntientops/business-core';

type TaskTimelineScreenRouteProp = RouteProp<RootStackParamList, 'TaskTimeline'>;

export const TaskTimelineScreen: React.FC = () => {
  const route = useRoute<TaskTimelineScreenRouteProp>();
  const { taskId } = route.params;
  const navigation = useNavigation<any>();
  
  const [task, setTask] = useState<OperationalDataTaskAssignment | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  const loadTaskData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const databaseManager = DatabaseManager.getInstance({
        path: config.databasePath
      });
      await databaseManager.initialize();

      // Find task in all tasks
      const allTasks = await databaseManager.getTasks();
      const taskData = allTasks.find((t: any) => t.id === taskId) as unknown as OperationalDataTaskAssignment | undefined;
      
      if (!taskData) {
        throw new Error('Task not found');
      }

      // Get worker information (via RealDataService)
      const workerData = taskData.assigned_worker_id
        ? RealDataService.getWorkerById(taskData.assigned_worker_id)
        : null;

      setTask(taskData as any);
      setWorker(workerData);
    } catch (err) {
      Logger.error('Failed to load task data:', undefined, 'TaskTimelineScreen.tsx');
      setError(err instanceof Error ? err.message : 'Failed to load task data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!task) return;

    try {
      const databaseManager = DatabaseManager.getInstance({
        path: config.databasePath
      });
      await databaseManager.updateTaskStatus(task.id, newStatus);
      setTask({ ...task, status: newStatus } as any);
      Alert.alert('Success', 'Task status updated successfully');
    } catch (error) {
      Logger.error('Task status update error:', undefined, 'TaskTimelineScreen.tsx');
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.taskDescription}>{task.description || 'No description available'}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{task.category}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority:</Text>
              <Text style={[styles.infoValue, { color: task.priority === 'urgent' ? '#ef4444' : '#10b981' }]}>
                {task.priority}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: task.status === 'Completed' ? '#10b981' : '#f59e0b' }]}>
                {task.status}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Worker:</Text>
              <Text style={styles.infoValue}>{worker?.name || 'Unassigned'}</Text>
            </View>
            {task.scheduled_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled:</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.scheduled_date).toLocaleDateString()}
                </Text>
              </View>
            )}
            {task.estimated_duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{task.estimated_duration} hours</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Requires Photo:</Text>
              <Text style={styles.infoValue}>{task.requires_photo ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              {task.status === 'Pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => handleStatusUpdate('In Progress')}
                >
                  <Text style={styles.actionButtonText}>Start Task</Text>
                </TouchableOpacity>
              )}
              
              {task.status === 'In Progress' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleStatusUpdate('Completed')}
                >
                  <Text style={styles.actionButtonText}>Complete Task</Text>
                </TouchableOpacity>
              )}
              
              {task.requires_photo && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.photoButton]}
                  onPress={() => navigation.navigate('PhotoCaptureModal', { taskId })}
                >
                  <Text style={styles.actionButtonText}>Add Photo Evidence</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  taskName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskDescription: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
    width: 120,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  photoButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskTimelineScreen;
