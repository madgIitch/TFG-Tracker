// supabase/functions/auth-register-phase3/index.ts  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'  
import { corsHeaders, handleCORS } from '../_shared/cors.ts'  
import { Phase3Request, AuthResponse } from '../_shared/types.ts'  

type InviteCodeRow = {
  id: string
  room_id: string
  code: string
  expires_at: string
  max_uses: number
  used_count: number
  is_active: boolean
}

type RoomRow = {
  id: string
  flat_id: string
  owner_id: string
  is_available: boolean | null
}

type LooseSupabaseClient = ReturnType<typeof createClient>

async function getInviteContext(
  supabaseClient: unknown,
  inviteCode: string
): Promise<{ invite: InviteCodeRow; room: RoomRow } | null> {
  const client = supabaseClient as LooseSupabaseClient
  const nowIso = new Date().toISOString()
  const { data: inviteData, error: inviteError } = await client
    .from('flat_invitation_codes')
    .select('id, room_id, code, expires_at, max_uses, used_count, is_active')
    .eq('code', inviteCode)
    .eq('is_active', true)
    .gt('expires_at', nowIso)
    .maybeSingle()

  if (inviteError || !inviteData) {
    return null
  }

  const invite = inviteData as InviteCodeRow

  if (invite.used_count >= invite.max_uses) {
    return null
  }

  const { data: roomData, error: roomError } = await client
    .from('rooms')
    .select('id, flat_id, owner_id, is_available')
    .eq('id', invite.room_id)
    .single()

  if (roomError || !roomData) {
    return null
  }

  const room = roomData as RoomRow

  const { data: acceptedAssignments, error: assignmentError } = await client
    .from('room_assignments')
    .select('id')
    .eq('room_id', room.id)
    .eq('status', 'accepted')
    .limit(1)

  const roomIsUnavailable = room.is_available === false
  const roomAlreadyAssigned = !assignmentError && !!acceptedAssignments && acceptedAssignments.length > 0
  if (roomIsUnavailable || roomAlreadyAssigned) {
    return null
  }

  return {
    invite,
    room,
  }
}

async function consumeInviteCode(
  supabaseClient: unknown,
  invite: InviteCodeRow
): Promise<void> {
  const client = supabaseClient as LooseSupabaseClient
  const nextUsedCount = invite.used_count + 1
  const shouldRemainActive = nextUsedCount < invite.max_uses

  await client
    .from('flat_invitation_codes')
    .update(({
      used_count: nextUsedCount,
      is_active: shouldRemainActive,
      last_used_at: new Date().toISOString(),
    } as unknown) as never)
    .eq('id', invite.id)
}

