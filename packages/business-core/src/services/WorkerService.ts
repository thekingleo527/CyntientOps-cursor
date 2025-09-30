/**
 * 👨‍💼 WorkerService
 * Mirrors: CyntientOps/Services/Worker/WorkerService.swift
 * Purpose: Worker management, assignments, and status tracking
 */

import { OperationalDataService } from './OperationalDataService';
import { CanonicalIDs } from '@cyntientops/domain-schema';
import { WorkerProfile, WorkerStatus, ClockStatus } from '@cyntientops/domain-schema';

export interface WorkerLocation {
  workerId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface ClockInData {
  workerId: string;
  buildingId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  notes?: string;
}

export interface WorkerAssignment {
  workerId: string;
  buildingId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

export class WorkerService {
  private operationalDataService: OperationalDataService;
  private workerLocations: Map<string, WorkerLocation> = new Map();
  private clockedInWorkers: Map<string, ClockInData> = new Map();

  constructor() {
    this.operationalDataService = OperationalDataService.getInstance();
  }

  /**
   * Get all workers
   */
  public getWorkers(): WorkerProfile[] {
    return this.operationalDataService.getWorkers();
  }

  /**
   * Get all workers (alias for compatibility)
   */
  public getAllWorkers(): WorkerProfile[] {
    return this.getWorkers();
  }

  /**
   * Get worker by ID
   */
  public getWorkerById(workerId: string): WorkerProfile | undefined {
    return this.operationalDataService.getWorkerById(workerId);
  }

  /**
   * Get active workers (currently clocked in)
   */
  public getActiveWorkers(): WorkerProfile[] {
    return this.getWorkers().filter(worker => worker.isClockedIn);
  }

  /**
   * Get workers assigned to a specific building
   */
  public getWorkersForBuilding(buildingId: string): WorkerProfile[] {
    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }
    
    return this.getWorkers().filter(worker => 
      worker.assignedBuildingIds.includes(buildingId)
    );
  }

  /**
   * Get today's tasks for a worker
   */
  public getTodaysTasks(workerId: string): any[] {
    return this.operationalDataService.getTodaysTasksForWorker(workerId);
  }

  /**
   * Clock in a worker
   */
  public async clockInWorker(clockInData: ClockInData): Promise<boolean> {
    const { workerId, buildingId, latitude, longitude, timestamp, notes } = clockInData;

    // Validate worker and building IDs
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }

    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }

    // Check if worker is already clocked in
    if (this.clockedInWorkers.has(workerId)) {
      throw new Error('Worker is already clocked in');
    }

    // Validate worker is assigned to this building
    const worker = this.getWorkerById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    if (!worker.assignedBuildingIds.includes(buildingId)) {
      throw new Error('Worker is not assigned to this building');
    }

    // Validate location (basic geofencing)
    const building = this.operationalDataService.getBuildingById(buildingId);
    if (building) {
      const distance = this.calculateDistance(
        latitude, longitude,
        building.latitude, building.longitude
      );
      
      // Allow 100 meter radius for clock-in
      if (distance > 0.1) {
        throw new Error('Worker is not within building vicinity');
      }
    }

    // Clock in the worker
    this.clockedInWorkers.set(workerId, clockInData);
    
    // Update worker status
    worker.isClockedIn = true;
    worker.status = 'Clocked In';
    worker.clockStatus = 'clockedIn';
    worker.currentBuildingId = buildingId;

