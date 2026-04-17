// supabase/functions/send-push/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleAuth } from "npm:google-auth-library@8.7.0";
import { corsHeaders } from '../_shared/cors.ts';

const serviceAccountStr = Deno.env.get('FCM_SERVICE_ACCOUNT');
const projectId = Deno.env.get('FCM_PROJECT_ID');
const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

let cachedAccessToken: string | null = null;
let tokenExpirationTime = 0;

async function getAccessToken(): Promise<string | null | undefined> {
    if (cachedAccessToken && Date.now() < tokenExpirationTime) {
        return cachedAccessToken;
    }

    if (!serviceAccountStr) {
        console.error('FCM_SERVICE_ACCOUNT secret is missing');
        return null;
    }

    try {
        let credentials;
        try {
            credentials = JSON.parse(serviceAccountStr);
        } catch {
            // Si falla el json parse, probamos a decodificar base64
            credentials = JSON.parse(atob(serviceAccountStr));
        }

        const auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });

        const client = await auth.getClient();
        const tokenInstance = await client.getAccessToken();

        if (tokenInstance.token) {
            cachedAccessToken = tokenInstance.token;
            tokenExpirationTime = Date.now() + 50 * 60 * 1000;
            return cachedAccessToken;
        }
        return null;
    } catch (error) {
        console.error('Failed to get FCM access token', error);
        return null;
    }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { tokens, title, body: notificationBody, data } = body;

        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return new Response(JSON.stringify({ ok: true, message: 'No tokens provided' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!projectId) {
            throw new Error('FCM_PROJECT_ID is not configured');
        }

        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to obtain Google OAuth access token');
        }

        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
        const invalidTokens: string[] = [];

        const promises = tokens.map(async (token: string) => {
            const message = {
                message: {
                    token,
                    notification: {
                        title: title || '',
                        body: notificationBody || '',
                    },
                    data: data || {},
                },
            };

            const response = await fetch(fcmUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`FCM Error for token ${token}:`, response.status, errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (_) { }

                if (
                    errorData?.error?.details?.some(
                        (detail: any) => detail.errorCode === 'UNREGISTERED'
                    ) ||
                    response.status === 404 ||
                    errorData?.error?.message === 'Requested entity was not found.' ||
                    errorData?.error?.status === 'NOT_FOUND' ||
                    errorData?.error?.status === 'UNAUTHENTICATED'
                ) {
                    invalidTokens.push(token);
                }
            }
        });

        await Promise.all(promises);

        if (invalidTokens.length > 0) {
            await supabaseClient
                .from('device_tokens')
                .delete()
                .in('token', invalidTokens);
            console.log(`Deleted ${invalidTokens.length} invalid tokens`);
        }

        return new Response(JSON.stringify({ ok: true, sent: tokens.length, invalid: invalidTokens.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('send-push error:', error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