async function createMatchesForFlatmates(
  supabaseClient: unknown,
  userId: string,
  flatId: string
): Promise<void> {
  const client = supabaseClient as LooseSupabaseClient

  const { data: flatRooms } = await client
    .from('rooms')
    .select('id')
    .eq('flat_id', flatId)

  const roomIds = (flatRooms ?? []).map((room: { id: string }) => room.id)
  if (roomIds.length === 0) return

  const { data: assignments } = await client
    .from('room_assignments')
    .select('assignee_id')
    .in('room_id', roomIds)
    .eq('status', 'accepted')

  const flatmateIds = Array.from(new Set(
    (assignments ?? [])
      .map((item: { assignee_id?: string }) => item.assignee_id)
      .filter((id: string | undefined): id is string => !!id && id !== userId)
  ))

  for (const flatmateId of flatmateIds) {
    const { data: existingMatch } = await client
      .from('matches')
      .select('id')
      .or(
        `(user_a_id.eq.${userId},user_b_id.eq.${flatmateId}),(user_a_id.eq.${flatmateId},user_b_id.eq.${userId})`
      )
      .limit(1)

    if (existingMatch && existingMatch.length > 0) {
      continue
    }

    await client.from('matches').insert(({
      user_a_id: userId,
      user_b_id: flatmateId,
      status: 'accepted',
    } as unknown) as never)
  }
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

    const inviteCode = typeof body.invite_code === 'string'
      ? body.invite_code.trim().toUpperCase()
      : ''
      
    if (!body.temp_token || !body.birth_date) {  
      return new Response(  
        JSON.stringify({ error: 'Missing required fields' }),  
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
      )  
    }  
  
    // Validar formato de fecha  
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

    let inviteContext: { invite: InviteCodeRow; room: RoomRow } | null = null
    if (inviteCode) {
      inviteContext = await getInviteContext(supabaseClient, inviteCode)
      if (!inviteContext) {
        return new Response(
          JSON.stringify({ error: 'Codigo de invitacion invalido, expirado o sin disponibilidad' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  
    // Obtener registro temporal completo  
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
  
    if (tempData.is_google_user) {  
      // Para usuarios de Google, solo actualizar perfil  
      // TODO: Implementar actualización de perfil de Google  
      return new Response(  
        JSON.stringify({ error: 'Google user profile update not implemented yet' }),  
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
      )  
    } else {  
      // Registro normal - crear usuario en Supabase Auth  
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({  
        email: tempData.email,  
        password: tempData.password,  
        email_confirm: true,  
        user_metadata: {  
          first_name: tempData.first_name,  
          last_name: tempData.last_name,  
          gender: tempData.gender  
        }  
      })  
  
      if (authError || !authData.user) {  
        console.error('Auth creation error:', authError)  
        return new Response(  
          JSON.stringify({ error: 'Failed to create user', details: authError?.message }),  
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
        )  
      }  
  
      // Crear registro en tabla users  
      const { error: userError } = await supabaseClient  
        .from('users')  
        .upsert(  
            {  
            id: authData.user.id,  
            email: tempData.email,  
            first_name: tempData.first_name,  
            last_name: tempData.last_name,  
            birth_date: body.birth_date,  
            gender: tempData.gender
            },  
            {  
            onConflict: 'id'  // Maneja duplicados  
            }  
        )
  
      if (userError) {  
        console.error('User table error:', userError)  
        // Rollback: eliminar usuario de Auth  
        await supabaseClient.auth.admin.deleteUser(authData.user.id)  
        return new Response(  
          JSON.stringify({ error: 'Failed to create user record' }),  
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
        )  
      }  
  
      // Crear perfil básico  
      await supabaseClient  
        .from('profiles')  
        .insert({ id: authData.user.id, gender: tempData.gender })  

      if (inviteContext) {
        const { error: assignmentError } = await supabaseClient
          .from('room_assignments')
          .insert({
            room_id: inviteContext.room.id,
            assignee_id: authData.user.id,
            status: 'accepted',
          })

        if (assignmentError) {
          console.error('Assignment creation error:', assignmentError)
          await supabaseClient.auth.admin.deleteUser(authData.user.id)
          return new Response(
            JSON.stringify({ error: 'No se pudo asignar la habitacion del codigo' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await supabaseClient
          .from('rooms')
          .update({ is_available: false })
          .eq('id', inviteContext.room.id)

        await consumeInviteCode(supabaseClient, inviteContext.invite)
        await createMatchesForFlatmates(
          supabaseClient,
          authData.user.id,
          inviteContext.room.flat_id
        )
      }
  
      // Generar sesión  
      const anonClient = createClient(  
        Deno.env.get('SUPABASE_URL') ?? '',  
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',  
        { auth: { autoRefreshToken: false, persistSession: false } }  
      )  
  
      const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({  
        email: tempData.email,  
        password: tempData.password  
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
          created_at: signInData.user.created_at  
        }  
      }  
  
      // Limpiar registro temporal  
      await supabaseClient  
        .from('temp_registrations')  
        .delete()  
        .eq('temp_token', body.temp_token)  
  
      return new Response(  
        JSON.stringify(response),  
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
      )  
    }  
  
  } catch (error) {  
    console.error('Phase3 registration error:', error)  
    return new Response(  
      JSON.stringify({ error: 'Internal server error' }),  
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
    )  
  }  
}  
  
Deno.serve(handler)

