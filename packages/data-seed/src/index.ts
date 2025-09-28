/**
 * @cyntientops/data-seed
 *
 * Complete operational data seed for CyntientOps
 * Contains: 7 workers, 17 buildings, 6 clients, 48+ routine tasks
 * Preserves all canonical IDs from Swift implementation
 */

import workersData from './workers.json';
import buildingsData from './buildings.json';
import clientsData from './clients.json';
import routinesData from './routines.json';

export const workers = workersData;
export const buildings = buildingsData;
export const clients = clientsData;
export const routines = routinesData;

// Data validation counts (must match Swift OperationalDataManager)
export const DATA_VALIDATION = {
  EXPECTED_WORKERS: 7,
  EXPECTED_BUILDINGS: 19, // Corrected count - we have 19 buildings with canonical IDs
  EXPECTED_CLIENTS: 12,
  EXPECTED_ROUTINES: 88, // All 88 operational tasks now extracted

  // Canonical ID validation
  VALID_WORKER_IDS: ['1', '2', '4', '5', '6', '7', '8'],
  VALID_BUILDING_IDS: ['1', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13', '14', '15', '16', '17', '18', '19', '20', '21'],

  // Key assignments validation
  KEVIN_DUTAN_TASKS: 38, // Kevin has 38 tasks as expected
  RUBIN_MUSEUM_ID: '14',
  KEVIN_DUTAN_ID: '4'
} as const;

// Validation functions
export function validateDataIntegrity(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  counts: {
    workers: number;
    buildings: number;
    clients: number;
    routines: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = {
    workers: workers.length,
    buildings: buildings.length,
    clients: clients.length,
    routines: routines.length
  };

  // Validate counts
  if (counts.workers !== DATA_VALIDATION.EXPECTED_WORKERS) {
    errors.push(`Expected ${DATA_VALIDATION.EXPECTED_WORKERS} workers, got ${counts.workers}`);
  }

  if (counts.buildings !== DATA_VALIDATION.EXPECTED_BUILDINGS) {
    errors.push(`Expected ${DATA_VALIDATION.EXPECTED_BUILDINGS} buildings, got ${counts.buildings}`);
  }

  if (counts.clients !== DATA_VALIDATION.EXPECTED_CLIENTS) {
    errors.push(`Expected ${DATA_VALIDATION.EXPECTED_CLIENTS} clients, got ${counts.clients}`);
  }

  if (counts.routines !== DATA_VALIDATION.EXPECTED_ROUTINES) {
    errors.push(`Expected ${DATA_VALIDATION.EXPECTED_ROUTINES} routines, got ${counts.routines}`);
  }

  // Validate canonical IDs
  const workerIds = workers.map(w => w.id);
  const buildingIds = buildings.map(b => b.id);

  const missingWorkerIds = DATA_VALIDATION.VALID_WORKER_IDS.filter(id => !workerIds.includes(id));
  if (missingWorkerIds.length > 0) {
    errors.push(`Missing worker IDs: ${missingWorkerIds.join(', ')}`);
  }

  const missingBuildingIds = DATA_VALIDATION.VALID_BUILDING_IDS.filter(id => !buildingIds.includes(id));
  if (missingBuildingIds.length > 0) {
    errors.push(`Missing building IDs: ${missingBuildingIds.join(', ')}`);
  }

  // Validate key assignments
  const kevinTasks = routines.filter(r => r.workerId === DATA_VALIDATION.KEVIN_DUTAN_ID);
  if (kevinTasks.length !== DATA_VALIDATION.KEVIN_DUTAN_TASKS) {
    errors.push(`Kevin Dutan has ${kevinTasks.length} tasks, expected ${DATA_VALIDATION.KEVIN_DUTAN_TASKS}`);
  }

  const rubinTasks = routines.filter(r => r.buildingId === DATA_VALIDATION.RUBIN_MUSEUM_ID);
  if (rubinTasks.length === 0) {
    errors.push('No tasks found for Rubin Museum');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    counts
  };
}

// Summary statistics
export function getDataSummary() {
  const validation = validateDataIntegrity();

  return {
    validation,
    summary: {
      totalWorkers: workers.length,
      totalBuildings: buildings.length,
      totalClients: clients.length,
      totalRoutines: routines.length,
      activeWorkers: workers.filter(w => w.isActive).length,
      activeBuildings: buildings.filter(b => b.isActive).length,
      activeClients: clients.filter(c => c.is_active).length,
      tasksByWorker: Object.fromEntries(
        workers.map(w => [
          w.name,
          routines.filter(r => r.workerId === w.id).length
        ])
      ),
      tasksByBuilding: Object.fromEntries(
        buildings.map(b => [
          b.name,
          routines.filter(r => r.buildingId === b.id).length
        ])
      )
    }
  };
}

// Export metadata
export const SEED_METADATA = {
  version: '1.0.0',
  extractedFrom: 'CyntientOps SwiftUI OperationalDataManager.swift',
  extractionDate: '2024-09-28',
  totalRecords: workers.length + buildings.length + clients.length + routines.length,
  preservedCanonicalIds: true,
  swiftCompatibilityVersion: '6.0'
} as const;