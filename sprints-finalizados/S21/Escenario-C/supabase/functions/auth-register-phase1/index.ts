// supabase/functions/auth-register-phase1/index.ts  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'  
import { corsHeaders, handleCORS } from '../_shared/cors.ts'  
import { Phase1Request, TempRegistrationResponse } from '../_shared/types.ts'  

const EMAIL_REGEX = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i

const hasDnsRecords = async (domain: string): Promise<boolean> => {
  try {
    const mxRecords = await Deno.resolveDns(domain, 'MX')
    if (mxRecords.length > 0) return true
  } catch {
    // ignored
  }

  try {
    const aRecords = await Deno.resolveDns(domain, 'A')
    if (aRecords.length > 0) return true
  } catch {
    // ignored
  }

  return false
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
  
    const body: Phase1Request = await req.json()  
    const normalizedEmail = body.email?.trim().toLowerCase() ?? ''
      
    if (!normalizedEmail) {  
      return new Response(  
        JSON.stringify({ error: 'Email is required' }),  
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
      )  
    }  
  
    // Validar formato de email  
    if (!EMAIL_REGEX.test(normalizedEmail)) {  
      return new Response(  
        JSON.stringify({ error: 'Invalid email format' }),  
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
      )  
    }  

    const domain = normalizedEmail.split('@')[1]
    const domainExists = await hasDnsRecords(domain)
    if (!domainExists) {
      return new Response(
        JSON.stringify({ error: 'Email domain does not exist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  
    const supabaseClient = createClient(  
      Deno.env.get('SUPABASE_URL') ?? '',  
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',  
      { auth: { autoRefreshToken: false, persistSession: false } }  
    )  
  
    // Generar token temporal único  
    const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`  
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas  
  
    // Guardar en tabla temporal  
    const { error } = await supabaseClient  
      .from('temp_registrations')  
      .insert({  
        temp_token: tempToken,  
        email: normalizedEmail,  
        password: body.password,  
        is_google_user: body.is_google_user || false,  
        expires_at: expiresAt.toISOString()  
      })  
  
    if (error) {  
      console.error('Error saving temp registration:', error)  
      return new Response(  
        JSON.stringify({ error: 'Failed to save temporary registration' }),  
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
      )  
    }  
  
    const response: TempRegistrationResponse = {  
      temp_token: tempToken,  
      email: normalizedEmail,  
      expires_at: expiresAt.toISOString()  
    }  
  
    return new Response(  
      JSON.stringify(response),  
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
    )  
  
  } catch (error) {  
    console.error('Phase1 registration error:', error)  
    return new Response(  
      JSON.stringify({ error: 'Internal server error' }),  
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }  
    )  
  }  
}  
  
Deno.serve(handler)