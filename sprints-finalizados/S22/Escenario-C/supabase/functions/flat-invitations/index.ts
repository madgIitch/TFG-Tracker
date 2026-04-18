import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { validateJWT, getUserId } from '../_shared/auth.ts';

type RoomSummary = {
  id: string;
  owner_id: string;
  flat_id: string;
  is_available: boolean | null;
};

type InvitationCodeRow = {
  id: string;
  room_id: string;
  created_by: string;
  code: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
};

const DEFAULT_TTL_HOURS = 48;
const DEFAULT_MAX_USES = 1;

function buildJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let value = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    value += alphabet[index];
  }
  return `HM-${value}`;
}

async function getRoom(roomId: string): Promise<RoomSummary | null> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('id, owner_id, flat_id, is_available')
    .eq('id', roomId)
    .single();

  if (error || !data) return null;
  return data as RoomSummary;
}

async function hasAcceptedAssignment(roomId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('room_assignments')
    .select('id')
    .eq('room_id', roomId)
    .eq('status', 'accepted')
    .limit(1);

  if (error || !data) return false;
  return data.length > 0;
}

async function checkRoomAvailability(roomId: string): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room || room.is_available === false) return false;
  const occupied = await hasAcceptedAssignment(roomId);
  return !occupied;
}

async function createUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateCode();
    const { data, error } = await supabaseAdmin
      .from('flat_invitation_codes')
      .select('id')
      .eq('code', candidate)
      .limit(1);

    if (!error && data && data.length === 0) {
      return candidate;
    }
  }

  throw new Error('No se pudo generar un codigo unico');
}

function mapInvitation(row: InvitationCodeRow) {
  return {
    id: row.id,
    room_id: row.room_id,
    code: row.code,
    expires_at: row.expires_at,
    max_uses: row.max_uses,
    used_count: row.used_count,
    remaining_uses: Math.max(0, row.max_uses - row.used_count),
    is_active: row.is_active,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : null;

  if (req.method === 'POST') {
    const type = body?.type as string | undefined;

    if (type === 'validate') {
      const code = String(body?.code ?? '').trim().toUpperCase();
      if (!code) {
        return buildJsonResponse({ error: 'code is required' }, 400);
      }

      const nowIso = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('flat_invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .gt('expires_at', nowIso)
        .maybeSingle();

      if (error) {
        console.error('[flat-invitations] validate error:', error);
        return buildJsonResponse({ error: 'Error validando codigo' }, 500);
      }

      if (!data) {
        return buildJsonResponse({ error: 'Codigo invalido o expirado' }, 404);
      }

      if (data.used_count >= data.max_uses) {
        return buildJsonResponse({ error: 'Codigo agotado' }, 409);
      }

      const room = await getRoom(data.room_id);
      const isAvailable = room ? await checkRoomAvailability(room.id) : false;
      if (!room || !isAvailable) {
        return buildJsonResponse({ error: 'La habitacion ya no esta disponible' }, 409);
      }

      return buildJsonResponse(
        {
          data: {
            code: data.code,
            room_id: room.id,
            flat_id: room.flat_id,
            owner_id: room.owner_id,
            expires_at: data.expires_at,
            remaining_uses: Math.max(0, data.max_uses - data.used_count),
          },
        },
        200
      );
    }
  }

  const payload = await validateJWT(req);
  if (!payload) {
    return buildJsonResponse({ error: 'Unauthorized' }, 401);
  }

  const userId = getUserId(payload);

    if (req.method === 'GET') {
      const roomId = url.searchParams.get('room_id');
      if (!roomId) {
        return buildJsonResponse({ error: 'room_id is required' }, 400);
      }

      const room = await getRoom(roomId);
      if (!room || room.owner_id !== userId) {
        return buildJsonResponse({ error: 'Room not found or unauthorized' }, 403);
      }

      const nowIso = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('flat_invitation_codes')
        .select('*')
        .eq('room_id', roomId)
        .eq('created_by', userId)
        .eq('is_active', true)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[flat-invitations] GET error:', error);
        return buildJsonResponse({ error: 'Error al obtener el codigo' }, 500);
      }

      if (!data || data.used_count >= data.max_uses) {
        return buildJsonResponse({ data: null }, 200);
      }

      return buildJsonResponse({ data: mapInvitation(data as InvitationCodeRow) }, 200);
    }

    if (req.method === 'POST') {
      const roomId = body?.room_id as string | undefined;
      const ttlHours = Number(body?.ttl_hours ?? DEFAULT_TTL_HOURS);
      const maxUses = Number(body?.max_uses ?? DEFAULT_MAX_USES);

      if (!roomId) {
        return buildJsonResponse({ error: 'room_id is required' }, 400);
      }

      const room = await getRoom(roomId);
      if (!room || room.owner_id !== userId) {
        return buildJsonResponse({ error: 'Room not found or unauthorized' }, 403);
      }

      const available = await checkRoomAvailability(roomId);
      if (!available) {
        return buildJsonResponse({ error: 'La habitacion no esta disponible' }, 409);
      }

      await supabaseAdmin
        .from('flat_invitation_codes')
        .update({ is_active: false })
        .eq('room_id', roomId)
        .eq('created_by', userId)
        .eq('is_active', true);

      const code = await createUniqueCode();
      const expiresAt = new Date(
        Date.now() + Math.max(1, ttlHours) * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await supabaseAdmin
        .from('flat_invitation_codes')
        .insert({
          room_id: roomId,
          created_by: userId,
          code,
          expires_at: expiresAt,
          max_uses: Math.max(1, maxUses),
          used_count: 0,
          is_active: true,
        })
        .select('*')
        .single();

      if (error || !data) {
        console.error('[flat-invitations] create error:', error);
        return buildJsonResponse({ error: 'No se pudo generar el codigo' }, 500);
      }

      return buildJsonResponse({ data: mapInvitation(data as InvitationCodeRow) }, 201);
    }

    return buildJsonResponse({ error: 'Method not allowed' }, 405);
});
