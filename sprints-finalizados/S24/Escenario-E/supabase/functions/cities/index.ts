// supabase/functions/cities/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCORS } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

Deno.serve(async (req: Request) => {
  const corsRes = handleCORS(req);
  if (corsRes) return corsRes;

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    const cityId = url.searchParams.get('city_id');
    const limitParam = url.searchParams.get('limit');
    const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 10, 50);

    if (cityId) {
      let query = supabase
        .from('city_places')
        .select('id, city_id, name')
        .eq('city_id', cityId)
        .order('name')
        .limit(limit);

      if (q) {
        query = query.ilike('name', `%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ places: data ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase
      .from('cities')
      .select('id, name, centroid')
      .order('name')
      .limit(limit);

    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ cities: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[cities] Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
