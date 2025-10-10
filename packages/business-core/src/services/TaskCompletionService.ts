/**
 * 📋 Task Completion Service
 * Purpose: Manage routine task completion persistence and history
 */

import { DatabaseManager } from '@cyntientops/database';
import type {
  RoutineTaskCompletion,
  TaskCompletionInput,
  TaskCompletionStats,
  WorkerCompletionHistory,
  BuildingCompletionHistory,
  TaskCompletionPhoto
} from '../types/TaskCompletion';

export class TaskCompletionService {
  private static instance: TaskCompletionService | null = null;
  private db: DatabaseManager;

  private constructor(db: DatabaseManager) {
    this.db = db;
  }

  public static getInstance(db: DatabaseManager): TaskCompletionService {
    if (!TaskCompletionService.instance) {
      TaskCompletionService.instance = new TaskCompletionService(db);
    }
    return TaskCompletionService.instance;
  }

  /**
   * Record a task completion
   */
  public async recordCompletion(input: TaskCompletionInput): Promise<RoutineTaskCompletion> {
    const id = this.generateId();
    const now = new Date().toISOString();

    // Calculate duration if actual start/end provided
    let durationMinutes: number | undefined;
    if (input.actualStart && input.actualEnd) {
      const start = new Date(input.actualStart);
      const end = new Date(input.actualEnd);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    const completion: RoutineTaskCompletion = {
      id,
      routineId: input.routineId,
      workerId: input.workerId,
      buildingId: input.buildingId,
      taskName: input.taskName,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      actualStart: input.actualStart,
      actualEnd: input.actualEnd,
      completedAt: now,
      status: input.status,
      durationMinutes,
      photos: input.photos || [],
      notes: input.notes,
      locationVerified: input.locationVerified || false,
      qualityRating: input.qualityRating,
      requiresFollowup: input.requiresFollowup || false,
      followupNotes: input.followupNotes,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };

    await this.db.run(
      `INSERT INTO routine_task_completions (
        id, routine_id, worker_id, building_id, task_name,
        scheduled_start, scheduled_end, actual_start, actual_end,
        completed_at, status, duration_minutes, photos, notes,
        location_verified, quality_rating, requires_followup,
        followup_notes, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        completion.id,
        completion.routineId,
        completion.workerId,
        completion.buildingId,
        completion.taskName,
        completion.scheduledStart,
        completion.scheduledEnd,
        completion.actualStart,
        completion.actualEnd,
        completion.completedAt,
        completion.status,
        completion.durationMinutes,
        JSON.stringify(completion.photos),
        completion.notes,
        completion.locationVerified ? 1 : 0,
        completion.qualityRating,
        completion.requiresFollowup ? 1 : 0,
        completion.followupNotes,
        JSON.stringify(completion.metadata),
        completion.createdAt,
        completion.updatedAt
      ]
    );

    // Update the routine's last_completed timestamp
    await this.db.run(
      `UPDATE routines SET last_completed = ?, updated_at = ? WHERE id = ?`,
      [now, now, completion.routineId]
    );

    return completion;
  }

  /**
   * Get completion by ID
   */
  public async getCompletion(id: string): Promise<RoutineTaskCompletion | null> {
    const row = await this.db.getFirst(
      `SELECT * FROM routine_task_completions WHERE id = ?`,
      [id]
    );

    return row ? this.mapRowToCompletion(row) : null;
  }

  /**
   * Get completions for a specific worker
   */
  public async getWorkerCompletions(
    workerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RoutineTaskCompletion[]> {
    const rows = await this.db.getAll(
      `SELECT * FROM routine_task_completions
       WHERE worker_id = ?
       ORDER BY completed_at DESC
       LIMIT ? OFFSET ?`,
      [workerId, limit, offset]
    );

    return rows.map(row => this.mapRowToCompletion(row));
  }

  /**
   * Get completions for a specific building
   */
  public async getBuildingCompletions(
    buildingId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RoutineTaskCompletion[]> {
    const rows = await this.db.getAll(
      `SELECT * FROM routine_task_completions
       WHERE building_id = ?
       ORDER BY completed_at DESC
       LIMIT ? OFFSET ?`,
      [buildingId, limit, offset]
    );

    return rows.map(row => this.mapRowToCompletion(row));
  }

  /**
   * Get completions for a specific routine
   */
  public async getRoutineCompletions(
    routineId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<RoutineTaskCompletion[]> {
    const rows = await this.db.getAll(
      `SELECT * FROM routine_task_completions
       WHERE routine_id = ?
       ORDER BY completed_at DESC
       LIMIT ? OFFSET ?`,
      [routineId, limit, offset]
    );

    return rows.map(row => this.mapRowToCompletion(row));
  }

  /**
   * Get completions within a date range
   */
  public async getCompletionsByDateRange(
    startDate: string,
    endDate: string,
    workerId?: string,
    buildingId?: string
  ): Promise<RoutineTaskCompletion[]> {
    let query = `SELECT * FROM routine_task_completions
                 WHERE completed_at >= ? AND completed_at <= ?`;
    const params: any[] = [startDate, endDate];

    if (workerId) {
      query += ` AND worker_id = ?`;
      params.push(workerId);
    }

    if (buildingId) {
      query += ` AND building_id = ?`;
      params.push(buildingId);
    }

    query += ` ORDER BY completed_at DESC`;

    const rows = await this.db.getAll(query, params);
    return rows.map(row => this.mapRowToCompletion(row));
  }

  /**
   * Get completion statistics for a worker
   */
  public async getWorkerStats(
    workerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TaskCompletionStats> {
    let query = `SELECT * FROM routine_task_completions WHERE worker_id = ?`;
    const params: any[] = [workerId];

    if (startDate && endDate) {
      query += ` AND completed_at >= ? AND completed_at <= ?`;
      params.push(startDate, endDate);
    }

    const completions = await this.db.getAll(query, params);
    return this.calculateStats(completions.map(row => this.mapRowToCompletion(row)));
  }

  /**
   * Get completion statistics for a building
   */
  public async getBuildingStats(
    buildingId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TaskCompletionStats> {
    let query = `SELECT * FROM routine_task_completions WHERE building_id = ?`;
    const params: any[] = [buildingId];

    if (startDate && endDate) {
      query += ` AND completed_at >= ? AND completed_at <= ?`;
      params.push(startDate, endDate);
    }

    const completions = await this.db.getAll(query, params);
    return this.calculateStats(completions.map(row => this.mapRowToCompletion(row)));
  }

  /**
   * Get worker completion history with stats
   */
  public async getWorkerHistory(
    workerId: string,
    workerName: string,
    startDate?: string,
    endDate?: string
  ): Promise<WorkerCompletionHistory> {
    const completions = await this.getCompletionsByDateRange(
      startDate || '1970-01-01',
      endDate || '2099-12-31',
      workerId
    );
    const stats = this.calculateStats(completions);

    return {
      workerId,
      workerName,
      completions,
      stats
    };
  }

  /**
   * Get building completion history with stats
   */
  public async getBuildingHistory(
    buildingId: string,
    buildingName: string,
    startDate?: string,
    endDate?: string
  ): Promise<BuildingCompletionHistory> {
    const completions = await this.getCompletionsByDateRange(
      startDate || '1970-01-01',
      endDate || '2099-12-31',
      undefined,
      buildingId
    );
    const stats = this.calculateStats(completions);

    return {
      buildingId,
      buildingName,
      completions,
      stats
    };
  }

  /**
   * Update a completion
   */
  public async updateCompletion(
    id: string,
    updates: Partial<TaskCompletionInput>
  ): Promise<RoutineTaskCompletion | null> {
    const existing = await this.getCompletion(id);
    if (!existing) {
      return null;
    }

    const updated: RoutineTaskCompletion = {
      ...existing,
      ...updates,
      photos: updates.photos || existing.photos,
      metadata: updates.metadata || existing.metadata,
      updatedAt: new Date().toISOString()
    };

    await this.db.run(
      `UPDATE routine_task_completions SET
        status = ?,
        actual_start = ?,
        actual_end = ?,
        duration_minutes = ?,
        photos = ?,
        notes = ?,
        location_verified = ?,
        quality_rating = ?,
        requires_followup = ?,
        followup_notes = ?,
        metadata = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        updated.status,
        updated.actualStart,
        updated.actualEnd,
        updated.durationMinutes,
        JSON.stringify(updated.photos),
        updated.notes,
        updated.locationVerified ? 1 : 0,
        updated.qualityRating,
        updated.requiresFollowup ? 1 : 0,
        updated.followupNotes,
        JSON.stringify(updated.metadata),
        updated.updatedAt,
        id
      ]
    );

    return updated;
  }

