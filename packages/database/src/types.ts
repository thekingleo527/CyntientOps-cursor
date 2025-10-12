/**
 * 🗄️ Database Types
 * Mirrors: CyntientOps/Core/Database/GRDBManager.swift
 * Purpose: Type definitions for database operations
 */

export interface DatabaseConfig {
  path: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
  cacheSize?: number;
  timeout?: number;
}

export interface DatabaseConnection {
  isOpen: boolean;
  lastError?: string;
  version: number;
}

export interface QueryResult {
  rows: any[];
  changes: number;
  lastInsertRowId?: number;
}

export interface Migration {
  version: number;
  description: string;
  up: string;
  down?: string;
  shouldRun?: (db: any) => Promise<boolean>;
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: any;
  primaryKey?: boolean;
  unique?: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface ForeignKeyDefinition {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}
