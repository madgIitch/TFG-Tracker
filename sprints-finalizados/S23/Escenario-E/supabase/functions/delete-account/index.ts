// supabase/functions/delete-account/index.ts
import { corsHeaders, handleCORS } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import type { JWTPayload } from '../_shared/types.ts';

const handler = withAuth(
  async (_req: Request, payload: JWTPayload): Promise<Response> => {
    const uid = getUserId(payload);

    try {
      // 1. Recoger IDs de flats del usuario
      const { data: userFlats } = await supabaseAdmin
        .from('flats')
        .select('id')
        .eq('owner_id', uid);
      const flatIds = (userFlats ?? []).map((f: { id: string }) => f.id);

      // 2. Recoger IDs de rooms en esos flats
      let roomIds: string[] = [];
      if (flatIds.length > 0) {
        const { data: flatRooms } = await supabaseAdmin
          .from('rooms')
          .select('id')
          .in('flat_id', flatIds);
        roomIds = (flatRooms ?? []).map((r: { id: string }) => r.id);
      }

      // 3. Recoger IDs de matches del usuario
      const { data: userMatches } = await supabaseAdmin
        .from('matches')
        .select('id')
        .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      const matchIds = (userMatches ?? []).map((m: { id: string }) => m.id);

      // 4. Recoger IDs de chats de esos matches
      let chatIds: string[] = [];
      if (matchIds.length > 0) {
        const { data: matchChats } = await supabaseAdmin
          .from('chats')
          .select('id')
          .in('match_id', matchIds);
        chatIds = (matchChats ?? []).map((c: { id: string }) => c.id);
      }

      // 5. Recoger IDs de expenses de los flats del usuario
      let expenseIds: string[] = [];
      if (flatIds.length > 0) {
        const { data: flatExpenses } = await supabaseAdmin
          .from('flat_expenses')
          .select('id')
          .in('flat_id', flatIds);
        expenseIds = (flatExpenses ?? []).map((e: { id: string }) => e.id);
      }

      // --- Borrar en orden respetando FK constraints ---

      // Mensajes
      if (chatIds.length > 0) {
        await supabaseAdmin.from('messages').delete().in('chat_id', chatIds);
      }
      await supabaseAdmin.from('messages').delete().eq('sender_id', uid);

      // Room assignments
      if (matchIds.length > 0) {
        await supabaseAdmin.from('room_assignments').delete().in('match_id', matchIds);
      }
      if (roomIds.length > 0) {
        await supabaseAdmin.from('room_assignments').delete().in('room_id', roomIds);
      }
      await supabaseAdmin.from('room_assignments').delete().eq('assignee_id', uid);

      // Chats
      if (matchIds.length > 0) {
        await supabaseAdmin.from('chats').delete().in('match_id', matchIds);
      }

      // Matches
      if (matchIds.length > 0) {
        await supabaseAdmin.from('matches').delete().in('id', matchIds);
      }

      // Flat invitation codes
      if (roomIds.length > 0) {
        await supabaseAdmin.from('flat_invitation_codes').delete().in('room_id', roomIds);
      }
      await supabaseAdmin.from('flat_invitation_codes').delete().eq('created_by', uid);

      // Room interests
      if (roomIds.length > 0) {
        await supabaseAdmin.from('room_interests').delete().in('room_id', roomIds);
      }
      await supabaseAdmin.from('room_interests').delete().eq('user_id', uid);

      // Room extras
      if (roomIds.length > 0) {
        await supabaseAdmin.from('room_extras').delete().in('room_id', roomIds);
      }

      // Flat expense splits
      if (expenseIds.length > 0) {
        await supabaseAdmin.from('flat_expense_splits').delete().in('expense_id', expenseIds);
      }
      await supabaseAdmin.from('flat_expense_splits').delete().eq('user_id', uid);

      // Flat expenses
      if (flatIds.length > 0) {
        await supabaseAdmin.from('flat_expenses').delete().in('flat_id', flatIds);
      }
      await supabaseAdmin.from('flat_expenses').delete().eq('paid_by', uid);

      // Flat settlements
      if (flatIds.length > 0) {
        await supabaseAdmin.from('flat_settlements').delete().in('flat_id', flatIds);
      }
      await supabaseAdmin
        .from('flat_settlements')
        .delete()
        .or(`from_user.eq.${uid},to_user.eq.${uid}`);

      // Rooms
      if (roomIds.length > 0) {
        await supabaseAdmin.from('rooms').delete().in('id', roomIds);
      }

      // Flats
      if (flatIds.length > 0) {
        await supabaseAdmin.from('flats').delete().in('id', flatIds);
      }

      // Swipe rejections
      await supabaseAdmin
        .from('swipe_rejections')
        .delete()
        .or(`user_id.eq.${uid},rejected_profile_id.eq.${uid}`);

      // Device tokens
      await supabaseAdmin.from('device_tokens').delete().eq('user_id', uid);

      // Profile photos
      await supabaseAdmin.from('profile_photos').delete().eq('profile_id', uid);

      // Profile
      await supabaseAdmin.from('profiles').delete().eq('id', uid);

      // Users
      await supabaseAdmin.from('users').delete().eq('id', uid);

      // Auth user (elimina el registro de autenticacion)
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
      if (authDeleteError) {
        console.error('[delete-account] Error deleting auth user:', authDeleteError);
        throw new Error('Failed to delete auth user');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[delete-account] Error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
);

Deno.serve(async (req: Request) => {
  const corsRes = handleCORS(req);
  if (corsRes) return corsRes;

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return handler(req);
});
