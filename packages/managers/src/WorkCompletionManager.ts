/**
 * 🏗️ Work Completion Manager
 * Purpose: Unified system for tracking all work completion across buildings
 * Features: Routine confirmation, task completion, maintenance records, site departure integration
 */

// Removed ServiceContainer import to break circular dependency
// WorkCompletionManager is now independent and can be used by business-core

export interface WorkCompletionRecord {
  id: string;
  buildingId: string;
  buildingName: string;
  workerId: string;
  workerName: string;
  workType: 'routine' | 'task' | 'maintenance' | 'inspection' | 'repair' | 'emergency' | 'departure';
  category: string;
  title: string;
  description: string;
  location?: string; // Building space/location
  completedAt: Date;
  duration?: number; // Minutes spent
  status: 'completed' | 'verified' | 'pending_verification';
  verificationMethod: 'photo' | 'signature' | 'gps' | 'manual' | 'automatic';
  photos?: string[];
  notes?: string;
  metadata: {
    taskId?: string;
    routineId?: string;
    maintenanceId?: string;
    inspectionId?: string;
    departureId?: string;
    gpsLocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    qualityScore?: number; // 1-10 rating
    issuesFound?: string[];
    materialsUsed?: string[];
    cost?: number;
  };
}

export interface RoutineCompletion {
  id: string;
  buildingId: string;
  routineId: string;
  routineTitle: string;
  workerId: string;
  workerName: string;
  completedAt: Date;
  location: string;
  verificationMethod: 'photo' | 'signature' | 'gps' | 'manual';
  photos?: string[];
  notes?: string;
  qualityScore?: number;
  issuesFound?: string[];
}

export interface WorkCompletionStats {
  totalCompletions: number;
  completionsToday: number;
  completionsThisWeek: number;
  completionsThisMonth: number;
  averageQualityScore: number;
  verificationRate: number; // % of work verified
  routineCompletionRate: number;
  taskCompletionRate: number;
  maintenanceCompletionRate: number;
  byWorker: Record<string, number>;
  byWorkType: Record<string, number>;
  byLocation: Record<string, number>;
}

export class WorkCompletionManager {
  private databaseManager: any;
  private taskService: any;
  private buildingService: any;

  constructor(databaseManager: any, taskService?: any, buildingService?: any) {
    this.databaseManager = databaseManager;
    this.taskService = taskService;
    this.buildingService = buildingService;
  }

  /**
   * Record routine completion with verification
   */
  async recordRoutineCompletion(completion: RoutineCompletion): Promise<void> {
    try {
      const workRecord: WorkCompletionRecord = {
        id: `routine_${completion.id}`,
        buildingId: completion.buildingId,
        buildingName: await this.getBuildingName(completion.buildingId),
        workerId: completion.workerId,
        workerName: completion.workerName,
        workType: 'routine',
        category: 'daily_routine',
        title: completion.routineTitle,
        description: `Routine completed: ${completion.routineTitle}`,
        location: completion.location,
        completedAt: completion.completedAt,
        status: 'completed',
        verificationMethod: completion.verificationMethod,
        photos: completion.photos,
        notes: completion.notes,
        metadata: {
          routineId: completion.routineId,
          qualityScore: completion.qualityScore,
          issuesFound: completion.issuesFound,
        }
      };

      await this.saveWorkCompletion(workRecord);
      await this.updateRoutineStatus(completion.routineId, 'completed');
    } catch (error) {
      console.error('Failed to record routine completion:', error);
      throw error;
    }
  }

  /**
   * Record task completion
   */
  async recordTaskCompletion(
    taskId: string,
    buildingId: string,
    workerId: string,
    completedAt: Date,
    verificationMethod: 'photo' | 'signature' | 'gps' | 'manual',
    photos?: string[],
    notes?: string,
    qualityScore?: number,
    issuesFound?: string[]
  ): Promise<void> {
    try {
      const task = await this.getTaskDetails(taskId);
      const worker = await this.getWorkerDetails(workerId);
      const buildingName = await this.getBuildingName(buildingId);

      const workRecord: WorkCompletionRecord = {
        id: `task_${taskId}_${Date.now()}`,
        buildingId,
        buildingName,
        workerId,
        workerName: worker.name,
        workType: 'task',
        category: task.category,
        title: task.title,
        description: task.description,
        location: task.location,
        completedAt,
        duration: task.estimatedDuration,
        status: 'completed',
        verificationMethod,
        photos,
        notes,
        metadata: {
          taskId,
          qualityScore,
          issuesFound,
        }
      };

      await this.saveWorkCompletion(workRecord);
      await this.updateTaskStatus(taskId, 'completed');
    } catch (error) {
      console.error('Failed to record task completion:', error);
      throw error;
    }
  }

