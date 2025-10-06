/**
 * ⏰ Clock In Manager
 * Mirrors: CyntientOps/Managers/ClockInManager.swift
 * Purpose: Worker clock in/out functionality with GPS validation
 */

import { DatabaseManager } from '@cyntientops/database';
import { ClockStatus } from '@cyntientops/domain-schema';

// QuickBooks Integration Interface
interface QuickBooksClient {
  syncTimeEntry(entry: TimeEntry): Promise<boolean>;
  syncPayrollData(payroll: PayrollData): Promise<boolean>;
  getWorkerRate(workerId: string): Promise<number>;
}

interface TimeEntry {
  workerId: string;
  buildingId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  totalHours: number;
  rate: number;
  totalPay: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
}

interface PayrollData {
  workerId: string;
  workerName: string;
  totalHours: number;
  baseRate: number;
  totalPay: number;
  deductions: number;
  netPay: number;
  period: string;
}

export interface ClockInData {
  workerId: string;
  buildingId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  notes?: string;
  accuracy?: number;
}

export interface ClockOutData {
  workerId: string;
  timestamp: Date;
  notes?: string;
  totalHours?: number;
}

export interface ClockSession {
  id: string;
  workerId: string;
  buildingId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  totalHours?: number;
  status: ClockStatus;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
}

export interface ClockInValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  distanceFromBuilding?: number;
  isWithinGeofence?: boolean;
}

export class ClockInManager {
  private static instance: ClockInManager;
  private databaseManager: DatabaseManager;
  private quickBooksClient?: QuickBooksClient;
  private activeSessions: Map<string, ClockSession> = new Map();
  private geofenceRadius: number = 100; // meters

  private constructor(databaseManager: DatabaseManager, quickBooksClient?: QuickBooksClient) {
    this.databaseManager = databaseManager;
    this.quickBooksClient = quickBooksClient;
  }

  public static getInstance(databaseManager: DatabaseManager, quickBooksClient?: QuickBooksClient): ClockInManager {
    if (!ClockInManager.instance) {
      ClockInManager.instance = new ClockInManager(databaseManager, quickBooksClient);
    }
    return ClockInManager.instance;
  }

