# 🧠 Embeddings Setup Guide

This guide explains how to enable semantic search in CyntientOps using OpenAI embeddings and Supabase pgvector.

## Overview

The embeddings system allows Nova AI to perform semantic search across the knowledge base, finding relevant information based on meaning rather than just keyword matching.

**Current State:**
- ✅ Knowledge ingestion pipeline (backfill-knowledge.js)
- ✅ Embedding generation script (embed-knowledge.js)
- ✅ Nova integration with retrieval
- ⏳ **Pending:** pgvector extension enablement + vector search queries

## Prerequisites

### 1. Supabase pgvector Extension

pgvector must be enabled in your Supabase project:

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

Or enable via Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Search for "vector"
3. Click "Enable"

### 2. OpenAI API Key

Get an API key from OpenAI:
1. Visit https://platform.openai.com/api-keys
2. Create a new secret key
3. Add to your environment:
   ```bash
   export OPENAI_API_KEY='sk-...'
   ```

**Pricing:**
- Model: `text-embedding-3-small`
- Cost: ~$0.02 per 1M tokens
- For 20 buildings with ~500 chunks: ~$0.01 total

## Migration: Add Embedding Column

Run this SQL in Supabase to add the embedding column:

```sql
-- Add vector column to knowledge_chunks (1536 dimensions for text-embedding-3-small)
ALTER TABLE knowledge_chunks
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector similarity index for fast searches
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create RPC function for vector search
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_building_id uuid DEFAULT NULL,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  token_count int,
  similarity float,
  metadata jsonb,
  created_at timestamptz,
  document_title text,
  document_source text,
  document_tags text[],
  document_metadata jsonb,
  building_id uuid,
  client_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.chunk_index,
    kc.content,
    kc.token_count,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.metadata,
    kc.created_at,
    kd.title AS document_title,
    kd.source_type AS document_source,
    kd.tags AS document_tags,
    kd.metadata AS document_metadata,
    kd.building_id,
    kd.client_id
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE
    (kc.embedding <=> query_embedding) < (1 - match_threshold)
    AND (filter_building_id IS NULL OR kd.building_id = filter_building_id)
    AND (filter_source_types IS NULL OR kd.source_type = ANY(filter_source_types))
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Usage

### 1. Generate Embeddings for Existing Knowledge

After running `backfill-knowledge.js`, generate embeddings:

```bash
# Set required environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SERVICE_KEY="your-service-role-key"
export OPENAI_API_KEY="sk-your-openai-key"

# Run embeddings script
node scripts/embed-knowledge.js

# Optional: specify batch size and continue on errors
node scripts/embed-knowledge.js --batch-size=100 --continue-on-error
```

**Output:**
```
🧠 Embedding knowledge chunks with OpenAI...
📦 Batch size: 50
✅ Embedded 50 chunk(s) (total: 50)
⏳ Waiting 1s to avoid rate limits...
✅ Embedded 42 chunk(s) (total: 92)

📊 Embedding Summary:
   ✅ Successfully embedded: 92 chunks
   ℹ️  All chunks already have embeddings
