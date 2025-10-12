#!/usr/bin/env node

/**
 * Backfill core operational data and knowledge documents into Supabase.
 * Uses deterministic UUIDs so references remain stable across runs.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const url =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.SUPABASE_URL_INTERNAL;

const serviceRoleKey =
  process.env.SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!url) {
  console.error('❌ Missing SUPABASE_URL.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing service role key.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);
const dataDir = path.resolve(__dirname, '../packages/data-seed/src');

function deterministicUuid(namespace, value) {
  const hash = crypto.createHash('sha1').update(`${namespace}:${value}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function upsert(table, rows) {
  if (!rows.length) return;
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Failed upserting into ${table}:`, error);
      throw error;
    }
  }
  console.log(`✅ Upserted ${rows.length} row(s) into ${table}`);
}

function loadJson(file) {
  const raw = fs.readFileSync(path.join(dataDir, file), 'utf8');
  return JSON.parse(raw);
}

async function ingestClients() {
  const clients = loadJson('clients.json');
  const rows = clients.map(client => {
    const id = deterministicUuid('client', client.id);
    return {
      id,
      name: client.name,
      contact_person: client.manager_name || client.name,
      email: client.contact_email || null,
      phone: client.contact_phone || null,
      address: client.address || null,
      is_active: client.is_active === false ? 0 : 1,
      updated_at: new Date().toISOString()
    };
  });
  await upsert('clients', rows);
  return new Map(clients.map(client => [client.id, deterministicUuid('client', client.id)]));
}

async function ingestBuildings(clientMap) {
  const buildings = loadJson('buildings.json');
  const rows = buildings.map(building => {
    const id = deterministicUuid('building', building.id);
    return {
      id,
      name: building.name,
      address: building.address,
      latitude: building.latitude,
      longitude: building.longitude,
      image_asset_name: building.imageAssetName || null,
      number_of_units: building.numberOfUnits || null,
      year_built: building.yearBuilt || null,
      square_footage: building.squareFootage || null,
      management_company: building.managementCompany || null,
      primary_contact: building.primaryContact || null,
      contact_phone: building.contactPhone || null,
      is_active: building.isActive === false ? 0 : 1,
      normalized_name: building.normalized_name || null,
      borough: building.borough || null,
      compliance_score: building.compliance_score || null,
      client_id: building.client_id ? clientMap.get(building.client_id) || null : null,
      special_notes: building.notes || null,
      created_at: building.propertyValueLastUpdated || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
  await upsert('buildings', rows);
  return new Map(buildings.map(building => [building.id, deterministicUuid('building', building.id)]));
}

async function ingestWorkers() {
  const workers = loadJson('workers.json');
  const rows = workers.map(worker => {
    const id = deterministicUuid('worker', worker.id);
    return {
      id,
      name: worker.name,
      email: worker.email || null,
      role: worker.role || 'worker',
      status: worker.status || 'Available',
      phone: worker.phone || null,
      skills: worker.skills || null,
      hourly_rate: worker.hourlyRate || null,
      is_active: worker.isActive === false ? 0 : 1,
      created_at: worker.created_at || new Date().toISOString(),
      updated_at: worker.updated_at || new Date().toISOString()
    };
  });
  await upsert('workers', rows);
  return new Map(workers.map(worker => [worker.id, deterministicUuid('worker', worker.id)]));
}

async function ingestTasks(buildingMap, workerMap) {
  const routines = loadJson('routines.json');
  const seen = new Set();
  const rows = routines.map(routine => {
    const id = deterministicUuid('task', routine.id);
    if (seen.has(id)) {
      return null;
    }
    seen.add(id);
    const buildingId = routine.buildingId ? buildingMap.get(routine.buildingId) || null : null;
    const workerId = routine.workerId ? workerMap.get(routine.workerId) || null : null;
    const allowedCategories = new Set(['Maintenance', 'Cleaning', 'Sanitation', 'Operations', 'Inspection', 'Emergency']);
    const category = allowedCategories.has(routine.category) ? routine.category : 'Operations';
    return {
      id,
      name: routine.title || routine.id,
      description: routine.description || null,
      category,
      priority: 'normal',
      status: 'Pending',
      assigned_building_id: buildingId,
      assigned_worker_id: workerId,
      due_date: null,
      estimated_duration: routine.estimatedDuration || null,
      requires_photo: routine.requiresPhoto ? 1 : 0,
      notes: routine.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean);
  await upsert('tasks', rows);
}

async function ingestCompliance(buildingMap) {
  const buildings = loadJson('buildings.json');
  const rows = buildings
    .filter(b => b.compliance_score !== undefined)
    .map(building => ({
      id: deterministicUuid('compliance', building.id),
      building_id: buildingMap.get(building.id) || null,
      category: 'Portfolio',
      status: building.compliance_score >= 0.9 ? 'compliant' : 'warning',
      score: building.compliance_score,
      last_inspection: building.lastAssessmentDate || null,
      next_inspection: null,
      violations_count: 0,
      notes: building.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  await upsert('compliance', rows);
}

async function ingestDsny(buildingMap) {
  const buildings = loadJson('buildings.json');
  const rows = buildings.map(building => ({
    id: deterministicUuid('dsny_schedule', building.id),
    building_id: buildingMap.get(building.id) || null,
    borough: building.borough || null,
    community_board: building.communityBoard || null,
    sanitation_district: building.sanitationDistrict || null,
    normalized_address: building.address ? building.address.toLowerCase() : building.name,
    regular_collection: building.regular_collection || null,
    recycling_collection: building.recycling_collection || null,
    organic_collection: building.organic_collection || null,
    snow_priority: building.snow_priority || null,
    metadata: {},
    last_updated: new Date().toISOString()
  }));
  await upsert('dsny_schedule_cache', rows);
}

async function ingestWeather(buildingMap) {
  const buildings = loadJson('buildings.json');
  for (const sourceBuilding of buildings) {
    const buildingUuid = buildingMap.get(sourceBuilding.id);
    if (!buildingUuid) continue;
    if (!sourceBuilding.latitude || !sourceBuilding.longitude) continue;

    try {
      const params = new URLSearchParams({
        latitude: sourceBuilding.latitude.toString(),
        longitude: sourceBuilding.longitude.toString(),
        current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code'
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) {
        console.warn(`⚠️  Weather fetch failed for ${sourceBuilding.name}: ${response.statusText}`);
        continue;
      }
      const data = await response.json();
      const current = data.current || {};
      const content = `Current weather for ${sourceBuilding.name}: temperature ${current.temperature_2m}°C, humidity ${current.relative_humidity_2m}%, precipitation ${current.precipitation ?? 0}mm, code ${current.weather_code}.`;
      const docId = deterministicUuid('weather', sourceBuilding.id);

      const { error: docError } = await supabase.from('knowledge_documents').upsert(
        [
          {
            id: docId,
            source_type: 'weather_current',
            source_id: sourceBuilding.id,
            title: `${sourceBuilding.name} Weather`,
            summary: `Live weather snapshot for ${sourceBuilding.name}`,
            building_id: buildingUuid,
            client_id: null,
            metadata: current,
            total_chunks: 1,
            embedding_model: 'text-embedding-3-small',
            updated_at: new Date().toISOString()
          }
        ],
        { onConflict: 'id' }
      );
      if (docError) {
        console.warn(`⚠️  Failed upserting weather doc for ${sourceBuilding.name}:`, docError);
        continue;
      }

      const { error: chunkError } = await supabase.from('knowledge_chunks').upsert(
        [
          {
            id: deterministicUuid('weather_chunk', sourceBuilding.id),
            document_id: docId,
            chunk_index: 0,
            content,
            token_count: content.length,
            metadata: current,
            updated_at: new Date().toISOString()
          }
        ],
        { onConflict: 'document_id,chunk_index' }
      );
      if (chunkError) {
        console.warn(`⚠️  Failed upserting weather chunk for ${sourceBuilding.name}:`, chunkError);
      } else {
        console.log(`✅ Weather knowledge updated for ${sourceBuilding.name}`);
      }
    } catch (error) {
      console.warn(`⚠️  Weather fetch error for building ${sourceBuilding.id}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Backfilling Supabase knowledge base...');
  const clientMap = await ingestClients();
  const buildingMap = await ingestBuildings(clientMap);
  const workerMap = await ingestWorkers();
  await ingestTasks(buildingMap, workerMap);
  await ingestCompliance(buildingMap);
  await ingestDsny(buildingMap);
  await ingestWeather(buildingMap);
  console.log('✅ Backfill completed');
}

main().catch(error => {
  console.error('❌ Backfill failed:', error);
  process.exit(1);
});
