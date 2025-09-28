/**
 * 🗄️ Database Utilities
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: Database utility functions
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export async function validateDatabaseIntegrity(db: SQLite.SQLiteDatabase): Promise<boolean> {
  try {
    const result = await db.getFirstAsync('PRAGMA integrity_check;');
    return result?.integrity_check === 'ok';
  } catch (error) {
    console.error('Database integrity check failed:', error);
    return false;
  }
}

export async function createBackup(db: SQLite.SQLiteDatabase, backupPath: string): Promise<void> {
  try {
    // Get database file path
    const dbPath = db.getConfig().name;
    
    // Copy database file to backup location
    await FileSystem.copyAsync({
      from: dbPath,
      to: backupPath
    });
    
    console.log(`Database backup created at: ${backupPath}`);
  } catch (error) {
    console.error('Failed to create database backup:', error);
    throw error;
  }
}

export async function restoreFromBackup(backupPath: string, dbPath: string): Promise<void> {
  try {
    // Check if backup file exists
    const backupInfo = await FileSystem.getInfoAsync(backupPath);
    if (!backupInfo.exists) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Copy backup to database location
    await FileSystem.copyAsync({
      from: backupPath,
      to: dbPath
    });
    
    console.log(`Database restored from backup: ${backupPath}`);
  } catch (error) {
    console.error('Failed to restore database from backup:', error);
    throw error;
  }
}

export async function getDatabaseStats(db: SQLite.SQLiteDatabase): Promise<{
  size: number;
  pageCount: number;
  pageSize: number;
  tableCount: number;
  indexCount: number;
}> {
  try {
    const [size, pageCount, pageSize, tableCount, indexCount] = await Promise.all([
      db.getFirstAsync('PRAGMA page_count;'),
      db.getFirstAsync('PRAGMA page_count;'),
      db.getFirstAsync('PRAGMA page_size;'),
      db.getFirstAsync(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `),
      db.getFirstAsync(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
      `)
    ]);
    
    return {
      size: (pageCount?.page_count || 0) * (pageSize?.page_size || 0),
      pageCount: pageCount?.page_count || 0,
      pageSize: pageSize?.page_size || 0,
      tableCount: tableCount?.count || 0,
      indexCount: indexCount?.count || 0
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    throw error;
  }
}

export async function optimizeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Run VACUUM to optimize database
    await db.execAsync('VACUUM;');
    
    // Update statistics
    await db.execAsync('ANALYZE;');
    
    console.log('Database optimization completed');
  } catch (error) {
    console.error('Database optimization failed:', error);
    throw error;
  }
}

export async function clearSyncQueue(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.runAsync('DELETE FROM sync_queue WHERE status = ?', ['completed']);
    console.log('Sync queue cleared of completed items');
  } catch (error) {
    console.error('Failed to clear sync queue:', error);
    throw error;
  }
}

export async function getSyncQueueStats(db: SQLite.SQLiteDatabase): Promise<{
  pending: number;
  processing: number;
  failed: number;
  total: number;
}> {
  try {
    const result = await db.getAllAsync(`
      SELECT 
        status,
        COUNT(*) as count
      FROM sync_queue 
      GROUP BY status
    `);
    
    const stats = {
      pending: 0,
      processing: 0,
      failed: 0,
      total: 0
    };
    
    result.forEach((row: any) => {
      stats[row.status as keyof typeof stats] = row.count;
      stats.total += row.count;
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to get sync queue stats:', error);
    throw error;
  }
}

export function formatDatabaseSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function sanitizeTableName(name: string): string {
  // Remove any characters that could be dangerous in SQL
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

export function sanitizeColumnName(name: string): string {
  // Remove any characters that could be dangerous in SQL
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}
