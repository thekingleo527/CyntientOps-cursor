/**
 * 🗺️ Route Manager
 * Purpose: Workflow-based operations and route optimization using canonical data
 * Data Source: packages/data-seed/src/routines.json (NO MOCK DATA)
 */

import { DatabaseManager } from '@cyntientops/database';
import { NamedCoordinate } from '@cyntientops/domain-schema';
import { Logger } from './LoggingService';

export interface RouteTask {
  id: string;
  title: string;
  description: string;
  building: string;
  buildingId: string;
  assignedWorker: string;
  workerId: string;
  category: string;
  skillLevel: string;
  recurrence: string;
  startHour: number;
  endHour: number;
  daysOfWeek: string;
  estimatedDuration: number;
  requiresPhoto: boolean;
  coordinates?: NamedCoordinate;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate?: Date;
}

export interface RouteOptimization {
  workerId: string;
  workerName: string;
  totalTasks: number;
  totalDuration: number;
  estimatedCompletion: Date;
  route: RouteTask[];
  efficiency: number;
  distance: number;
}

export interface RouteOperationalBridge {
  optimizeRoute: (workerId: string, date: Date) => Promise<RouteOptimization>;
  getWorkerTasks: (workerId: string, date: Date) => Promise<RouteTask[]>;
  updateTaskStatus: (taskId: string, status: RouteTask['status']) => Promise<void>;
  getBuildingCoordinates: (buildingId: string) => Promise<NamedCoordinate | null>;
  calculateDistance: (from: NamedCoordinate, to: NamedCoordinate) => number;
}

export class RouteManager implements RouteOperationalBridge {
  private static instance: RouteManager;
  private database: DatabaseManager;
  private routines: RouteTask[] = [];

  private constructor(database: DatabaseManager) {
    this.database = database;
    Logger.debug('RouteManager initialized', undefined, 'RouteManager');
    this.loadRoutines();
  }

  public static getInstance(database: DatabaseManager): RouteManager {
    if (!RouteManager.instance) {
      RouteManager.instance = new RouteManager(database);
    }
    return RouteManager.instance;
  }

  private async loadRoutines(): Promise<void> {
    try {
      // Load canonical routine data from data-seed
      const routinesData = await import('@cyntientops/data-seed');
      this.routines = routinesData.routines.map((routine: any) => ({
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
        priority: this.calculatePriority(routine),
        status: 'pending' as const,
        dueDate: this.calculateDueDate(routine),
      }));
      console.log(`Loaded ${this.routines.length} canonical routines`);
    } catch (error) {
      Logger.error('Failed to load routines:', undefined, 'RouteManager');
      this.routines = [];
    }
  }

  private calculatePriority(routine: any): number {
    // Priority based on recurrence and skill level
    let priority = 1;
    
    if (routine.recurrence === 'Daily') priority += 3;
    else if (routine.recurrence === 'Weekly') priority += 2;
    else if (routine.recurrence === 'Monthly') priority += 1;
    
    if (routine.skillLevel === 'Advanced') priority += 2;
    else if (routine.skillLevel === 'Intermediate') priority += 1;
    
    return priority;
  }

  private calculateDueDate(routine: any): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate due date based on recurrence
    switch (routine.recurrence) {
      case 'Daily':
        return new Date(today.getTime() + 24 * 60 * 60 * 1000);
      case 'Weekly':
        return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'Monthly':
        return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  public async optimizeRoute(workerId: string, date: Date): Promise<RouteOptimization> {
    const workerTasks = await this.getWorkerTasks(workerId, date);
    
    if (workerTasks.length === 0) {
      return {
        workerId,
        workerName: this.getWorkerName(workerId),
        totalTasks: 0,
        totalDuration: 0,
        estimatedCompletion: date,
        route: [],
        efficiency: 0,
        distance: 0,
      };
    }

    // Sort tasks by priority and start time
    const sortedTasks = workerTasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.startHour - b.startHour; // Earlier start time first
    });

    // Calculate total duration and distance
    const totalDuration = sortedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    const distance = await this.calculateRouteDistance(sortedTasks);
    