  /**
   * Record maintenance completion
   */
  async recordMaintenanceCompletion(
    maintenanceId: string,
    buildingId: string,
    workerId: string,
    completedAt: Date,
    verificationMethod: 'photo' | 'signature' | 'gps' | 'manual',
    photos?: string[],
    notes?: string,
    cost?: number,
    materialsUsed?: string[]
  ): Promise<void> {
    try {
      const maintenance = await this.getMaintenanceDetails(maintenanceId);
      const worker = await this.getWorkerDetails(workerId);
      const buildingName = await this.getBuildingName(buildingId);

      const workRecord: WorkCompletionRecord = {
        id: `maintenance_${maintenanceId}_${Date.now()}`,
        buildingId,
        buildingName,
        workerId,
        workerName: worker.name,
        workType: 'maintenance',
        category: maintenance.category,
        title: maintenance.title,
        description: maintenance.description,
        location: maintenance.location,
        completedAt,
        duration: maintenance.estimatedDuration,
        status: 'completed',
        verificationMethod,
        photos,
        notes,
        metadata: {
          maintenanceId,
          cost,
          materialsUsed,
        }
      };

      await this.saveWorkCompletion(workRecord);
      await this.updateMaintenanceStatus(maintenanceId, 'completed');
    } catch (error) {
      console.error('Failed to record maintenance completion:', error);
      throw error;
    }
  }

  /**
   * Record site departure completion
   */
  async recordSiteDeparture(
    buildingId: string,
    workerId: string,
    completedAt: Date,
    completedTasks: string[],
    completedRoutines: string[],
    photos?: string[],
    notes?: string
  ): Promise<void> {
    try {
      const worker = await this.getWorkerDetails(workerId);
      const buildingName = await this.getBuildingName(buildingId);

      const workRecord: WorkCompletionRecord = {
        id: `departure_${buildingId}_${workerId}_${Date.now()}`,
        buildingId,
        buildingName,
        workerId,
        workerName: worker.name,
        workType: 'departure',
        category: 'site_departure',
        title: `Site Departure - ${buildingName}`,
        description: `Completed ${completedTasks.length} tasks and ${completedRoutines.length} routines`,
        completedAt,
        status: 'completed',
        verificationMethod: 'photo',
        photos,
        notes,
        metadata: {
          departureId: `departure_${buildingId}_${workerId}_${Date.now()}`,
          completedRoutines,
        }
      };

      await this.saveWorkCompletion(workRecord);
    } catch (error) {
      console.error('Failed to record site departure:', error);
      throw error;
    }
  }

  /**
   * Get unified building history
   */
  async getBuildingHistory(
    buildingId: string,
    startDate?: Date,
    endDate?: Date,
    workTypes?: string[],
    workerId?: string
  ): Promise<WorkCompletionRecord[]> {
    try {
      let query = `
        SELECT * FROM work_completion_records 
        WHERE building_id = ?
      `;
      const params: any[] = [buildingId];

      if (startDate) {
        query += ` AND completed_at >= ?`;
        params.push(startDate.toISOString());
      }

      if (endDate) {
        query += ` AND completed_at <= ?`;
        params.push(endDate.toISOString());
      }

      if (workTypes && workTypes.length > 0) {
        query += ` AND work_type IN (${workTypes.map(() => '?').join(',')})`;
        params.push(...workTypes);
      }

      if (workerId) {
        query += ` AND worker_id = ?`;
        params.push(workerId);
      }

      query += ` ORDER BY completed_at DESC`;

      const results = await this.databaseManager.query(query, params);
      return results.map(this.mapDatabaseRecordToWorkCompletion);
    } catch (error) {
      console.error('Failed to get building history:', error);
      return [];
    }
  }

