// supabase/functions/flat-invitation/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCORS } from '../_shared/cors.ts'
import { validateJWT, getUserId } from '../_shared/auth.ts'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let body: { action: string; room_id?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const { action } = body

  // ─── GENERATE ───────────────────────────────────────────────────────────────
  if (action === 'generate') {
    const payload = await validateJWT(req)
    if (!payload) return json({ error: 'Unauthorized' }, 401)
    const userId = getUserId(payload)

    const { room_id } = body
    if (!room_id) return json({ error: 'Missing room_id' }, 400)

    // Verify caller owns the room
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, title, flat_id, owner_id, flats(address)')
      .eq('id', room_id)
      .single()

    if (roomErr || !room) return json({ error: 'Room not found' }, 404)
    if (room.owner_id !== userId) return json({ error: 'Forbidden' }, 403)

    // Deactivate existing active codes for this room
    await supabase
      .from('flat_invitation_codes')
      .update({ is_active: false })
      .eq('room_id', room_id)
      .eq('is_active', true)

    // Generate unique code
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('flat_invitation_codes')
        .select('id')
        .eq('code', code)
        .single()
      if (!existing) break
      code = generateCode()
      attempts++
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: newCode, error: insertErr } = await supabase
      .from('flat_invitation_codes')
      .insert({
        room_id,
        created_by: userId,
        code,
        expires_at: expiresAt,
        max_uses: 1,
        used_count: 0,
        is_active: true,
      })
      .select()
      .single()

    if (insertErr || !newCode) return json({ error: 'Error generating code' }, 500)

    const flatAddress = (room.flats as { address: string } | null)?.address ?? ''

    return json({
      code: newCode.code,
      expires_at: newCode.expires_at,
      room_title: room.title,
      flat_address: flatAddress,
    })
  }

  // ─── VALIDATE ───────────────────────────────────────────────────────────────
  if (action === 'validate') {
    const { code } = body
    if (!code) return json({ error: 'Missing code' }, 400)

    const { data: inv, error: invErr } = await supabase
      .from('flat_invitation_codes')
      .select('*, rooms(id, title, price_per_month, flat_id, flats(address, city))')
      .eq('code', code.toUpperCase())
      .single()

    if (invErr || !inv) return json({ valid: false, reason: 'not_found' })

    if (!inv.is_active || inv.used_count >= inv.max_uses) {
      return json({ valid: false, reason: 'used' })
    }

    if (new Date(inv.expires_at) < new Date()) {
      return json({ valid: false, reason: 'expired' })
    }

    const room = inv.rooms as {
      id: string; title: string; price_per_month: number; flat_id: string
      flats: { address: string; city: string } | null
    } | null

    return json({
      valid: true,
      room: {
        id: room?.id,
        title: room?.title,
        price_per_month: room?.price_per_month,
      },
      flat: {
        address: room?.flats?.address,
        city: room?.flats?.city,
      },
    })
  }

  // ─── REDEEM ──────────────────────────────────────────────────────────────────
  if (action === 'redeem') {
    const payload = await validateJWT(req)
    if (!payload) return json({ error: 'Unauthorized' }, 401)
    const userId = getUserId(payload)

    const { code } = body
    if (!code) return json({ error: 'Missing code' }, 400)

    // Re-validate code
    const { data: inv, error: invErr } = await supabase
      .from('flat_invitation_codes')
      .select('*, rooms(id, flat_id, owner_id)')
      .eq('code', code.toUpperCase())
      .single()

    if (invErr || !inv) return json({ error: 'Invalid code' }, 400)
    if (!inv.is_active || inv.used_count >= inv.max_uses) {
      return json({ error: 'Code already used' }, 400)
    }
    if (new Date(inv.expires_at) < new Date()) {
      return json({ error: 'Code expired' }, 400)
    }

    const room = inv.rooms as { id: string; flat_id: string; owner_id: string } | null
    if (!room) return json({ error: 'Room not found' }, 404)

    // Prevent owner from redeeming their own code
    if (room.owner_id === userId) {
      return json({ error: 'Cannot redeem your own invitation code' }, 400)
    }

    // Check user doesn't already have an accepted assignment in this flat
    const { data: existingAssignment } = await supabase
      .from('room_assignments')
      .select('id, rooms!inner(flat_id)')
      .eq('assignee_id', userId)
      .eq('status', 'accepted')
      .eq('rooms.flat_id', room.flat_id)
      .maybeSingle()

    if (existingAssignment) {
      return json({ error: 'Already assigned to a room in this flat' }, 409)
    }

    // Mark code as used
    const newUsedCount = inv.used_count + 1
    await supabase
      .from('flat_invitation_codes')
      .update({
        used_count: newUsedCount,
        is_active: newUsedCount < inv.max_uses,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', inv.id)

    // Create room assignment
    await supabase.from('room_assignments').insert({
      room_id: room.id,
      assignee_id: userId,
      status: 'accepted',
    })

    // Mark room unavailable
    await supabase.from('rooms').update({ is_available: false }).eq('id', room.id)

    // Find existing residents in the flat (accepted assignments, excluding the new user)
    const { data: existingResidents } = await supabase
      .from('room_assignments')
      .select('assignee_id, rooms!inner(flat_id)')
      .eq('status', 'accepted')
      .eq('rooms.flat_id', room.flat_id)
      .neq('assignee_id', userId)

    const residentIds = [
      ...new Set((existingResidents ?? []).map((r) => r.assignee_id as string)),
    ]

    let matchesCreated = 0
    for (const residentId of residentIds) {
      // Check if match already exists (bidirectional)
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .or(
          `and(user_a_id.eq.${userId},user_b_id.eq.${residentId}),and(user_a_id.eq.${residentId},user_b_id.eq.${userId})`
        )
        .maybeSingle()

      if (existingMatch) continue

      // Create match
      const { data: newMatch, error: matchErr } = await supabase
        .from('matches')
        .insert({
          user_a_id: userId,
          user_b_id: residentId,
          status: 'room_assigned',
        })
        .select('id')
        .single()

      if (matchErr || !newMatch) continue

      // Create chat for the match
      await supabase.from('chats').insert({ match_id: newMatch.id })
      matchesCreated++
    }

    return json({ room_id: room.id, flat_id: room.flat_id, matches_created: matchesCreated })
  }

  return json({ error: 'Unknown action' }, 400)
}

Deno.serve(handler)
