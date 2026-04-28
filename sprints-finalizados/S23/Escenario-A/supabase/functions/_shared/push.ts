import { supabaseAdmin } from './supabaseAdmin.ts';

export type PushData = Record<string, string>;

export interface PushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: PushData;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const PUSH_INTERNAL_KEY = Deno.env.get('PUSH_INTERNAL_KEY') ?? '';

const toSafeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const sanitizePushData = (
  data: Record<string, unknown> | undefined
): PushData | undefined => {
  if (!data) return undefined;
  const sanitized: PushData = {};
  Object.entries(data).forEach(([key, value]) => {
    const k = toSafeString(key);
    const v = toSafeString(value);
    if (k && v) {
      sanitized[k] = v;
    }
  });
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

export async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('device_tokens')
    .select('token')
    .in('user_id', uniqueUserIds);

  if (error || !data) {
    console.error('[push] Failed to fetch device tokens:', error);
    return [];
  }

  const uniqueTokens = new Set<string>();
  data.forEach((row) => {
    const token = toSafeString(row.token);
    if (token) uniqueTokens.add(token);
  });
  return Array.from(uniqueTokens);
}

export async function invokeSendPush(payload: PushPayload): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PUSH_INTERNAL_KEY) {
    console.warn('[push] Missing SUPABASE_URL/SERVICE_ROLE/PUSH_INTERNAL_KEY envs.');
    return;
  }

  if (!payload.tokens.length || !payload.title.trim() || !payload.body.trim()) {
    return;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'x-internal-push-key': PUSH_INTERNAL_KEY,
    },
    body: JSON.stringify({
      tokens: payload.tokens,
      title: payload.title.trim(),
      body: payload.body.trim(),
      data: sanitizePushData(payload.data),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('[push] send-push call failed:', response.status, details);
  }
}

export function fireAndForgetPush(payload: PushPayload): void {
  void invokeSendPush(payload).catch((error) => {
    console.error('[push] fireAndForgetPush error:', error);
  });
}