    // Calculate efficiency (tasks per hour)
    const efficiency = sortedTasks.length / (totalDuration / 60);
    
    // Estimate completion time
    const estimatedCompletion = new Date(date);
    estimatedCompletion.setHours(estimatedCompletion.getHours() + Math.ceil(totalDuration / 60));

    return {
      workerId,
      workerName: this.getWorkerName(workerId),
      totalTasks: sortedTasks.length,
      totalDuration,
      estimatedCompletion,
      route: sortedTasks,
      efficiency,
      distance,
    };
  }

  public async getWorkerTasks(workerId: string, date: Date): Promise<RouteTask[]> {
    const dayOfWeek = this.getDayOfWeek(date);
    
    return this.routines.filter(routine => {
      // Filter by worker
      if (routine.workerId !== workerId) return false;
      
      // Filter by day of week
      const days = routine.daysOfWeek.split(',');
      if (!days.includes(dayOfWeek)) return false;
      
      // Filter by recurrence
      const isDue = this.isTaskDue(routine, date);
      if (!isDue) return false;
      
      return true;
    });
  }

  public async updateTaskStatus(taskId: string, status: RouteTask['status']): Promise<void> {
    const task = this.routines.find(r => r.id === taskId);
    if (task) {
      task.status = status;
      // In a real implementation, this would update the database
      console.log(`Updated task ${taskId} status to ${status}`);
    }
  }

  public async getBuildingCoordinates(buildingId: string): Promise<NamedCoordinate | null> {
    try {
      // Get building data from database
      const buildings = await this.database.getBuildings();
      const building = buildings.find(b => b.id === buildingId);
      
      if (building) {
        return {
          id: building.id,
          name: building.name,
          latitude: building.latitude,
          longitude: building.longitude,
          address: building.address,
        };
      }
      
      return null;
    } catch (error) {
      Logger.error('Failed to get building coordinates:', undefined, 'RouteManager');
      return null;
    }
  }

  public calculateDistance(from: NamedCoordinate, to: NamedCoordinate): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(from.latitude)) * Math.cos(this.toRadians(to.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private async calculateRouteDistance(tasks: RouteTask[]): Promise<number> {
    let totalDistance = 0;
    
    for (let i = 0; i < tasks.length - 1; i++) {
      const currentTask = tasks[i];
      const nextTask = tasks[i + 1];
      
      const currentCoords = await this.getBuildingCoordinates(currentTask.buildingId);
      const nextCoords = await this.getBuildingCoordinates(nextTask.buildingId);
      
      if (currentCoords && nextCoords) {
        totalDistance += this.calculateDistance(currentCoords, nextCoords);
      }
    }
    
    return totalDistance;
  }

  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private isTaskDue(routine: RouteTask, date: Date): boolean {
    const today = new Date();
    const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (routine.recurrence) {
      case 'Daily':
        return daysDiff >= 0;
      case 'Weekly':
        return daysDiff >= 0 && daysDiff % 7 === 0;
      case 'Monthly':
        return daysDiff >= 0 && daysDiff % 30 === 0;
      default:
        return daysDiff >= 0;
    }
  }

  private getWorkerName(workerId: string): string {
    const worker = this.routines.find(r => r.workerId === workerId);
    return worker ? worker.assignedWorker : 'Unknown Worker';
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Public methods for external access
  public getRoutines(): RouteTask[] {
    return this.routines;
  }

  public getRoutinesByWorker(workerId: string): RouteTask[] {
    return this.routines.filter(routine => routine.workerId === workerId);
  }

  public getRoutinesByBuilding(buildingId: string): RouteTask[] {
    return this.routines.filter(routine => routine.buildingId === buildingId);
  }

  public getRoutinesByCategory(category: string): RouteTask[] {
    return this.routines.filter(routine => routine.category === category);
  }

  public getRoutinesByRecurrence(recurrence: string): RouteTask[] {
    return this.routines.filter(routine => routine.recurrence === recurrence);
  }
}
