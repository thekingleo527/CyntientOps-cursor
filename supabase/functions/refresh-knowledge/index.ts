/**
 * Supabase Edge Function: refresh-knowledge
 *
 * Refreshes the knowledge base by:
 * 1. Ingesting operational data (buildings, workers, tasks, compliance)
 * 2. Updating DSNY schedule cache
 * 3. Refreshing weather snapshots
 *
 * Invoke via cron or HTTP POST:
 * curl -X POST https://<project>.supabase.co/functions/v1/refresh-knowledge \
 *   -H "Authorization: Bearer <anon-key>"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🚀 Starting knowledge refresh...');

    // Step 1: Load buildings for weather refresh
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, name, address, latitude, longitude')
      .eq('is_active', 1);

    if (buildingsError) {
      throw new Error(`Failed to load buildings: ${buildingsError.message}`);
    }

    console.log(`✅ Loaded ${buildings?.length ?? 0} active buildings`);

    // Step 2: Refresh weather data for each building
    let weatherUpdated = 0;
    let weatherFailed = 0;

    for (const building of buildings ?? []) {
      if (!building.latitude || !building.longitude) {
        console.warn(`⚠️  Skipping ${building.name}: missing coordinates`);
        continue;
      }

      try {
        const params = new URLSearchParams({
          latitude: building.latitude.toString(),
          longitude: building.longitude.toString(),
          current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
        });

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`
        );

        if (!weatherResponse.ok) {
          throw new Error(`Weather API returned ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current || {};

        const content = `Current weather for ${building.name}: temperature ${current.temperature_2m}°C, humidity ${current.relative_humidity_2m}%, precipitation ${current.precipitation ?? 0}mm, wind speed ${current.wind_speed_10m ?? 0} m/s, code ${current.weather_code}.`;

        // Upsert knowledge document
        const docId = deterministicUuid('weather', building.id);

        const { error: docError } = await supabase
          .from('knowledge_documents')
          .upsert({
            id: docId,
            source_type: 'weather_current',
            source_id: building.id,
            title: `${building.name} Weather`,
            summary: `Live weather snapshot for ${building.name}`,
            building_id: building.id,
            metadata: current,
            total_chunks: 1,
            embedding_model: 'text-embedding-3-small',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (docError) throw docError;

        // Upsert knowledge chunk
        const { error: chunkError } = await supabase
          .from('knowledge_chunks')
          .upsert({
            id: deterministicUuid('weather_chunk', building.id),
            document_id: docId,
            chunk_index: 0,
            content,
            token_count: content.length,
            metadata: current,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'document_id,chunk_index' });

        if (chunkError) throw chunkError;

        weatherUpdated++;
        console.log(`✅ Weather updated for ${building.name}`);
      } catch (error) {
        weatherFailed++;
        console.error(`❌ Failed to update weather for ${building.name}:`, error);
      }
    }

    // Step 3: Update compliance alerts count
    const { count: complianceCount } = await supabase
      .from('compliance')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'compliant');

    console.log(`✅ Knowledge refresh complete`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          buildings_processed: buildings?.length ?? 0,
          weather_updated: weatherUpdated,
          weather_failed: weatherFailed,
          compliance_alerts: complianceCount ?? 0,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Refresh failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Generate deterministic UUID v4-like string from namespace and value
 * Using synchronous crypto for Deno edge functions
 */
function deterministicUuid(namespace: string, value: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${namespace}:${value}`);

  // Use Deno's crypto API synchronously
  const hashBuffer = crypto.subtle.digestSync('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}
