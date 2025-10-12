# Supabase Edge Functions

This directory contains Supabase Edge Functions for automating knowledge base operations.

## Available Functions

### 1. `refresh-knowledge`
Full knowledge refresh including weather updates and compliance checks.

**Purpose:**
- Refreshes weather data for all active buildings
- Updates compliance alert counts
- Provides comprehensive stats

**Schedule:** Every 6 hours or on-demand
**Endpoint:** `https://<project>.supabase.co/functions/v1/refresh-knowledge`

### 2. `weather-refresh`
Lightweight weather-only refresh for frequent updates.

**Purpose:**
- Updates weather snapshots for all buildings with coordinates
- Converts WMO weather codes to readable descriptions
- Fast execution (~2-5 seconds for 20 buildings)

**Schedule:** Every hour
**Endpoint:** `https://<project>.supabase.co/functions/v1/weather-refresh`

## Deployment

### Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

### Deploy Functions

Deploy all functions:
```bash
supabase functions deploy
```

Deploy specific function:
```bash
supabase functions deploy refresh-knowledge
supabase functions deploy weather-refresh
```

## Scheduling with Supabase Cron

### Option 1: Using Supabase Dashboard

1. Go to **Database** → **Extensions** → Enable `pg_cron`
2. Go to **SQL Editor** and run:

```sql
-- Weather refresh every hour
SELECT cron.schedule(
  'weather-refresh-hourly',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://<your-project-ref>.supabase.co/functions/v1/weather-refresh',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Full knowledge refresh every 6 hours
SELECT cron.schedule(
  'knowledge-refresh-6h',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT
    net.http_post(
      url := 'https://<your-project-ref>.supabase.co/functions/v1/refresh-knowledge',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### Option 2: Using External Cron (GitHub Actions)

Create `.github/workflows/refresh-knowledge.yml`:

```yaml
name: Refresh Knowledge Base

on:
  schedule:
    - cron: '0 * * * *'  # Hourly
  workflow_dispatch:      # Manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Weather Refresh
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/weather-refresh \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

## Manual Invocation

### Using cURL

Weather refresh:
```bash
curl -X POST https://<project>.supabase.co/functions/v1/weather-refresh \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json"
```

Full refresh:
```bash
curl -X POST https://<project>.supabase.co/functions/v1/refresh-knowledge \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json"
```

### Using Supabase CLI

```bash
supabase functions invoke weather-refresh --no-verify-jwt
supabase functions invoke refresh-knowledge --no-verify-jwt
```

## Monitoring

### View Function Logs

```bash
supabase functions logs weather-refresh
supabase functions logs refresh-knowledge
```

### View Cron Job Status

```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Environment Variables

Functions automatically have access to:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has admin access)
- `SUPABASE_ANON_KEY` - Anonymous key (public access)

No additional configuration needed!

## Troubleshooting

### Function fails with "Missing Supabase credentials"
- Ensure the function is deployed to Supabase (not running locally)
- Environment variables are auto-injected in production

### Weather API timeout
- Open Meteo API has rate limits (10,000 calls/day for free tier)
- Consider batching or reducing frequency if hitting limits

### Database connection issues
- Check RLS policies on `knowledge_documents` and `knowledge_chunks`
- Ensure service role key has proper permissions

## Development

### Local Testing

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Serve function locally:
   ```bash
   supabase functions serve weather-refresh --env-file .env.local
   ```

3. Test with cURL:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/weather-refresh \
     -H "Authorization: Bearer <anon-key>"
   ```

### Environment File (.env.local)

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-key>
```

## Related Scripts

- `scripts/backfill-knowledge.js` - Initial data ingestion
- `scripts/refresh-knowledge.js` - Full refresh orchestrator
- `scripts/embed-knowledge.js` - Embeddings generation (requires OpenAI API key)
- `scripts/analyze-knowledge.ts` - Database optimization

These Edge Functions are production-ready alternatives to the Node.js scripts for automated scheduling.
