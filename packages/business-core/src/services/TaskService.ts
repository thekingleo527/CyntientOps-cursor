/**
 * @cyntientops/business-core
 * 
 * TaskService - Connect routines.json to task display with time-based filtering
 */

import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { OperationalDataService } from './OperationalDataService';
import routinesData from '@cyntientops/data-seed/src/routines.json';
import workersData from '@cyntientops/data-seed/src/workers.json';
import buildingsData from '@cyntientops/data-seed/src/buildings.json';

// Types
export interface RoutineTask {
  id: string;
  title: string;
  description: string;
  building: string;
  buildingId: string;
  assignedWorker: string;
  workerId: string;
  category: string;
  skillLevel: 'Basic' | 'Intermediate' | 'Advanced';
  recurrence: 'Daily' | 'Weekly' | 'Monthly' | 'One-time';
  startHour: number;
  endHour: number;
  daysOfWeek: string;
  estimatedDuration: number;
  requiresPhoto: boolean;
}

export interface TaskSchedule {
  now: OperationalDataTaskAssignment[];
  next: OperationalDataTaskAssignment[];
  today: OperationalDataTaskAssignment[];
  urgent: OperationalDataTaskAssignment[];
  completed: OperationalDataTaskAssignment[];
}

export class TaskService {
  private static instance: TaskService;
  private routines: RoutineTask[] = [];
  private database: any;
  private dashboardSync: any;
  private operationalDataService: OperationalDataService;

  constructor(database?: any, dashboardSync?: any) {
    this.database = database;
    this.dashboardSync = dashboardSync;
    this.operationalDataService = OperationalDataService.getInstance();
    this.initializeRoutines();
  }

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  private initializeRoutines(): void {
    this.routines = routinesData.map(routine => ({
      id: routine.id,
      title: routine.title,
      description: routine.description,
      building: routine.building,
      buildingId: routine.buildingId,
      assignedWorker: routine.assignedWorker,
      workerId: routine.workerId,
      category: routine.category,
      skillLevel: routine.skillLevel,
      recurrence: routine.recurrence,
      startHour: routine.startHour,
      endHour: routine.endHour,
      daysOfWeek: routine.daysOfWeek,
      estimatedDuration: routine.estimatedDuration,
      requiresPhoto: routine.requiresPhoto,
    }));
  }

  /**
   * Get all tasks (alias for compatibility)
   */
  public getAllTasks(): OperationalDataTaskAssignment[] {
    const allTasks: OperationalDataTaskAssignment[] = [];
    
    // Get tasks for all workers
    const workers = this.operationalDataService.getWorkers();
    workers.forEach(worker => {
      const workerTasks = this.generateWorkerTasks(worker.id);
      allTasks.push(...workerTasks.now, ...workerTasks.next, ...workerTasks.today, ...workerTasks.urgent, ...workerTasks.completed);
    });
    
    return allTasks;
  }

  generateWorkerTasks(workerId: string): TaskSchedule {
    const workerRoutines = this.routines.filter(r => r.workerId === workerId);
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const currentDayName = this.getDayName(currentDay);

    const nowTasks: OperationalDataTaskAssignment[] = [];
    const nextTasks: OperationalDataTaskAssignment[] = [];
    const todayTasks: OperationalDataTaskAssignment[] = [];
    const urgentTasks: OperationalDataTaskAssignment[] = [];
    const completedTasks: OperationalDataTaskAssignment[] = [];

    workerRoutines.forEach(routine => {
      const daysOfWeek = routine.daysOfWeek.split(',');
      const isScheduledToday = daysOfWeek.includes(currentDayName);

      if (isScheduledToday) {
        const task = this.createTaskFromRoutine(routine, now);
        
        if (currentHour >= routine.startHour && currentHour < routine.endHour) {
          task.status = 'in_progress';
          task.priority = 'high';
          nowTasks.push(task);
        } else if (currentHour < routine.startHour) {
          task.status = 'pending';
          task.priority = this.calculatePriority(routine, now);
          nextTasks.push(task);
        } else if (currentHour >= routine.endHour) {
          task.status = 'completed';
          task.priority = 'low';
          completedTasks.push(task);
        }

        todayTasks.push(task);

        if (this.isTaskUrgent(task, now)) {
          urgentTasks.push(task);
        }
      }
    });

    return {
      now: this.sortTasks(nowTasks),
      next: this.sortTasks(nextTasks),
      today: this.sortTasks(todayTasks),
      urgent: this.sortTasks(urgentTasks),
      completed: this.sortTasks(completedTasks),
    };
  }

  private createTaskFromRoutine(routine: RoutineTask, baseDate: Date): OperationalDataTaskAssignment {
    const dueDate = new Date(baseDate);
    dueDate.setHours(routine.endHour, 0, 0, 0);

    const building = buildingsData.find(b => b.id === routine.buildingId);
    const worker = workersData.find(w => w.id === routine.workerId);

    return {
      id: `task_${routine.id}_${Date.now()}`,
      title: routine.title,
      description: routine.description,
      buildingId: routine.buildingId,
      buildingName: building?.name || routine.building,
      buildingAddress: building?.address || '',
      assignedWorkerId: routine.workerId,
      assignedWorkerName: worker?.name || routine.assignedWorker,
      category: routine.category,
      priority: this.calculatePriority(routine, baseDate),
      status: 'pending',
      createdAt: new Date(),
      dueDate,
      estimatedDuration: routine.estimatedDuration,
      requiresPhoto: routine.requiresPhoto,
      skillLevel: routine.skillLevel,
      recurrence: routine.recurrence,
      location: {
        latitude: building?.latitude || 40.7580,
        longitude: building?.longitude || -73.9855,
      },
      metadata: {
        routineId: routine.id,
        startHour: routine.startHour,
        endHour: routine.endHour,
        daysOfWeek: routine.daysOfWeek,
      },
    };
  }

  private calculatePriority(routine: RoutineTask, currentTime: Date): 'low' | 'medium' | 'high' | 'urgent' {
    const currentHour = currentTime.getHours();
    const timeUntilStart = routine.startHour - currentHour;

    if (timeUntilStart <= 2 && timeUntilStart >= 0) return 'high';
    if (timeUntilStart < 0) return 'urgent';
    if (timeUntilStart <= 8) return 'medium';
        return 'low';
  }

  private isTaskUrgent(task: OperationalDataTaskAssignment, currentTime: Date): boolean {
    const dueTime = new Date(task.dueDate).getTime();
    const currentTimeMs = currentTime.getTime();
    const timeUntilDue = dueTime - currentTimeMs;
    return timeUntilDue < 0 || timeUntilDue < 60 * 60 * 1000;
  }

  private getDayName(dayNumber: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  }

  private sortTasks(tasks: OperationalDataTaskAssignment[]): OperationalDataTaskAssignment[] {
    return tasks.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  getWorkerRoutines(workerId: string): RoutineTask[] {
    return this.routines.filter(r => r.workerId === workerId);
  }

  getAllRoutines(): RoutineTask[] {
    return [...this.routines];
  }
}

export default TaskService;