  /**
   * Get work completion statistics
   */
  async getWorkCompletionStats(
    buildingId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WorkCompletionStats> {
    try {
      const history = await this.getBuildingHistory(buildingId, startDate, endDate);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const completionsToday = history.filter(record => record.completedAt >= today).length;
      const completionsThisWeek = history.filter(record => record.completedAt >= weekAgo).length;
      const completionsThisMonth = history.filter(record => record.completedAt >= monthAgo).length;

      const averageQualityScore = history
        .filter(record => record.metadata.qualityScore)
        .reduce((sum, record) => sum + (record.metadata.qualityScore || 0), 0) / 
        history.filter(record => record.metadata.qualityScore).length || 0;

      const verificationRate = history.length > 0 
        ? (history.filter(record => record.verificationMethod !== 'manual').length / history.length) * 100 
        : 0;

      const routineCompletionRate = history.length > 0
        ? (history.filter(record => record.workType === 'routine').length / history.length) * 100
        : 0;

      const taskCompletionRate = history.length > 0
        ? (history.filter(record => record.workType === 'task').length / history.length) * 100
        : 0;

      const maintenanceCompletionRate = history.length > 0
        ? (history.filter(record => record.workType === 'maintenance').length / history.length) * 100
        : 0;

      // Group by worker
      const byWorker: Record<string, number> = {};
      history.forEach(record => {
        byWorker[record.workerId] = (byWorker[record.workerId] || 0) + 1;
      });

      // Group by work type
      const byWorkType: Record<string, number> = {};
      history.forEach(record => {
        byWorkType[record.workType] = (byWorkType[record.workType] || 0) + 1;
      });

      // Group by location
      const byLocation: Record<string, number> = {};
      history.forEach(record => {
        if (record.location) {
          byLocation[record.location] = (byLocation[record.location] || 0) + 1;
        }
      });

      return {
        totalCompletions: history.length,
        completionsToday,
        completionsThisWeek,
        completionsThisMonth,
        averageQualityScore,
        verificationRate,
        routineCompletionRate,
        taskCompletionRate,
        maintenanceCompletionRate,
        byWorker,
        byWorkType,
        byLocation,
      };
    } catch (error) {
      console.error('Failed to get work completion stats:', error);
      return {
        totalCompletions: 0,
        completionsToday: 0,
        completionsThisWeek: 0,
        completionsThisMonth: 0,
        averageQualityScore: 0,
        verificationRate: 0,
        routineCompletionRate: 0,
        taskCompletionRate: 0,
        maintenanceCompletionRate: 0,
        byWorker: {},
        byWorkType: {},
        byLocation: {},
      };
    }
  }

  /**
   * Verify work completion (admin/manager verification)
   */
  async verifyWorkCompletion(
    workCompletionId: string,
    verifiedBy: string,
    verificationNotes?: string,
    qualityScore?: number
  ): Promise<void> {
    try {
      await this.databaseManager.query(`
        UPDATE work_completion_records 
        SET status = 'verified', 
            verified_by = ?, 
            verification_notes = ?,
            quality_score = ?,
            verified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [verifiedBy, verificationNotes, qualityScore, workCompletionId]);
    } catch (error) {
      console.error('Failed to verify work completion:', error);
      throw error;
    }
  }

  // Private helper methods
  private async saveWorkCompletion(record: WorkCompletionRecord): Promise<void> {
    await this.databaseManager.query(`
      INSERT INTO work_completion_records (
        id, building_id, building_name, worker_id, worker_name, work_type, category,
        title, description, location, completed_at, duration, status, verification_method,
        photos, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      record.id,
      record.buildingId,
      record.buildingName,
      record.workerId,
      record.workerName,
      record.workType,
      record.category,
      record.title,
      record.description,
      record.location,
      record.completedAt.toISOString(),
      record.duration,
      record.status,
      record.verificationMethod,
      JSON.stringify(record.photos || []),
      record.notes,
      JSON.stringify(record.metadata)
    ]);
  }

  private mapDatabaseRecordToWorkCompletion(record: any): WorkCompletionRecord {
    return {
      id: record.id,
      buildingId: record.building_id,
      buildingName: record.building_name,
      workerId: record.worker_id,
      workerName: record.worker_name,
      workType: record.work_type,
      category: record.category,
      title: record.title,
      description: record.description,
      location: record.location,
      completedAt: new Date(record.completed_at),
      duration: record.duration,
      status: record.status,
      verificationMethod: record.verification_method,
      photos: JSON.parse(record.photos || '[]'),
      notes: record.notes,
      metadata: JSON.parse(record.metadata || '{}')
    };
  }

  private async getBuildingName(buildingId: string): Promise<string> {
    const result = await this.databaseManager.query(
      'SELECT name FROM buildings WHERE id = ?',
      [buildingId]
    );
    return result[0]?.name || 'Unknown Building';
  }

  private async getWorkerDetails(workerId: string): Promise<{ name: string }> {
    const result = await this.databaseManager.query(
      'SELECT name FROM workers WHERE id = ?',
      [workerId]
    );
    return result[0] || { name: 'Unknown Worker' };
  }

  private async getTaskDetails(taskId: string): Promise<any> {
    const result = await this.databaseManager.query(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );
    return result[0] || {};
  }

  private async getMaintenanceDetails(maintenanceId: string): Promise<any> {
    const result = await this.databaseManager.query(
      'SELECT * FROM maintenance_records WHERE id = ?',
      [maintenanceId]
    );
    return result[0] || {};
  }

  private async updateRoutineStatus(routineId: string, status: string): Promise<void> {
    await this.container.database.query(
      'UPDATE routines SET status = ? WHERE id = ?',
      [status, routineId]
    );
  }

  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await this.container.database.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, taskId]
    );
  }

  private async updateMaintenanceStatus(maintenanceId: string, status: string): Promise<void> {
    await this.container.database.query(
      'UPDATE maintenance_records SET status = ? WHERE id = ?',
      [status, maintenanceId]
    );
  }
}
