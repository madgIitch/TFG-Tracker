import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withAuth } from '../_shared/auth.ts'
import {
  Room,
  RoomFilters,
  PaginatedResponse,
  JWTPayload,
} from '../_shared/types.ts'

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

type RoomWithRelations = Room & {
  flat?: Record<string, unknown>
  owner?: Record<string, unknown>
}

async function getFlatIdsByCity(city: string): Promise<string[]> {
  const { data, error } = await supabaseClient
    .from('flats')
    .select('id')
    .eq('city', city)

  if (error || !data) return []

  return data
    .map((row) => row.id as string)
    .filter(Boolean)
}

async function getFlatIdsByCityIds(cityIds: string[]): Promise<string[]> {
  if (cityIds.length === 0) return [];
  const { data, error } = await supabaseClient
    .from('flats')
    .select('id')
    .in('city_id', cityIds);
  if (error || !data) return [];
  return data.map((row) => row.id as string).filter(Boolean);
}

async function getFlatIdsByDistrictIds(zoneIds: string[]): Promise<string[]> {
  if (zoneIds.length === 0) return [];
  const { data, error } = await supabaseClient
    .from('flats')
    .select('id')
    .in('district_id', zoneIds);
  if (error || !data) return [];
  return data.map((row) => row.id as string).filter(Boolean);
}

function buildSearchQuery(filters: RoomFilters, scopedFlatIds?: string[]) {
  let query = supabaseClient
    .from('rooms')
    .select(
      `
      *,
      flat:flats(*),
      owner:users!rooms_owner_id_fkey(*)
    `
    )
    .eq('is_available', true)

  if (scopedFlatIds) {
    if (scopedFlatIds.length === 0) {
      query = query.eq('flat_id', '00000000-0000-0000-0000-000000000000')
    } else {
      query = query.in('flat_id', scopedFlatIds)
    }
  }

  if (typeof filters.price_min === 'number') {
    query = query.gte('price_per_month', filters.price_min)
  }

  if (typeof filters.price_max === 'number') {
    query = query.lte('price_per_month', filters.price_max)
  }

  if (filters.available_from) {
    query = query.lte('available_from', filters.available_from)
  }

  return query
}

function sortByRelevance(rooms: RoomWithRelations[], filters: RoomFilters): RoomWithRelations[] {
  return rooms.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    if (typeof filters.price_max === 'number' && filters.price_max > 0) {
      scoreA += ((filters.price_max - a.price_per_month) / filters.price_max) * 0.5
      scoreB += ((filters.price_max - b.price_per_month) / filters.price_max) * 0.5
    }

    const todayMs = Date.now()
    const availableA = a.available_from ? new Date(a.available_from).getTime() : todayMs
    const availableB = b.available_from ? new Date(b.available_from).getTime() : todayMs
    const daysA = Math.abs(availableA - todayMs) / (1000 * 60 * 60 * 24)
    const daysB = Math.abs(availableB - todayMs) / (1000 * 60 * 60 * 24)
    scoreA += Math.max(0, (30 - daysA) / 30) * 0.3
    scoreB += Math.max(0, (30 - daysB) / 30) * 0.3

    if (a.size_m2 && b.size_m2) {
      scoreA += (a.size_m2 / 100) * 0.2
      scoreB += (b.size_m2 / 100) * 0.2
    }

    return scoreB - scoreA
  })
}

const handler = withAuth(async (req: Request, _payload: JWTPayload): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await req.json()
    const filters: RoomFilters = body.filters || {}
    const page = Math.max(1, Number(body.page) || 1)
    const per_page = Math.min(Math.max(1, Number(body.per_page) || 20), 50)

    if (
      typeof filters.price_min === 'number' &&
      typeof filters.price_max === 'number' &&
      filters.price_min > filters.price_max
    ) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: 'price_min cannot be greater than price_max',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const flatIdsFromLegacyCity = filters.city ? await getFlatIdsByCity(filters.city) : undefined
    const flatIdsFromCityIds = filters.city_ids?.length
      ? await getFlatIdsByCityIds(filters.city_ids)
      : undefined
    const flatIdsFromZoneIds = filters.zone_ids?.length
      ? await getFlatIdsByDistrictIds(filters.zone_ids)
      : undefined
    const scopedFlatIds = (() => {
      const parts = [flatIdsFromLegacyCity, flatIdsFromCityIds, flatIdsFromZoneIds].filter(
        (value): value is string[] => Array.isArray(value)
      );
      if (parts.length === 0) return undefined;
      return parts.reduce<string[]>((acc, current, idx) => {
        if (idx === 0) return [...current];
        const allowed = new Set(current);
        return acc.filter((item) => allowed.has(item));
      }, []);
    })();

    let countQuery = supabaseClient
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('is_available', true)

    if (scopedFlatIds) {
      if (scopedFlatIds.length === 0) {
        countQuery = countQuery.eq('flat_id', '00000000-0000-0000-0000-000000000000')
      } else {
        countQuery = countQuery.in('flat_id', scopedFlatIds)
      }
    }

    if (typeof filters.price_min === 'number') {
      countQuery = countQuery.gte('price_per_month', filters.price_min)
    }

    if (typeof filters.price_max === 'number') {
      countQuery = countQuery.lte('price_per_month', filters.price_max)
    }

    if (filters.available_from) {
      countQuery = countQuery.lte('available_from', filters.available_from)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return new Response(
        JSON.stringify({ error: 'Failed to count results' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const offset = (page - 1) * per_page
    const query = buildSearchQuery(filters, scopedFlatIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + per_page - 1)

    const { data: rooms, error: roomsError } = await query

    if (roomsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to search rooms' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const sortedRooms = sortByRelevance((rooms ?? []) as RoomWithRelations[], filters)

    const total_pages = Math.ceil((count || 0) / per_page)
    const response: PaginatedResponse<RoomWithRelations> = {
      data: sortedRooms,
      count: count || 0,
      page,
      per_page,
      total_pages,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

Deno.serve(handler)
