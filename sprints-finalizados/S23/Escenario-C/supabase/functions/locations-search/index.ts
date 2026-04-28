import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCORS } from '../_shared/cors.ts';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

type GenericRow = Record<string, unknown>;

type LocationCity = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

type LocationZone = {
  id: string;
  name: string;
  city_id?: string;
  city_name?: string;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const getRowString = (row: GenericRow, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return undefined;
};

const getCityId = (row: GenericRow): string | undefined =>
  getRowString(row, ['city_id', 'cityId', 'municipality_id', 'id_city']);

const getCityName = (row: GenericRow): string | undefined =>
  getRowString(row, ['city_name', 'city', 'municipality_name', 'city_label']);

const mapCityFromCitiesRow = (row: GenericRow): LocationCity | null => {
  const id = getRowString(row, ['id', 'city_id']);
  const name = getRowString(row, ['name', 'city', 'label']);
  if (!id || !name) return null;

  const centroidValue = row.centroid;
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (centroidValue && typeof centroidValue === 'object') {
    const maybe = centroidValue as Record<string, unknown>;
    latitude = asNumber(maybe.latitude ?? maybe.lat);
    longitude = asNumber(maybe.longitude ?? maybe.lng ?? maybe.lon);
  }

  latitude = latitude ?? asNumber(row.latitude ?? row.lat);
  longitude = longitude ?? asNumber(row.longitude ?? row.lng ?? row.lon);

  return {
    id,
    name,
    ...(latitude != null ? { latitude } : {}),
    ...(longitude != null ? { longitude } : {}),
  };
};

const mapZoneRow = (row: GenericRow): LocationZone | null => {
  const id = getRowString(row, ['id', 'zone_id', 'place_id']);
  const name = getRowString(row, ['name', 'label', 'place_name', 'zone']);
  if (!id || !name) return null;

  return {
    id,
    name,
    ...(getCityId(row) ? { city_id: getCityId(row) } : {}),
    ...(getCityName(row) ? { city_name: getCityName(row) } : {}),
  };
};

async function searchCities(q: string, limit: number): Promise<LocationCity[]> {
  const { data, error } = await supabaseClient
    .from('cities')
    .select('*')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as GenericRow[])
    .map(mapCityFromCitiesRow)
    .filter((item): item is LocationCity => Boolean(item));
}

async function getZones(cityId: string, q: string | null, limit: number): Promise<LocationZone[]> {
  let query = supabaseClient
    .from('city_places')
    .select('*')
    .eq('city_id', cityId)
    .limit(limit * 2);

  if (q) {
    query = query.ilike('name', `%${q}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const normalizedQuery = q?.toLowerCase().trim() ?? '';

  return (data as GenericRow[])
    .filter((row) => {
      const type = getRowString(row, ['type', 'place_type', 'kind']);
      if (type && type.toLowerCase().includes('city')) return false;
      const name = getRowString(row, ['name', 'label', 'place_name', 'zone']);
      if (!normalizedQuery || !name) return true;
      return name.toLowerCase().includes(normalizedQuery);
    })
    .map(mapZoneRow)
    .filter((item): item is LocationZone => Boolean(item))
    .slice(0, limit);
}

async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const type = (url.searchParams.get('type') ?? 'cities').toLowerCase();
    const q = (url.searchParams.get('q') ?? '').trim();
    const limit = Math.min(
      Math.max(Number(url.searchParams.get('limit') ?? '10') || 10, 1),
      50
    );

    if (type === 'cities') {
      if (q.length < 2) {
        return new Response(JSON.stringify({ cities: [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cities = await searchCities(q, limit);
      return new Response(JSON.stringify({ cities }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'zones') {
      const cityId = (url.searchParams.get('city_id') ?? '').trim();
      if (!cityId) {
        return new Response(JSON.stringify({ error: 'city_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const zones = await getZones(cityId, q.length >= 2 ? q : null, limit);
      return new Response(JSON.stringify({ zones }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

Deno.serve(handler);
