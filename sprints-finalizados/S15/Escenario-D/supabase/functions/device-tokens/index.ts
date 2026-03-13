// supabase/functions/device-tokens/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import { JWTPayload } from '../_shared/types.ts';

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = withAuth(
    async (req: Request, payload: JWTPayload): Promise<Response> => {
        const userId = getUserId(payload);
        const method = req.method;

        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
        }

        try {
            if (method === 'POST') {
                const { token, platform } = await req.json();

                if (!token || !platform) {
                    return new Response(JSON.stringify({ error: 'token and platform are required' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { error } = await supabaseClient
                    .from('device_tokens')
                    .upsert({
                        user_id: userId,
                        token,
                        platform,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id, token' });

                if (error) throw error;

                return new Response(JSON.stringify({ message: 'Token registered successfully' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (method === 'DELETE') {
                const { token } = await req.json();

                if (!token) {
                    return new Response(JSON.stringify({ error: 'token is required' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { error } = await supabaseClient
                    .from('device_tokens')
                    .delete()
                    .match({ user_id: userId, token });

                if (error) throw error;

                return new Response(JSON.stringify({ message: 'Token deleted successfully' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error('Device tokens error:', error);
            return new Response(
                JSON.stringify({ error: 'Internal server error', details: String(error) }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
    }
);

Deno.serve(handler);
