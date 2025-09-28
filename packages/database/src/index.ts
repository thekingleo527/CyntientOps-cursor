/**
 * @cyntientops/database
 * 
 * Database layer for CyntientOps
 * Mirrors GRDBManager.swift functionality
 */

export { DatabaseManager } from './DatabaseManager';
export type { 
  DatabaseConfig, 
  DatabaseStats, 
  PhotoEvidence, 
  WorkerBuildingAssignment, 
  DSnyScheduleCache 
} from './DatabaseManager';

// Database initialization helper
export async function initializeDatabase(config: {
  path: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
  enableJournalMode?: boolean;
}): Promise<DatabaseManager> {
  const dbManager = DatabaseManager.getInstance(config);
  await dbManager.initialize();
  return dbManager;
}

// Default export
export default DatabaseManager;
