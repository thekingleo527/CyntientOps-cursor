/**
 * 📱 Offline Task Manager
 * Purpose: Complete offline task management with sync capabilities
 * Features: Offline CRUD operations, conflict resolution, sync queue management
 */

import { Logger } from './LoggingService';
import { OfflineSupportManager } from './OfflineSupportManager';
import { OperationalDataTaskAssignment } from '@cyntientops/domain-schema';

export interface OfflineTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  buildingId: string;
  workerId: string;
  createdAt: string;
  updatedAt: string;
  isOffline: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  localVersion: number;
  serverVersion?: number;
}

export interface TaskSyncConflict {
  taskId: string;
  field: string;
  localValue: any;
  serverValue: any;
  resolution: 'local' | 'server' | 'merged';
}

export class OfflineTaskManager {
  private static instance: OfflineTaskManager;
  private offlineManager: OfflineSupportManager | null = null;
  private tasks: Map<string, OfflineTask> = new Map();
  private syncQueue: string[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): OfflineTaskManager {
    if (!OfflineTaskManager.instance) {
      OfflineTaskManager.instance = new OfflineTaskManager();
    }
    return OfflineTaskManager.instance;
  }

  public async initialize(offlineManager: OfflineSupportManager): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.offlineManager = offlineManager;
    await this.loadOfflineTasks();
    this.isInitialized = true;