  /**
   * Clock in a worker with GPS validation
   */
  public async clockInWorker(clockInData: ClockInData): Promise<{
    success: boolean;
    sessionId?: string;
    validation: ClockInValidation;
  }> {
    try {
      // Validate clock in data
      const validation = await this.validateClockIn(clockInData);
      
      if (!validation.isValid) {
        return {
          success: false,
          validation
        };
      }

      // Check if worker is already clocked in
      if (this.isWorkerClockedIn(clockInData.workerId)) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: ['Worker is already clocked in'],
            warnings: []
          }
        };
      }

      // Create clock session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: ClockSession = {
        id: sessionId,
        workerId: clockInData.workerId,
        buildingId: clockInData.buildingId,
        clockInTime: clockInData.timestamp,
        status: 'clockedIn',
        location: {
          latitude: clockInData.latitude,
          longitude: clockInData.longitude,
          accuracy: clockInData.accuracy
        },
        notes: clockInData.notes
      };

      // Store session
      this.activeSessions.set(clockInData.workerId, session);

      // Update worker status in database
      await this.updateWorkerStatus(clockInData.workerId, 'Clocked In');

      // Log clock in event
      await this.logClockEvent({
        workerId: clockInData.workerId,
        buildingId: clockInData.buildingId,
        eventType: 'clock_in',
        timestamp: clockInData.timestamp,
        location: {
          latitude: clockInData.latitude,
          longitude: clockInData.longitude,
          accuracy: clockInData.accuracy
        },
        notes: clockInData.notes
      });

      // Sync to QuickBooks
      if (this.quickBooksClient) {
        try {
          const workerRate = await this.quickBooksClient.getWorkerRate(clockInData.workerId);
          const timeEntry: TimeEntry = {
            workerId: clockInData.workerId,
            buildingId: clockInData.buildingId,
            clockInTime: clockInData.timestamp,
            totalHours: 0, // Will be updated on clock out
            rate: workerRate,
            totalPay: 0, // Will be calculated on clock out
            location: {
              latitude: clockInData.latitude,
              longitude: clockInData.longitude,
              accuracy: clockInData.accuracy
            },
            notes: clockInData.notes
          };
          await this.quickBooksClient.syncTimeEntry(timeEntry);
        } catch (error) {
          console.warn('QuickBooks sync failed for clock in:', error);
        }
      }

      return {
        success: true,
        sessionId,
        validation
      };
    } catch (error) {
      console.error('Clock in error:', error);
      return {
        success: false,
        validation: {
          isValid: false,
          errors: ['Clock in failed due to system error'],
          warnings: []
        }
      };
    }
  }

  /**
   * Clock out a worker
   */
  public async clockOutWorker(clockOutData: ClockOutData): Promise<{
    success: boolean;
    session?: ClockSession;
  }> {
    try {
      // Get active session
      const session = this.activeSessions.get(clockOutData.workerId);
      
      if (!session) {
        return {
          success: false,
          session: undefined
        };
      }

      // Calculate total hours
      const totalHours = this.calculateTotalHours(session.clockInTime, clockOutData.timestamp);

      // Update session
      const updatedSession: ClockSession = {
        ...session,
        clockOutTime: clockOutData.timestamp,
        totalHours,
        status: 'clockedOut',
        notes: clockOutData.notes || session.notes
      };

      // Store completed session
      await this.storeCompletedSession(updatedSession);

      // Remove from active sessions
      this.activeSessions.delete(clockOutData.workerId);

      // Update worker status
      await this.updateWorkerStatus(clockOutData.workerId, 'Available');

      // Log clock out event
      await this.logClockEvent({
        workerId: clockOutData.workerId,
        buildingId: session.buildingId,
        eventType: 'clock_out',
        timestamp: clockOutData.timestamp,
        notes: clockOutData.notes
      });

      // Sync to QuickBooks
      if (this.quickBooksClient) {
        try {
          const workerRate = await this.quickBooksClient.getWorkerRate(clockOutData.workerId);
          const totalPay = totalHours * workerRate;
          
          const timeEntry: TimeEntry = {
            workerId: clockOutData.workerId,
            buildingId: session.buildingId,
            clockInTime: session.clockInTime,
            clockOutTime: clockOutData.timestamp,
            totalHours,
            rate: workerRate,
            totalPay,
            location: session.location,
            notes: clockOutData.notes || session.notes
          };
          
          await this.quickBooksClient.syncTimeEntry(timeEntry);
          
          // Sync payroll data
          const payrollData: PayrollData = {
            workerId: clockOutData.workerId,
            workerName: await this.getWorkerName(clockOutData.workerId),
            totalHours,
            baseRate: workerRate,
            totalPay,
            deductions: 0, // Will be calculated based on tax rules
            netPay: totalPay,
            period: this.getCurrentPayPeriod()
          };
          
          await this.quickBooksClient.syncPayrollData(payrollData);
        } catch (error) {
          console.warn('QuickBooks sync failed for clock out:', error);
        }
      }

      return {
        success: true,
        session: updatedSession
      };
    } catch (error) {
      console.error('Clock out error:', error);
      return {
        success: false,
        session: undefined
      };
    }
  }

  /**
   * Validate clock in data
   */
  private async validateClockIn(clockInData: ClockInData): Promise<ClockInValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate worker exists
    const worker = this.databaseManager.getWorkerById(clockInData.workerId);
    if (!worker) {
      errors.push('Worker not found');
    }

    // Validate building exists
    const building = this.databaseManager.getBuildingById(clockInData.buildingId);
    if (!building) {
      errors.push('Building not found');
    }

    // Validate GPS coordinates
    if (!clockInData.latitude || !clockInData.longitude) {
      errors.push('GPS coordinates required');
    }

    // Check GPS accuracy
    if (clockInData.accuracy && clockInData.accuracy > 50) {
      warnings.push('GPS accuracy is low');
    }

    // Validate location proximity to building
    if (worker && building && clockInData.latitude && clockInData.longitude) {
      const distance = this.calculateDistance(
        clockInData.latitude,
        clockInData.longitude,
        building.latitude,
        building.longitude
      );

      if (distance > this.geofenceRadius) {
        errors.push(`Worker is ${Math.round(distance)}m away from building (max: ${this.geofenceRadius}m)`);
      } else if (distance > this.geofenceRadius * 0.8) {
        warnings.push(`Worker is near the edge of the geofence (${Math.round(distance)}m from building)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      distanceFromBuilding: building ? this.calculateDistance(
        clockInData.latitude,
        clockInData.longitude,
        building.latitude,
        building.longitude
      ) : undefined,
      isWithinGeofence: building ? this.calculateDistance(
        clockInData.latitude,
        clockInData.longitude,
        building.latitude,
        building.longitude
      ) <= this.geofenceRadius : false
    };
  }

  /**
   * Check if worker is clocked in
   */
  public isWorkerClockedIn(workerId: string): boolean {
    return this.activeSessions.has(workerId);
  }

  /**
   * Get active session for worker
   */
  public getActiveSession(workerId: string): ClockSession | undefined {
    return this.activeSessions.get(workerId);
  }

  /**
   * Get all active sessions
   */
  public getAllActiveSessions(): ClockSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get worker's clock status
   */
  public getWorkerClockStatus(workerId: string): ClockStatus {
    const session = this.activeSessions.get(workerId);
    return session ? session.status : 'clockedOut';
  }

  /**
   * Calculate total hours worked
   */
  private calculateTotalHours(startTime: Date, endTime: Date): number {
    const diffMs = endTime.getTime() - startTime.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Update worker status in database
   */
  private async updateWorkerStatus(workerId: string, status: string): Promise<void> {
    // This would update the worker status in the database
    // For now, we'll just log it
    console.log(`Worker ${workerId} status updated to: ${status}`);
  }

  /**
   * Store completed session
   */
  private async storeCompletedSession(session: ClockSession): Promise<void> {
    // This would store the completed session in the database
    // For now, we'll just log it
    console.log(`Stored completed session: ${session.id} for worker ${session.workerId}`);
  }

  /**
   * Log clock event
   */
  private async logClockEvent(event: {
    workerId: string;
    buildingId: string;
    eventType: 'clock_in' | 'clock_out';
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    notes?: string;
  }): Promise<void> {
    // This would log the clock event to the database
    console.log(`Clock event: ${event.eventType} for worker ${event.workerId} at ${event.timestamp}`);
  }

  /**
   * Get clock in statistics for a worker
   */
  public async getWorkerClockStats(workerId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    totalSessions: number;
    totalHours: number;
    averageHours: number;
    lastClockIn?: Date;
    lastClockOut?: Date;
  }> {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      // Query clock sessions from database
      const sessions = await this.databaseManager.query(
        `SELECT * FROM clock_sessions 
         WHERE worker_id = ? AND clock_in_time >= ? 
         ORDER BY clock_in_time DESC`,
        [workerId, startDate.toISOString()]
      );

      if (!sessions || sessions.length === 0) {
        return {
          totalSessions: 0,
          totalHours: 0,
          averageHours: 0
        };
      }

      // Calculate statistics
      const totalSessions = sessions.length;
      let totalHours = 0;
      let completedSessions = 0;

      sessions.forEach(session => {
        if (session.clock_out_time) {
          const clockIn = new Date(session.clock_in_time);
          const clockOut = new Date(session.clock_out_time);
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          completedSessions++;
        }
      });

      const averageHours = completedSessions > 0 ? totalHours / completedSessions : 0;
      const lastSession = sessions[0];

      return {
        totalSessions,
        totalHours,
        averageHours,
        lastClockIn: lastSession.clock_in_time ? new Date(lastSession.clock_in_time) : undefined,
        lastClockOut: lastSession.clock_out_time ? new Date(lastSession.clock_out_time) : undefined
      };
    } catch (error) {
      console.error('Failed to get worker clock stats:', error);
      // Fallback to mock data
      return {
        totalSessions: 0,
        totalHours: 0,
        averageHours: 0
      };
    }
  }

  /**
   * Set geofence radius
   */
  public setGeofenceRadius(radius: number): void {
    this.geofenceRadius = radius;
  }

  /**
   * Get geofence radius
   */
  public getGeofenceRadius(): number {
    return this.geofenceRadius;
  }

  /**
   * Get worker name for QuickBooks sync
   */
  private async getWorkerName(workerId: string): Promise<string> {
    try {
      const worker = await this.databaseManager.get('workers', workerId);
      return worker?.name || 'Unknown Worker';
    } catch (error) {
      console.warn('Failed to get worker name:', error);
      return 'Unknown Worker';
    }
  }

  /**
   * Get current pay period for QuickBooks sync
   */
  private getCurrentPayPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // Weekly pay period (Monday to Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(day - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`;
  }

  /**
   * Set QuickBooks client
   */
  public setQuickBooksClient(quickBooksClient: QuickBooksClient): void {
    this.quickBooksClient = quickBooksClient;
  }

  /**
   * Get QuickBooks sync status
   */
  public isQuickBooksEnabled(): boolean {
    return this.quickBooksClient !== undefined;
  }
}
