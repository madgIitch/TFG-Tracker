// supabase/functions/auth-register-phase3/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCORS } from '../_shared/cors.ts'
import { Phase3Request, AuthResponse } from '../_shared/types.ts'

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

    const body: Phase3Request & { is_google_user?: boolean; first_name?: string; last_name?: string; gender?: string } = await req.json()

    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ─── Google user path ─────────────────────────────────────────────────────
    if (body.is_google_user === true) {
      const { first_name, last_name, gender, birth_date } = body as any

      if (!first_name || !last_name || !gender || !birth_date) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields for Google registration' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!birthDateRegex.test(birth_date)) {
        return new Response(
          JSON.stringify({ error: 'Invalid birth_date format. Use YYYY-MM-DD' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Identify the user from the Authorization header
      const authHeader = req.headers.get('Authorization') ?? ''
      const token = authHeader.replace('Bearer ', '').trim()

      const { data: authUserData, error: authUserError } = await supabaseClient.auth.getUser(token)
      if (authUserError || !authUserData.user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const userId = authUserData.user.id
      const email = authUserData.user.email ?? ''

      // Upsert users record
      const { error: userError } = await supabaseClient
        .from('users')
        .upsert(
          { id: userId, email, first_name, last_name, birth_date, gender },
          { onConflict: 'id' }
        )

      if (userError) {
        console.error('Google user upsert error:', userError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Upsert profiles record
      await supabaseClient
        .from('profiles')
        .upsert({ id: userId, gender }, { onConflict: 'id' })

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─── Email/password user path ─────────────────────────────────────────────
    if (!body.temp_token || !body.birth_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!birthDateRegex.test(body.birth_date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid birth_date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
        { onConflict: 'id' }
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

  } catch (error) {
    console.error('Phase3 registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

Deno.serve(handler)
