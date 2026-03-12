import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCORS } from '../_shared/cors.ts'
import { Phase3Request, AuthResponse } from '../_shared/types.ts'

interface FlatInvitationCodeRow {
  id: string
  room_id: string
  code: string
  expires_at: string
  max_uses: number
  used_count: number
  is_active: boolean
}

interface InvitationJoinPlan {
  invitationId: string
  roomId: string
  companionIds: string[]
}

function normalizeInvitationCode(rawCode: string): string {
  return rawCode.trim().toUpperCase()
}

async function createMissingMatch(
  supabaseClient: ReturnType<typeof createClient>,
  userIdA: string,
  userIdB: string
): Promise<void> {
  if (userIdA === userIdB) return

  const { data: existingMatch } = await supabaseClient
    .from('matches')
    .select('id')
    .or(
      `(user_a_id.eq.${userIdA},user_b_id.eq.${userIdB}),(user_a_id.eq.${userIdB},user_b_id.eq.${userIdA})`
    )
    .limit(1)

  if (existingMatch && existingMatch.length > 0) return

  await supabaseClient.from('matches').insert({
    user_a_id: userIdA,
    user_b_id: userIdB,
    status: 'accepted',
  })
}

async function resolveInvitationJoinPlan(
  supabaseClient: ReturnType<typeof createClient>,
  rawInvitationCode: string
): Promise<InvitationJoinPlan> {
  const invitationCode = normalizeInvitationCode(rawInvitationCode)
  const nowIso = new Date().toISOString()

  const { data: codeData, error: codeError } = await supabaseClient
    .from('flat_invitation_codes')
    .select('*')
    .eq('code', invitationCode)
    .eq('is_active', true)
    .gt('expires_at', nowIso)
    .limit(1)
    .maybeSingle()

  if (codeError || !codeData) {
    throw new Error('Codigo de invitacion invalido o caducado')
  }

  const invitation = codeData as FlatInvitationCodeRow
  if (invitation.used_count >= invitation.max_uses) {
    throw new Error('Codigo de invitacion sin plazas disponibles')
  }

  const { data: roomData, error: roomError } = await supabaseClient
    .from('rooms')
    .select('id, flat_id, owner_id, is_available')
    .eq('id', invitation.room_id)
    .single()

  if (roomError || !roomData?.id || !roomData.owner_id || !roomData.flat_id) {
    throw new Error('La habitacion asociada al codigo no existe')
  }

  if (!roomData.is_available) {
    throw new Error('La habitacion del codigo ya no esta disponible')
  }

  const { data: acceptedAssignments } = await supabaseClient
    .from('room_assignments')
    .select('id')
    .eq('room_id', invitation.room_id)
    .eq('status', 'accepted')

  if (acceptedAssignments && acceptedAssignments.length > 0) {
    throw new Error('La habitacion del codigo ya no esta disponible')
  }

  const companionIds = new Set<string>([roomData.owner_id as string])
  const { data: currentMembers } = await supabaseClient
    .from('room_assignments')
    .select('assignee_id, room:rooms!inner(flat_id)')
    .eq('status', 'accepted')
    .eq('room.flat_id', roomData.flat_id)

  ;(currentMembers ?? []).forEach((item) => {
    if (item.assignee_id) companionIds.add(item.assignee_id as string)
  })

  return {
    invitationId: invitation.id,
    roomId: invitation.room_id,
    companionIds: Array.from(companionIds),
  }
}

