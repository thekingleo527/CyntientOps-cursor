#!/usr/bin/env ts-node
/// <reference types="node" />

/**
 * Run ANALYZE on the Supabase knowledge_chunks table to refresh vector stats.
 */

import { createClient } from '@supabase/supabase-js';

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

async function runAnalyze() {
  console.log('🧠 Running ANALYZE on knowledge_chunks ...');
  const { error } = await supabase.rpc('exec_sql', { sql: 'ANALYZE knowledge_chunks;' });

  if (error) {
    console.error('❌ ANALYZE failed:', error);
    process.exit(1);
  }

  console.log('✅ ANALYZE completed successfully');
}

runAnalyze().catch(error => {
  console.error('❌ Unexpected error during ANALYZE:', error);
  process.exit(1);
});
