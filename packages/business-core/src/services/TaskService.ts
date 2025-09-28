/**
 * 📋 TaskService
 * Mirrors: CyntientOps/Services/Task/TaskService.swift
 * Purpose: Task scheduling, management, and progress tracking
 */

import { OperationalDataService } from './OperationalDataService';
import { WorkerService } from './WorkerService';
import { CanonicalIDs } from '@cyntientops/domain-schema';
import { ContextualTask, TaskStatus, TaskUrgency, TaskCategoryType } from '@cyntientops/domain-schema';

export interface TaskSchedule {
  taskId: string;
  workerId: string;
  buildingId: string;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  estimatedDuration: number;
  priority: TaskUrgency;
  status: TaskStatus;
}

export interface TaskProgress {
  taskId: string;
  workerId: string;
  startTime: Date | null;
  endTime: Date | null;
  progressPercentage: number;
  notes: string[];
  photos: string[];
  status: TaskStatus;
}

export interface TaskFilter {
  workerId?: string;
  buildingId?: string;
  status?: TaskStatus;
  priority?: TaskUrgency;
  category?: TaskCategoryType;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class TaskService {
  private operationalDataService: OperationalDataService;
  private workerService: WorkerService;
  private taskProgress: Map<string, TaskProgress> = new Map();
  private taskSchedules: Map<string, TaskSchedule> = new Map();

  constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
    this.workerService = new WorkerService();
  }

  /**
   * Get all tasks/routines
   */
  public getAllTasks(): any[] {
    return this.operationalDataService.getRoutines();
  }

  /**
   * Get tasks with filters
   */
  public getTasks(filter?: TaskFilter): any[] {
    let tasks = this.getAllTasks();

    if (!filter) return tasks;

    if (filter.workerId) {
      tasks = tasks.filter(task => task.workerId === filter.workerId);
    }

    if (filter.buildingId) {
      tasks = tasks.filter(task => task.buildingId === filter.buildingId);
    }

    if (filter.status) {
      tasks = tasks.filter(task => task.status === filter.status);
    }

    if (filter.priority) {
      tasks = tasks.filter(task => task.priority === filter.priority);
    }

    if (filter.category) {
      tasks = tasks.filter(task => task.category === filter.category);
    }

    if (filter.dateRange) {
      tasks = tasks.filter(task => {
        if (!task.scheduledDate) return false;
        const taskDate = new Date(task.scheduledDate);
        return taskDate >= filter.dateRange!.start && taskDate <= filter.dateRange!.end;
      });
    }

    return tasks;
  }

  /**
   * Get task by ID
   */
  public getTaskById(taskId: string): any | undefined {
    return this.getAllTasks().find(task => task.id === taskId);
  }

  /**
   * Get today's tasks for a worker
   */
  public getTodaysTasksForWorker(workerId: string): any[] {
    return this.operationalDataService.getTodaysTasksForWorker(workerId);
  }

  /**
   * Get tasks for a specific building
   */
  public getTasksForBuilding(buildingId: string): any[] {
    return this.operationalDataService.getTasksForBuilding(buildingId);
  }

