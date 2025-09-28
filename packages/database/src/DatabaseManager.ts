/**
 * 🗄️ Database Manager
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: SQLite database management with GRDB-like functionality
 */

import Database from 'better-sqlite3';
import { WorkerProfile, Building, Client, OperationalDataTaskAssignment } from '@cyntientops/domain-schema';
import { 
  workers, 
  buildings, 
  clients, 
  routines 
} from '@cyntientops/data-seed';

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
  enableJournalMode?: boolean;
}

export interface DatabaseStats {
  totalWorkers: number;
  totalBuildings: number;
  totalClients: number;
  totalTasks: number;
  totalPhotos: number;
  lastUpdated: Date;
}

export interface PhotoEvidence {
  id: string;
  taskId: string;
  workerId: string;
  buildingId: string;
  photoPath: string;
  photoCategory: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WorkerBuildingAssignment {
  id: string;
  workerId: string;
  buildingId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

export interface DSnyScheduleCache {
  id: string;
  buildingId: string;
  address: string;
  refuseDays: string;
  recyclingDays: string;
  organicsDays: string;
  bulkDays: string;
  lastUpdated: Date;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;
  private config: DatabaseConfig;

  private constructor(config: DatabaseConfig) {
    this.config = {
      enableWAL: true,
      enableForeignKeys: true,
      enableJournalMode: true,
      ...config
    };
  }

  public static getInstance(config?: DatabaseConfig): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!config) {
        throw new Error('DatabaseConfig required for first initialization');
      }
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection and create tables
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🗄️ Initializing database...');
      
      // Create database connection
      this.db = new Database(this.config.path);
      
      // Configure database settings
      this.configureDatabase();
      
      // Create tables
      await this.createTables();
      
      // Seed initial data
      await this.seedInitialData();
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Configure database settings
   */
  private configureDatabase(): void {
    if (!this.db) return;

    // Enable WAL mode for better concurrency
    if (this.config.enableWAL) {
      this.db.pragma('journal_mode = WAL');
    }

    // Enable foreign key constraints
    if (this.config.enableForeignKeys) {
      this.db.pragma('foreign_keys = ON');
    }

    // Set synchronous mode for better performance
    this.db.pragma('synchronous = NORMAL');
    
    // Set cache size
    this.db.pragma('cache_size = 10000');
    
    // Set temp store to memory
    this.db.pragma('temp_store = MEMORY');
  }

  /**
   * Create all database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    const tables = [
      // Workers table
      `CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Available',
        capabilities TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Buildings table
      `CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        building_type TEXT,
        client_id TEXT,
        management_company TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )`,

      // Clients table
      `CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'Pending',
        assigned_worker_id TEXT,
        building_id TEXT NOT NULL,
        scheduled_date DATETIME,
        start_time DATETIME,
        end_time DATETIME,
        estimated_duration INTEGER,
        recurrence_type TEXT,
        requires_photo BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_worker_id) REFERENCES workers(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      )`,

      // Worker building assignments table
      `CREATE TABLE IF NOT EXISTS worker_building_assignments (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        building_id TEXT NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assigned_by TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (worker_id) REFERENCES workers(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        UNIQUE(worker_id, building_id)
      )`,

      // Photo evidence table
      `CREATE TABLE IF NOT EXISTS photo_evidence (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        building_id TEXT NOT NULL,
        photo_path TEXT NOT NULL,
        photo_category TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      )`,

      // DSNY schedule cache table
      `CREATE TABLE IF NOT EXISTS dsny_schedule_cache (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        address TEXT NOT NULL,
        refuse_days TEXT,
        recycling_days TEXT,
        organics_days TEXT,
        bulk_days TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      )`,

      // Task progress table
      `CREATE TABLE IF NOT EXISTS task_progress (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        progress_percentage INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        start_time DATETIME,
        end_time DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )`
    ];

    // Execute table creation statements
    for (const tableSQL of tables) {
      this.db.exec(tableSQL);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(assigned_worker_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_building_id ON tasks(building_id)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date)',
      'CREATE INDEX IF NOT EXISTS idx_photo_evidence_task_id ON photo_evidence(task_id)',
      'CREATE INDEX IF NOT EXISTS idx_worker_assignments_worker_id ON worker_building_assignments(worker_id)',
      'CREATE INDEX IF NOT EXISTS idx_worker_assignments_building_id ON worker_building_assignments(building_id)',
      'CREATE INDEX IF NOT EXISTS idx_dsny_cache_building_id ON dsny_schedule_cache(building_id)'
    ];

    for (const indexSQL of indexes) {
      this.db.exec(indexSQL);
    }
  }

  /**
   * Seed initial data from data-seed package
   */
  private async seedInitialData(): Promise<void> {
    if (!this.db) return;

    console.log('🌱 Seeding initial data...');

    // Clear existing data
    this.db.exec('DELETE FROM tasks');
    this.db.exec('DELETE FROM worker_building_assignments');
    this.db.exec('DELETE FROM photo_evidence');
    this.db.exec('DELETE FROM dsny_schedule_cache');
    this.db.exec('DELETE FROM task_progress');
    this.db.exec('DELETE FROM workers');
    this.db.exec('DELETE FROM buildings');
    this.db.exec('DELETE FROM clients');

    // Insert workers
    const insertWorker = this.db.prepare(`
      INSERT INTO workers (id, name, email, phone, role, status, capabilities)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const worker of workers) {
      insertWorker.run(
        worker.id,
        worker.name,
        worker.email || null,
        worker.phone || null,
        worker.role,
        worker.status || 'Available',
        JSON.stringify(worker.capabilities || {})
      );
    }

    // Insert clients
    const insertClient = this.db.prepare(`
      INSERT INTO clients (id, name, contact_person, email, phone, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const client of clients) {
      insertClient.run(
        client.id,
        client.name,
        client.contact_person || null,
        client.email || null,
        client.phone || null,
        client.address || null
      );
    }

    // Insert buildings
    const insertBuilding = this.db.prepare(`
      INSERT INTO buildings (id, name, address, latitude, longitude, building_type, client_id, management_company)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const building of buildings) {
      insertBuilding.run(
        building.id,
        building.name,
        building.address,
        building.latitude,
        building.longitude,
        building.building_type || null,
        building.client_id || null,
        building.management_company || null
      );
    }

    // Insert tasks
    const insertTask = this.db.prepare(`
      INSERT INTO tasks (
        id, name, description, category, priority, status, assigned_worker_id, 
        building_id, scheduled_date, start_time, end_time, estimated_duration, 
        recurrence_type, requires_photo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const task of routines) {
      insertTask.run(
        task.id,
        task.name,
        task.description || null,
        task.category,
        task.priority || 'medium',
        task.status || 'Pending',
        task.assigned_worker_id || null,
        task.building_id,
        task.scheduled_date ? new Date(task.scheduled_date).toISOString() : null,
        task.start_time ? new Date(task.start_time).toISOString() : null,
        task.end_time ? new Date(task.end_time).toISOString() : null,
        task.estimated_duration || null,
        task.recurrence_type || null,
        task.requires_photo || false
      );
    }

    console.log('✅ Initial data seeded successfully');
  }

  /**
   * Get all workers
   */
  public getWorkers(): WorkerProfile[] {
    if (!this.db) return [];
    
    const stmt = this.db.prepare('SELECT * FROM workers ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      status: row.status,
      capabilities: row.capabilities ? JSON.parse(row.capabilities) : {}
    }));
  }

  /**
   * Get worker by ID
   */
  public getWorkerById(id: string): WorkerProfile | null {
    if (!this.db) return null;
    
    const stmt = this.db.prepare('SELECT * FROM workers WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      status: row.status,
      capabilities: row.capabilities ? JSON.parse(row.capabilities) : {}
    };
  }

  /**
   * Get all buildings
   */
  public getBuildings(): Building[] {
    if (!this.db) return [];
    
    const stmt = this.db.prepare('SELECT * FROM buildings ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      building_type: row.building_type,
      client_id: row.client_id,
      management_company: row.management_company
    }));
  }

  /**
   * Get building by ID
   */
  public getBuildingById(id: string): Building | null {
    if (!this.db) return null;
    
    const stmt = this.db.prepare('SELECT * FROM buildings WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      building_type: row.building_type,
      client_id: row.client_id,
      management_company: row.management_company
    };
  }

  /**
   * Get all clients
   */
  public getClients(): Client[] {
    if (!this.db) return [];
    
    const stmt = this.db.prepare('SELECT * FROM clients ORDER BY name');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      contact_person: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address
    }));
  }

  /**
   * Get tasks for a specific worker
   */
  public getTasksForWorker(workerId: string): OperationalDataTaskAssignment[] {
    if (!this.db) return [];
    
    const stmt = this.db.prepare(`
      SELECT t.*, w.name as worker_name, b.name as building_name, b.address as building_address
      FROM tasks t
      LEFT JOIN workers w ON t.assigned_worker_id = w.id
      LEFT JOIN buildings b ON t.building_id = b.id
      WHERE t.assigned_worker_id = ?
      ORDER BY t.scheduled_date ASC
    `);
    
    const rows = stmt.all(workerId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assigned_worker_id: row.assigned_worker_id,
      building_id: row.building_id,
      scheduled_date: row.scheduled_date ? new Date(row.scheduled_date) : undefined,
      start_time: row.start_time ? new Date(row.start_time) : undefined,
      end_time: row.end_time ? new Date(row.end_time) : undefined,
      estimated_duration: row.estimated_duration,
      recurrence_type: row.recurrence_type,
      requires_photo: Boolean(row.requires_photo)
    }));
  }

  /**
   * Get tasks for a specific building
   */
  public getTasksForBuilding(buildingId: string): OperationalDataTaskAssignment[] {
    if (!this.db) return [];
    
    const stmt = this.db.prepare(`
      SELECT t.*, w.name as worker_name, b.name as building_name, b.address as building_address
      FROM tasks t
      LEFT JOIN workers w ON t.assigned_worker_id = w.id
      LEFT JOIN buildings b ON t.building_id = b.id
      WHERE t.building_id = ?
      ORDER BY t.scheduled_date ASC
    `);
    
    const rows = stmt.all(buildingId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assigned_worker_id: row.assigned_worker_id,
      building_id: row.building_id,
      scheduled_date: row.scheduled_date ? new Date(row.scheduled_date) : undefined,
      start_time: row.start_time ? new Date(row.start_time) : undefined,
      end_time: row.end_time ? new Date(row.end_time) : undefined,
      estimated_duration: row.estimated_duration,
      recurrence_type: row.recurrence_type,
      requires_photo: Boolean(row.requires_photo)
    }));
  }

  /**
   * Add photo evidence
   */
  public addPhotoEvidence(photo: Omit<PhotoEvidence, 'id' | 'timestamp'>): string {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO photo_evidence (id, task_id, worker_id, building_id, photo_path, photo_category, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      photo.taskId,
      photo.workerId,
      photo.buildingId,
      photo.photoPath,
      photo.photoCategory,
      photo.metadata ? JSON.stringify(photo.metadata) : null
    );
    
    return id;
  }

  /**
   * Get photo evidence for a task
   */
  public getPhotoEvidenceForTask(taskId: string): PhotoEvidence[] {
    if (!this.db) return [];
    
    const stmt = this.db.prepare('SELECT * FROM photo_evidence WHERE task_id = ? ORDER BY timestamp DESC');
    const rows = stmt.all(taskId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      workerId: row.worker_id,
      buildingId: row.building_id,
      photoPath: row.photo_path,
      photoCategory: row.photo_category,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  /**
   * Update task status
   */
  public updateTaskStatus(taskId: string, status: string, workerId?: string): boolean {
    if (!this.db) return false;
    
    const stmt = this.db.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(status, taskId);
    return result.changes > 0;
  }

  /**
   * Get database statistics
   */
  public getDatabaseStats(): DatabaseStats {
    if (!this.db) {
      return {
        totalWorkers: 0,
        totalBuildings: 0,
        totalClients: 0,
        totalTasks: 0,
        totalPhotos: 0,
        lastUpdated: new Date()
      };
    }
    
    const workerCount = this.db.prepare('SELECT COUNT(*) as count FROM workers').get() as any;
    const buildingCount = this.db.prepare('SELECT COUNT(*) as count FROM buildings').get() as any;
    const clientCount = this.db.prepare('SELECT COUNT(*) as count FROM clients').get() as any;
    const taskCount = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
    const photoCount = this.db.prepare('SELECT COUNT(*) as count FROM photo_evidence').get() as any;
    
    return {
      totalWorkers: workerCount.count,
      totalBuildings: buildingCount.count,
      totalClients: clientCount.count,
      totalTasks: taskCount.count,
      totalPhotos: photoCount.count,
      lastUpdated: new Date()
    };
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get database instance (for advanced operations)
   */
  public getDatabase(): Database.Database | null {
    return this.db;
  }
}