  /**
   * Delete a completion
   */
  public async deleteCompletion(id: string): Promise<boolean> {
    const result = await this.db.run(
      `DELETE FROM routine_task_completions WHERE id = ?`,
      [id]
    );

    return (result.changes || 0) > 0;
  }

  /**
   * Get completions requiring followup
   */
  public async getCompletionsRequiringFollowup(
    workerId?: string,
    buildingId?: string
  ): Promise<RoutineTaskCompletion[]> {
    let query = `SELECT * FROM routine_task_completions WHERE requires_followup = 1`;
    const params: any[] = [];

    if (workerId) {
      query += ` AND worker_id = ?`;
      params.push(workerId);
    }

    if (buildingId) {
      query += ` AND building_id = ?`;
      params.push(buildingId);
    }

    query += ` ORDER BY completed_at DESC`;

    const rows = await this.db.getAll(query, params);
    return rows.map(row => this.mapRowToCompletion(row));
  }

  // Private helper methods

  private generateId(): string {
    return `rtc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapRowToCompletion(row: any): RoutineTaskCompletion {
    return {
      id: row.id,
      routineId: row.routine_id,
      workerId: row.worker_id,
      buildingId: row.building_id,
      taskName: row.task_name,
      scheduledStart: row.scheduled_start,
      scheduledEnd: row.scheduled_end,
      actualStart: row.actual_start,
      actualEnd: row.actual_end,
      completedAt: row.completed_at,
      status: row.status,
      durationMinutes: row.duration_minutes,
      photos: row.photos ? JSON.parse(row.photos) : [],
      notes: row.notes,
      locationVerified: Boolean(row.location_verified),
      qualityRating: row.quality_rating,
      requiresFollowup: Boolean(row.requires_followup),
      followupNotes: row.followup_notes,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private calculateStats(completions: RoutineTaskCompletion[]): TaskCompletionStats {
    const totalCompletions = completions.length;

    if (totalCompletions === 0) {
      return {
        totalCompletions: 0,
        completedOnTime: 0,
        completedLate: 0,
        averageDuration: 0,
        completionRate: 0,
        photosRequired: 0,
        photosSubmitted: 0,
        averageQualityRating: undefined
      };
    }

    let completedOnTime = 0;
    let completedLate = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let photosRequired = 0;
    let photosSubmitted = 0;
    let totalQualityRating = 0;
    let qualityRatingCount = 0;

    for (const completion of completions) {
      // Check if completed on time
      if (completion.actualEnd) {
        const scheduledEnd = new Date(completion.scheduledEnd);
        const actualEnd = new Date(completion.actualEnd);
        if (actualEnd <= scheduledEnd) {
          completedOnTime++;
        } else {
          completedLate++;
        }
      }

      // Calculate duration
      if (completion.durationMinutes !== undefined) {
        totalDuration += completion.durationMinutes;
        durationCount++;
      }

      // Count photos
      if (completion.photos.length > 0) {
        photosSubmitted += completion.photos.length;
      }
      // Assuming all tasks in a certain category require photos
      // This could be enhanced by checking the routine settings
      photosRequired += 1;

      // Quality rating
      if (completion.qualityRating) {
        totalQualityRating += completion.qualityRating;
        qualityRatingCount++;
      }
    }

    const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    const completionRate = totalCompletions > 0
      ? (completions.filter(c => c.status === 'completed').length / totalCompletions) * 100
      : 0;
    const averageQualityRating = qualityRatingCount > 0
      ? totalQualityRating / qualityRatingCount
      : undefined;

    return {
      totalCompletions,
      completedOnTime,
      completedLate,
      averageDuration,
      completionRate,
      photosRequired,
      photosSubmitted,
      averageQualityRating
    };
  }
}
