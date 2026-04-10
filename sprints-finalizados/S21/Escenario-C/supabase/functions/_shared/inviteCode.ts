const DEFAULT_INVITE_TTL_HOURS = 48;

interface InviteCodePayload {
  room_id: string;
  owner_id: string;
  exp: number;
  jti: string;
}

export interface InviteCodeClaims {
  roomId: string;
  ownerId: string;
  expiresAt: string;
  expiresAtEpoch: number;
  jti: string;
}

function getSecret(): string {
  return (
    Deno.env.get('INVITE_CODE_SECRET') ||
    Deno.env.get('SUPABASE_JWT_SECRET') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    ''
  );
}

function encodeBase64Url(input: string): string {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(new RegExp('=+$'), '');
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return atob(normalized + '='.repeat(padLength));
}

async function sign(value: string): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error('Missing invite code secret');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value)
  );

  const sigBytes = String.fromCharCode(...new Uint8Array(signature));
  return encodeBase64Url(sigBytes);
}

async function verify(value: string, signature: string): Promise<boolean> {
  const expected = await sign(value);
  return expected === signature;
}

function generateJti(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export async function createInviteCode(input: {
  roomId: string;
  ownerId: string;
  ttlHours?: number;
}): Promise<InviteCodeClaims & { code: string }> {
  const ttlHours = Math.max(1, input.ttlHours ?? DEFAULT_INVITE_TTL_HOURS);
  const expiresAtEpoch = Math.floor(Date.now() / 1000) + ttlHours * 3600;

  const payload: InviteCodePayload = {
    room_id: input.roomId,
    owner_id: input.ownerId,
    exp: expiresAtEpoch,
    jti: generateJti(),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  const code = `HM-${encodedPayload}.${signature}`;

  return {
    code,
    roomId: payload.room_id,
    ownerId: payload.owner_id,
    expiresAtEpoch,
    expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
    jti: payload.jti,
  };
}

export async function parseInviteCode(
  code: string
): Promise<{ claims: InviteCodeClaims | null; error: string | null }> {
  const cleaned = code.trim();
  if (!cleaned.startsWith('HM-')) {
    return { claims: null, error: 'Invalid invite code format' };
  }

  const token = cleaned.slice(3);
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return { claims: null, error: 'Invalid invite code format' };
  }

  const isValidSignature = await verify(encodedPayload, signature).catch(() => false);
  if (!isValidSignature) {
    return { claims: null, error: 'Invalid invite code signature' };
  }

  let payload: InviteCodePayload;
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload)) as InviteCodePayload;
  } catch {
    return { claims: null, error: 'Invalid invite code payload' };
  }

  if (!payload.room_id || !payload.owner_id || !payload.exp) {
    return { claims: null, error: 'Malformed invite code' };
  }

  const nowEpoch = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowEpoch) {
    return { claims: null, error: 'Invite code expired' };
  }

  return {
    claims: {
      roomId: payload.room_id,
      ownerId: payload.owner_id,
      expiresAtEpoch: payload.exp,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      jti: payload.jti,
    },
    error: null,
  };
}
