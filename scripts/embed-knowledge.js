#!/usr/bin/env node

/**
 * Generate embeddings for knowledge chunks using OpenAI (text-embedding-3-small).
 * Requires OPENAI_API_KEY and pgvector extension enabled in Supabase.
 *
 * Usage:
 *   node scripts/embed-knowledge.js [--batch-size=50] [--continue-on-error]
 *
 * Environment Variables:
 *   SUPABASE_URL - Supabase project URL
 *   SERVICE_KEY - Supabase service role key
 *   OPENAI_API_KEY - OpenAI API key
 */

const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

const url =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PROJECT_URL ||
  process.env.SUPABASE_URL_INTERNAL;

const serviceRoleKey =
  process.env.SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const openaiKey = process.env.OPENAI_API_KEY;

if (!url || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials (SUPABASE_URL/SERVICE_KEY).');
  process.exit(1);
}

if (!openaiKey) {
  console.error('❌ Missing OPENAI_API_KEY.');
  console.error('   Get your key at: https://platform.openai.com/api-keys');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Parse command-line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 50;
const continueOnError = args.includes('--continue-on-error');

async function checkPgvectorExtension() {
  const { data, error } = await supabase.rpc('pg_extension_exists', { name: 'vector' });

  if (error) {
    console.warn('⚠️  Could not verify pgvector extension. Proceeding anyway...');
    return false;
  }

  return !!data;
}

async function fetchChunksWithoutEmbeddings(limit = 50) {
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id, content, document_id')
    .is('embedding', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data || [];
}

async function embed(texts) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float'
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    if (error.status === 429) {
      console.error('❌ OpenAI rate limit exceeded. Please wait and try again.');
    } else if (error.status === 401) {
      console.error('❌ Invalid OpenAI API key.');
    } else {
      console.error('❌ OpenAI API error:', error.message);
    }
    throw error;
  }
}

async function updateChunks(chunks, embeddings) {
  const payload = chunks.map((chunk, index) => ({
    id: chunk.id,
    embedding: JSON.stringify(embeddings[index]) // pgvector expects JSON array
  }));

  const { error } = await supabase.from('knowledge_chunks').upsert(payload, {
    onConflict: 'id'
  });

  if (error) {
    throw error;
  }
}

async function main() {
  console.log('🧠 Embedding knowledge chunks with OpenAI...');
  console.log(`📦 Batch size: ${batchSize}`);

  // Check if pgvector is enabled
  const hasPgvector = await checkPgvectorExtension();
  if (!hasPgvector) {
    console.error('⚠️  pgvector extension not detected in Supabase.');
    console.error('   Enable it in Dashboard → Database → Extensions → vector');
    if (!continueOnError) {
      process.exit(1);
    }
  }

  let totalProcessed = 0;
  let totalFailed = 0;
  let hasMore = true;

  while (hasMore) {
    const chunks = await fetchChunksWithoutEmbeddings(batchSize);

    if (!chunks.length) {
      hasMore = false;
      break;
    }

    console.log(`\n📝 Processing batch of ${chunks.length} chunks...`);

    try {
      const embeddings = await embed(chunks.map(chunk => chunk.content));
      await updateChunks(chunks, embeddings);
      totalProcessed += chunks.length;
      console.log(`✅ Embedded ${chunks.length} chunk(s) (total: ${totalProcessed})`);

      // Rate limiting: OpenAI free tier allows ~3 requests/min
      // Wait 1 second between batches to avoid hitting limits
      if (chunks.length === batchSize) {
        console.log('⏳ Waiting 1s to avoid rate limits...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      totalFailed += chunks.length;
      console.error(`❌ Failed to embed batch: ${error.message}`);

      if (!continueOnError) {
        throw error;
      }

      console.warn('⚠️  Continuing with next batch (--continue-on-error)...');
    }

    // If we got fewer chunks than batch size, we're done
    if (chunks.length < batchSize) {
      hasMore = false;
    }
  }

  console.log('\n📊 Embedding Summary:');
  console.log(`   ✅ Successfully embedded: ${totalProcessed} chunks`);
  if (totalFailed > 0) {
    console.log(`   ❌ Failed: ${totalFailed} chunks`);
  }

  if (totalProcessed === 0 && totalFailed === 0) {
    console.log('   ℹ️  All chunks already have embeddings');
  }
}

main().catch(error => {
  console.error('❌ Embedding failed:', error);
  process.exit(1);
});
