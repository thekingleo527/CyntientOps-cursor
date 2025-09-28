/**
 * 📅 Weekly Routine Screen
 * Mirrors: CyntientOps/Views/Worker/WorkerWeeklyRoutineView.swift
 * Purpose: Weekly routine management with proper data hydration
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { Building, OperationalDataTaskAssignment, WorkerProfile } from '@cyntientops/domain-schema';
import { RoutinePriorityComponent, BuildingRoutine, ScheduleType, RoutinePriority } from '@cyntientops/ui-components';

interface WeeklyRoutineData {
  routines: BuildingRoutine[];
  tasks: OperationalDataTaskAssignment[];
  buildings: Building[];
  workers: WorkerProfile[];
}

interface DayRoutineData {
  day: string;
  routines: BuildingRoutine[];
  tasks: OperationalDataTaskAssignment[];
  completionRate: number;
}

export const WeeklyRoutineScreen: React.FC = () => {
  const [routineData, setRoutineData] = useState<WeeklyRoutineData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('');

  useEffect(() => {
    loadWeeklyRoutineData();
  }, [selectedWeek]);

  const loadWeeklyRoutineData = async () => {
    try {
      setIsLoading(true);
      
      const databaseManager = DatabaseManager.getInstance({
        path: 'cyntientops.db'
      });
      await databaseManager.initialize();

      // Load all data
      const [buildings, workers, tasks] = await Promise.all([
        databaseManager.getBuildings(),
        databaseManager.getWorkers(),
        databaseManager.getTasks()
      ]);

      // Generate weekly routines from tasks
      const routines = generateWeeklyRoutines(tasks, buildings);
      
      setRoutineData({
        routines,
        tasks,
        buildings,
        workers
      });

    } catch (error) {
      console.error('Failed to load weekly routine data:', error);
      Alert.alert('Error', 'Failed to load weekly routine data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyRoutines = (tasks: OperationalDataTaskAssignment[], buildings: Building[]): BuildingRoutine[] => {
    const routines: BuildingRoutine[] = [];
    
    // Group tasks by building and create routines
    const tasksByBuilding = tasks.reduce((acc, task) => {
      if (!acc[task.assigned_building_id]) {
        acc[task.assigned_building_id] = [];
      }
      acc[task.assigned_building_id].push(task);
      return acc;
    }, {} as Record<string, OperationalDataTaskAssignment[]>);

    Object.entries(tasksByBuilding).forEach(([buildingId, buildingTasks]) => {
      const building = buildings.find(b => b.id === buildingId);
      if (!building) return;

      // Create daily routines
      const dailyRoutines = buildingTasks.filter(task => 
        task.schedule_type === 'daily' || task.schedule_type === 'Daily'
      );

      dailyRoutines.forEach((task, index) => {
        routines.push({
          id: `routine-${buildingId}-daily-${index}`,
          buildingId: buildingId,
          routineName: task.name,
          description: task.description || `Daily ${task.category} routine for ${building.name}`,
          scheduleType: ScheduleType.DAILY,
          scheduleDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          startTime: extractTimeFromTask(task),
          estimatedDuration: estimateTaskDuration(task),
          priority: mapTaskPriorityToRoutinePriority(task.priority),
          isActive: task.status !== 'Cancelled',
          createdDate: new Date(task.created_at || Date.now())
        });
      });

      // Create weekly routines
      const weeklyRoutines = buildingTasks.filter(task => 
        task.schedule_type === 'weekly' || task.schedule_type === 'Weekly'
      );

      weeklyRoutines.forEach((task, index) => {
        routines.push({
          id: `routine-${buildingId}-weekly-${index}`,
          buildingId: buildingId,
          routineName: task.name,
          description: task.description || `Weekly ${task.category} routine for ${building.name}`,
          scheduleType: ScheduleType.WEEKLY,
          scheduleDays: extractWeeklyDays(task),
          startTime: extractTimeFromTask(task),
          estimatedDuration: estimateTaskDuration(task),
          priority: mapTaskPriorityToRoutinePriority(task.priority),
          isActive: task.status !== 'Cancelled',
          createdDate: new Date(task.created_at || Date.now())
        });
      });
    });

    return routines;
  };

  const extractTimeFromTask = (task: OperationalDataTaskAssignment): string => {
    if (task.due_date) {
      const date = new Date(task.due_date);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return '09:00'; // Default time
  };

  const extractWeeklyDays = (task: OperationalDataTaskAssignment): string[] => {
    // This would typically come from task metadata
    // For now, return common working days
    return ['Monday', 'Wednesday', 'Friday'];
  };

  const estimateTaskDuration = (task: OperationalDataTaskAssignment): number => {
    // Estimate duration based on task category
    const durationMap: Record<string, number> = {
      'Cleaning': 30,
      'Maintenance': 60,
      'Inspection': 45,
      'Repair': 90,
      'Compliance': 120,
      'Emergency': 180
    };
    return durationMap[task.category] || 60;
  };

  const mapTaskPriorityToRoutinePriority = (taskPriority: string): RoutinePriority => {
    switch (taskPriority.toLowerCase()) {
      case 'urgent':
      case 'critical': return RoutinePriority.CRITICAL;
      case 'high': return RoutinePriority.HIGH;
      case 'medium': return RoutinePriority.MEDIUM;
      case 'low': return RoutinePriority.LOW;
      default: return RoutinePriority.MEDIUM;
    }
  };

  const getWeekDays = (): string[] => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  };

  const getDayRoutineData = (day: string): DayRoutineData => {
    if (!routineData) {
      return { day, routines: [], tasks: [], completionRate: 0 };
    }

    const dayRoutines = routineData.routines.filter(routine => {
      switch (routine.scheduleType) {
        case ScheduleType.DAILY:
          return true;
        case ScheduleType.WEEKLY:
          return routine.scheduleDays.includes(day);
        default:
          return false;
      }
    });

    const dayTasks = routineData.tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      const dayOfWeek = taskDate.toLocaleDateString('en-US', { weekday: 'long' });
      return dayOfWeek === day;
    });

    const completedTasks = dayTasks.filter(task => task.status === 'Completed');
    const completionRate = dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0;

    return {
      day,
      routines: dayRoutines,
      tasks: dayTasks,
      completionRate
    };
  };

  const getWeekRange = (): string => {
    const startOfWeek = new Date(selectedWeek);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading weekly routines...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('prev')}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Weekly Routines</Text>
          <Text style={styles.weekRange}>{getWeekRange()}</Text>
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateWeek('next')}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {getWeekDays().map((day) => {
          const dayData = getDayRoutineData(day);
          const isSelected = selectedDay === day;
          
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayButton, isSelected && styles.dayButtonActive]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextActive]}>
                {day.slice(0, 3)}
              </Text>
              <Text style={[styles.dayButtonSubtext, isSelected && styles.dayButtonSubtextActive]}>
                {dayData.routines.length} routines
              </Text>
              <View style={[styles.dayProgressBar, { 
                backgroundColor: dayData.completionRate >= 80 ? '#10b981' : 
                               dayData.completionRate >= 60 ? '#f59e0b' : '#ef4444'
              }]}>
                <View style={[styles.dayProgressFill, { width: `${dayData.completionRate}%` }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedDay ? (
          <View style={styles.dayContent}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{selectedDay}</Text>
              <Text style={styles.daySubtitle}>
                {getDayRoutineData(selectedDay).routines.length} routines scheduled
              </Text>
            </View>

            {/* Routines for selected day */}
            {getDayRoutineData(selectedDay).routines.map((routine) => (
              <RoutinePriorityComponent
                key={routine.id}
                routine={routine}
                onRoutinePress={(routine) => {
                  Alert.alert(
                    routine.routineName,
                    `Building: ${routine.buildingId}\nSchedule: ${routine.scheduleType}\nDuration: ${routine.estimatedDuration} minutes`
                  );
                }}
                showBuilding={true}
              />
            ))}

            {/* Tasks for selected day */}
            {getDayRoutineData(selectedDay).tasks.length > 0 && (
              <View style={styles.tasksSection}>
                <Text style={styles.tasksSectionTitle}>Tasks for {selectedDay}</Text>
                {getDayRoutineData(selectedDay).tasks.map((task) => (
                  <View key={task.id} style={styles.taskItem}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                    <Text style={[styles.taskStatus, { 
                      color: task.status === 'Completed' ? '#10b981' : '#f59e0b'
                    }]}>
                      {task.status}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSelectionContainer}>
            <Text style={styles.noSelectionText}>Select a day to view routines</Text>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  weekRange: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  daySelector: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  daySelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    minWidth: 80,
  },
  dayButtonActive: {
    backgroundColor: '#3b82f6',
  },
  dayButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#ffffff',
  },
  dayButtonSubtext: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  dayButtonSubtextActive: {
    color: '#ffffff',
  },
  dayProgressBar: {
    width: '100%',
    height: 2,
    borderRadius: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  dayProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  dayContent: {
    padding: 20,
  },
  dayHeader: {
    marginBottom: 20,
  },
  dayTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  daySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  tasksSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tasksSectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  taskItem: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  taskCategory: {
    color: '#10b981',
    fontSize: 12,
    marginRight: 8,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSelectionText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});

export default WeeklyRoutineScreen;