    Logger.info('Offline task manager initialized', 'OfflineTaskManager');
  }

  private async loadOfflineTasks(): Promise<void> {
    try {
      const tasksData = await this.offlineManager!.getCachedData('offline_tasks');
      if (tasksData) {
        this.tasks = new Map(Object.entries(tasksData));
        Logger.info(`Loaded ${this.tasks.size} offline tasks`, 'OfflineTaskManager');
      }
    } catch (error) {
      Logger.error('Failed to load offline tasks', error, 'OfflineTaskManager');
    }
  }

  private async saveOfflineTasks(): Promise<void> {
    try {
      const tasksData = Object.fromEntries(this.tasks);
      await this.offlineManager!.cacheData('offline_tasks', tasksData);
    } catch (error) {
      Logger.error('Failed to save offline tasks', error, 'OfflineTaskManager');
    }
  }

  public async createTask(taskData: Omit<OfflineTask, 'id' | 'createdAt' | 'updatedAt' | 'isOffline' | 'syncStatus' | 'localVersion'>): Promise<OfflineTask> {
    const task: OfflineTask = {
      ...taskData,
      id: this.generateTaskId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOffline: true,
      syncStatus: 'pending',
      localVersion: 1,
    };

    this.tasks.set(task.id, task);
    this.syncQueue.push(task.id);
    await this.saveOfflineTasks();

    // Queue for sync
    await this.offlineManager!.queueSyncAction({
      type: 'CREATE',
      entity: 'task',
      data: task,
      maxRetries: 3, // Added missing maxRetries property
    });

    Logger.info(`Created offline task: ${task.id}`, 'OfflineTaskManager');
    return task;
  }

  public async updateTask(taskId: string, updates: Partial<OfflineTask>): Promise<OfflineTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) {
      Logger.warn(`Task not found: ${taskId}`, 'OfflineTaskManager');
      return null;
    }

    const updatedTask: OfflineTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
      localVersion: task.localVersion + 1,
      syncStatus: 'pending',
    };

    this.tasks.set(taskId, updatedTask);
    
    // Add to sync queue if not already there
    if (!this.syncQueue.includes(taskId)) {
      this.syncQueue.push(taskId);
    }

    await this.saveOfflineTasks();

    // Queue for sync
    await this.offlineManager!.queueSyncAction({
      type: 'UPDATE',
      entity: 'task',
      data: updatedTask,
      maxRetries: 3, // Added missing maxRetries property
    });

    Logger.info(`Updated offline task: ${taskId}`, 'OfflineTaskManager');
    return updatedTask;
  }

  public async deleteTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      Logger.warn(`Task not found: ${taskId}`, 'OfflineTaskManager');
      return false;
    }

    this.tasks.delete(taskId);
    await this.saveOfflineTasks();

    // Queue for sync
    await this.offlineManager!.queueSyncAction({
      type: 'DELETE',
      entity: 'task',
      data: { id: taskId },
      maxRetries: 3, // Added missing maxRetries property
    });

    Logger.info(`Deleted offline task: ${taskId}`, 'OfflineTaskManager');
    return true;
  }

  public async getTask(taskId: string): Promise<OfflineTask | null> {
    return this.tasks.get(taskId) || null;
  }

  public async getTasksForWorker(workerId: string): Promise<OfflineTask[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.workerId === workerId);
    return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getTasksForBuilding(buildingId: string): Promise<OfflineTask[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.buildingId === buildingId);
    return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getPendingTasks(): Promise<OfflineTask[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.status === 'pending');
    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  public async getOverdueTasks(): Promise<OfflineTask[]> {
    const now = new Date();
    const tasks = Array.from(this.tasks.values()).filter(task => {
      const dueDate = new Date(task.dueDate);
      return task.status !== 'completed' && task.status !== 'cancelled' && dueDate < now;
    });
    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  public async syncTaskFromServer(serverTask: any): Promise<void> {
    const existingTask = this.tasks.get(serverTask.id);
    
    if (existingTask) {
      // Check for conflicts
      const conflicts = this.detectConflicts(existingTask, serverTask);
      
      if (conflicts.length > 0) {
        await this.resolveConflicts(serverTask.id, conflicts);
      } else {
        // No conflicts, update with server data
        const updatedTask: OfflineTask = {
          ...existingTask,
          ...serverTask,
          isOffline: false,
          syncStatus: 'synced',
          serverVersion: serverTask.version || 1,
        };
        
        this.tasks.set(serverTask.id, updatedTask);
        await this.saveOfflineTasks();
      }
    } else {
      // New task from server
      const newTask: OfflineTask = {
        ...serverTask,
        isOffline: false,
        syncStatus: 'synced',
        serverVersion: serverTask.version || 1,
        localVersion: 1,
      };
      
      this.tasks.set(serverTask.id, newTask);
      await this.saveOfflineTasks();
    }
  }

  private detectConflicts(localTask: OfflineTask, serverTask: any): TaskSyncConflict[] {
    const conflicts: TaskSyncConflict[] = [];
    
    // Check for conflicts in key fields
    const fieldsToCheck = ['title', 'description', 'status', 'priority', 'dueDate'];
    
    for (const field of fieldsToCheck) {
      if (localTask[field as keyof OfflineTask] !== serverTask[field]) {
        conflicts.push({
          taskId: localTask.id,
          field,
          localValue: localTask[field as keyof OfflineTask],
          serverValue: serverTask[field],
          resolution: 'server', // Default resolution
        });
      }
    }
    
    return conflicts;
  }

  private async resolveConflicts(taskId: string, conflicts: TaskSyncConflict[]): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    Logger.warn(`Resolving ${conflicts.length} conflicts for task: ${taskId}`, 'OfflineTaskManager');

    // Apply conflict resolution
    const resolvedTask = { ...task };
    
    for (const conflict of conflicts) {
      switch (conflict.field) {
        case 'status':
          // Server wins for status changes
          resolvedTask.status = conflict.serverValue;
          conflict.resolution = 'server';
          break;
        case 'title':
        case 'description':
          // Merge for text fields
          resolvedTask[conflict.field] = conflict.serverValue;
          conflict.resolution = 'server';
          break;
        case 'dueDate':
          // Use the later date
          const localDate = new Date(conflict.localValue);
          const serverDate = new Date(conflict.serverValue);
          resolvedTask.dueDate = serverDate > localDate ? conflict.serverValue : conflict.localValue;
          conflict.resolution = serverDate > localDate ? 'server' : 'local';
          break;
        default:
          // Default to server value
          (resolvedTask as any)[conflict.field] = conflict.serverValue;
          conflict.resolution = 'server';
      }
    }

    resolvedTask.syncStatus = 'synced';
    resolvedTask.updatedAt = new Date().toISOString();
    
    this.tasks.set(taskId, resolvedTask);
    await this.saveOfflineTasks();

    Logger.info(`Resolved conflicts for task: ${taskId}`, 'OfflineTaskManager');
  }

  public async markTaskAsSynced(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.syncStatus = 'synced';
      task.isOffline = false;
      await this.saveOfflineTasks();
    }
  }

  public async markTaskAsSyncFailed(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.syncStatus = 'failed';
      await this.saveOfflineTasks();
    }
  }

  public getSyncQueue(): string[] {
    return [...this.syncQueue];
  }

  public removeFromSyncQueue(taskId: string): void {
    const index = this.syncQueue.indexOf(taskId);
    if (index !== -1) {
      this.syncQueue.splice(index, 1);
    }
  }

  public getOfflineStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      offlineTasks: tasks.filter(t => t.isOffline).length,
      pendingSync: tasks.filter(t => t.syncStatus === 'pending').length,
      syncFailed: tasks.filter(t => t.syncStatus === 'failed').length,
      overdueTasks: tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        return t.status !== 'completed' && t.status !== 'cancelled' && dueDate < new Date();
      }).length,
    };
  }

  private generateTaskId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.tasks.clear();
    this.syncQueue = [];
    this.offlineManager = null;
    this.isInitialized = false;
    
    Logger.info('Offline task manager destroyed', 'OfflineTaskManager');
  }

  public static destroyInstance(): void {
    if (OfflineTaskManager.instance) {
      OfflineTaskManager.instance.destroy();
      OfflineTaskManager.instance = null as any;
    }
  }
}

export default OfflineTaskManager;
