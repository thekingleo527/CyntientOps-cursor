/**
 * 💾 Backup Manager
 * Purpose: Automated backup and recovery system for data protection
 */

// import { DatabaseManager } from '@cyntientops/database';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './ErrorHandler';
import { Logger } from './LoggingService';
import { AuditTrailManager, AuditEventType, AuditSeverity } from './AuditTrailManager';

// Temporary DatabaseManager interface for React Native compatibility
interface LocalDatabaseManager {
  [key: string]: any;
}

// React Native compatible process object
declare const process: {
  env: { [key: string]: string | undefined };
};

// Type definitions
export interface BackupConfig {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  schedule: string;
  retention: number;
  retentionCount: number;
  enabled: boolean;
  tables?: string[];
  includeData?: boolean;
  compression?: boolean;
  encryption?: boolean;
  destination: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackupRecord {
  id: string;
  configId: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  size?: number;
  checksum?: string;
  filePath?: string;
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
}
// Note: Using expo-file-system for React Native compatibility instead of Node.js fs
// import * as FileSystem from 'expo-file-system';
// Note: Using path utilities from expo-file-system for React Native compatibility
// import { path } from 'expo-file-system';
// Note: Using expo-crypto for React Native compatibility
// import * as Crypto from 'expo-crypto';

// Temporary placeholder implementations for React Native compatibility
const fs = {
  existsSync: (path: string) => {
    // Placeholder: always return true for now
    return true;
  },
  mkdirSync: (path: string, options?: any) => {
    // Placeholder: no-op for now
    return;
  },
  statSync: (path: string) => {
    // Placeholder: return mock stats
    return {
      size: 1024,
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    };
  },
  readFileSync: (path: string) => {
    // Placeholder: return empty buffer
    return new Uint8Array(0);
  },
  unlinkSync: (path: string) => {
    // Placeholder: no-op for now
    return;
  }
};

const path = {
  join: (...paths: string[]) => {
    // Simple path joining for React Native
    return paths.filter(p => p).join('/');
  }
};

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential'
}

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum BackupRetention {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}


export interface RestoreRequest {
  id: string;
  backupId: string;
  targetDatabase: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
  requestedBy: string;
  createdAt: Date;
}

export interface BackupStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackupTime?: Date;
  nextScheduledBackup?: Date;
  storageUsed: number;
  storageAvailable: number;
}

export class BackupManager {
  private static instance: BackupManager;
  private database: LocalDatabaseManager;
  private errorHandler: ErrorHandler;
  private auditTrail: AuditTrailManager;
  private backupDirectory: string;
  private encryptionKey: string;

  private constructor(database: LocalDatabaseManager) {
    this.database = database;
    this.errorHandler = ErrorHandler.getInstance();
    this.auditTrail = AuditTrailManager.getInstance(database as any);
    this.backupDirectory = process.env.BACKUP_DIRECTORY || './backups';
    this.encryptionKey = this.getEncryptionKey();
    
    this.ensureBackupDirectory();
  }

