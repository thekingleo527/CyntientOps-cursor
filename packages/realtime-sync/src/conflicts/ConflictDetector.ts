/**
 * @cyntientops/realtime-sync
 * 
 * Conflict Detection Service
 * Purpose: Detect conflicts between local and server data versions
 * Features: 3-way conflict detection, version tracking, deletion conflict handling
 */

export interface DataRecord {
  id: string;
  tableName: string;
  data: any;
  version: number;
  lastModified: number;
  lastModifiedBy: string;
  hash: string;
}

export interface Conflict {
  id: string;
  recordId: string;
  tableName: string;
  type: 'update_update' | 'update_delete' | 'delete_delete';
  localVersion: DataRecord;
  serverVersion: DataRecord;
  commonAncestor?: DataRecord;
  detectedAt: number;
  status: 'pending' | 'resolved' | 'deferred';
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'accept_local' | 'accept_server' | 'merge' | 'manual';
  mergedData?: any;
  resolvedBy?: string;
  resolvedAt: number;
  notes?: string;
}

export class ConflictDetector {
  private db: any; // DatabaseManager

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Detect conflicts between local and server versions
   */
  async detectConflicts(
    localRecords: DataRecord[],
    serverRecords: DataRecord[]
  ): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Create maps for efficient lookup
    const localMap = new Map(localRecords.map(r => [r.id, r]));
    const serverMap = new Map(serverRecords.map(r => [r.id, r]));

    // Check for conflicts
    for (const [id, localRecord] of localMap) {
      const serverRecord = serverMap.get(id);

      if (!serverRecord) {
        // Record exists locally but not on server (possible delete conflict)
        const deleted = await this.checkIfDeletedOnServer(id, localRecord.tableName);

        if (deleted) {
          conflicts.push(await this.createConflict(
            id,
            localRecord,
            null,
            'update_delete'
          ));
        }
      } else {
        // Both versions exist - check for update conflict
        if (this.hasConflict(localRecord, serverRecord)) {
          conflicts.push(await this.createConflict(
            id,
            localRecord,
            serverRecord,
            'update_update'
          ));
        }
      }
    }

    // Check for records on server that were deleted locally
    for (const [id, serverRecord] of serverMap) {
      if (!localMap.has(id)) {
        const deletedLocally = await this.checkIfDeletedLocally(id, serverRecord.tableName);

        if (deletedLocally) {
          conflicts.push(await this.createConflict(
            id,
            null,
            serverRecord,
            'update_delete'
          ));
        }
      }
    }

    console.log(`[ConflictDetector] Detected ${conflicts.length} conflicts`);
    return conflicts;
  }

  /**
   * Check if records have conflicting changes
   */
  private hasConflict(local: DataRecord, server: DataRecord): boolean {
    // Version conflict
    if (local.version !== server.version) {
      return true;
    }

    // Hash conflict (data changed)
    if (local.hash !== server.hash) {
      return true;
    }

    // Timestamp conflict (modified by different users at similar times)
    const timeDiff = Math.abs(local.lastModified - server.lastModified);
    if (timeDiff < 5000 && local.lastModifiedBy !== server.lastModifiedBy) {
      return true;
    }

    return false;
  }

  /**
   * Create conflict record with common ancestor lookup
   */
  private async createConflict(
    recordId: string,
    local: DataRecord | null,
    server: DataRecord | null,
    type: Conflict['type']
  ): Promise<Conflict> {
    const tableName = (local || server)!.tableName;

    // Try to find common ancestor
    const ancestor = await this.findCommonAncestor(recordId, tableName);

    return {
      id: `conflict_${Date.now()}_${recordId}`,
      recordId,
      tableName,
      type,
      localVersion: local!,
      serverVersion: server!,
      commonAncestor: ancestor || undefined,
      detectedAt: Date.now(),
      status: 'pending',
    };
  }

  /**
   * Find common ancestor version (for 3-way merge)
   */
  private async findCommonAncestor(
    recordId: string,
    tableName: string
  ): Promise<DataRecord | null> {
    try {
      // Query version history table
      const result = await this.db.executeSql(
        `SELECT * FROM version_history
         WHERE record_id = ? AND table_name = ?
         ORDER BY version DESC LIMIT 1`,
        [recordId, tableName]
      );

      if (result.rows.length > 0) {
        const row = result.rows.item(0);
        return {
          id: row.record_id,
          tableName: row.table_name,
          data: JSON.parse(row.data),
          version: row.version,
          lastModified: row.timestamp,
          lastModifiedBy: row.modified_by,
          hash: row.hash,
        };
      }

      return null;
    } catch (error) {
      console.error('[ConflictDetector] Failed to find ancestor:', error);
      return null;
    }
  }

  /**
   * Check if record was deleted on server
   */
  private async checkIfDeletedOnServer(
    recordId: string,
    tableName: string
  ): Promise<boolean> {
    try {
      const result = await this.db.executeSql(
        `SELECT * FROM deletion_log
         WHERE record_id = ? AND table_name = ? AND source = 'server'`,
        [recordId, tableName]
      );

      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if record was deleted locally
   */
  private async checkIfDeletedLocally(
    recordId: string,
    tableName: string
  ): Promise<boolean> {
    try {
      const result = await this.db.executeSql(
        `SELECT * FROM deletion_log
         WHERE record_id = ? AND table_name = ? AND source = 'local'`,
        [recordId, tableName]
      );

      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save conflict to database
   */
  async saveConflict(conflict: Conflict): Promise<void> {
    await this.db.executeSql(
      `INSERT OR REPLACE INTO sync_conflicts (
        id, record_id, table_name, type,
        local_version, server_version, common_ancestor,
        detected_at, status, resolution
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conflict.id,
        conflict.recordId,
        conflict.tableName,
        conflict.type,
        JSON.stringify(conflict.localVersion),
        JSON.stringify(conflict.serverVersion),
        conflict.commonAncestor ? JSON.stringify(conflict.commonAncestor) : null,
        conflict.detectedAt,
        conflict.status,
        conflict.resolution ? JSON.stringify(conflict.resolution) : null,
      ]
    );
  }

  /**
   * Get all pending conflicts
   */
  async getPendingConflicts(): Promise<Conflict[]> {
    const result = await this.db.executeSql(
      `SELECT * FROM sync_conflicts WHERE status = 'pending' ORDER BY detected_at ASC`,
      []
    );

    const conflicts: Conflict[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      conflicts.push({
        id: row.id,
        recordId: row.record_id,
        tableName: row.table_name,
        type: row.type,
        localVersion: JSON.parse(row.local_version),
        serverVersion: JSON.parse(row.server_version),
        commonAncestor: row.common_ancestor ? JSON.parse(row.common_ancestor) : undefined,
        detectedAt: row.detected_at,
        status: row.status,
        resolution: row.resolution ? JSON.parse(row.resolution) : undefined,
      });
    }

    return conflicts;
  }
}
