/**
 * 🗄️ Query Builder
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: SQL query building utilities
 */

export class QueryBuilder {
  private query: string = '';
  private params: any[] = [];
  private isSelect: boolean = false;
  private isInsert: boolean = false;
  private isUpdate: boolean = false;
  private isDelete: boolean = false;

  static select(columns: string = '*'): QueryBuilder {
    const builder = new QueryBuilder();
    builder.isSelect = true;
    builder.query = `SELECT ${columns}`;
    return builder;
  }

  static insert(table: string): QueryBuilder {
    const builder = new QueryBuilder();
    builder.isInsert = true;
    builder.query = `INSERT INTO ${table}`;
    return builder;
  }

  static update(table: string): QueryBuilder {
    const builder = new QueryBuilder();
    builder.isUpdate = true;
    builder.query = `UPDATE ${table}`;
    return builder;
  }

  static delete(): QueryBuilder {
    const builder = new QueryBuilder();
    builder.isDelete = true;
    builder.query = 'DELETE';
    return builder;
  }

  from(table: string): QueryBuilder {
    if (this.isSelect || this.isDelete) {
      this.query += ` FROM ${table}`;
    }
    return this;
  }

  values(data: Record<string, any>): QueryBuilder {
    if (this.isInsert) {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      this.query += ` (${columns.join(', ')}) VALUES (${placeholders})`;
      this.params.push(...Object.values(data));
    }
    return this;
  }

  set(data: Record<string, any>): QueryBuilder {
    if (this.isUpdate) {
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      this.query += ` SET ${setClause}`;
      this.params.push(...Object.values(data));
    }
    return this;
  }

  where(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` WHERE ${condition}`;
    this.params.push(...params);
    return this;
  }

  and(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` AND ${condition}`;
    this.params.push(...params);
    return this;
  }

  or(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` OR ${condition}`;
    this.params.push(...params);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.query += ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.query += ` LIMIT ${count}`;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.query += ` OFFSET ${count}`;
    return this;
  }

  join(table: string, condition: string): QueryBuilder {
    this.query += ` JOIN ${table} ON ${condition}`;
    return this;
  }

  leftJoin(table: string, condition: string): QueryBuilder {
    this.query += ` LEFT JOIN ${table} ON ${condition}`;
    return this;
  }

  rightJoin(table: string, condition: string): QueryBuilder {
    this.query += ` RIGHT JOIN ${table} ON ${condition}`;
    return this;
  }

  groupBy(columns: string): QueryBuilder {
    this.query += ` GROUP BY ${columns}`;
    return this;
  }

  having(condition: string, ...params: any[]): QueryBuilder {
    this.query += ` HAVING ${condition}`;
    this.params.push(...params);
    return this;
  }

  build(): { query: string; params: any[] } {
    return {
      query: this.query,
      params: this.params
    };
  }

  toString(): string {
    return this.query;
  }
}

// Utility functions for common queries
export const Queries = {
  // Building queries
  getBuildingsByClient: (clientId: string) =>
    QueryBuilder.select()
      .from('buildings')
      .where('client_id = ?', clientId)
      .and('is_active = 1')
      .orderBy('name'),

  getActiveBuildings: () =>
    QueryBuilder.select()
      .from('buildings')
      .where('is_active = 1')
      .orderBy('name'),

  // Worker queries
  getWorkersByStatus: (status: string) =>
    QueryBuilder.select()
      .from('workers')
      .where('status = ?', status)
      .and('is_active = 1')
      .orderBy('name'),

  getWorkersByBuilding: (buildingId: string) =>
    QueryBuilder.select('w.*')
      .from('workers w')
      .join('tasks t', 'w.id = t.assigned_worker_id')
      .where('t.assigned_building_id = ?', buildingId)
      .and('w.is_active = 1')
      .groupBy('w.id')
      .orderBy('w.name'),

  // Task queries
  getTasksByBuilding: (buildingId: string) =>
    QueryBuilder.select('t.*, b.name as building_name, w.name as worker_name')
      .from('tasks t')
      .leftJoin('buildings b', 't.assigned_building_id = b.id')
      .leftJoin('workers w', 't.assigned_worker_id = w.id')
      .where('t.assigned_building_id = ?', buildingId)
      .orderBy('t.due_date'),

  getTasksByWorker: (workerId: string) =>
    QueryBuilder.select('t.*, b.name as building_name')
      .from('tasks t')
      .leftJoin('buildings b', 't.assigned_building_id = b.id')
      .where('t.assigned_worker_id = ?', workerId)
      .orderBy('t.due_date'),

  getOverdueTasks: () =>
    QueryBuilder.select('t.*, b.name as building_name, w.name as worker_name')
      .from('tasks t')
      .leftJoin('buildings b', 't.assigned_building_id = b.id')
      .leftJoin('workers w', 't.assigned_worker_id = w.id')
      .where('t.due_date < ?', new Date().toISOString())
      .and('t.status != ?', 'Completed')
      .orderBy('t.due_date'),

  // Routine queries
  getRoutinesByBuilding: (buildingId: string) =>
    QueryBuilder.select('r.*, w.name as worker_name')
      .from('routines r')
      .leftJoin('workers w', 'r.assigned_worker_id = w.id')
      .where('r.building_id = ?', buildingId)
      .and('r.is_active = 1')
      .orderBy('r.next_due'),

  // Compliance queries
  getComplianceByBuilding: (buildingId: string) =>
    QueryBuilder.select()
      .from('compliance')
      .where('building_id = ?', buildingId)
      .orderBy('category'),

  // Clock-in queries
  getClockInByWorker: (workerId: string, date?: string) => {
    const query = QueryBuilder.select('c.*, b.name as building_name')
      .from('clock_in c')
      .leftJoin('buildings b', 'c.building_id = b.id')
      .where('c.worker_id = ?', workerId);
    
    if (date) {
      query.and('DATE(c.clock_in_time) = ?', date);
    }
    
    return query.orderBy('c.clock_in_time', 'DESC');
  },

  // Inventory queries
  getLowStockItems: (buildingId?: string) => {
    const query = QueryBuilder.select('i.*, b.name as building_name')
      .from('inventory i')
      .leftJoin('buildings b', 'i.building_id = b.id')
      .where('i.current_stock <= i.minimum_stock')
      .and('i.is_active = 1');
    
    if (buildingId) {
      query.and('i.building_id = ?', buildingId);
    }
    
    return query.orderBy('i.current_stock');
  }
};
