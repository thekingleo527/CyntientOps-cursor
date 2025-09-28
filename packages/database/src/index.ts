/**
 * 🗄️ Database Package - Main Export
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: SQLite database layer with GRDB-like functionality
 */

export { DatabaseManager } from './DatabaseManager';
export { DatabaseSchema } from './DatabaseSchema';
export { MigrationManager } from './MigrationManager';
export { QueryBuilder } from './QueryBuilder';

// Types
export type {
  DatabaseConfig,
  DatabaseConnection,
  QueryResult,
  Migration,
  TableSchema
} from './types';

// Utilities
export { 
  validateDatabaseIntegrity,
  createBackup,
  restoreFromBackup,
  getDatabaseStats
} from './utils';