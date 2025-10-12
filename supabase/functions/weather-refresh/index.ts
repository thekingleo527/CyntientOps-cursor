/**
 * Supabase Edge Function: weather-refresh
 *
 * Lightweight function that only refreshes weather data for active buildings.
 * Ideal for frequent cron scheduling (e.g., every hour).
 *
 * Invoke via cron or HTTP POST:
 * curl -X POST https://<project>.supabase.co/functions/v1/weather-refresh \
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

    console.log('🌤️  Starting weather refresh...');

    // Load active buildings with coordinates
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, name, address, latitude, longitude')
      .eq('is_active', 1)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (buildingsError) {
      throw new Error(`Failed to load buildings: ${buildingsError.message}`);
    }

    console.log(`✅ Loaded ${buildings?.length ?? 0} buildings with coordinates`);

    let updated = 0;
    let failed = 0;
    const results: Array<{ building: string; status: string; error?: string }> = [];

    // Refresh weather for each building
    for (const building of buildings ?? []) {
      try {
        const params = new URLSearchParams({
          latitude: building.latitude.toString(),
          longitude: building.longitude.toString(),
          current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
          timezone: 'America/New_York',
        });

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`
        );

        if (!weatherResponse.ok) {
          throw new Error(`Weather API returned ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current || {};

        // Format weather description
        const conditions = getWeatherDescription(current.weather_code ?? 0);
        const content = `Weather at ${building.name} (${building.address}): ${conditions}, ${current.temperature_2m}°C, ${current.relative_humidity_2m}% humidity, ${current.precipitation ?? 0}mm precipitation, wind ${current.wind_speed_10m ?? 0} m/s from ${current.wind_direction_10m ?? 0}°. Last updated: ${current.time ?? new Date().toISOString()}.`;

        // Deterministic IDs
        const docId = deterministicUuid('weather', building.id);
        const chunkId = deterministicUuid('weather_chunk', building.id);

        // Upsert knowledge document
        const { error: docError } = await supabase
          .from('knowledge_documents')
          .upsert({
            id: docId,
            source_type: 'weather_current',
            source_id: building.id,
            title: `${building.name} Weather`,
            summary: `${conditions} - ${current.temperature_2m}°C`,
            building_id: building.id,
            tags: ['weather', 'current', conditions.toLowerCase()],
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
            id: chunkId,
            document_id: docId,
            chunk_index: 0,
            content,
            token_count: content.length,
            metadata: { ...current, building_name: building.name },
            updated_at: new Date().toISOString(),
          }, { onConflict: 'document_id,chunk_index' });

        if (chunkError) throw chunkError;

        updated++;
        results.push({ building: building.name, status: 'success' });
        console.log(`✅ Weather updated for ${building.name}`);
      } catch (error) {
        failed++;
        results.push({
          building: building.name,
          status: 'failed',
          error: error.message,
        });
        console.error(`❌ Failed to update weather for ${building.name}:`, error);
      }
    }

    console.log(`✅ Weather refresh complete: ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          total_buildings: buildings?.length ?? 0,
          updated,
          failed,
        },
        results: results.slice(0, 10), // Limit results in response
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Weather refresh failed:', error);

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
 * Generate deterministic UUID from namespace and value
 */
function deterministicUuid(namespace: string, value: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${namespace}:${value}`);

  const hashBuffer = crypto.subtle.digestSync('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Convert WMO weather code to human-readable description
 * https://open-meteo.com/en/docs
 */
function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail',
  };

  return weatherCodes[code] ?? 'Unknown';
}
