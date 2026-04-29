import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import type { JWTPayload } from '../_shared/types.ts';

type RoomRow = { id: string; flat_id: string };
type FlatRow = { id: string };
type ProfilePhotoRow = { path: string };
type RoomExtraRow = { room_id: string; photos: string[] | null };

async function listOwnedFlats(userId: string): Promise<FlatRow[]> {
  const { data } = await supabaseAdmin.from('flats').select('id').eq('owner_id', userId);
  return (data ?? []) as FlatRow[];
}

async function listOwnedRooms(userId: string): Promise<RoomRow[]> {
  const { data } = await supabaseAdmin
    .from('rooms')
    .select('id, flat_id')
    .eq('owner_id', userId);
  return (data ?? []) as RoomRow[];
}

async function listProfilePhotoPaths(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('profile_photos')
    .select('path')
    .eq('profile_id', userId);
  return (data as ProfilePhotoRow[] | null)?.map((item) => item.path).filter(Boolean) ?? [];
}

async function listRoomPhotoPaths(roomIds: string[]): Promise<string[]> {
  if (roomIds.length === 0) return [];
  const { data } = await supabaseAdmin
    .from('room_extras')
    .select('room_id, photos')
    .in('room_id', roomIds);
  return ((data as RoomExtraRow[] | null) ?? [])
    .flatMap((item) => item.photos ?? [])
    .filter(Boolean);
}

function avatarPathFromUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (!avatarUrl.startsWith('http')) return avatarUrl;
  try {
    const parsed = new URL(avatarUrl);
    const prefixes = [
      '/storage/v1/object/sign/avatars/',
      '/storage/v1/object/public/avatars/',
      '/storage/v1/object/avatars/',
    ];
    for (const prefix of prefixes) {
      const index = parsed.pathname.indexOf(prefix);
      if (index !== -1) {
        return parsed.pathname.substring(index + prefix.length);
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function deleteStorageObjects(bucket: string, paths: string[]) {
  if (paths.length === 0) return;
  await supabaseAdmin.storage.from(bucket).remove(Array.from(new Set(paths)));
}

const handler = withAuth(
  async (req: Request, payload: JWTPayload): Promise<Response> => {
    const userId = getUserId(payload);
    try {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ownedFlats = await listOwnedFlats(userId);
      const ownedRooms = await listOwnedRooms(userId);
      const ownedFlatIds = ownedFlats.map((flat) => flat.id);
      const ownedRoomIds = ownedRooms.map((room) => room.id);
      const profilePhotoPaths = await listProfilePhotoPaths(userId);
      const roomPhotoPaths = await listRoomPhotoPaths(ownedRoomIds);

      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle();
      const avatarPath = avatarPathFromUrl(profileData?.avatar_url as string | null);
      const { data: userMatches } = await supabaseAdmin
        .from('matches')
        .select('id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
      const matchIds = (userMatches ?? []).map((match) => match.id as string).filter(Boolean);
      const { data: matchChats } = await supabaseAdmin
        .from('chats')
        .select('id')
        .in('match_id', matchIds.length > 0 ? matchIds : ['00000000-0000-0000-0000-000000000000']);
      const chatIds = (matchChats ?? []).map((chat) => chat.id as string).filter(Boolean);

      const { data: ownedExpenses } = await supabaseAdmin
        .from('flat_expenses')
        .select('id')
        .in('flat_id', ownedFlatIds.length > 0 ? ownedFlatIds : ['00000000-0000-0000-0000-000000000000']);
      const ownedExpenseIds = (ownedExpenses ?? []).map((expense) => expense.id as string).filter(Boolean);
      const { data: paidExpenses } = await supabaseAdmin
        .from('flat_expenses')
        .select('id')
        .eq('paid_by', userId);
      const paidExpenseIds = (paidExpenses ?? []).map((expense) => expense.id as string).filter(Boolean);
      const allUserExpenseIds = Array.from(new Set([...ownedExpenseIds, ...paidExpenseIds]));

      if (ownedRoomIds.length > 0) {
        await supabaseAdmin.from('flat_invitation_codes').delete().in('room_id', ownedRoomIds);
        await supabaseAdmin.from('room_assignments').delete().in('room_id', ownedRoomIds);
        await supabaseAdmin.from('room_interests').delete().in('room_id', ownedRoomIds);
        await supabaseAdmin.from('room_extras').delete().in('room_id', ownedRoomIds);
      }

      if (allUserExpenseIds.length > 0) {
        await supabaseAdmin.from('flat_expense_splits').delete().in('expense_id', allUserExpenseIds);
        await supabaseAdmin.from('flat_expenses').delete().in('id', allUserExpenseIds);
      }
      if (ownedFlatIds.length > 0) {
        await supabaseAdmin.from('flat_expenses').delete().in('flat_id', ownedFlatIds);
        await supabaseAdmin.from('flat_settlements').delete().in('flat_id', ownedFlatIds);
      }
      await supabaseAdmin.from('flat_expense_splits').delete().eq('user_id', userId);
      await supabaseAdmin.from('flat_settlements').delete().eq('from_user', userId);
      await supabaseAdmin.from('flat_settlements').delete().eq('to_user', userId);
      await supabaseAdmin.from('room_assignments').delete().eq('assignee_id', userId);
      await supabaseAdmin.from('room_interests').delete().eq('user_id', userId);
      if (chatIds.length > 0) {
        await supabaseAdmin.from('messages').delete().in('chat_id', chatIds);
      }
      await supabaseAdmin.from('messages').delete().eq('sender_id', userId);
      if (chatIds.length > 0) {
        await supabaseAdmin.from('chats').delete().in('id', chatIds);
      }
      if (matchIds.length > 0) {
        await supabaseAdmin.from('room_assignments').delete().in('match_id', matchIds);
      }

      await supabaseAdmin.from('matches').delete().or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
      await supabaseAdmin.from('swipe_rejections').delete().or(`user_id.eq.${userId},rejected_profile_id.eq.${userId}`);
      await supabaseAdmin.from('device_tokens').delete().eq('user_id', userId);
      await supabaseAdmin.from('profile_photos').delete().eq('profile_id', userId);
      await supabaseAdmin.from('profiles').delete().eq('id', userId);

      if (ownedRoomIds.length > 0) {
        await supabaseAdmin.from('rooms').delete().in('id', ownedRoomIds);
      }
      if (ownedFlatIds.length > 0) {
        await supabaseAdmin.from('flats').delete().in('id', ownedFlatIds);
      }

      await supabaseAdmin.from('users').delete().eq('id', userId);

      await deleteStorageObjects(
        'avatars',
        avatarPath ? [...profilePhotoPaths, avatarPath] : profilePhotoPaths
      );
      await deleteStorageObjects('room-photos', roomPhotoPaths);

      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        return new Response(
          JSON.stringify({
            error: 'Failed to delete auth user',
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
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }
);

Deno.serve(handler);
