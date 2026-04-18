import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

type SendPushBody = {
  tokens?: string[];
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const INTERNAL_HEADER = 'x-internal-push-key';
const INTERNAL_KEY = Deno.env.get('PUSH_INTERNAL_KEY') ?? '';
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') ?? '';
const FCM_SERVICE_ACCOUNT = Deno.env.get('FCM_SERVICE_ACCOUNT') ?? '';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const toBase64Url = (input: string): string =>
  btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const sanitized = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = Uint8Array.from(atob(sanitized), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binary.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function createServiceAccountAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedJwt = `${encodedHeader}.${encodedPayload}`;

  const normalizedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const privateKey = await importPrivateKey(normalizedPrivateKey);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const signature = toBase64Url(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );
  const assertion = `${unsignedJwt}.${signature}`;

  const tokenResponse = await fetch(serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    throw new Error(`Google OAuth token error: ${tokenResponse.status} ${details}`);
  }

  const tokenPayload = await tokenResponse.json();
  return tokenPayload.access_token as string;
}

function isUnregisteredError(payload: unknown): boolean {
  const text = JSON.stringify(payload ?? {}).toUpperCase();
  return text.includes('UNREGISTERED') || text.includes('REGISTRATION_TOKEN_NOT_REGISTERED');
}

async function purgeInvalidToken(token: string): Promise<void> {
  const { error } = await supabaseAdmin.from('device_tokens').delete().eq('token', token);
  if (error) {
    console.error('[send-push] Failed to purge invalid token:', token, error);
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const internalKey = req.headers.get(INTERNAL_HEADER);
  if (!internalKey || !INTERNAL_KEY || internalKey !== INTERNAL_KEY) {
    return jsonResponse(401, { error: 'Unauthorized internal request' });
  }

  if (!FCM_PROJECT_ID || !FCM_SERVICE_ACCOUNT) {
    return jsonResponse(500, { error: 'Missing FCM configuration secrets' });
  }

  const body = (await req.json()) as SendPushBody;
  const tokens = Array.from(new Set((body.tokens ?? []).filter(Boolean)));
  const title = (body.title ?? '').trim();
  const messageBody = (body.body ?? '').trim();
  const data = body.data ?? {};

  if (tokens.length === 0 || !title || !messageBody) {
    return jsonResponse(400, { error: 'tokens, title and body are required' });
  }

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = JSON.parse(FCM_SERVICE_ACCOUNT) as ServiceAccount;
  } catch (error) {
    console.error('[send-push] Invalid FCM_SERVICE_ACCOUNT JSON:', error);
    return jsonResponse(500, {
      error: 'Invalid FCM_SERVICE_ACCOUNT secret',
      details: error instanceof Error ? error.message : String(error),
    });
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    return jsonResponse(500, { error: 'FCM_SERVICE_ACCOUNT is missing required fields' });
  }

  let accessToken = '';
  try {
    accessToken = await createServiceAccountAccessToken(serviceAccount);
  } catch (error) {
    console.error('[send-push] OAuth token generation error:', error);
    return jsonResponse(500, {
      error: 'Failed to generate OAuth access token',
      details: error instanceof Error ? error.message : String(error),
    });
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;
  let sent = 0;
  let failed = 0;
  let purged = 0;

  for (const token of tokens) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title,
              body: messageBody,
            },
            data,
            android: { priority: 'high' },
            apns: {
              headers: { 'apns-priority': '10' },
              payload: {
                aps: { sound: 'default', contentAvailable: true },
              },
            },
          },
        }),
      });

      if (response.ok) {
        sent += 1;
        continue;
      }

      failed += 1;
      const errorPayload = await response.json().catch(() => ({}));
      if (isUnregisteredError(errorPayload)) {
        await purgeInvalidToken(token);
        purged += 1;
      }
      console.error('[send-push] FCM send error:', response.status, errorPayload);
    } catch (error) {
      failed += 1;
      console.error('[send-push] Unexpected send error:', token, error);
    }
  }

  return jsonResponse(200, {
    data: {
      total: tokens.length,
      sent,
      failed,
      purged,
    },
  });
});
