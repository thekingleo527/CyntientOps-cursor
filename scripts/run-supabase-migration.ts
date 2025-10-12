#!/usr/bin/env ts-node
/// <reference types="node" />

/**
 * Run Supabase schema migrations using the service role key.
 * Applies statements from scripts/supabase-schema.sql sequentially via exec_sql.
 */

import fs from 'fs';
import path from 'path';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

const url =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.SUPABASE_URL_INTERNAL;
const serviceRoleKey =
  process.env.SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!url) {
  console.error('❌ Missing SUPABASE_URL. Set SUPABASE_URL before running the migration.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing service role key. Set SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}

async function run() {
  console.log('🚀 Running Supabase migrations using service role key');
  const supabaseUrl = url as string;
  const supabaseKey = serviceRoleKey as string;
  const client: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  const schemaPath = path.resolve(__dirname, 'supabase-schema.sql');
  const sqlSource = fs.readFileSync(schemaPath, 'utf8');

  const sanitizedSource = sqlSource.trim();

  const statements: string[] = [];
  let buffer = '';
  let index = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let dollarTag: string | null = null;

  while (index < sanitizedSource.length) {
    const char = sanitizedSource[index];
    const nextTwo = sanitizedSource.slice(index, index + 2);

    if (dollarTag) {
      if (sanitizedSource.slice(index, index + dollarTag.length) === dollarTag) {
        buffer += dollarTag;
        index += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buffer += char;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && nextTwo === '--') {
      const lineEnd = sanitizedSource.indexOf('\n', index);
      if (lineEnd === -1) {
        break;
      }
      index = lineEnd + 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '$') {
      const match = sanitizedSource.slice(index).match(/^\$([a-zA-Z0-9_]*)\$/);
      if (match) {
        dollarTag = match[0];
        buffer += dollarTag;
        index += dollarTag.length;
        continue;
      }
    }

    if (!inDoubleQuote && char === "'") {
      inSingleQuote = !inSingleQuote;
      buffer += char;
      index += 1;
      continue;
    }

    if (!inSingleQuote && char === '"') {
      inDoubleQuote = !inDoubleQuote;
      buffer += char;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarTag && char === ';') {
      const statement = buffer.trim();
      if (statement.length) {
        statements.push(statement);
      }
      buffer = '';
      index += 1;
      continue;
    }

    buffer += char;
    index += 1;
  }

  const finalStatement = buffer.trim();
  if (finalStatement.length) {
    statements.push(finalStatement);
  }

  const skipped: string[] = [];

  for (const statement of statements) {
    try {
      const { error } = await client.rpc('exec_sql', { sql: statement });
      if (error) {
        const message = error.message || '';
        if (
          statement.toLowerCase().includes('vector') &&
          message.toLowerCase().includes('permission denied')
        ) {
          console.warn(`⚠️  Skipping vector extension/index (not permitted): ${message}`);
          skipped.push(statement);
          continue;
        }

        console.warn(`⚠️  Statement failed, skipping:\n${statement}\n→ ${message}`);
        skipped.push(statement);
      } else {
        console.log(`✅ Executed: ${statement.split('\n')[0]}...`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error running statement:\n${statement}\n→`, error);
      skipped.push(statement);
    }
  }

  if (skipped.length) {
    console.log('\n⚠️  Skipped statements that need follow-up:');
    skipped.forEach(stmt => console.log(`   → ${stmt.split('\n')[0]}...`));
  } else {
    console.log('\n✅ Supabase schema fully applied');
  }
}

run().catch(error => {
  console.error('❌ Migration execution error:', error);
  process.exit(1);
});
/// <reference types="node" />