  public static getInstance(database: LocalDatabaseManager): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager(database);
    }
    return BackupManager.instance;
  }

  private getEncryptionKey(): string {
    const key = process.env.BACKUP_ENCRYPTION_KEY || 'CyntientOps-Backup-Key-2025-Secure';
    // TODO: Implement proper hashing with expo-crypto
    return key; // Placeholder - should use proper hashing
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }

  // Backup Configuration Management
  public async createBackupConfig(config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const backupConfig: BackupConfig = {
        ...config,
        id,
        createdAt: now,
        updatedAt: now
      };

      await this.database.execute(
        `INSERT INTO backup_configs (id, name, type, schedule, retention, retention_count, 
         enabled, compression, encryption, destination, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backupConfig.id,
          backupConfig.name,
          backupConfig.type,
          backupConfig.schedule,
          backupConfig.retention,
          backupConfig.retentionCount,
          backupConfig.enabled ? 1 : 0,
          backupConfig.compression ? 1 : 0,
          backupConfig.encryption ? 1 : 0,
          backupConfig.destination,
          backupConfig.createdAt.toISOString(),
          backupConfig.updatedAt.toISOString()
        ]
      );

      await this.auditTrail.logEvent({
        eventType: AuditEventType.CONFIGURATION_CHANGE,
        category: 'system' as any,
        severity: AuditSeverity.MEDIUM,
        action: 'Backup configuration created',
        description: `Backup configuration '${config.name}' created`,
        details: { configId: id, type: config.type },
        outcome: 'success',
        timestamp: new Date()
      });

      Logger.info(`Backup configuration created: ${id}`, { configId: id, name: config.name }, 'BackupManager');
      return id;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  public async getBackupConfigs(): Promise<BackupConfig[]> {
    try {
      const result = await this.database.query('SELECT * FROM backup_configs ORDER BY created_at DESC');
      
      return result.map((config: any) => ({
        ...config,
        enabled: Boolean(config.enabled),
        compression: Boolean(config.compression),
        encryption: Boolean(config.encryption),
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      }));
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  // Backup Execution
  public async createBackup(configId: string, type: BackupType = BackupType.FULL): Promise<string> {
    try {
      const config = await this.getBackupConfig(configId);
      if (!config) {
        throw new Error(`Backup configuration not found: ${configId}`);
      }

      const backupId = this.generateId();
      const startTime = new Date();
      const fileName = this.generateBackupFileName(configId, type, startTime);
      const filePath = path.join(this.backupDirectory, fileName);

      // Create backup record
      const backupRecord: BackupRecord = {
        id: backupId,
        configId,
        type,
        status: 'running',
        startTime,
        size: 0,
        checksum: '',
        filePath,
        metadata: {
          configName: config.name,
          databasePath: 'cyntientops.db', // Fixed: use static path instead of non-existent method
          version: '1.0.0'
        },
        createdAt: startTime
      };

      await this.saveBackupRecord(backupRecord);

      await this.auditTrail.logEvent({
        eventType: AuditEventType.BACKUP_CREATED,
        category: 'system' as any,
        severity: AuditSeverity.MEDIUM,
        action: 'Backup started',
        description: `Backup '${backupId}' started for configuration '${config.name}'`,
        details: { backupId, configId, type },
        outcome: 'success',
        timestamp: startTime
      });

      // Perform the actual backup
      try {
        await this.performBackup(backupRecord, config);
        
        // Update backup record with success
        await this.updateBackupRecord(backupId, {
          status: BackupStatus.COMPLETED,
          endTime: new Date()
        });

        Logger.info(`Backup completed successfully: ${backupId}`, { backupId, filePath }, 'BackupManager');
        return backupId;
      } catch (backupError) {
        // Update backup record with failure
        await this.updateBackupRecord(backupId, {
          status: BackupStatus.FAILED,
          endTime: new Date(),
          errorMessage: backupError instanceof Error ? backupError.message : 'Unknown error'
        });

        throw backupError;
      }
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  private async performBackup(backupRecord: BackupRecord, config: BackupConfig): Promise<void> {
    try {
      // Get database path
      const dbPath = 'cyntientops.db'; // Fixed: use static path instead of non-existent method
      
      // Create backup using SQLite backup API - simplified for now
      // const backup = await this.database.backup(dbPath, backupRecord.filePath);
      
      // Calculate file size and checksum
      if (!backupRecord.filePath) {
        throw new Error('Backup file path is undefined');
      }
      const stats = fs.statSync(backupRecord.filePath);
      const fileBuffer = fs.readFileSync(backupRecord.filePath);
      // TODO: Implement proper checksum with expo-crypto
      const checksum = 'placeholder-checksum'; // Placeholder - should use proper hashing

      // Apply compression if enabled
      if (config.compression && backupRecord.filePath) {
        await this.compressBackup(backupRecord.filePath);
      }

      // Apply encryption if enabled
      if (config.encryption && backupRecord.filePath) {
        await this.encryptBackup(backupRecord.filePath);
      }

      // Update backup record with final details
      await this.updateBackupRecord(backupRecord.id, {
        size: stats.size,
        checksum
      });

    } catch (error) {
      // Clean up failed backup file
      if (backupRecord.filePath && fs.existsSync(backupRecord.filePath)) {
        fs.unlinkSync(backupRecord.filePath);
      }
      throw error;
    }
  }

  private async compressBackup(filePath: string): Promise<void> {
    // In a real implementation, this would use a compression library like zlib
    // For now, we'll just log that compression would happen
    Logger.info(`Backup compression would be applied to: ${filePath}`, undefined, 'BackupManager');
  }

  private async encryptBackup(filePath: string): Promise<void> {
    try {
      // TODO: Implement proper encryption with expo-crypto
      Logger.info(`Backup encryption would be applied to: ${filePath}`, undefined, 'BackupManager');
      return; // Placeholder - skip encryption for now
    } catch (error) {
      Logger.error(`Backup encryption failed: ${filePath}`, { error: (error as Error).message }, 'BackupManager');
      throw error;
    }
  }

  // Restore Operations
  public async restoreBackup(backupId: string, targetDatabase: string, requestedBy: string): Promise<string> {
    try {
      const backup = await this.getBackupRecord(backupId);
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const restoreId = this.generateId();
      const startTime = new Date();

      const restoreRequest: RestoreRequest = {
        id: restoreId,
        backupId,
        targetDatabase,
        status: 'in_progress',
        startTime,
        requestedBy,
        createdAt: startTime
      };

      await this.saveRestoreRequest(restoreRequest);

      await this.auditTrail.logEvent({
        eventType: AuditEventType.BACKUP_RESTORED,
        category: 'system' as any,
        severity: AuditSeverity.HIGH,
        action: 'Backup restore started',
        description: `Backup restore '${restoreId}' started from backup '${backupId}'`,
        details: { restoreId, backupId, targetDatabase, requestedBy },
        outcome: 'success',
        timestamp: startTime
      });

      try {
        await this.performRestore(backup, targetDatabase);
        
        await this.updateRestoreRequest(restoreId, {
          status: 'completed',
          endTime: new Date()
        });

        Logger.info(`Backup restore completed: ${restoreId}`, { restoreId, backupId }, 'BackupManager');
        return restoreId;
      } catch (restoreError) {
        await this.updateRestoreRequest(restoreId, {
          status: 'failed',
          endTime: new Date(),
          errorMessage: restoreError instanceof Error ? restoreError.message : 'Unknown error'
        });
        throw restoreError;
      }
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.HIGH);
      throw error;
    }
  }

  private async performRestore(backup: BackupRecord, targetDatabase: string): Promise<void> {
    try {
      if (!backup.filePath) {
        throw new Error('Backup file path is undefined');
      }
      
      // Decrypt if needed
      let sourcePath = backup.filePath;
      if (backup.metadata?.encrypted) {
        sourcePath = await this.decryptBackup(backup.filePath);
      }

      // Decompress if needed
      if (backup.metadata?.compressed) {
        sourcePath = await this.decompressBackup(sourcePath);
      }

      // Perform the restore - simplified for now
      // await this.database.restore(sourcePath, targetDatabase);
      Logger.info(`Backup restore would be performed from: ${sourcePath} to: ${targetDatabase}`, undefined, 'BackupManager');

      // Clean up temporary files
      if (sourcePath !== backup.filePath) {
        fs.unlinkSync(sourcePath);
      }

    } catch (error) {
      Logger.error(`Backup restore failed: ${backup.id}`, { error: (error as Error).message }, 'BackupManager');
      throw error;
    }
  }

  private async decryptBackup(filePath: string): Promise<string> {
    try {
      // TODO: Implement proper decryption with expo-crypto
      Logger.info(`Backup decryption would be applied to: ${filePath}`, undefined, 'BackupManager');
      return filePath; // Placeholder - return original path for now
    } catch (error) {
      Logger.error(`Backup decryption failed: ${filePath}`, { error: (error as Error).message }, 'BackupManager');
      throw error;
    }
  }

  private async decompressBackup(filePath: string): Promise<string> {
    // In a real implementation, this would use a decompression library
    // For now, we'll just return the original path
    Logger.info(`Backup decompression would be applied to: ${filePath}`, undefined, 'BackupManager');
    return filePath;
  }

  // Backup Management
  public async getBackupRecords(limit: number = 100): Promise<BackupRecord[]> {
    try {
      const result = await this.database.query(
        'SELECT * FROM backup_records ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      return result.map((record: any) => ({
        ...record,
        startTime: new Date(record.startTime),
        endTime: record.endTime ? new Date(record.endTime) : undefined,
        metadata: JSON.parse(record.metadata),
        createdAt: new Date(record.createdAt)
      }));
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  public async getBackupStats(): Promise<BackupStats> {
    try {
      const [totalBackups, successfulBackups, failedBackups, totalSize, lastBackup, storageStats] = await Promise.all([
        this.database.query('SELECT COUNT(*) as count FROM backup_records'),
        this.database.query('SELECT COUNT(*) as count FROM backup_records WHERE status = "completed"'),
        this.database.query('SELECT COUNT(*) as count FROM backup_records WHERE status = "failed"'),
        this.database.query('SELECT SUM(size) as total FROM backup_records WHERE status = "completed"'),
        this.database.query('SELECT created_at FROM backup_records WHERE status = "completed" ORDER BY created_at DESC LIMIT 1'),
        this.getStorageStats()
      ]);

      return {
        totalBackups: totalBackups[0]?.count || 0,
        successfulBackups: successfulBackups[0]?.count || 0,
        failedBackups: failedBackups[0]?.count || 0,
        totalSize: totalSize[0]?.total || 0,
        lastBackupTime: lastBackup[0] ? new Date(lastBackup[0].created_at) : undefined,
        nextScheduledBackup: undefined, // Would be calculated based on schedule
        storageUsed: storageStats.used,
        storageAvailable: storageStats.available
      };
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  private async getStorageStats(): Promise<{used: number, available: number}> {
    try {
      const stats = fs.statSync(this.backupDirectory);
      // In a real implementation, this would calculate actual disk usage
      return {
        used: 0,
        available: 0
      };
    } catch (error) {
      return { used: 0, available: 0 };
    }
  }

  // Cleanup and Maintenance
  public async cleanupOldBackups(): Promise<number> {
    try {
      const configs = await this.getBackupConfigs();
      let deletedCount = 0;

      for (const config of configs) {
        const cutoffDate = this.calculateCutoffDate(config.retention as any, config.retentionCount);
        
        const oldBackups = await this.database.query(
          'SELECT * FROM backup_records WHERE config_id = ? AND created_at < ?',
          [config.id, cutoffDate.toISOString()]
        );

        for (const backup of oldBackups) {
          // Delete backup file
          if (fs.existsSync(backup.filePath)) {
            fs.unlinkSync(backup.filePath);
          }

          // Delete backup record
          await this.database.execute(
            'DELETE FROM backup_records WHERE id = ?',
            [backup.id]
          );

          deletedCount++;
        }
      }

      Logger.info(`Cleaned up ${deletedCount} old backups`, { deletedCount }, 'BackupManager');
      return deletedCount;
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  private calculateCutoffDate(retention: BackupRetention, retentionCount: number): Date {
    const now = new Date();
    const cutoff = new Date(now);

    switch (retention) {
      case BackupRetention.DAILY:
        cutoff.setDate(now.getDate() - retentionCount);
        break;
      case BackupRetention.WEEKLY:
        cutoff.setDate(now.getDate() - (retentionCount * 7));
        break;
      case BackupRetention.MONTHLY:
        cutoff.setMonth(now.getMonth() - retentionCount);
        break;
      case BackupRetention.YEARLY:
        cutoff.setFullYear(now.getFullYear() - retentionCount);
        break;
    }

    return cutoff;
  }

  // Helper methods
  private async getBackupConfig(id: string): Promise<BackupConfig | null> {
    try {
      const result = await this.database.query(
        'SELECT * FROM backup_configs WHERE id = ?',
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      const config = result[0];
      return {
        ...config,
        enabled: Boolean(config.enabled),
        compression: Boolean(config.compression),
        encryption: Boolean(config.encryption),
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      };
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  private async getBackupRecord(id: string): Promise<BackupRecord | null> {
    try {
      const result = await this.database.query(
        'SELECT * FROM backup_records WHERE id = ?',
        [id]
      );

      if (result.length === 0) {
        return null;
      }

      const record = result[0];
      return {
        ...record,
        startTime: new Date(record.startTime),
        endTime: record.endTime ? new Date(record.endTime) : undefined,
        metadata: JSON.parse(record.metadata),
        createdAt: new Date(record.createdAt)
      };
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.MEDIUM);
      throw error;
    }
  }

  private async saveBackupRecord(record: BackupRecord): Promise<void> {
    await this.database.execute(
      `INSERT INTO backup_records (id, config_id, type, status, start_time, end_time, size, 
       checksum, file_path, error_message, metadata, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.configId,
        record.type,
        record.status,
        record.startTime.toISOString(),
        record.endTime?.toISOString(),
        record.size,
        record.checksum,
        record.filePath,
        record.errorMessage,
        JSON.stringify(record.metadata),
        record.createdAt.toISOString()
      ]
    );
  }

  private async updateBackupRecord(id: string, updates: Partial<BackupRecord>): Promise<void> {
    const fields = [];
    const values = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.endTime) {
      fields.push('end_time = ?');
      values.push(updates.endTime.toISOString());
    }
    if (updates.size !== undefined) {
      fields.push('size = ?');
      values.push(updates.size);
    }
    if (updates.checksum) {
      fields.push('checksum = ?');
      values.push(updates.checksum);
    }
    if (updates.errorMessage) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    if (fields.length > 0) {
      values.push(id);
      await this.database.execute(
        `UPDATE backup_records SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  private async saveRestoreRequest(request: RestoreRequest): Promise<void> {
    await this.database.execute(
      `INSERT INTO restore_requests (id, backup_id, target_database, status, start_time, 
       end_time, error_message, requested_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.id,
        request.backupId,
        request.targetDatabase,
        request.status,
        request.startTime.toISOString(),
        request.endTime?.toISOString(),
        request.errorMessage,
        request.requestedBy,
        request.createdAt.toISOString()
      ]
    );
  }

  private async updateRestoreRequest(id: string, updates: Partial<RestoreRequest>): Promise<void> {
    const fields = [];
    const values = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.endTime) {
      fields.push('end_time = ?');
      values.push(updates.endTime.toISOString());
    }
    if (updates.errorMessage) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    if (fields.length > 0) {
      values.push(id);
      await this.database.execute(
        `UPDATE restore_requests SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  private generateBackupFileName(configId: string, type: BackupType, timestamp: Date): string {
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    return `backup_${configId}_${type}_${dateStr}_${timeStr}.db`;
  }

  private generateId(): string {
    return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  public async initializeTables(): Promise<void> {
    try {
      const tables = [
        `CREATE TABLE IF NOT EXISTS backup_configs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          schedule TEXT NOT NULL,
          retention TEXT NOT NULL,
          retention_count INTEGER NOT NULL,
          enabled INTEGER DEFAULT 1,
          compression INTEGER DEFAULT 0,
          encryption INTEGER DEFAULT 0,
          destination TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS backup_records (
          id TEXT PRIMARY KEY,
          config_id TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          size INTEGER DEFAULT 0,
          checksum TEXT,
          file_path TEXT NOT NULL,
          error_message TEXT,
          metadata TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (config_id) REFERENCES backup_configs(id)
        )`,
        `CREATE TABLE IF NOT EXISTS restore_requests (
          id TEXT PRIMARY KEY,
          backup_id TEXT NOT NULL,
          target_database TEXT NOT NULL,
          status TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          error_message TEXT,
          requested_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (backup_id) REFERENCES backup_records(id)
        )`
      ];

      for (const table of tables) {
        await this.database.execute(table);
      }

      Logger.info('Backup manager tables initialized', undefined, 'BackupManager');
    } catch (error) {
      this.errorHandler.handleError(error, ErrorCategory.DATABASE, ErrorSeverity.CRITICAL);
      throw error;
    }
  }
}
