/**
 * @cyntientops/mobile-rn
 * 
 * Worker Site Departure Tab - Site departure management
 * Features: Clock out, task completion, photo evidence, departure checklist
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '@cyntientops/design-tokens';
import { GlassCard, GlassIntensity, CornerRadius } from '@cyntientops/ui-components';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskService } from '@cyntientops/business-core';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { Logger } from '@cyntientops/business-core';

// Types
export interface WorkerSiteDepartureTabProps {
  workerId: string;
  userName: string;
  userRole: string;
}

export interface DepartureChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  category: 'safety' | 'equipment' | 'documentation' | 'cleanup';
}

export const WorkerSiteDepartureTab: React.FC<WorkerSiteDepartureTabProps> = ({
  workerId,
  userName,
}) => {
  const [currentTasks, setCurrentTasks] = useState<OperationalDataTaskAssignment[]>([]);
  const [departureChecklist, setDepartureChecklist] = useState<DepartureChecklistItem[]>([]);
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [currentBuilding, setCurrentBuilding] = useState<string | null>('131 Perry Street');

  useEffect(() => {
    loadDepartureData();
  }, [workerId]);

  const loadDepartureData = async () => {
    try {
      // Load current tasks
      const taskService = TaskService.getInstance();
      const schedule = taskService.generateWorkerTasks(workerId);
      setCurrentTasks([...schedule.now, ...schedule.next, ...schedule.today]);

      // Load departure checklist
      const checklist: DepartureChecklistItem[] = [
        {
          id: '1',
          title: 'Complete Current Tasks',
          description: 'Finish all assigned tasks for today',
          completed: false,
          required: true,
          category: 'documentation',
        },
        {
          id: '2',
          title: 'Equipment Check',
          description: 'Return all equipment to storage',
          completed: false,
          required: true,
          category: 'equipment',
        },
        {
          id: '3',
          title: 'Safety Inspection',
          description: 'Ensure all safety measures are in place',
          completed: false,
          required: true,
          category: 'safety',
        },
        {
          id: '4',
          title: 'Photo Documentation',
          description: 'Take completion photos if required',
          completed: false,
          required: false,
          category: 'documentation',
        },
        {
          id: '5',
          title: 'Site Cleanup',
          description: 'Clean up work area and dispose of waste',
          completed: false,
          required: true,
          category: 'cleanup',
        },
        {
          id: '6',
          title: 'Client Sign-off',
          description: 'Get client approval if required',
          completed: false,
          required: false,
          category: 'documentation',
        },
      ];
      setDepartureChecklist(checklist);
    } catch (error) {
      Logger.error('Failed to load departure data:', undefined, 'WorkerSiteDepartureTab.tsx');
    }
  };

  const handleChecklistItemToggle = (itemId: string) => {
    setDepartureChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const handleClockOut = () => {
    const requiredItems = departureChecklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    
    if (completedRequired.length < requiredItems.length) {
      Alert.alert(
        'Incomplete Checklist',
        'Please complete all required items before clocking out.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clock Out', 
          onPress: () => {
            setIsClockedIn(false);
            Alert.alert('Success', 'You have been clocked out successfully.');
          }
        },
      ]
    );
  };

  const handleTaskComplete = (taskId: string) => {
    Alert.alert(
      'Complete Task',
      'Mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            setCurrentTasks(prev => 
              prev.map(task => 
                task.id === taskId 
                  ? { ...task, status: 'Completed' }
                  : task
              )
            );
            Alert.alert('Success', 'Task marked as completed.');
          }
        },
      ]
    );
  };

  const renderCurrentTasks = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Current Tasks</Text>
      {currentTasks.slice(0, 3).map(task => (
        <GlassCard
          key={task.id}
          intensity={GlassIntensity.regular}
          cornerRadius={CornerRadius.medium}
          style={styles.taskCard}
        >
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{task.name}</Text>
            <View style={[
              styles.taskStatus,
              { backgroundColor: task.status === 'Completed' ? Colors.status.success : Colors.status.warning }
            ]}>
              <Text style={styles.taskStatusText}>{task.status}</Text>
            </View>
          </View>
          <Text style={styles.taskDescription}>{task.description}</Text>
          <Text style={styles.taskLocation}>📍 {task.buildingName}</Text>
          {task.status !== 'Completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleTaskComplete(task.id)}
            >
              <LinearGradient
                colors={[Colors.role.worker.primary, Colors.role.worker.secondary]}
                style={styles.completeButtonGradient}
              >
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </GlassCard>
      ))}
    </View>
  );

  const renderDepartureChecklist = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>✅ Departure Checklist</Text>
      {departureChecklist.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.checklistItem}
          onPress={() => handleChecklistItemToggle(item.id)}
        >
          <GlassCard
            intensity={GlassIntensity.regular}
            cornerRadius={CornerRadius.medium}
            style={[
              styles.checklistCard,
              item.completed && styles.completedCard
            ]}
          >
            <View style={styles.checklistHeader}>
              <View style={[
                styles.checkbox,
                item.completed && styles.checkedBox
              ]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checklistContent}>
                <Text style={[
                  styles.checklistTitle,
                  item.completed && styles.completedText
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.checklistDescription,
                  item.completed && styles.completedText
                ]}>
                  {item.description}
                </Text>
              </View>
              {item.required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>REQUIRED</Text>
                </View>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderClockOutSection = () => {
    const requiredItems = departureChecklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    const canClockOut = completedRequired.length === requiredItems.length;

    return (
      <View style={styles.clockOutSection}>
        <GlassCard
          intensity={GlassIntensity.thick}
          cornerRadius={CornerRadius.large}
          style={styles.clockOutCard}
        >
          <View style={styles.clockOutHeader}>
            <Text style={styles.clockOutTitle}>🕐 Ready to Clock Out?</Text>
            <Text style={styles.clockOutSubtitle}>
              {currentBuilding ? `Currently at ${currentBuilding}` : 'No active location'}
            </Text>
          </View>
          
          <View style={styles.checklistProgress}>
            <Text style={styles.progressText}>
              Checklist: {completedRequired.length}/{requiredItems.length} completed
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(completedRequired.length / requiredItems.length) * 100}%`,
                    backgroundColor: canClockOut ? Colors.status.success : Colors.status.warning
                  }
                ]} 
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.clockOutButton,
              !canClockOut && styles.disabledButton
            ]}
            onPress={handleClockOut}
            disabled={!canClockOut}
          >
            <LinearGradient
              colors={canClockOut 
                ? [Colors.status.error, '#FF6B6B'] 
                : [Colors.text.tertiary, Colors.text.tertiary]
              }
              style={styles.clockOutButtonGradient}
            >
              <Text style={styles.clockOutButtonText}>
                {isClockedIn ? 'Clock Out' : 'Already Clocked Out'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Site Departure</Text>
        
        {renderCurrentTasks()}
        {renderDepartureChecklist()}
        {renderClockOutSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  taskCard: {
    padding: 16,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  taskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  taskLocation: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginBottom: 12,
  },
  completeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  checklistItem: {
    marginBottom: 12,
  },
  checklistCard: {
    padding: 16,
  },
  completedCard: {
    opacity: 0.7,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkedBox: {
    backgroundColor: Colors.status.success,
    borderColor: Colors.status.success,
  },
  checkmark: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
  checklistContent: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  requiredBadge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  clockOutSection: {
    marginTop: 24,
  },
  clockOutCard: {
    padding: 20,
  },
  clockOutHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  clockOutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  clockOutSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  checklistProgress: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  clockOutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  clockOutButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  clockOutButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WorkerSiteDepartureTab;
