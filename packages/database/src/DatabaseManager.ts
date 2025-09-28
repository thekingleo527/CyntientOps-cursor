/**
 * 🗄️ Database Manager
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: Main database connection and management
 */

import * as SQLite from 'expo-sqlite';
import { DatabaseConfig, DatabaseConnection, QueryResult } from './types';
import { DatabaseSchema } from './DatabaseSchema';
import { MigrationManager } from './MigrationManager';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private config: DatabaseConfig;
  private schema: DatabaseSchema;
  private migrationManager: MigrationManager;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.schema = new DatabaseSchema();
    this.migrationManager = new MigrationManager();
  }

  static getInstance(config: DatabaseConfig): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Open database connection
      this.db = await SQLite.openDatabaseAsync(this.config.path);
      
      // Enable WAL mode for better performance
      await this.enableWALMode();
      
      // Run migrations
      await this.migrationManager.runMigrations(this.db);
      
      // Create tables if they don't exist
      await this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async enableWALMode(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.execAsync('PRAGMA journal_mode=WAL;');
      await this.db.execAsync('PRAGMA synchronous=NORMAL;');
      await this.db.execAsync('PRAGMA cache_size=10000;');
      await this.db.execAsync('PRAGMA temp_store=MEMORY;');
    } catch (error) {
      console.warn('Failed to enable WAL mode:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = this.schema.getTableDefinitions();
    
    for (const table of tables) {
      await this.db.execAsync(table);
    }
  }

  async getBuildings(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync('SELECT * FROM buildings WHERE is_active = 1');
    return result;
  }

  async getWorkers(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync('SELECT * FROM workers WHERE is_active = 1');
    return result;
  }

  async getTasks(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT t.*, b.name as building_name, w.name as worker_name 
      FROM tasks t
      LEFT JOIN buildings b ON t.assigned_building_id = b.id
      LEFT JOIN workers w ON t.assigned_worker_id = w.id
      ORDER BY t.created_at DESC
    `);
    return result;
  }

  async getRoutines(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT r.*, b.name as building_name, w.name as worker_name
      FROM routines r
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN workers w ON r.assigned_worker_id = w.id
      ORDER BY r.schedule_date DESC
    `);
    return result;
  }

  async insertBuilding(building: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO buildings (id, name, address, latitude, longitude, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      building.id,
      building.name,
      building.address,
      building.latitude,
      building.longitude,
      building.isActive || 1,
      new Date().toISOString()
    ]);
  }

  async insertWorker(worker: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO workers (id, name, role, status, phone, email, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      worker.id,
      worker.name,
      worker.role,
      worker.status,
      worker.phone,
      worker.email,
      worker.isActive || 1,
      new Date().toISOString()
    ]);
  }

  async insertTask(task: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO tasks (id, name, description, category, priority, status, assigned_building_id, assigned_worker_id, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      task.id,
      task.name,
      task.description,
      task.category,
      task.priority,
      task.status,
      task.assigned_building_id,
      task.assigned_worker_id,
      task.due_date,
      new Date().toISOString()
    ]);
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE tasks 
      SET status = ?, updated_at = ?
      WHERE id = ?
    `, [status, new Date().toISOString(), taskId]);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  // Health check and diagnostics
  async getDatabaseStats(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stats = await this.db.getAllAsync(`
      SELECT 
        (SELECT COUNT(*) FROM buildings) as building_count,
        (SELECT COUNT(*) FROM workers) as worker_count,
        (SELECT COUNT(*) FROM tasks) as task_count,
        (SELECT COUNT(*) FROM routines) as routine_count
    `);
    
    return stats[0];
  }

  async validateIntegrity(): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync('PRAGMA integrity_check;');
      return result[0]?.integrity_check === 'ok';
    } catch (error) {
      console.error('Database integrity check failed:', error);
      return false;
    }
  }
}