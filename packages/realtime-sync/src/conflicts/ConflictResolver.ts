/**
 * @cyntientops/realtime-sync
 * 
 * Conflict Resolution Service
 * Purpose: Resolve conflicts using multiple strategies and apply resolutions
 * Features: Auto-merge, manual resolution, field-level resolution, batch processing
 */

import { Conflict, ConflictResolution, DataRecord } from './ConflictDetector';
import { ThreeWayMergeService, MergeResult } from './ThreeWayMerge';

export type ResolutionStrategy =
  | 'auto_merge'           // Attempt automatic merge
  | 'prefer_local'         // Always use local version
  | 'prefer_server'        // Always use server version
  | 'prefer_newer'         // Use version with newer timestamp
  | 'manual'               // Require manual resolution
  | 'field_level';         // Field-by-field resolution

export class ConflictResolver {
  private db: any; // DatabaseManager
  private mergeService: ThreeWayMergeService;

  constructor(db: any) {
    this.db = db;
    this.mergeService = new ThreeWayMergeService();
  }

  /**
   * Resolve conflict using specified strategy
   */
  async resolveConflict(
    conflict: Conflict,
    strategy: ResolutionStrategy,
    userId?: string,
    manualData?: any
  ): Promise<ConflictResolution> {
    console.log(`[ConflictResolver] Resolving conflict ${conflict.id} with strategy: ${strategy}`);

    let resolution: ConflictResolution;

    switch (strategy) {
      case 'auto_merge':
        resolution = await this.autoMerge(conflict, userId);
        break;

      case 'prefer_local':
        resolution = this.preferLocal(conflict, userId);
        break;

      case 'prefer_server':
        resolution = this.preferServer(conflict, userId);
        break;

      case 'prefer_newer':
        resolution = this.preferNewer(conflict, userId);
        break;

      case 'manual':
        if (!manualData) {
          throw new Error('Manual data required for manual resolution strategy');
        }
        resolution = this.manual(conflict, manualData, userId);
        break;

      case 'field_level':
        if (!manualData) {
          throw new Error('Field selections required for field-level resolution');
        }
        resolution = this.fieldLevel(conflict, manualData, userId);
        break;

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }

    // Save resolution
    await this.saveResolution(conflict, resolution);

    // Apply resolution to database
    await this.applyResolution(conflict, resolution);

    return resolution;
  }

  /**
   * Auto-merge using 3-way merge algorithm
   */
  private async autoMerge(conflict: Conflict, userId?: string): Promise<ConflictResolution> {
    const mergeResult = this.mergeService.merge(conflict);

    if (mergeResult.success) {
      return {
        strategy: 'merge',
        mergedData: mergeResult.mergedData,
        resolvedBy: userId,
        resolvedAt: Date.now(),
        notes: 'Automatically merged using 3-way merge',
      };
    } else {
      // Auto-merge failed, fallback to prefer newer
      return this.preferNewer(conflict, userId);
    }
  }

  /**
   * Prefer local version
   */
  private preferLocal(conflict: Conflict, userId?: string): ConflictResolution {
    return {
      strategy: 'accept_local',
      mergedData: conflict.localVersion.data,
      resolvedBy: userId,
      resolvedAt: Date.now(),
      notes: 'Local version accepted',
    };
  }

  /**
   * Prefer server version
   */
  private preferServer(conflict: Conflict, userId?: string): ConflictResolution {
    return {
      strategy: 'accept_server',
      mergedData: conflict.serverVersion.data,
      resolvedBy: userId,
      resolvedAt: Date.now(),
      notes: 'Server version accepted',
    };
  }

  /**
   * Prefer newer version based on timestamp
   */
  private preferNewer(conflict: Conflict, userId?: string): ConflictResolution {
    const useLocal = conflict.localVersion.lastModified > conflict.serverVersion.lastModified;

    return {
      strategy: useLocal ? 'accept_local' : 'accept_server',
      mergedData: useLocal ? conflict.localVersion.data : conflict.serverVersion.data,
      resolvedBy: userId,
      resolvedAt: Date.now(),
      notes: `Newer version (${useLocal ? 'local' : 'server'}) accepted`,
    };
  }

