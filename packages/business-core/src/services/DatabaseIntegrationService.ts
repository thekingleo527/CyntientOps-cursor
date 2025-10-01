/**
 * 🗄️ Database Integration Service
 * Purpose: Connect ViewModels to real SQLite operations
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift database operations
 */

import { DatabaseManager } from '@cyntientops/database';
import { OperationalDataTaskAssignment, NamedCoordinate, WorkerProfile, ClientProfile } from '@cyntientops/domain-schema';
import { Logger } from './LoggingService';

export interface DatabaseQueryResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export interface DatabaseFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN';
  value: any;
}

export interface DatabaseSort {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface DatabaseQueryOptions {
  filters?: DatabaseFilter[];
  sort?: DatabaseSort[];
  limit?: number;
  offset?: number;
}

export class DatabaseIntegrationService {
  private static instance: DatabaseIntegrationService;
  private database: DatabaseManager;

  private constructor(database: DatabaseManager) {
    this.database = database;
  }

  public static getInstance(database: DatabaseManager): DatabaseIntegrationService {
    if (!DatabaseIntegrationService.instance) {
      DatabaseIntegrationService.instance = new DatabaseIntegrationService(database);
    }
    return DatabaseIntegrationService.instance;
  }

  // MARK: - Worker Operations

  /**
   * Get worker profile by ID
   */
  async getWorkerProfile(workerId: string): Promise<WorkerProfile | null> {
    try {
      const result = await this.database.query(
        'SELECT * FROM workers WHERE id = ?',
        [workerId]
      );
      
      if (result.length === 0) return null;
      
      const worker = result[0];
      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
        phone: worker.phone,
        hourlyRate: worker.hourly_rate,
        shift: worker.shift,
        skills: worker.skills ? JSON.parse(worker.skills) : [],
        assignedBuildings: await this.getWorkerAssignedBuildings(workerId),
        isActive: worker.is_active === 1,
        createdAt: new Date(worker.created_at),
        updatedAt: new Date(worker.updated_at)
      };
    } catch (error) {
      Logger.error('Failed to get worker profile:', undefined, 'DatabaseIntegrationService');
      return null;
    }
  }

  /**
   * Get all workers with optional filtering
   */
  async getWorkers(options?: DatabaseQueryOptions): Promise<DatabaseQueryResult<WorkerProfile>> {
    try {
      let query = 'SELECT * FROM workers WHERE is_active = 1';
      const params: any[] = [];

      if (options?.filters) {
        for (const filter of options.filters) {
          query += ` AND ${filter.field} ${filter.operator} ?`;
          params.push(filter.value);
        }
      }

      if (options?.sort) {
        const sortClause = options.sort.map(s => `${s.field} ${s.direction}`).join(', ');
        query += ` ORDER BY ${sortClause}`;
      }

      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options?.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const result = await this.database.query(query, params);
      
      const workers: WorkerProfile[] = await Promise.all(
        result.map(async (worker) => ({
          id: worker.id,
          name: worker.name,
          email: worker.email,
          role: worker.role,
          phone: worker.phone,
          hourlyRate: worker.hourly_rate,
          shift: worker.shift,
          skills: worker.skills ? JSON.parse(worker.skills) : [],
          assignedBuildings: await this.getWorkerAssignedBuildings(worker.id),
          isActive: worker.is_active === 1,
          createdAt: new Date(worker.created_at),
          updatedAt: new Date(worker.updated_at)
        }))
      );

      return {
        data: workers,
        count: workers.length,
        hasMore: options?.limit ? workers.length === options.limit : false
      };
    } catch (error) {
      Logger.error('Failed to get workers:', undefined, 'DatabaseIntegrationService');
      return { data: [], count: 0, hasMore: false };
    }
  }

  /**
   * Get worker assigned buildings
   */
  private async getWorkerAssignedBuildings(workerId: string): Promise<NamedCoordinate[]> {
    try {
      const result = await this.database.query(
        `SELECT b.* FROM buildings b 
         INNER JOIN worker_building_assignments wba ON b.id = wba.building_id 
         WHERE wba.worker_id = ? AND b.is_active = 1`,
        [workerId]
      );

      return result.map(building => ({
        id: building.id,
        name: building.name,
        latitude: building.latitude,
        longitude: building.longitude,
        address: building.address
      }));
    } catch (error) {
      Logger.error('Failed to get worker assigned buildings:', undefined, 'DatabaseIntegrationService');
      return [];
    }
  }

  // MARK: - Task Operations