    console.log(`✅ Worker ${worker.name} clocked in at ${building?.name || buildingId}`);
    return true;
  }

  /**
   * Clock out a worker
   */
  public async clockOutWorker(workerId: string, notes?: string): Promise<boolean> {
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }

    const clockInData = this.clockedInWorkers.get(workerId);
    if (!clockInData) {
      throw new Error('Worker is not clocked in');
    }

    const worker = this.getWorkerById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    // Clock out the worker
    this.clockedInWorkers.delete(workerId);
    
    // Update worker status
    worker.isClockedIn = false;
    worker.status = 'Available';
    worker.clockStatus = 'clockedOut';
    worker.currentBuildingId = undefined;

    console.log(`✅ Worker ${worker.name} clocked out`);
    return true;
  }

  /**
   * Get clock-in data for a worker
   */
  public getClockInData(workerId: string): ClockInData | undefined {
    return this.clockedInWorkers.get(workerId);
  }

  /**
   * Check if worker is clocked in
   */
  public isWorkerClockedIn(workerId: string): boolean {
    return this.clockedInWorkers.has(workerId);
  }

  /**
   * Update worker location
   */
  public updateWorkerLocation(workerId: string, latitude: number, longitude: number, accuracy?: number): void {
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }

    const location: WorkerLocation = {
      workerId,
      latitude,
      longitude,
      timestamp: new Date(),
      accuracy
    };

    this.workerLocations.set(workerId, location);
  }

  /**
   * Get worker location
   */
  public getWorkerLocation(workerId: string): WorkerLocation | undefined {
    return this.workerLocations.get(workerId);
  }

  /**
   * Get all worker locations
   */
  public getAllWorkerLocations(): WorkerLocation[] {
    return Array.from(this.workerLocations.values());
  }

  /**
   * Get workers near a location
   */
  public getWorkersNearLocation(latitude: number, longitude: number, radiusKm: number = 1): WorkerLocation[] {
    return this.getAllWorkerLocations().filter(location => {
      const distance = this.calculateDistance(
        latitude, longitude,
        location.latitude, location.longitude
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Assign worker to building
   */
  public assignWorkerToBuilding(workerId: string, buildingId: string, assignedBy: string): boolean {
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }

    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }

    const worker = this.getWorkerById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    if (!worker.assignedBuildingIds.includes(buildingId)) {
      worker.assignedBuildingIds.push(buildingId);
      worker.updatedAt = new Date();
      console.log(`✅ Assigned worker ${worker.name} to building ${buildingId}`);
      return true;
    }

    return false; // Already assigned
  }

  /**
   * Remove worker from building
   */
  public removeWorkerFromBuilding(workerId: string, buildingId: string): boolean {
    if (!CanonicalIDs.Workers.isValidWorkerId(workerId)) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }

    if (!CanonicalIDs.Buildings.isValidBuildingId(buildingId)) {
      throw new Error(`Invalid building ID: ${buildingId}`);
    }

    const worker = this.getWorkerById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const index = worker.assignedBuildingIds.indexOf(buildingId);
    if (index > -1) {
      worker.assignedBuildingIds.splice(index, 1);
      worker.updatedAt = new Date();
      console.log(`✅ Removed worker ${worker.name} from building ${buildingId}`);
      return true;
    }

    return false; // Not assigned
  }

  /**
   * Get worker performance metrics
   */
  public getWorkerPerformanceMetrics(workerId: string): {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    averageTaskTime: number;
    currentStreak: number;
    lastActiveDate: Date | null;
  } {
    const worker = this.getWorkerById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const allTasks = this.operationalDataService.getTasksForWorker(workerId);
    const completedTasks = allTasks.filter(task => task.status === 'Completed').length;
    const totalTasks = allTasks.length;

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      averageTaskTime: 45, // Default 45 minutes
      currentStreak: 0,
      lastActiveDate: worker.isClockedIn ? new Date() : null
    };
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get worker status summary
   */
  public getWorkerStatusSummary(): {
    total: number;
    clockedIn: number;
    available: number;
    offline: number;
  } {
    const workers = this.getWorkers();
    return {
      total: workers.length,
      clockedIn: workers.filter(w => w.isClockedIn).length,
      available: workers.filter(w => w.status === 'Available').length,
      offline: workers.filter(w => w.status === 'Offline').length
    };
  }
}
