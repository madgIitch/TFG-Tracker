import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth } from '../_shared/auth.ts';
import type { JWTPayload } from '../_shared/types.ts';

type CityRow = {
  id: string;
  name: string;
  ref_ine?: string | null;
  ine_municipio?: string | null;
};

type ZoneRow = {
  id: string;
  city_id: string;
  name: string;
};

type CityOption = {
  id: string;
  name: string;
  province_code: string | null;
};

type ZoneOption = {
  id: string;
  city_id: string;
  name: string;
};

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function normalizeQuery(value: string | null): string {
  return (value ?? '').trim();
}

function toLimit(value: string | null, fallback = 20): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(parsed)));
}

function provinceCodeFromCity(city: CityRow): string | null {
  const fromMunicipio = city.ine_municipio?.slice(0, 2);
  if (fromMunicipio && fromMunicipio.length === 2) return fromMunicipio;

  const digitsRef = (city.ref_ine ?? '').replace(/\D/g, '');
  if (digitsRef.length >= 2) return digitsRef.slice(0, 2);

  const digitsId = city.id.replace(/\D/g, '');
  if (digitsId.length >= 2) return digitsId.slice(0, 2);

  return null;
}

function cityToOption(city: CityRow): CityOption {
  return {
    id: city.id,
    name: city.name,
    province_code: provinceCodeFromCity(city),
  };
}

function zoneToOption(zone: ZoneRow): ZoneOption {
  return {
    id: zone.id,
    city_id: zone.city_id,
    name: zone.name,
  };
}

const handler = withAuth(
  async (req: Request, _payload: JWTPayload): Promise<Response> => {
    try {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const url = new URL(req.url);
      const pathname = url.pathname.toLowerCase();
      const isCitiesRoute = pathname.endsWith('/locations/cities');
      const isZonesRoute = pathname.endsWith('/locations/zones');

      if (isCitiesRoute) {
        const q = normalizeQuery(url.searchParams.get('q'));
        const limit = toLimit(url.searchParams.get('limit'));

        let query = supabaseClient
          .from('cities')
          .select('id, name, ref_ine, ine_municipio')
          .order('name', { ascending: true })
          .limit(limit);

        if (q.length > 0) {
          query = query.ilike('name', `%${q}%`);
        }

        const { data, error } = await query;
        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch cities', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ data: (data ?? []).map((item) => cityToOption(item as CityRow)) }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (isZonesRoute) {
        const cityId = normalizeQuery(url.searchParams.get('city_id'));
        if (!cityId) {
          return new Response(
            JSON.stringify({ error: 'city_id is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const q = normalizeQuery(url.searchParams.get('q'));
        const limit = toLimit(url.searchParams.get('limit'));

        let query = supabaseClient
          .from('city_places')
          .select('id, city_id, name')
          .eq('city_id', cityId)
          .order('name', { ascending: true })
          .limit(limit);

        if (q.length > 0) {
          query = query.ilike('name', `%${q}%`);
        }

        const { data, error } = await query;
        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch zones', details: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ data: (data ?? []).map((item) => zoneToOption(item as ZoneRow)) }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }
);

Deno.serve(handler);
