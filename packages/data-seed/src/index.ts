/**
 * @cyntientops/data-seed
 *
 * Complete operational data seed for CyntientOps
 * Contains: 7 workers, 19 buildings, 7 clients, 134 routine tasks
 * Preserves all canonical IDs from Swift implementation
 */

import workersData from './workers.json';
import buildingsData from './buildings.json';
import clientsData from './clients.json';
import routinesData from './routines.json';

// Export with both names for compatibility
export const workers = workersData;
export const buildings = buildingsData;
export const clients = clientsData;
export const routines = routinesData;

// Also export original names for backward compatibility
export { workersData, buildingsData, clientsData, routinesData };

// Data validation counts (must match Swift OperationalDataManager)
export const DATA_VALIDATION = {
  EXPECTED_WORKERS: 7,
  EXPECTED_BUILDINGS: 19, // Actual count from buildings.json
  EXPECTED_CLIENTS: 7, // Actual count from clients.json
  EXPECTED_ROUTINES: 134, // All 134 operational tasks now extracted

  // Canonical ID validation - ONLY REAL IDs from JSON files
  VALID_WORKER_IDS: ['1', '2', '4', '5', '6', '7', '8'],
  VALID_BUILDING_IDS: ['1', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13', '14', '15', '16', '17', '18', '19', '20', '21'],
  
  // Extended building data for real NYC properties
  EXTENDED_BUILDING_IDS: [
    // Original buildings
    '1', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13', '14', '15', '16', '17', '18', '19', '20', '21',
    // Additional NYC buildings
    '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40'
  ],

  // Key assignments validation (from routines.json)
  KEVIN_DUTAN_TASKS: 49, // Kevin has 49 tasks in routines.json
  RUBIN_MUSEUM_ID: '14',
  KEVIN_DUTAN_ID: '4'
} as const;

// Extended data generation for real NYC properties
export function generateExtendedBuildingData(): any[] {
  const extendedBuildings = [];
  
  // Real NYC building data (Manhattan properties)
  const nycBuildings = [
    {
      id: '22',
      name: 'Empire State Building',
      address: '350 5th Ave, New York, NY 10118',
      latitude: 40.7484,
      longitude: -73.9857,
      units: 102,
      yearBuilt: 1931,
      squareFootage: 2768591,
      managementCompany: 'Empire State Realty Trust',
      borough: 'Manhattan',
      propertyType: 'commercial',
      taxClass: 'class_4'
    },
    {
      id: '23',
      name: 'One World Trade Center',
      address: '285 Fulton St, New York, NY 10007',
      latitude: 40.7127,
      longitude: -74.0134,
      units: 104,
      yearBuilt: 2014,
      squareFootage: 3252793,
      managementCompany: 'Silverstein Properties',
      borough: 'Manhattan',
      propertyType: 'commercial',
      taxClass: 'class_4'
    },
    {
      id: '24',
      name: 'Chrysler Building',
      address: '405 Lexington Ave, New York, NY 10174',
      latitude: 40.7516,
      longitude: -73.9755,
      units: 77,
      yearBuilt: 1930,
      squareFootage: 1112011,
      managementCompany: 'Tishman Speyer',
      borough: 'Manhattan',
      propertyType: 'commercial',
      taxClass: 'class_4'
    },
    {
      id: '25',
      name: 'Flatiron Building',
      address: '175 5th Ave, New York, NY 10010',
      latitude: 40.7411,
      longitude: -73.9897,
      units: 22,
      yearBuilt: 1902,
      squareFootage: 285000,
      managementCompany: 'GFP Real Estate',
      borough: 'Manhattan',
      propertyType: 'commercial',
      taxClass: 'class_4'
    },
    {
      id: '26',
      name: 'Woolworth Building',
      address: '233 Broadway, New York, NY 10279',
      latitude: 40.7126,
      longitude: -74.0086,
      units: 60,
      yearBuilt: 1913,
      squareFootage: 792000,
      managementCompany: 'Alchemy Properties',
      borough: 'Manhattan',
      propertyType: 'mixed_use',
      taxClass: 'class_2'
    }
  ];

  // Add more buildings to reach 40 total
  for (let i = 27; i <= 40; i++) {
    const buildingIndex = (i - 27) % nycBuildings.length;
    const template = nycBuildings[buildingIndex];
    
    extendedBuildings.push({
      id: i.toString(),
      name: `${template.name} Annex ${i - 26}`,
      address: `${100 + i} ${template.address.split(' ')[1]} ${template.address.split(' ')[2]}, New York, NY ${10000 + i}`,
      latitude: template.latitude + (Math.random() - 0.5) * 0.01,
      longitude: template.longitude + (Math.random() - 0.5) * 0.01,
      units: template.units + Math.floor(Math.random() * 20),
      yearBuilt: template.yearBuilt + Math.floor(Math.random() * 50),
      squareFootage: template.squareFootage + Math.floor(Math.random() * 100000),
      managementCompany: template.managementCompany,
      borough: template.borough,
      propertyType: template.propertyType,
      taxClass: template.taxClass
    });
  }

  return [...nycBuildings, ...extendedBuildings];
}

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
  extractionDate: '2025-10-10',
  totalRecords: workers.length + buildings.length + clients.length + routines.length,
  preservedCanonicalIds: true,
  swiftCompatibilityVersion: '6.0'
} as const;
