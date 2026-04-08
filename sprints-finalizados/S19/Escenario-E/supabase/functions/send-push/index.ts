// supabase/functions/send-push/index.ts
// Función auxiliar interna: solo la llaman otras edge functions via HTTP

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface SendPushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

function pemToDer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function b64url(input: string): string {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getOAuthToken(): Promise<string> {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT') ?? '';
  // Soporta tanto JSON plano como JSON codificado en Base64
  const serviceAccountJson = raw.trimStart().startsWith('{') ? raw : atob(raw);
  const sa = JSON.parse(serviceAccountJson);

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify(claim));
  const signingInput = `${header}.${payload}`;

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`OAuth token error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token as string;
}

async function sendPushNotification(payload: SendPushPayload): Promise<void> {
  const projectId = Deno.env.get('FCM_PROJECT_ID') ?? '';
  const accessToken = await getOAuthToken();
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const invalidTokens: string[] = [];

  for (const token of payload.tokens) {
    const body = {
      message: {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: 'high',
        },
      },
    };

    const res = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      const errorCode = err?.error?.details?.[0]?.errorCode ?? err?.error?.status;
      if (errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT') {
        invalidTokens.push(token);
      } else {
        console.error(`[send-push] FCM error for token ${token}:`, JSON.stringify(err));
      }
    }
  }

  if (invalidTokens.length > 0) {
    await supabaseClient
      .from('device_tokens')
      .delete()
      .in('token', invalidTokens);
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  try {
    const payload: SendPushPayload = await req.json();

    if (!payload.tokens || payload.tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens' }), { status: 200 });
    }

    await sendPushNotification(payload);
    return new Response(JSON.stringify({ message: 'sent' }), { status: 200 });
  } catch (error) {
    console.error('[send-push] error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    );
  }
});
