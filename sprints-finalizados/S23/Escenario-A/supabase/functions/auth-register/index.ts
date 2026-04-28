import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCORS } from '../_shared/cors.ts'
import { AuthSignupRequest, AuthResponse } from '../_shared/types.ts'

async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCORS(req)
  if (corsResponse) return corsResponse

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

    const body: AuthSignupRequest = await req.json()

    if (
      !body.email ||
      !body.password ||
      !body.data?.first_name ||
      !body.data?.last_name ||
      !body.data?.birth_date ||
      !body.data?.gender
    ) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details:
            'email, password, first_name, last_name, birth_date and gender are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthDateRegex.test(body.data.birth_date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid birth_date format. Use YYYY-MM-DD' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const validGenders = ['male', 'female', 'non_binary', 'other', 'undisclosed']
    if (!validGenders.includes(body.data.gender)) {
      return new Response(
        JSON.stringify({ error: 'Invalid gender value' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: body.data.first_name,
        last_name: body.data.last_name,
        gender: body.data.gender,
      },
    })

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create user',
          details: authError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { error: userError } = await supabaseClient
      .from('users')
      .upsert(
        {
          id: authData.user.id,
          email: body.email,
          first_name: body.data.first_name,
          last_name: body.data.last_name,
          identity_document: body.data.identity_document,
          birth_date: body.data.birth_date,
          gender: body.data.gender,
        },
        {
          onConflict: 'id',
        }
      )

    if (userError) {
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({
          error: 'Failed to create user record',
          details: userError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        gender: body.data.gender,
      })

    if (profileError) {
      await supabaseClient.from('users').delete().eq('id', authData.user.id)
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({
          error: 'Failed to create user profile',
          details: profileError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (signInError || !signInData.session || !signInData.user) {
      await supabaseClient.from('profiles').delete().eq('id', authData.user.id)
      await supabaseClient.from('users').delete().eq('id', authData.user.id)
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({
          error: 'User created but failed to generate session',
          user_id: authData.user.id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { session, user } = signInData

    const response: AuthResponse = {
      access_token: session.access_token,
      token_type: 'bearer',
      expires_in: (session as unknown as { expires_in?: number }).expires_in ?? 3600,
      refresh_token: session.refresh_token ?? '',
      user: {
        id: user.id,
        email: user.email!,
        first_name: body.data.first_name,
        last_name: body.data.last_name,
        identity_document: body.data.identity_document,
        birth_date: body.data.birth_date,
        gender: body.data.gender,
        created_at: user.created_at,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 201,
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
}

Deno.serve(handler)
