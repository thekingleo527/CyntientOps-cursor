/**
 * 📅 Routine Priority Component
 * Mirrors: CyntientOps/Components/Common/RoutinePriority.swift
 * Purpose: Routine priority management with schedule types and building routines
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

export enum RoutinePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ScheduleType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface BuildingRoutine {
  id: string;
  buildingId: string;
  routineName: string;
  description: string;
  scheduleType: ScheduleType;
  scheduleDays: string[]; // ["Monday", "Tuesday"] or ["1", "15"] for monthly
  startTime: string; // "09:00"
  estimatedDuration: number; // minutes
  priority: RoutinePriority;
  isActive: boolean;
  createdDate: Date;
}

export interface RoutinePriorityProps {
  routine: BuildingRoutine;
  onRoutinePress?: (routine: BuildingRoutine) => void;
  showBuilding?: boolean;
  compact?: boolean;
}

export const RoutinePriorityComponent: React.FC<RoutinePriorityProps> = ({
  routine,
  onRoutinePress,
  showBuilding = false,
  compact = false
}) => {
  const getPriorityColor = (priority: RoutinePriority): string => {
    switch (priority) {
      case RoutinePriority.LOW: return '#6b7280'; // Gray
      case RoutinePriority.MEDIUM: return '#3b82f6'; // Blue
      case RoutinePriority.HIGH: return '#f59e0b'; // Orange
      case RoutinePriority.CRITICAL: return '#ef4444'; // Red
      default: return '#6b7280';
    }
  };

  const getPriorityDisplayName = (priority: RoutinePriority): string => {
    switch (priority) {
      case RoutinePriority.LOW: return 'Low';
      case RoutinePriority.MEDIUM: return 'Medium';
      case RoutinePriority.HIGH: return 'High';
      case RoutinePriority.CRITICAL: return 'Critical';
      default: return 'Unknown';
    }
  };

  const getScheduleDisplayText = (): string => {
    switch (routine.scheduleType) {
      case ScheduleType.DAILY:
        return `Daily at ${routine.startTime}`;
      case ScheduleType.WEEKLY: {
        const days = routine.scheduleDays.slice(0, 3).join(', ');
        return `${days} at ${routine.startTime}`;
      }
      case ScheduleType.MONTHLY: {
        const dayNumbers = routine.scheduleDays.join(', ');
        return `Monthly on ${dayNumbers}th at ${routine.startTime}`;
      }
      default:
        return 'Custom schedule';
    }
  };

  const isRoutineDueToday = (): boolean => {
    const today = new Date();
    const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    switch (routine.scheduleType) {
      case ScheduleType.DAILY:
        return true;
      case ScheduleType.WEEKLY:
        return routine.scheduleDays.includes(todayName);
      default:
        return false;
    }
  };

  const isRoutineOverdue = (): boolean => {
    if (!isRoutineDueToday()) return false;
    
    const now = new Date();
    const [hours, minutes] = routine.startTime.split(':').map(Number);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    return now > todayStart;
  };

  const getDurationText = (): string => {
    const hours = Math.floor(routine.estimatedDuration / 60);
    const minutes = routine.estimatedDuration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const isDue = isRoutineDueToday();
  const isOverdue = isRoutineOverdue();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        compact && styles.compactContainer,
        isDue && styles.dueContainer,
        isOverdue && styles.overdueContainer
      ]}
      onPress={() => onRoutinePress?.(routine)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Priority Indicator */}
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(routine.priority) }]} />
        
        {/* Routine Content */}
        <View style={styles.routineContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.routineName, compact && styles.compactRoutineName]} numberOfLines={compact ? 1 : 2}>
              {routine.routineName}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(routine.priority) }]}>
              <Text style={styles.priorityText}>
                {getPriorityDisplayName(routine.priority)}
              </Text>
            </View>
          </View>
          
          {/* Description */}
          {!compact && routine.description && (
            <Text style={styles.description} numberOfLines={2}>
              {routine.description}
            </Text>
          )}
          
          {/* Schedule and Duration */}
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleText}>
              {getScheduleDisplayText()}
            </Text>
            <Text style={styles.durationText}>
              {getDurationText()}
            </Text>
          </View>
          
          {/* Building Info */}
          {showBuilding && (
            <Text style={styles.buildingText}>
              Building: {routine.buildingId}
            </Text>
          )}
          
          {/* Status Indicators */}
          <View style={styles.statusRow}>
            {isDue && (
              <View style={[styles.statusBadge, isOverdue ? styles.overdueBadge : styles.dueBadge]}>
                <Text style={styles.statusText}>
                  {isOverdue ? 'OVERDUE' : 'DUE TODAY'}
                </Text>
              </View>
            )}
            
            {routine.isActive ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>ACTIVE</Text>
              </View>
            ) : (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>INACTIVE</Text>
              </View>
            )}
          </View>
        </View>
      </View>
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
  dueContainer: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  overdueContainer: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  routineContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routineName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  compactRoutineName: {
    fontSize: 14,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  scheduleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  durationText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  buildingText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueBadge: {
    backgroundColor: '#f59e0b',
  },
  overdueBadge: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  activeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#6b7280',
  },
  inactiveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default RoutinePriorityComponent;
