#!/usr/bin/env node
/*
 * Validate core seed datasets for parity and canonical IDs.
 * This script loads JSON directly (no TS runtime needed).
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');

function load(name) {
  const p = path.join(root, `${name}.json`);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function main() {
  const errors = [];
  const warnings = [];

  const workers = load('workers');
  const buildings = load('buildings');
  const clients = load('clients');
  const routines = load('routines');

  const EXPECTED = {
    workers: 7,
    buildings: 19,
    clients: 7,
    routines: 134,
    kevinId: '4',
    kevinTasks: 49,
    rubinId: '14',
  };

  // Counts
  if (workers.length !== EXPECTED.workers) errors.push(`workers: expected ${EXPECTED.workers}, got ${workers.length}`);
  if (buildings.length !== EXPECTED.buildings) errors.push(`buildings: expected ${EXPECTED.buildings}, got ${buildings.length}`);
  if (clients.length !== EXPECTED.clients) errors.push(`clients: expected ${EXPECTED.clients}, got ${clients.length}`);
  if (routines.length !== EXPECTED.routines) errors.push(`routines: expected ${EXPECTED.routines}, got ${routines.length}`);

  // Canonical IDs
  const buildingIds = buildings.map(b => b.id).sort();
  const expectedIds = ['1','3','4','5','6','7','8','9','10','11','13','14','15','16','17','18','19','21','20'].sort();
  const missing = expectedIds.filter(id => !buildingIds.includes(id));
  if (missing.length) errors.push(`buildings missing IDs: ${missing.join(', ')}`);

  // Kevin tasks
  const kevinTasks = routines.filter(r => r.workerId === EXPECTED.kevinId);
  if (kevinTasks.length !== EXPECTED.kevinTasks) errors.push(`Kevin tasks: expected ${EXPECTED.kevinTasks}, got ${kevinTasks.length}`);

  // Rubin tasks present
  const rubinTasks = routines.filter(r => r.buildingId === EXPECTED.rubinId);
  if (rubinTasks.length === 0) errors.push('Rubin Museum tasks: none found');

  // Report
  if (errors.length) {
    console.error('❌ Seed validation failed:');
    errors.forEach(e => console.error(' -', e));
    if (warnings.length) {
      console.warn('Warnings:');
      warnings.forEach(w => console.warn(' -', w));
    }
    process.exit(1);
  } else {
    console.log('✅ Seed validation passed.');
    console.log(`Counts → workers:${workers.length} buildings:${buildings.length} clients:${clients.length} routines:${routines.length}`);
    console.log(`Kevin tasks: ${kevinTasks.length}; Rubin tasks: ${rubinTasks.length}`);
  }
}

main();

