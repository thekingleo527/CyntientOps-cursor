#!/usr/bin/env node

/**
 * Combine schema migration, data backfill, and ANALYZE into a single refresh step.
 * Useful for cron/CI scheduling: `node scripts/refresh-knowledge.js`
 */

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    env: {
      ...process.env
    },
    ...options
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`❌ Missing required env var: ${name}`);
    process.exit(1);
  }
}

function main() {
  requireEnv('SUPABASE_URL');
  requireEnv('SERVICE_KEY');

  console.log('🚀 Refreshing Supabase knowledge base...');
  run('npx', ['ts-node', '--compiler-options', '{"types":["node"],"module":"CommonJS"}', 'scripts/run-supabase-migration.ts']);
  run('node', ['scripts/backfill-knowledge.js']);
  run('npx', ['ts-node', '--compiler-options', '{"types":["node"],"module":"CommonJS"}', 'scripts/analyze-knowledge.ts']);
  console.log('✅ Knowledge refresh completed');
}

main();
