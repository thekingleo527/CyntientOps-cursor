/**
 * 📋 Unified Task Detail View
 * Mirrors: CyntientOps/Views/Main/UnifiedTaskDetailView.swift
 * Purpose: Universal task detail interface for all roles and modes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { GlassCard, Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { OperationalDataTaskAssignment, TaskUrgency, TaskStatus, UserRole } from '@cyntientops/domain-schema';

export interface UnifiedTaskDetailViewProps {
  task: OperationalDataTaskAssignment;
  userRole: UserRole;
  onClose: () => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskStart?: (taskId: string) => void;
  onTaskUpdate?: (task: OperationalDataTaskAssignment) => void;
  onAddPhoto?: (taskId: string) => void;
  onAddNote?: (taskId: string) => void;
  onReportIssue?: (taskId: string) => void;
  isLoading?: boolean;
}

export const UnifiedTaskDetailView: React.FC<UnifiedTaskDetailViewProps> = ({
  task,
  userRole,
  onClose,
  onTaskComplete,
  onTaskStart,
  onTaskUpdate,
  onAddPhoto,
  onAddNote,
  onReportIssue,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<OperationalDataTaskAssignment>(task);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const isCompleted = task.status === 'Completed';
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;
  const canEdit = userRole === 'admin' || userRole === 'manager' || userRole === 'super_admin';
  const canComplete = userRole === 'worker' || canEdit;

  const getUrgencyColor = (urgency: TaskUrgency): string => {
    switch (urgency) {
      case 'emergency': return Colors.status.error;
      case 'critical':
      case 'urgent': return Colors.status.error;
      case 'high': return Colors.status.warning;
      case 'medium': return Colors.primary.yellow;
      case 'low': return Colors.status.success;
      case 'normal': return Colors.primary.blue;
      default: return Colors.text.secondary;
    }
  };

  const getStatusColor = (): string => {
    if (isCompleted) return Colors.status.success;
    if (isOverdue) return Colors.status.error;
    return Colors.status.warning;
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCompleteTask = () => {
    Alert.alert(
      'Complete Task',
      `Are you sure you want to mark "${task.name}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          style: 'default',
          onPress: () => onTaskComplete?.(task.id)
        },
      ]
    );
  };

  const handleStartTask = () => {
    Alert.alert(
      'Start Task',
      `Are you ready to start working on "${task.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          style: 'default',
          onPress: () => onTaskStart?.(task.id)
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>{task.name}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{task.status}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(task.priority) }]}>
            <Text style={styles.urgencyText}>{task.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTaskInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Task Information</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Category:</Text>
        <Text style={styles.infoValue}>{task.category}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Priority:</Text>
        <Text style={[styles.infoValue, { color: getUrgencyColor(task.priority) }]}>
          {task.priority.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status:</Text>
        <Text style={[styles.infoValue, { color: getStatusColor() }]}>
          {task.status}
        </Text>
      </View>
      
      {task.assigned_building_id && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Building:</Text>
          <Text style={styles.infoValue}>{task.assigned_building_id}</Text>
        </View>
      )}
      
      {task.assigned_worker_id && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned to:</Text>
          <Text style={styles.infoValue}>{task.assigned_worker_id}</Text>
        </View>
      )}
    </View>
  );

  const renderTiming = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Timing</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Created:</Text>
        <Text style={styles.infoValue}>{formatDateTime(task.created_at)}</Text>
      </View>
      
      {task.due_date && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Due Date:</Text>
          <Text style={[styles.infoValue, isOverdue && { color: Colors.status.error }]}>
            {formatDateTime(task.due_date)}
          </Text>
        </View>
      )}
      
      {task.started_at && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Started:</Text>
          <Text style={styles.infoValue}>{formatDateTime(task.started_at)}</Text>
        </View>
      )}
      
      {task.completed_at && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Completed:</Text>
          <Text style={styles.infoValue}>{formatDateTime(task.completed_at)}</Text>
        </View>
      )}
    </View>
  );

  const renderDescription = () => (
    task.description && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{task.description}</Text>
      </View>
    )
  );

  const renderInstructions = () => (
    task.instructions && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>{task.instructions}</Text>
      </View>
    )
  );

  const renderActions = () => {
    if (userRole === 'worker') {
      return (
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          {!isCompleted && task.status !== 'In Progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={handleStartTask}
            >
              <Text style={styles.actionButtonText}>Start Task</Text>
            </TouchableOpacity>
          )}
          
          {!isCompleted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleCompleteTask}
            >
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.photoButton]}
            onPress={() => onAddPhoto?.(task.id)}
          >
            <Text style={styles.actionButtonText}>Add Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.noteButton]}
            onPress={() => onAddNote?.(task.id)}
          >
            <Text style={styles.actionButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (canEdit) {
      return (
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.actionButtonText}>
              {isEditing ? 'Cancel Edit' : 'Edit Task'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.issueButton]}
            onPress={() => onReportIssue?.(task.id)}
          >
            <Text style={styles.actionButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary.blue} />
      <Text style={styles.loadingText}>Loading task details...</Text>
    </View>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {renderTaskInfo()}
          {renderTiming()}
          {renderDescription()}
          {renderInstructions()}
          {renderActions()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.titleLarge,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  urgencyText: {
    ...Typography.caption,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.titleMedium,
    color: Colors.text.secondary,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.thin,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  description: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  instructions: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  actionsSection: {
    padding: Spacing.lg,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: Colors.primary.blue,
  },
  completeButton: {
    backgroundColor: Colors.status.success,
  },
  photoButton: {
    backgroundColor: Colors.primary.purple,
  },
  noteButton: {
    backgroundColor: Colors.primary.green,
  },
  editButton: {
    backgroundColor: Colors.primary.yellow,
  },
  issueButton: {
    backgroundColor: Colors.status.error,
  },
  actionButtonText: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
});

export default UnifiedTaskDetailView;