  /**
   * Get tasks for a worker
   */
  async getWorkerTasks(workerId: string, options?: DatabaseQueryOptions): Promise<DatabaseQueryResult<OperationalDataTaskAssignment>> {
    try {
      let query = `
        SELECT t.*, b.name as building_name, b.address as building_address
        FROM tasks t
        LEFT JOIN buildings b ON t.building_id = b.id
        WHERE t.assigned_worker_id = ?
      `;
      const params: any[] = [workerId];

      if (options?.filters) {
        for (const filter of options.filters) {
          query += ` AND ${filter.field} ${filter.operator} ?`;
          params.push(filter.value);
        }
      }

      if (options?.sort) {
        const sortClause = options.sort.map(s => `${s.field} ${s.direction}`).join(', ');
        query += ` ORDER BY ${sortClause}`;
      } else {
        query += ' ORDER BY t.due_date ASC';
      }

      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options?.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const result = await this.database.query(query, params);
      
      const tasks: OperationalDataTaskAssignment[] = result.map(task => ({
        id: task.id,
        name: task.name,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        assigned_worker_id: task.assigned_worker_id,
        assigned_building_id: task.building_id,
        due_date: task.due_date,
        estimated_duration: task.estimated_duration,
        created_at: task.created_at,
        updated_at: task.updated_at
      }));

      return {
        data: tasks,
        count: tasks.length,
        hasMore: options?.limit ? tasks.length === options.limit : false
      };
    } catch (error) {
      Logger.error('Failed to get worker tasks:', undefined, 'DatabaseIntegrationService');
      return { data: [], count: 0, hasMore: false };
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, completionNotes?: string): Promise<boolean> {
    try {
      await this.database.execute(
        'UPDATE tasks SET status = ?, updated_at = ?, completion_notes = ? WHERE id = ?',
        [status, new Date().toISOString(), completionNotes || null, taskId]
      );
      return true;
    } catch (error) {
      Logger.error('Failed to update task status:', undefined, 'DatabaseIntegrationService');
      return false;
    }
  }

  /**
   * Create new task
   */
  async createTask(task: Partial<OperationalDataTaskAssignment>): Promise<string | null> {
    try {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.database.execute(
        `INSERT INTO tasks (id, name, description, category, priority, status, 
         assigned_worker_id, building_id, due_date, estimated_duration, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taskId,
          task.name,
          task.description,
          task.category || 'routine',
          task.priority || 'medium',
          task.status || 'Pending',
          task.assigned_worker_id,
          task.assigned_building_id,
          task.due_date,
          task.estimated_duration || 60,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      
      return taskId;
    } catch (error) {
      Logger.error('Failed to create task:', undefined, 'DatabaseIntegrationService');
      return null;
    }
  }

  // MARK: - Building Operations

  /**
   * Get building by ID
   */
  async getBuilding(buildingId: string): Promise<NamedCoordinate | null> {
    try {
      const result = await this.database.query(
        'SELECT * FROM buildings WHERE id = ? AND is_active = 1',
        [buildingId]
      );
      
      if (result.length === 0) return null;
      
      const building = result[0];
      return {
        id: building.id,
        name: building.name,
        latitude: building.latitude,
        longitude: building.longitude,
        address: building.address
      };
    } catch (error) {
      Logger.error('Failed to get building:', undefined, 'DatabaseIntegrationService');
      return null;
    }
  }

  /**
   * Get all buildings
   */
  async getBuildings(options?: DatabaseQueryOptions): Promise<DatabaseQueryResult<NamedCoordinate>> {
    try {
      let query = 'SELECT * FROM buildings WHERE is_active = 1';
      const params: any[] = [];

      if (options?.filters) {
        for (const filter of options.filters) {
          query += ` AND ${filter.field} ${filter.operator} ?`;
          params.push(filter.value);
        }
      }

      if (options?.sort) {
        const sortClause = options.sort.map(s => `${s.field} ${s.direction}`).join(', ');
        query += ` ORDER BY ${sortClause}`;
      }

      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;
        if (options?.offset) {
          query += ` OFFSET ${options.offset}`;
        }
      }

      const result = await this.database.query(query, params);
      
      const buildings: NamedCoordinate[] = result.map(building => ({
        id: building.id,
        name: building.name,
        latitude: building.latitude,
        longitude: building.longitude,
        address: building.address
      }));

      return {
        data: buildings,
        count: buildings.length,
        hasMore: options?.limit ? buildings.length === options.limit : false
      };
    } catch (error) {
      Logger.error('Failed to get buildings:', undefined, 'DatabaseIntegrationService');
      return { data: [], count: 0, hasMore: false };
    }
  }

  // MARK: - Clock In/Out Operations

  /**
   * Clock in worker
   */
  async clockInWorker(workerId: string, buildingId: string): Promise<boolean> {
    try {
      const clockInId = `clockin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.database.execute(
        `INSERT INTO clock_ins (id, worker_id, building_id, clock_in_time, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [clockInId, workerId, buildingId, new Date().toISOString(), 'active', new Date().toISOString()]
      );
      
      return true;
    } catch (error) {
      Logger.error('Failed to clock in worker:', undefined, 'DatabaseIntegrationService');
      return false;
    }
  }

  /**
   * Clock out worker
   */
  async clockOutWorker(workerId: string): Promise<boolean> {
    try {
      await this.database.execute(
        `UPDATE clock_ins SET clock_out_time = ?, status = 'completed', updated_at = ?
         WHERE worker_id = ? AND status = 'active'`,
        [new Date().toISOString(), new Date().toISOString(), workerId]
      );
      
      return true;
    } catch (error) {
      Logger.error('Failed to clock out worker:', undefined, 'DatabaseIntegrationService');
      return false;
    }
  }

  /**
   * Get current clock status for worker
   */
  async getWorkerClockStatus(workerId: string): Promise<any | null> {
    try {
      const result = await this.database.query(
        `SELECT ci.*, b.name as building_name, b.address as building_address
         FROM clock_ins ci
         LEFT JOIN buildings b ON ci.building_id = b.id
         WHERE ci.worker_id = ? AND ci.status = 'active'
         ORDER BY ci.clock_in_time DESC
         LIMIT 1`,
        [workerId]
      );
      
      if (result.length === 0) return null;
      
      const clockIn = result[0];
      return {
        id: clockIn.id,
        workerId: clockIn.worker_id,
        buildingId: clockIn.building_id,
        buildingName: clockIn.building_name,
        buildingAddress: clockIn.building_address,
        clockInTime: new Date(clockIn.clock_in_time),
        status: clockIn.status
      };
    } catch (error) {
      Logger.error('Failed to get worker clock status:', undefined, 'DatabaseIntegrationService');
      return null;
    }
  }

  // MARK: - Analytics Operations

  /**
   * Get worker performance metrics
   */
  async getWorkerPerformanceMetrics(workerId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
          AVG(CASE WHEN status = 'Completed' THEN estimated_duration ELSE NULL END) as avg_completion_time,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM tasks 
        WHERE assigned_worker_id = ?
      `;
      const params: any[] = [workerId];

      if (dateRange) {
        query += ' AND created_at BETWEEN ? AND ?';
        params.push(dateRange.start.toISOString(), dateRange.end.toISOString());
      }

      const result = await this.database.query(query, params);
      
      if (result.length === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          activeDays: 0
        };
      }

      const metrics = result[0];
      const completionRate = metrics.total_tasks > 0 ? (metrics.completed_tasks / metrics.total_tasks) * 100 : 0;

      return {
        totalTasks: metrics.total_tasks,
        completedTasks: metrics.completed_tasks,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCompletionTime: Math.round(metrics.avg_completion_time || 0),
        activeDays: metrics.active_days
      };
    } catch (error) {
      Logger.error('Failed to get worker performance metrics:', undefined, 'DatabaseIntegrationService');
      return {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        activeDays: 0
      };
    }
  }

  // MARK: - Utility Methods

  /**
   * Execute raw SQL query
   */
  async executeQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      return await this.database.query(query, params);
    } catch (error) {
      Logger.error('Failed to execute query:', undefined, 'DatabaseIntegrationService');
      return [];
    }
  }

  /**
   * Execute raw SQL command
   */
  async executeCommand(command: string, params: any[] = []): Promise<boolean> {
    try {
      await this.database.execute(command, params);
      return true;
    } catch (error) {
      Logger.error('Failed to execute command:', undefined, 'DatabaseIntegrationService');
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await Promise.all([
        this.database.query('SELECT COUNT(*) as count FROM workers WHERE is_active = 1'),
        this.database.query('SELECT COUNT(*) as count FROM buildings WHERE is_active = 1'),
        this.database.query('SELECT COUNT(*) as count FROM tasks'),
        this.database.query('SELECT COUNT(*) as count FROM clock_ins WHERE status = "active"')
      ]);

      return {
        activeWorkers: stats[0][0]?.count || 0,
        activeBuildings: stats[1][0]?.count || 0,
        totalTasks: stats[2][0]?.count || 0,
        activeClockIns: stats[3][0]?.count || 0
      };
    } catch (error) {
      Logger.error('Failed to get database stats:', undefined, 'DatabaseIntegrationService');
      return {
        activeWorkers: 0,
        activeBuildings: 0,
        totalTasks: 0,
        activeClockIns: 0
      };
    }
  }
}

export default DatabaseIntegrationService;
