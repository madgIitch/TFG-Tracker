import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { corsHeaders, handleCORS } from '../_shared/cors.ts'

serve(async (req) => {
  // Manejo de CORS
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const supabase = supabaseAdmin

    // GET /locations/cities?q=<texto>
    if (req.method === 'GET' && pathParts[pathParts.length - 1] === 'cities') {
      const query = url.searchParams.get('q')

      let dbQuery = supabase
        .from('cities')
        .select('id, name, centroid')
        
      if (query && query.trim().length > 0) {
        // Búsqueda simple por ilike. Idealmente se usaría text search en produccion
        dbQuery = dbQuery.ilike('name', `%${query.trim()}%`)
      }

      dbQuery = dbQuery.order('name', { ascending: true }).limit(50)

      const { data, error } = await dbQuery

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // GET /locations/cities/:cityId/places
    if (req.method === 'GET' && pathParts.length >= 2 && pathParts[pathParts.length - 1] === 'places') {
      const cityId = pathParts[pathParts.length - 2]
      
      const { data, error } = await supabase
        .from('city_places')
        .select('id, city_id, name, centroid')
        .eq('city_id', cityId)
        .order('name', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )

  } catch (error: any) {
    console.error('Error en locations function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
