/**
 * 🗄️ Migration Manager
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: Database migration management
 */

import * as SQLite from 'expo-sqlite';
import { Migration } from './types';

export class MigrationManager {
  private migrations: Migration[] = [];

  constructor() {
    this.initializeMigrations();
  }

  private initializeMigrations(): void {
    this.migrations = [
      {
        version: 1,
        description: 'Initial schema creation',
        up: `
          -- This migration is handled by DatabaseSchema.createTables()
          -- All tables are created in the initial setup
        `
      },
      {
        version: 2,
        description: 'Add indexes for performance',
        up: `
          CREATE INDEX IF NOT EXISTS idx_tasks_building ON tasks(assigned_building_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(assigned_worker_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        `
      },
      {
        version: 3,
        description: 'Add compliance tracking',
        up: `
          ALTER TABLE buildings ADD COLUMN compliance_score REAL DEFAULT 0.0;
          ALTER TABLE buildings ADD COLUMN last_compliance_check TEXT;
        `
      }
    ];
  }

  async runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          description TEXT,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Get current version
      const currentVersion = await this.getCurrentVersion(db);

      // Run pending migrations
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`Running migration ${migration.version}: ${migration.description}`);
          await this.runMigration(db, migration);
        }
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
    try {
      const result = await db.getFirstAsync(`
        SELECT MAX(version) as version FROM migrations
      `);
      return result?.version || 0;
    } catch (error) {
      // If migrations table doesn't exist or is empty, start from version 0
      return 0;
    }
  }

  private async runMigration(db: SQLite.SQLiteDatabase, migration: Migration): Promise<void> {
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      
      // Run the migration
      if (migration.up.trim()) {
        await db.execAsync(migration.up);
      }
      
      // Record the migration
      await db.runAsync(`
        INSERT INTO migrations (version, description) VALUES (?, ?)
      `, [migration.version, migration.description]);
      
      await db.execAsync('COMMIT;');
      
      console.log(`Migration ${migration.version} applied successfully`);
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  async rollbackMigration(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
    const migration = this.migrations.find(m => m.version === version);
    if (!migration || !migration.down) {
      throw new Error(`No rollback available for migration ${version}`);
    }

    try {
      await db.execAsync('BEGIN TRANSACTION;');
      
      // Run the rollback
      await db.execAsync(migration.down);
      
      // Remove the migration record
      await db.runAsync(`
        DELETE FROM migrations WHERE version = ?
      `, [version]);
      
      await db.execAsync('COMMIT;');
      
      console.log(`Migration ${version} rolled back successfully`);
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.error(`Rollback of migration ${version} failed:`, error);
      throw error;
    }
  }

  getPendingMigrations(currentVersion: number): Migration[] {
    return this.migrations.filter(m => m.version > currentVersion);
  }
}