  /**
   * Get overdue tasks
   */
  public getOverdueTasks(): any[] {
    const now = new Date();
    return this.getAllTasks().filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now && task.status !== 'Completed';
    });
  }

  /**
   * Get urgent tasks
   */
  public getUrgentTasks(): any[] {
    return this.getAllTasks().filter(task => 
      task.priority === 'high' || task.priority === 'urgent' || task.priority === 'critical'
    );
  }

  /**
   * Get pending tasks
   */
  public getPendingTasks(): any[] {
    return this.getAllTasks().filter(task => task.status === 'Pending');
  }

  /**
   * Get in-progress tasks
   */
  public getInProgressTasks(): any[] {
    return this.getAllTasks().filter(task => task.status === 'In Progress');
  }

  /**
   * Get completed tasks
   */
  public getCompletedTasks(): any[] {
    return this.getAllTasks().filter(task => task.status === 'Completed');
  }

  /**
   * Start a task
   */
  public async startTask(taskId: string, workerId: string): Promise<boolean> {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.workerId !== workerId) {
      throw new Error('Task is not assigned to this worker');
    }

    if (task.status === 'In Progress') {
      throw new Error('Task is already in progress');
    }

    if (task.status === 'Completed') {
      throw new Error('Task is already completed');
    }

    // Check if worker is clocked in
    if (!this.workerService.isWorkerClockedIn(workerId)) {
      throw new Error('Worker must be clocked in to start a task');
    }

    // Update task status
    task.status = 'In Progress';
    task.updatedAt = new Date();

    // Create task progress record
    const progress: TaskProgress = {
      taskId,
      workerId,
      startTime: new Date(),
      endTime: null,
      progressPercentage: 0,
      notes: [],
      photos: [],
      status: 'In Progress'
    };

    this.taskProgress.set(taskId, progress);

    console.log(`✅ Task ${task.title} started by worker ${workerId}`);
    return true;
  }

  /**
   * Complete a task
   */
  public async completeTask(taskId: string, workerId: string, notes?: string, photos?: string[]): Promise<boolean> {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.workerId !== workerId) {
      throw new Error('Task is not assigned to this worker');
    }

    if (task.status !== 'In Progress') {
      throw new Error('Task must be in progress to complete');
    }

    // Update task status
    task.status = 'Completed';
    task.completedAt = new Date();
    task.updatedAt = new Date();

    // Update task progress
    const progress = this.taskProgress.get(taskId);
    if (progress) {
      progress.endTime = new Date();
      progress.progressPercentage = 100;
      progress.status = 'Completed';
      if (notes) progress.notes.push(notes);
      if (photos) progress.photos.push(...photos);
    }

    console.log(`✅ Task ${task.title} completed by worker ${workerId}`);
    return true;
  }

  /**
   * Pause a task
   */
  public async pauseTask(taskId: string, workerId: string, reason?: string): Promise<boolean> {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.workerId !== workerId) {
      throw new Error('Task is not assigned to this worker');
    }

    if (task.status !== 'In Progress') {
      throw new Error('Task must be in progress to pause');
    }

    // Update task status
    task.status = 'Paused';
    task.updatedAt = new Date();

    // Update task progress
    const progress = this.taskProgress.get(taskId);
    if (progress) {
      progress.status = 'Paused';
      if (reason) progress.notes.push(`Paused: ${reason}`);
    }

    console.log(`⏸️ Task ${task.title} paused by worker ${workerId}`);
    return true;
  }

  /**
   * Resume a paused task
   */
  public async resumeTask(taskId: string, workerId: string): Promise<boolean> {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.workerId !== workerId) {
      throw new Error('Task is not assigned to this worker');
    }

    if (task.status !== 'Paused') {
      throw new Error('Task must be paused to resume');
    }

    // Update task status
    task.status = 'In Progress';
    task.updatedAt = new Date();

    // Update task progress
    const progress = this.taskProgress.get(taskId);
    if (progress) {
      progress.status = 'In Progress';
      progress.notes.push('Resumed');
    }

    console.log(`▶️ Task ${task.title} resumed by worker ${workerId}`);
    return true;
  }

  /**
   * Get task progress
   */
  public getTaskProgress(taskId: string): TaskProgress | undefined {
    return this.taskProgress.get(taskId);
  }

  /**
   * Update task progress
   */
  public updateTaskProgress(taskId: string, progressPercentage: number, notes?: string): boolean {
    const progress = this.taskProgress.get(taskId);
    if (!progress) {
      return false;
    }

    progress.progressPercentage = Math.max(0, Math.min(100, progressPercentage));
    if (notes) {
      progress.notes.push(notes);
    }

    return true;
  }

  /**
   * Add photo to task
   */
  public addTaskPhoto(taskId: string, photoPath: string): boolean {
    const progress = this.taskProgress.get(taskId);
    if (!progress) {
      return false;
    }

    progress.photos.push(photoPath);
    return true;
  }

  /**
   * Schedule a task
   */
  public scheduleTask(taskId: string, scheduledDate: Date, startTime: Date, endTime: Date): boolean {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const schedule: TaskSchedule = {
      taskId,
      workerId: task.workerId,
      buildingId: task.buildingId,
      scheduledDate,
      startTime,
      endTime,
      estimatedDuration: task.estimatedDuration || 60,
      priority: this.mapTaskPriority(task.priority || 'medium'),
      status: task.status as TaskStatus
    };

    this.taskSchedules.set(taskId, schedule);
    task.scheduledDate = scheduledDate;

    console.log(`📅 Task ${task.title} scheduled for ${scheduledDate.toDateString()}`);
    return true;
  }

  /**
   * Get task schedule
   */
  public getTaskSchedule(taskId: string): TaskSchedule | undefined {
    return this.taskSchedules.get(taskId);
  }

  /**
   * Get tasks scheduled for a specific date
   */
  public getTasksForDate(date: Date): TaskSchedule[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return Array.from(this.taskSchedules.values()).filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === targetDate.getTime();
    });
  }

  /**
   * Get worker's schedule for a date
   */
  public getWorkerSchedule(workerId: string, date: Date): TaskSchedule[] {
    const tasksForDate = this.getTasksForDate(date);
    return tasksForDate.filter(schedule => schedule.workerId === workerId);
  }

  /**
   * Get task statistics
   */
  public getTaskStatistics(): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    urgent: number;
    completionRate: number;
  } {
    const allTasks = this.getAllTasks();
    const pending = this.getPendingTasks().length;
    const inProgress = this.getInProgressTasks().length;
    const completed = this.getCompletedTasks().length;
    const overdue = this.getOverdueTasks().length;
    const urgent = this.getUrgentTasks().length;

    return {
      total: allTasks.length,
      pending,
      inProgress,
      completed,
      overdue,
      urgent,
      completionRate: allTasks.length > 0 ? completed / allTasks.length : 0
    };
  }

  /**
   * Get task performance metrics for a worker
   */
  public getWorkerTaskMetrics(workerId: string): {
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    currentTasks: number;
  } {
    const workerTasks = this.getTasks({ workerId });
    const completedTasks = workerTasks.filter(t => t.status === 'Completed');
    const currentTasks = workerTasks.filter(t => t.status === 'In Progress' || t.status === 'Pending').length;

    // Calculate average completion time (simplified)
    const averageCompletionTime = 45; // Default 45 minutes

    // Calculate on-time completion rate (simplified)
    const onTimeTasks = completedTasks.filter(task => {
      if (!task.dueDate) return true;
      return new Date(task.completedAt || new Date()) <= new Date(task.dueDate);
    }).length;

    const onTimeCompletionRate = completedTasks.length > 0 ? onTimeTasks / completedTasks.length : 0;

    return {
      totalTasks: workerTasks.length,
      completedTasks: completedTasks.length,
      averageCompletionTime,
      onTimeCompletionRate,
      currentTasks
    };
  }

  /**
   * Map task priority string to TaskUrgency enum
   */
  private mapTaskPriority(priority: string): TaskUrgency {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'critical':
      case 'emergency':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
      case 'normal':
        return 'normal';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * Get tasks by category
   */
  public getTasksByCategory(category: TaskCategoryType): any[] {
    return this.getAllTasks().filter(task => task.category === category);
  }

  /**
   * Get task distribution by worker
   */
  public getTaskDistributionByWorker(): Record<string, number> {
    const distribution: Record<string, number> = {};
    const workers = this.workerService.getWorkers();

    workers.forEach(worker => {
      const workerTasks = this.getTasks({ workerId: worker.id });
      distribution[worker.name] = workerTasks.length;
    });

    return distribution;
  }

  /**
   * Get task distribution by building
   */
  public getTaskDistributionByBuilding(): Record<string, number> {
    const distribution: Record<string, number> = {};
    const buildings = this.operationalDataService.getBuildings();

    buildings.forEach(building => {
      const buildingTasks = this.getTasks({ buildingId: building.id });
      distribution[building.name] = buildingTasks.length;
    });

    return distribution;
  }
}
