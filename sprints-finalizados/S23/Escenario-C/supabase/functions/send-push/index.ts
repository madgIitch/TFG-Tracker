import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

type SendPushPayload = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
  token_uri?: string;
};

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  const paddingRegex = new RegExp('=+$');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(paddingRegex, '');
}

function base64UrlEncodeJson(obj: unknown): string {
  return base64UrlEncode(encoder.encode(JSON.stringify(obj)));
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function parseServiceAccountSecret(raw: string): ServiceAccount {
  const trimmed = raw.trim();

  const tryParseJson = (value: string): unknown => JSON.parse(value);

  const stripWrappingQuotes = (value: string): string => {
    const v = value.trim();
    if (
      (v.startsWith("'") && v.endsWith("'")) ||
      (v.startsWith('"') && v.endsWith('"'))
    ) {
      return v.slice(1, -1);
    }
    return v;
  };

  const tryDecodeBase64 = (value: string): string | null => {
    try {
      return atob(value);
    } catch {
      return null;
    }
  };

  const attempts: string[] = [];
  attempts.push(trimmed);
  attempts.push(stripWrappingQuotes(trimmed));

  const decoded = tryDecodeBase64(stripWrappingQuotes(trimmed));
  if (decoded) attempts.push(decoded.trim());

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const parsed = tryParseJson(attempt);
      if (typeof parsed === 'string') {
        return JSON.parse(parsed) as ServiceAccount;
      }
      return parsed as ServiceAccount;
    } catch (e) {
      lastError = e;
    }
  }

  const hint =
    lastError instanceof Error ? lastError.message : 'Unknown JSON parse error';
  throw new Error(
    `FCM_SERVICE_ACCOUNT is not valid JSON. ${hint}. First chars: ${trimmed.slice(0, 20)}`
  );
}

async function signJwt(payload: Record<string, unknown>, serviceAccount: ServiceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const body = payload;
  const input = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(body)}`;

  const pem = normalizePrivateKey(serviceAccount.private_key);

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8Der(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    encoder.encode(input)
  );

  return `${input}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function pemToPkcs8Der(pem: string): ArrayBuffer {
  const clean = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const raw = atob(clean);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(): Promise<string> {
  const rawServiceAccount = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!rawServiceAccount) {
    throw new Error('Missing FCM_SERVICE_ACCOUNT secret');
  }

  const projectId = Deno.env.get('FCM_PROJECT_ID');
  if (!projectId) {
    throw new Error('Missing FCM_PROJECT_ID secret');
  }

  const serviceAccount = parseServiceAccountSecret(rawServiceAccount);
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Invalid FCM_SERVICE_ACCOUNT JSON');
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
  const jwt = await signJwt(
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: tokenUri,
      iat: now,
      exp: now + 60 * 60,
    },
    serviceAccount
  );

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OAuth token error: ${res.status} ${txt}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('OAuth token missing access_token');
  }

  return json.access_token;
}

async function deleteToken(token: string) {
  await supabaseAdmin.from('device_tokens').delete().eq('token', token);
}

async function sendToToken(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: data ?? {},
        android: {
          notification: {
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
      },
    }),
  });

  if (res.ok) return;

  const txt = await res.text();

  const shouldDelete =
    txt.includes('UNREGISTERED') ||
    txt.includes('NotRegistered') ||
    txt.includes('registration-token-not-registered') ||
    txt.includes('Requested entity was not found');

  if (shouldDelete) {
    await deleteToken(token);
    return;
  }

  throw new Error(`FCM send error: ${res.status} ${txt}`);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const expectedAuth = `Bearer ${serviceKey}`;
  if (!serviceKey || authHeader !== expectedAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const projectId = Deno.env.get('FCM_PROJECT_ID') ?? '';
    const body = (await req.json()) as Partial<SendPushPayload>;

    const tokens = Array.isArray(body.tokens) ? body.tokens.filter(Boolean) : [];
    if (tokens.length === 0 || !body.title || !body.body) {
      return new Response(JSON.stringify({ error: 'tokens, title and body are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken();

    await Promise.all(
      tokens.map((token) =>
        sendToToken(accessToken, projectId, token, body.title!, body.body!, body.data)
          .catch((error) => {
            console.error('[send-push] Error sending to token:', token, error);
            return undefined;
          })
      )
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[send-push] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
