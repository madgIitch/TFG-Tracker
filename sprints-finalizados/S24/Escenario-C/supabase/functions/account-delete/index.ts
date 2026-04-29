import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import type { JWTPayload } from '../_shared/types.ts';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

type RoomRow = { id: string };
type ProfilePhotoRow = { path: string };
type RoomExtraRow = { photos?: string[] | null };

const cleanArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

async function deleteStorageObjects(userId: string): Promise<void> {
  const { data: profilePhotos } = await supabaseClient
    .from('profile_photos')
    .select('path')
    .eq('profile_id', userId);

  const avatarPaths = (profilePhotos ?? [])
    .map((row) => (row as ProfilePhotoRow).path)
    .filter(Boolean);

  if (avatarPaths.length > 0) {
    await supabaseClient.storage.from('avatars').remove(avatarPaths);
  }

  const { data: ownedRooms } = await supabaseClient
    .from('rooms')
    .select('id')
    .eq('owner_id', userId);

  const roomIds = (ownedRooms ?? []).map((row) => (row as RoomRow).id);
  if (roomIds.length === 0) return;

  const { data: extras } = await supabaseClient
    .from('room_extras')
    .select('photos')
    .in('room_id', roomIds);

  const photoPaths = (extras ?? []).flatMap((row) =>
    cleanArray((row as RoomExtraRow).photos)
  );

  if (photoPaths.length > 0) {
    await supabaseClient.storage.from('room-photos').remove(photoPaths);
  }
}

async function deleteRelationalData(userId: string): Promise<void> {
  const { data: ownedRooms } = await supabaseClient
    .from('rooms')
    .select('id, flat_id')
    .eq('owner_id', userId);

  const roomIds = (ownedRooms ?? []).map((row) => (row as { id: string }).id);

  const { data: ownedFlats } = await supabaseClient
    .from('flats')
    .select('id')
    .eq('owner_id', userId);
  const flatIds = (ownedFlats ?? []).map((row) => (row as { id: string }).id);

  if (roomIds.length > 0) {
    await supabaseClient.from('room_assignments').delete().in('room_id', roomIds);
    await supabaseClient.from('room_extras').delete().in('room_id', roomIds);
    await supabaseClient.from('flat_invitation_codes').delete().in('room_id', roomIds);
    await supabaseClient.from('room_interests').delete().in('room_id', roomIds);
  }

  await supabaseClient.from('room_assignments').delete().eq('assignee_id', userId);
  await supabaseClient.from('device_tokens').delete().eq('user_id', userId);
  await supabaseClient.from('swipe_rejections').delete().eq('user_id', userId);
  await supabaseClient.from('swipe_rejections').delete().eq('rejected_profile_id', userId);

  const { data: matches } = await supabaseClient
    .from('matches')
    .select('id')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
  const matchIds = (matches ?? []).map((row) => (row as { id: string }).id);

  if (matchIds.length > 0) {
    const { data: chats } = await supabaseClient
      .from('chats')
      .select('id')
      .in('match_id', matchIds);
    const chatIds = (chats ?? []).map((row) => (row as { id: string }).id);
    if (chatIds.length > 0) {
      await supabaseClient.from('messages').delete().in('chat_id', chatIds);
    }
    await supabaseClient.from('chats').delete().in('match_id', matchIds);
    await supabaseClient.from('matches').delete().in('id', matchIds);
  }

  if (roomIds.length > 0) {
    await supabaseClient.from('rooms').delete().in('id', roomIds);
  }

  if (flatIds.length > 0) {
    await supabaseClient.from('flat_expenses').delete().in('flat_id', flatIds);
    await supabaseClient.from('flat_settlements').delete().in('flat_id', flatIds);
    await supabaseClient.from('flats').delete().in('id', flatIds);
  }

  await supabaseClient.from('profile_photos').delete().eq('profile_id', userId);
  await supabaseClient.from('profiles').delete().eq('id', userId);
  await supabaseClient.from('users').delete().eq('id', userId);
}

const handler = withAuth(async (_req: Request, payload: JWTPayload): Promise<Response> => {
  try {
    if (_req.method !== 'DELETE') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = getUserId(payload);

    await deleteStorageObjects(userId);
    await deleteRelationalData(userId);

    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return new Response(
        JSON.stringify({
          error: 'No se pudo eliminar la cuenta de autenticacion',
          details: authDeleteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

Deno.serve(handler);
