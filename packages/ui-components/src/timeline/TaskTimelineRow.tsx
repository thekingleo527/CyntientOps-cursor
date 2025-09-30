/**
 * @cyntientops/ui-components
 * 
 * Task Timeline Row Component
 * Mock implementation for development
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { OperationalDataTaskAssignment, TaskStatus } from '@cyntientops/domain-schema';

export interface TaskTimelineRowProps {
  task: OperationalDataTaskAssignment;
  onPress?: (task: OperationalDataTaskAssignment) => void;
  style?: any;
}

export const TaskTimelineRow: React.FC<TaskTimelineRowProps> = ({ task, onPress, style }) => {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'pending': return Colors.pending;
      case 'overdue': return Colors.error;
      default: return Colors.pending;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={() => onPress?.(task)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.taskTitle}>{task.taskName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{task.status}</Text>
          </View>
        </View>
        
        <Text style={styles.taskDescription}>{task.description}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.buildingText}>Building: {task.buildingId}</Text>
          <Text style={styles.workerText}>Worker: {task.assignedWorkerId}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    ...Typography.heading3,
    color: Colors.primaryText,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.primaryText,
    textTransform: 'capitalize',
  },
  taskDescription: {
    ...Typography.body,
    color: Colors.secondaryText,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buildingText: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
  workerText: {
    ...Typography.caption,
    color: Colors.tertiaryText,
  },
});

export default TaskTimelineRow;