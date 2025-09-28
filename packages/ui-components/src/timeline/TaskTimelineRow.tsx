/**
 * 📋 Task Timeline Row
 * Mirrors: CyntientOps/Components/Common/TaskTimelineRow.swift
 * Purpose: Individual task row in timeline with status, urgency, and completion state
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { OperationalDataTaskAssignment, TaskUrgency } from '@cyntientops/domain-schema';

interface TaskTimelineRowProps {
  task: OperationalDataTaskAssignment;
  onTaskPress?: (task: OperationalDataTaskAssignment) => void;
  showBuilding?: boolean;
  compact?: boolean;
}

export const TaskTimelineRow: React.FC<TaskTimelineRowProps> = ({
  task,
  onTaskPress,
  showBuilding = false,
  compact = false
}) => {
  const isCompleted = task.status === 'Completed';
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;
  
  const getUrgencyColor = (urgency: TaskUrgency): string => {
    switch (urgency) {
      case 'emergency': return '#8b5cf6'; // Purple
      case 'critical':
      case 'urgent': return '#ef4444'; // Red
      case 'high': return '#f59e0b'; // Orange
      case 'medium': return '#eab308'; // Yellow
      case 'low': return '#10b981'; // Green
      case 'normal': return '#3b82f6'; // Blue
      default: return '#6b7280'; // Gray
    }
  };

  const getStatusColor = (): string => {
    if (isCompleted) return '#10b981'; // Green
    if (isOverdue) return '#ef4444'; // Red
    return '#f59e0b'; // Orange
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={() => onTaskPress?.(task)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Status Indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        
        {/* Task Content */}
        <View style={styles.taskContent}>
          {/* Title and Time */}
          <View style={styles.header}>
            <Text style={[styles.title, isCompleted && styles.completedTitle]} numberOfLines={compact ? 1 : 2}>
              {task.name}
            </Text>
            {task.due_date && (
              <Text style={styles.timeText}>
                {formatTime(task.due_date)}
              </Text>
            )}
          </View>
          
          {/* Description */}
          {!compact && task.description && (
            <Text style={styles.description} numberOfLines={2}>
              {task.description}
            </Text>
          )}
          
          {/* Building and Category */}
          <View style={styles.metaInfo}>
            {showBuilding && task.assigned_building_id && (
              <Text style={styles.buildingText}>
                Building: {task.assigned_building_id}
              </Text>
            )}
            <Text style={styles.categoryText}>
              {task.category}
            </Text>
          </View>
          
          {/* Due Date */}
          {task.due_date && (
            <Text style={[styles.dueDate, isOverdue && styles.overdueText]}>
              Due: {formatDate(task.due_date)}
            </Text>
          )}
        </View>
        
        {/* Urgency Badge */}
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(task.priority) }]}>
          <Text style={styles.urgencyText}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {/* Completion Checkmark */}
      {isCompleted && (
        <View style={styles.completionIndicator}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  compactContainer: {
    marginVertical: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  timeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  buildingText: {
    color: '#6b7280',
    fontSize: 12,
  },
  categoryText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  dueDate: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  completionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TaskTimelineRow;