  /**
   * Manual resolution with custom data
   */
  private manual(
    conflict: Conflict,
    manualData: any,
    userId?: string
  ): ConflictResolution {
    return {
      strategy: 'manual',
      mergedData: manualData,
      resolvedBy: userId,
      resolvedAt: Date.now(),
      notes: 'Manually resolved',
    };
  }

  /**
   * Field-level resolution (choose per field)
   */
  private fieldLevel(
    conflict: Conflict,
    fieldSelections: { [field: string]: 'local' | 'server' | any },
    userId?: string
  ): ConflictResolution {
    const mergedData: any = {};

    // Get all fields
    const allFields = new Set([
      ...Object.keys(conflict.localVersion.data),
      ...Object.keys(conflict.serverVersion.data),
    ]);

    for (const field of allFields) {
      const selection = fieldSelections[field];

      if (selection === 'local') {
        mergedData[field] = conflict.localVersion.data[field];
      } else if (selection === 'server') {
        mergedData[field] = conflict.serverVersion.data[field];
      } else if (selection !== undefined) {
        mergedData[field] = selection; // Custom value
      } else {
        // Default to server value
        mergedData[field] = conflict.serverVersion.data[field];
      }
    }

    return {
      strategy: 'merge',
      mergedData,
      resolvedBy: userId,
      resolvedAt: Date.now(),
      notes: 'Field-level resolution applied',
    };
  }

  /**
   * Save resolution to database
   */
  private async saveResolution(
    conflict: Conflict,
    resolution: ConflictResolution
  ): Promise<void> {
    await this.db.executeSql(
      `UPDATE sync_conflicts 
       SET status = 'resolved', resolution = ?
       WHERE id = ?`,
      [JSON.stringify(resolution), conflict.id]
    );
  }

  /**
   * Apply resolution to actual data table
   */
  private async applyResolution(
    conflict: Conflict,
    resolution: ConflictResolution
  ): Promise<void> {
    if (!resolution.mergedData) {
      throw new Error('No merged data to apply');
    }

    // Build UPDATE query dynamically
    const fields = Object.keys(resolution.mergedData).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => resolution.mergedData[f]);

    await this.db.executeSql(
      `UPDATE ${conflict.tableName}
       SET ${setClause}, version = version + 1, last_modified = ?, last_modified_by = ?
       WHERE id = ?`,
      [...values, Date.now(), resolution.resolvedBy || 'system', conflict.recordId]
    );

    console.log(`[ConflictResolver] Applied resolution to ${conflict.tableName}.${conflict.recordId}`);
  }

  /**
   * Batch resolve multiple conflicts with same strategy
   */
  async batchResolve(
    conflicts: Conflict[],
    strategy: ResolutionStrategy,
    userId?: string
  ): Promise<{ resolved: number; failed: number; errors: string[] }> {
    let resolved = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const conflict of conflicts) {
      try {
        await this.resolveConflict(conflict, strategy, userId);
        resolved++;
      } catch (error: any) {
        failed++;
        errors.push(`${conflict.id}: ${error.message}`);
      }
    }

    return { resolved, failed, errors };
  }

  /**
   * Get resolution recommendation
   */
  getRecommendation(conflict: Conflict): {
    strategy: ResolutionStrategy;
    confidence: number;
    reasoning: string;
  } {
    // Rule 1: If local is much newer, prefer local
    const timeDiff = conflict.localVersion.lastModified - conflict.serverVersion.lastModified;
    if (timeDiff > 60000) { // 1 minute
      return {
        strategy: 'prefer_local',
        confidence: 0.9,
        reasoning: 'Local version is significantly newer',
      };
    }

    // Rule 2: If server is much newer, prefer server
    if (timeDiff < -60000) {
      return {
        strategy: 'prefer_server',
        confidence: 0.9,
        reasoning: 'Server version is significantly newer',
      };
    }

    // Rule 3: If we have common ancestor, try auto-merge
    if (conflict.commonAncestor) {
      return {
        strategy: 'auto_merge',
        confidence: 0.7,
        reasoning: 'Common ancestor available for 3-way merge',
      };
    }

    // Rule 4: Default to prefer newer
    return {
      strategy: 'prefer_newer',
      confidence: 0.5,
      reasoning: 'No clear winner, using timestamp heuristic',
    };
  }
}
