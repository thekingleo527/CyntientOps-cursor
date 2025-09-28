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
      
      // Create indexes for performance
      await this.createIndexes();
      
      // Seed initial data if database is empty
      await this.seedInitialData();
      
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

  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const indexes = this.schema.getIndexes();
    
    for (const index of indexes) {
      await this.db.execAsync(index);
    }
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if data already exists
    const buildingCount = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM buildings');
    if (buildingCount && (buildingCount as any).count > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    console.log('Seeding initial data...');
    
    // Import and seed data
    const { buildings, workers, clients, routines } = await import('@cyntientops/data-seed');
    
    // Seed buildings
    for (const building of buildings) {
      await this.insertBuilding(building);
    }
    
    // Seed workers
    for (const worker of workers) {
      await this.insertWorker(worker);
    }
    
    // Seed clients
    for (const client of clients) {
      await this.insertClient(client);
    }
    
    // Seed routines
    for (const routine of routines) {
      await this.insertRoutine(routine);
    }
    
    console.log('Initial data seeded successfully');
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

  async getTasksForWorker(workerId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT t.*, b.name as building_name, b.address as building_address,
             b.latitude as building_latitude, b.longitude as building_longitude
      FROM tasks t
      LEFT JOIN buildings b ON t.assigned_building_id = b.id
      WHERE t.assigned_worker_id = ? AND t.status != 'Completed'
      ORDER BY 
        CASE t.priority 
          WHEN 'emergency' THEN 1
          WHEN 'critical' THEN 2
          WHEN 'urgent' THEN 3
          WHEN 'high' THEN 4
          WHEN 'medium' THEN 5
          WHEN 'low' THEN 6
          ELSE 7
        END,
        t.due_date ASC
    `, [workerId]);
    return result;
  }

  async getTodaysTasksForWorker(workerId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.getAllAsync(`
      SELECT t.*, b.name as building_name, b.address as building_address
      FROM tasks t
      LEFT JOIN buildings b ON t.assigned_building_id = b.id
      WHERE t.assigned_worker_id = ? 
        AND t.status != 'Completed'
        AND (t.due_date IS NULL OR DATE(t.due_date) <= ?)
      ORDER BY t.priority, t.due_date ASC
    `, [workerId, today]);
    return result;
  }

  async getRoutinesForWorker(workerId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT r.*, b.name as building_name, b.address as building_address
      FROM routines r
      LEFT JOIN buildings b ON r.building_id = b.id
      WHERE r.assigned_worker_id = ? AND r.is_active = 1
      ORDER BY r.next_due ASC
    `, [workerId]);
    return result;
  }

  async getBuildingsForWorker(workerId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getAllAsync(`
      SELECT DISTINCT b.*, 
             COUNT(t.id) as active_task_count,
             COUNT(r.id) as routine_count
      FROM buildings b
      LEFT JOIN tasks t ON b.id = t.assigned_building_id 
        AND t.assigned_worker_id = ? 
        AND t.status != 'Completed'
      LEFT JOIN routines r ON b.id = r.building_id 
        AND r.assigned_worker_id = ? 
        AND r.is_active = 1
      WHERE b.is_active = 1
      GROUP BY b.id
      ORDER BY b.name
    `, [workerId, workerId]);
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

  async insertClient(client: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO clients (id, name, contact_person, email, phone, address, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      client.id,
      client.name,
      client.contact_person,
      client.email,
      client.phone,
      client.address,
      client.isActive || 1,
      new Date().toISOString()
    ]);
  }

  async insertRoutine(routine: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      INSERT INTO routines (id, name, description, building_id, assigned_worker_id, schedule_type, 
                           schedule_days, start_time, estimated_duration, priority, is_active, 
                           last_completed, next_due, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      routine.id,
      routine.name,
      routine.description,
      routine.building_id,
      routine.assigned_worker_id,
      routine.schedule_type,
      JSON.stringify(routine.schedule_days || []),
      routine.start_time,
      routine.estimated_duration,
      routine.priority,
      routine.is_active || 1,
      routine.last_completed,
      routine.next_due,
      new Date().toISOString()
    ]);
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const updateFields = ['status = ?', 'updated_at = ?'];
    const updateValues = [status, new Date().toISOString()];
    
    if (status === 'Completed') {
      updateFields.push('completed_at = ?');
      updateValues.push(new Date().toISOString());
    }
    
    updateValues.push(taskId);
    
    await this.db.runAsync(`
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
  }

  async startTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync(`
      UPDATE tasks 
      SET status = 'In Progress', started_at = ?, updated_at = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), taskId]);
  }

  async completeTask(taskId: string, actualDuration?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const updateFields = [
      'status = ?',
      'completed_at = ?',
      'updated_at = ?'
    ];
    const updateValues = [
      'Completed',
      new Date().toISOString(),
      new Date().toISOString()
    ];
    
    if (actualDuration) {
      updateFields.push('actual_duration = ?');
      updateValues.push(actualDuration);
    }
    
    updateValues.push(taskId);
    
    await this.db.runAsync(`
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
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