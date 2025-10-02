/**
 * 🗄️ Database Schema
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: SQLite schema definitions for CyntientOps
 */

import { TableSchema } from './types';

export class DatabaseSchema {
  getTableDefinitions(): string[] {
    return [
      this.createBuildingsTable(),
      this.createWorkersTable(),
      this.createTasksTable(),
      this.createRoutinesTable(),
      this.createUserSessionsTable(),
      this.createComplianceTable(),
      this.createPhotoEvidenceTable(),
      this.createSmartPhotoEvidenceTable(),
      this.createBuildingSpacesTable(),
      this.createBuildingInspectionsTable(),
      this.createWorkCompletionRecordsTable(),
      this.createClockInTable(),
      this.createInventoryTable(),
      this.createClientsTable(),
      this.createSyncQueueTable(),
      this.createTimeTheftAlertsTable(),
      this.createMLModelsTable(),
      this.createVersionHistoryTable(),
      this.createConflictResolutionTable(),
      this.createOfflineQueueTable(),
      this.createIssuesTable(),
      this.createSupplyRequestsTable(),
      this.createBuildingActivityTable(),
      this.createDashboardUpdatesTable(),
      this.createCacheEntriesTable()
    ];
  }

  private createUserSessionsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_role TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        device_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        permissions TEXT,
        status TEXT DEFAULT 'active',
        profile TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  private createBuildingsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
        longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
        image_asset_name TEXT,
        number_of_units INTEGER CHECK (number_of_units > 0),
        year_built INTEGER CHECK (year_built >= 1800 AND year_built <= 2030),
        square_footage INTEGER CHECK (square_footage > 0),
        management_company TEXT,
        primary_contact TEXT,
        contact_phone TEXT CHECK (length(contact_phone) >= 10),
        is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
        normalized_name TEXT,
        aliases TEXT,
        borough TEXT CHECK (borough IN ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island')),
        compliance_score REAL DEFAULT 0.0 CHECK (compliance_score >= 0.0 AND compliance_score <= 100.0),
        client_id TEXT,
        special_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      );
    `;
  }

  private createWorkersTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL CHECK (length(name) >= 2),
        role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'manager', 'supervisor')),
        status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Off', 'On Break')),
        phone TEXT CHECK (length(phone) >= 10),
        email TEXT CHECK (email LIKE '%@%.%'),
        skills TEXT, -- JSON array of skills
        certifications TEXT, -- JSON array of certifications
        hourly_rate REAL CHECK (hourly_rate >= 0.0),
        is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  private createTasksTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL CHECK (length(name) >= 3),
        description TEXT,
        category TEXT NOT NULL CHECK (category IN ('Maintenance', 'Cleaning', 'Sanitation', 'Operations', 'Inspection', 'Emergency')),
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical', 'emergency')),
        status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold')),
        assigned_building_id TEXT,
        assigned_worker_id TEXT,
        due_date TEXT CHECK (due_date IS NULL OR datetime(due_date) IS NOT NULL),
        completed_at TEXT CHECK (completed_at IS NULL OR datetime(completed_at) IS NOT NULL),
        estimated_duration INTEGER CHECK (estimated_duration > 0), -- minutes
        actual_duration INTEGER CHECK (actual_duration >= 0), -- minutes
        requires_photo INTEGER DEFAULT 0 CHECK (requires_photo IN (0, 1)),
        photo_evidence TEXT, -- JSON array of photo paths
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_building_id) REFERENCES buildings(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_worker_id) REFERENCES workers(id) ON DELETE SET NULL
      );
    `;
  }

  private createRoutinesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        building_id TEXT NOT NULL,
        assigned_worker_id TEXT,
        schedule_type TEXT NOT NULL, -- daily, weekly, monthly, etc.
        schedule_days TEXT, -- JSON array of days
        start_time TEXT,
        estimated_duration INTEGER, -- minutes
        priority TEXT DEFAULT 'medium',
        is_active INTEGER DEFAULT 1,
        last_completed TEXT,
        next_due TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (assigned_worker_id) REFERENCES workers(id)
      );
    `;
  }

  private createComplianceTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS compliance (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        category TEXT NOT NULL, -- HPD, DOB, FDNY, LL97, LL11, DEP
        status TEXT NOT NULL, -- compliant, warning, violation
        score REAL,
        last_inspection TEXT,
        next_inspection TEXT,
        violations_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      );
    `;
  }

  private createPhotoEvidenceTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS photo_evidence (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        building_id TEXT,
        worker_id TEXT,
        photo_path TEXT NOT NULL,
        photo_category TEXT,
        notes TEXT,
        taken_at TEXT DEFAULT CURRENT_TIMESTAMP,
        uploaded_at TEXT,
        is_synced INTEGER DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      );
    `;
  }

  private createSmartPhotoEvidenceTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS smart_photo_evidence (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        building_id TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        thumbnail_uri TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        location TEXT NOT NULL,
        smart_location TEXT NOT NULL,
        worker_specified_area TEXT,
        metadata TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        upload_attempts INTEGER DEFAULT 0,
        tags TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      );
    `;
  }

  private createBuildingSpacesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS building_spaces (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        floor INTEGER NOT NULL,
        coordinates TEXT,
        description TEXT,
        access_type TEXT,
        is_accessible INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      );
    `;
  }

  private createBuildingInspectionsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS building_inspections (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        building_name TEXT NOT NULL,
        inspector_id TEXT NOT NULL,
        inspector_name TEXT NOT NULL,
        inspection_date TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        checklist TEXT NOT NULL,
        issues TEXT DEFAULT '[]',
        photos TEXT DEFAULT '[]',
        notes TEXT,
        completion_date TEXT,
        next_inspection_date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (inspector_id) REFERENCES workers(id)
      );
    `;
  }

  private createWorkCompletionRecordsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS work_completion_records (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        building_name TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        worker_name TEXT NOT NULL,
        work_type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        completed_at TEXT NOT NULL,
        duration INTEGER,
        status TEXT DEFAULT 'completed',
        verification_method TEXT NOT NULL,
        photos TEXT DEFAULT '[]',
        notes TEXT,
        metadata TEXT DEFAULT '{}',
        verified_by TEXT,
        verification_notes TEXT,
        quality_score INTEGER,
        verified_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      );
    `;
  }

  private createClockInTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS clock_in (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        building_id TEXT NOT NULL,
        clock_in_time TEXT NOT NULL,
        clock_out_time TEXT,
        total_hours REAL,
        is_synced INTEGER DEFAULT 0,
        quickbooks_exported INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      );
    `;
  }

  private createInventoryTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        category TEXT NOT NULL, -- cleaning, equipment, maintenance, safety
        item_name TEXT NOT NULL,
        current_stock INTEGER DEFAULT 0,
        minimum_stock INTEGER DEFAULT 0,
        unit TEXT, -- pieces, gallons, etc.
        last_restocked TEXT,
        next_restock_due TEXT,
        supplier TEXT,
        cost_per_unit REAL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      );
    `;
  }

  private createClientsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  private createSyncQueueTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
        data TEXT, -- JSON data
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_attempt TEXT,
        next_attempt TEXT,
        status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  getIndexes(): string[] {
    return [
      'CREATE INDEX IF NOT EXISTS idx_tasks_building ON tasks(assigned_building_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(assigned_worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);',
      'CREATE INDEX IF NOT EXISTS idx_routines_building ON routines(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_routines_worker ON routines(assigned_worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_compliance_building ON compliance(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_clock_in_worker ON clock_in(worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_clock_in_building ON clock_in(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_inventory_building ON inventory(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_next_attempt ON sync_queue(next_attempt);',
      'CREATE INDEX IF NOT EXISTS idx_time_theft_alerts_worker ON time_theft_alerts(worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_time_theft_alerts_status ON time_theft_alerts(status);',
      'CREATE INDEX IF NOT EXISTS idx_ml_models_name ON ml_models(name);',
      'CREATE INDEX IF NOT EXISTS idx_version_history_record ON version_history(record_id, table_name);',
      'CREATE INDEX IF NOT EXISTS idx_conflict_resolution_status ON conflict_resolution(status);',
      'CREATE INDEX IF NOT EXISTS idx_offline_queue_priority ON offline_queue(priority, created_at);',
      'CREATE INDEX IF NOT EXISTS idx_issues_building ON issues(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_issues_worker ON issues(worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);',
      'CREATE INDEX IF NOT EXISTS idx_supply_requests_building ON supply_requests(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_supply_requests_worker ON supply_requests(worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_supply_requests_status ON supply_requests(status);',
      'CREATE INDEX IF NOT EXISTS idx_building_activity_building ON building_activity(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_building_activity_timestamp ON building_activity(timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_dashboard_updates_building ON dashboard_updates(building_id);',
      'CREATE INDEX IF NOT EXISTS idx_dashboard_updates_worker ON dashboard_updates(worker_id);',
      'CREATE INDEX IF NOT EXISTS idx_dashboard_updates_timestamp ON dashboard_updates(timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);',
      'CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);'
    ];
  }

  private createTimeTheftAlertsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS time_theft_alerts (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        evidence TEXT,
        detected_at INTEGER NOT NULL,
        status TEXT DEFAULT 'open',
        resolved_at INTEGER,
        resolved_by TEXT,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )
    `;
  }

  private createMLModelsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS ml_models (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        features INTEGER NOT NULL,
        accuracy REAL NOT NULL,
        trained_at INTEGER NOT NULL,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;
  }

  private createVersionHistoryTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS version_history (
        id TEXT PRIMARY KEY,
        record_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        version INTEGER NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        modified_by TEXT NOT NULL,
        hash TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;
  }

  private createConflictResolutionTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS conflict_resolution (
        id TEXT PRIMARY KEY,
        conflict_id TEXT NOT NULL,
        strategy TEXT NOT NULL,
        resolution_data TEXT,
        resolved_by TEXT,
        resolved_at INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;
  }

  private createOfflineQueueTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        update_type TEXT NOT NULL,
        update_data TEXT NOT NULL,
        priority TEXT DEFAULT 'normal',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_attempt TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }

  private createIssuesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        category TEXT,
        assigned_to TEXT,
        due_date TEXT,
        resolved_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )
    `;
  }

  private createSupplyRequestsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS supply_requests (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        worker_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        urgency TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        category TEXT,
        requested_for TEXT,
        fulfilled_at TEXT,
        fulfilled_by TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )
    `;
  }

  private createBuildingActivityTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS building_activity (
        id TEXT PRIMARY KEY,
        building_id TEXT NOT NULL,
        worker_id TEXT,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )
    `;
  }

  private createDashboardUpdatesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS dashboard_updates (
        id TEXT PRIMARY KEY,
        building_id TEXT,
        worker_id TEXT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        timestamp TEXT NOT NULL,
        hash TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        FOREIGN KEY (worker_id) REFERENCES workers(id)
      )
    `;
  }

  private createCacheEntriesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS cache_entries (
        id TEXT PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        cache_value TEXT NOT NULL,
        expires_at TEXT,
        encrypted INTEGER DEFAULT 0 CHECK (encrypted IN (0, 1)),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }
}