```

### 2. Automatic Embedding Pipeline

Add embedding generation to your refresh workflow:

**Option A: Add to refresh-knowledge.js**

```javascript
// In scripts/refresh-knowledge.js
function main() {
  requireEnv('SUPABASE_URL');
  requireEnv('SERVICE_KEY');

  console.log('🚀 Refreshing Supabase knowledge base...');
  run('npx', ['ts-node', ...migration]);
  run('node', ['scripts/backfill-knowledge.js']);
  run('npx', ['ts-node', ...analyze]);

  // Add embeddings if OPENAI_API_KEY is set
  if (process.env.OPENAI_API_KEY) {
    console.log('🧠 Generating embeddings...');
    run('node', ['scripts/embed-knowledge.js']);
  } else {
    console.log('⏭️  Skipping embeddings (OPENAI_API_KEY not set)');
  }

  console.log('✅ Knowledge refresh completed');
}
```

**Option B: Separate cron job**

```bash
# Run embeddings nightly (less frequent than data refresh)
0 2 * * * cd /path/to/project && node scripts/embed-knowledge.js
```

### 3. Using Vector Search in Nova

Update Nova queries to use vector search when embeddings are available:

**Swift (SupabaseKnowledgeService):**

```swift
public func semanticSearch(
    for query: String,
    buildingId: UUID? = nil,
    sourceTypes: [String]? = nil,
    threshold: Double = 0.7,
    limit: Int = 6
) async throws -> [NovaKnowledgeResult] {
    // First, generate embedding for the query using OpenAI
    let queryEmbedding = try await generateEmbedding(for: query)

    // Call Supabase RPC function
    let params: [String: Any] = [
        "query_embedding": queryEmbedding,
        "match_threshold": threshold,
        "match_count": limit,
        "filter_building_id": buildingId as Any,
        "filter_source_types": sourceTypes as Any
    ]

    let response = try await client.database
        .rpc("match_knowledge_chunks", params: params)
        .execute()

    // ... decode and return results
}
```

**React Native:**

```typescript
async function semanticSearch(
  query: string,
  buildingId?: string,
  sourceTypes?: string[],
  threshold: number = 0.7,
  limit: number = 6
): Promise<KnowledgeResult[]> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_building_id: buildingId,
    filter_source_types: sourceTypes
  });

  if (error) throw error;
  return data;
}
```

## Monitoring & Maintenance

### Check Embedding Coverage

```sql
-- Count chunks with/without embeddings
SELECT
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS embedded,
  COUNT(*) FILTER (WHERE embedding IS NULL) AS missing
FROM knowledge_chunks;
```

### Test Vector Search

```sql
-- Test similarity search (requires a sample embedding)
SELECT
  kd.title,
  kc.content,
  1 - (kc.embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM knowledge_chunks kc
JOIN knowledge_documents kd ON kc.document_id = kd.id
WHERE kc.embedding IS NOT NULL
ORDER BY kc.embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

### Re-embed Updated Content

When knowledge is updated, re-generate embeddings:

```sql
-- Clear embeddings for updated chunks (forces re-embedding)
UPDATE knowledge_chunks
SET embedding = NULL
WHERE updated_at > NOW() - INTERVAL '1 day';
```

Then run:
```bash
node scripts/embed-knowledge.js
```

## Troubleshooting

### Error: "pgvector extension not detected"

**Solution:** Enable pgvector in Supabase Dashboard → Database → Extensions

### Error: "OpenAI rate limit exceeded"

**Solutions:**
- Use smaller `--batch-size` (default: 50)
- Wait a few minutes between runs
- Upgrade OpenAI plan for higher limits

### Error: "Invalid API key"

**Solution:** Verify your OpenAI API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Embeddings not improving search quality

**Possible causes:**
- Insufficient training data (need more diverse content)
- Query mismatch (ensure queries match content style)
- Threshold too high (try 0.6 instead of 0.7)

**Solutions:**
- Add more knowledge chunks
- Use hybrid search (keyword + vector)
- Tune similarity threshold

## Cost Estimation

For a typical deployment with 20 buildings:

| Item | Count | Cost |
|------|-------|------|
| Initial embeddings | ~500 chunks | $0.01 |
| Daily updates | ~50 chunks/day | $0.0001/day |
| Monthly total | | ~$0.01 |

**OpenAI Pricing:** https://openai.com/api/pricing/

## Next Steps

1. ✅ Enable pgvector extension
2. ✅ Run migration to add embedding column
3. ✅ Set OPENAI_API_KEY
4. ✅ Generate initial embeddings
5. ⏳ Update Nova services to use vector search
6. ⏳ Add embedding generation to automated pipeline
7. ⏳ Monitor and optimize search quality

## Resources

- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