async function completeInvitationJoin(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  plan: InvitationJoinPlan
): Promise<void> {
  const { data: existingAccepted } = await supabaseClient
    .from('room_assignments')
    .select('id')
    .eq('room_id', plan.roomId)
    .eq('status', 'accepted')
    .limit(1)

  if (existingAccepted && existingAccepted.length > 0) {
    throw new Error('La habitacion ya no esta disponible')
  }

  const { error: assignmentError } = await supabaseClient.from('room_assignments').insert({
    room_id: plan.roomId,
    assignee_id: userId,
    status: 'accepted',
  })
  if (assignmentError) {
    throw new Error('No se pudo asignar la habitacion del piso')
  }

  await supabaseClient.from('rooms').update({ is_available: false }).eq('id', plan.roomId)

  const { data: inviteData, error: inviteReadError } = await supabaseClient
    .from('flat_invitation_codes')
    .select('used_count, max_uses')
    .eq('id', plan.invitationId)
    .single()

  if (!inviteReadError && inviteData) {
    const nextUsedCount = (inviteData.used_count as number) + 1
    await supabaseClient
      .from('flat_invitation_codes')
      .update({
        used_count: nextUsedCount,
        last_used_at: new Date().toISOString(),
        is_active: nextUsedCount < (inviteData.max_uses as number),
      })
      .eq('id', plan.invitationId)
  }

  await Promise.all(
    plan.companionIds
      .filter((companionId) => companionId && companionId !== userId)
      .map((companionId) => createMissingMatch(supabaseClient, userId, companionId))
  )
}

async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: Phase3Request = await req.json()
    if (!body.temp_token || !body.birth_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthDateRegex.test(body.birth_date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid birth_date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: tempData, error: tempError } = await supabaseClient
      .from('temp_registrations')
      .select('*')
      .eq('temp_token', body.temp_token)
      .single()

    if (tempError || !tempData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired temporary token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(tempData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Temporary registration expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tempData.gender) {
      return new Response(
        JSON.stringify({ error: 'Missing required gender' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasInvitationCode =
      typeof body.invitation_code === 'string' && body.invitation_code.trim().length > 0
    const invitationPlan = hasInvitationCode
      ? await resolveInvitationJoinPlan(supabaseClient, body.invitation_code as string)
      : null

    if (tempData.is_google_user) {
      return new Response(
        JSON.stringify({ error: 'Google user profile update not implemented yet' }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: tempData.email,
      password: tempData.password,
      email_confirm: true,
      user_metadata: {
        first_name: tempData.first_name,
        last_name: tempData.last_name,
        gender: tempData.gender,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user', details: authError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userRecord = {
      id: authData.user.id,
      email: tempData.email,
      first_name: tempData.first_name,
      last_name: tempData.last_name,
      birth_date: body.birth_date,
      gender: tempData.gender,
    }

    const { error: userError } = await supabaseClient
      .from('users')
      .upsert(userRecord, { onConflict: 'id' })

    if (userError) {
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create user record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({ id: authData.user.id, gender: tempData.gender })

    if (profileError) {
      await supabaseClient.from('users').delete().eq('id', authData.user.id)
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (invitationPlan) {
      try {
        await completeInvitationJoin(supabaseClient, authData.user.id, invitationPlan)
      } catch (joinError) {
        await supabaseClient.from('room_assignments').delete().eq('assignee_id', authData.user.id)
        await supabaseClient.from('profiles').delete().eq('id', authData.user.id)
        await supabaseClient.from('users').delete().eq('id', authData.user.id)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({
            error: joinError instanceof Error ? joinError.message : 'No se pudo completar la invitacion',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: tempData.email,
      password: tempData.password,
    })

    if (signInError || !signInData.session || !signInData.user) {
      return new Response(
        JSON.stringify({ error: 'User created but failed to generate session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response: AuthResponse = {
      access_token: signInData.session.access_token,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: signInData.session.refresh_token ?? '',
      user: {
        id: signInData.user.id,
        email: signInData.user.email!,
        first_name: tempData.first_name,
        last_name: tempData.last_name,
        birth_date: body.birth_date,
        gender: tempData.gender,
        created_at: signInData.user.created_at,
      },
    }

    await supabaseClient.from('temp_registrations').delete().eq('temp_token', body.temp_token)

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Phase3 registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

Deno.serve(handler)
