/**
 * 📅 Daily Routine Screen
 * Mirrors: CyntientOps/Views/Worker/WorkerRoutineSheet.swift
 * Purpose: Daily routine management with proper data hydration
 */

import React, { useState, useEffect } from 'react';
import config from '../config/app.config';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseManager } from '@cyntientops/database';
import { Building, OperationalDataTaskAssignment, WorkerProfile } from '@cyntientops/domain-schema';
import { RoutinePriorityComponent, BuildingRoutine, ScheduleType, RoutinePriority } from '@cyntientops/ui-components';
import { TodaysProgressDetailView } from '@cyntientops/ui-components';
import { Logger } from '@cyntientops/business-core';

interface DailyRoutineData {
  routines: BuildingRoutine[];
  tasks: OperationalDataTaskAssignment[];
  buildings: Building[];
  workers: WorkerProfile[];
  todayStats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
}

interface TimeSlot {
  time: string;
  routines: BuildingRoutine[];
  tasks: OperationalDataTaskAssignment[];
}

export const DailyRoutineScreen: React.FC = () => {
  const [routineData, setRoutineData] = useState<DailyRoutineData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'progress'>('timeline');

  useEffect(() => {
    loadDailyRoutineData();
  }, [selectedDate]);

  const loadDailyRoutineData = async () => {
    try {
      setIsLoading(true);
      
      const databaseManager = DatabaseManager.getInstance({
        path: config.databasePath
      });
      await databaseManager.initialize();

      // Load all data
      const [buildings, workers, tasks] = await Promise.all([
        databaseManager.getBuildings(),
        databaseManager.getWorkers(),
        databaseManager.getTasks()
      ]);

      // Filter tasks for selected date
      const todayTasks = filterTasksForDate(tasks, selectedDate);
      
      // Generate daily routines from tasks
      const routines = generateDailyRoutines(todayTasks, buildings);
      
      // Calculate today's stats
      const todayStats = calculateTodayStats(todayTasks);
      
      setRoutineData({
        routines,
        tasks: todayTasks,
        buildings,
        workers,
        todayStats
      });

    } catch (error) {
      Logger.error('Failed to load daily routine data:', undefined, 'DailyRoutineScreen.tsx');
      Alert.alert('Error', 'Failed to load daily routine data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDailyRoutineData();
    setIsRefreshing(false);
  };

  const filterTasksForDate = (tasks: OperationalDataTaskAssignment[], date: Date): OperationalDataTaskAssignment[] => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate >= targetDate && taskDate < nextDay;
    });
  };

  const generateDailyRoutines = (tasks: OperationalDataTaskAssignment[], buildings: Building[]): BuildingRoutine[] => {
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

      // Create routines for each task
      buildingTasks.forEach((task, index) => {
        routines.push({
          id: `routine-${buildingId}-${index}`,
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

  const calculateTodayStats = (tasks: OperationalDataTaskAssignment[]) => {
    const completedTasks = tasks.filter(task => task.status === 'Completed');
    const pendingTasks = tasks.filter(task => task.status !== 'Completed');
    const overdueTasks = pendingTasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date()
    );

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
    };
  };

  const getTimeSlots = (): TimeSlot[] => {
    if (!routineData) return [];

    const timeSlots: TimeSlot[] = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    hours.forEach(hour => {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const routines = routineData.routines.filter(routine => {
        const routineHour = parseInt(routine.startTime.split(':')[0]);
        return routineHour === hour;
      });
      const tasks = routineData.tasks.filter(task => {
        if (!task.due_date) return false;
        const taskHour = new Date(task.due_date).getHours();
        return taskHour === hour;
      });

      if (routines.length > 0 || tasks.length > 0) {
        timeSlots.push({
          time: timeString,
          routines,
          tasks
        });
      }
    });

    return timeSlots;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading daily routines...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Daily Routines</Text>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          {isToday(selectedDate) && (
            <Text style={styles.todayIndicator}>Today</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      {routineData && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routineData.todayStats.totalTasks}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {routineData.todayStats.completedTasks}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {routineData.todayStats.pendingTasks}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {routineData.todayStats.overdueTasks}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'timeline' && styles.toggleButtonActive]}
          onPress={() => setViewMode('timeline')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'timeline' && styles.toggleButtonTextActive]}>
            Timeline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'progress' && styles.toggleButtonActive]}
          onPress={() => setViewMode('progress')}
        >
          <Text style={[styles.toggleButtonText, viewMode === 'progress' && styles.toggleButtonTextActive]}>
            Progress
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'timeline' ? (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
        >
          {getTimeSlots().map((timeSlot) => (
            <View key={timeSlot.time} style={styles.timeSlot}>
              <View style={styles.timeSlotHeader}>
                <Text style={styles.timeSlotTime}>{timeSlot.time}</Text>
                <Text style={styles.timeSlotCount}>
                  {timeSlot.routines.length + timeSlot.tasks.length} items
                </Text>
              </View>
              
              {/* Routines */}
              {timeSlot.routines.map((routine) => (
                <RoutinePriorityComponent
                  key={routine.id}
                  routine={routine}
                  onRoutinePress={(routine) => {
                    Alert.alert(
                      routine.routineName,
                      `Building: ${routine.buildingId}\nTime: ${routine.startTime}\nDuration: ${routine.estimatedDuration} minutes`
                    );
                  }}
                  showBuilding={true}
                  compact={true}
                />
              ))}
              
              {/* Tasks */}
              {timeSlot.tasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskCategory}>{task.category}</Text>
                    <Text style={[styles.taskStatus, { 
                      color: task.status === 'Completed' ? '#10b981' : '#f59e0b'
                    }]}>
                      {task.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
          
          {getTimeSlots().length === 0 && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No routines scheduled for this day</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.progressContainer}>
          {routineData && (
            <TodaysProgressDetailView
              tasks={routineData.tasks}
              buildings={routineData.buildings}
              onTaskPress={(task) => {
                Alert.alert(
                  task.name,
                  `Category: ${task.category}\nStatus: ${task.status}\nPriority: ${task.priority}`
                );
              }}
              onBuildingPress={(building) => {
                Alert.alert(
                  building.name,
                  `Address: ${building.address}\nType: ${building.building_type || 'N/A'}`
                );
              }}
            />
          )}
        </View>
      )}
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
  dateText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  todayIndicator: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  timeSlot: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotTime: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeSlotCount: {
    color: '#9ca3af',
    fontSize: 12,
  },
  taskItem: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskContent: {
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  progressContainer: {
    flex: 1,
  },
});

export default DailyRoutineScreen;
