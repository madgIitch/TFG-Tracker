// supabase/functions/matches/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import { Match, ApiResponse, JWTPayload } from '../_shared/types.ts';
import { fireAndForgetPush, getTokensForUsers } from '../_shared/push.ts';
import { resolveLikeAction } from '../_shared/match-resolution.ts';

/**
 * Edge Function para gestion de matches en HomiMatch
 * Maneja operaciones CRUD para matches entre usuarios
 */

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface MatchValidationData {
  user_a_id: string;
  user_b_id: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'room_offer' | 'room_assigned' | 'room_declined';
}

async function getUserMatches(userId: string): Promise<Match[]> {
  const { data, error } = await supabaseClient
    .from('matches')
    .select(
      `
      *,
      user_a:profiles!matches_user_a_id_fkey(*),
      user_b:profiles!matches_user_b_id_fkey(*)
    `
    )
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order('matched_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch matches: ${error.message}`);
  }

  return data as Match[];
}

async function createMatch(matchData: {
  user_a_id: string;
  user_b_id: string;
}): Promise<Match> {
  const { data, error } = await supabaseClient
    .from('matches')
    .insert({ ...matchData, status: 'pending' })
    .select(
      `
      *,
      user_a:profiles!matches_user_a_id_fkey(*),
      user_b:profiles!matches_user_b_id_fkey(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to create match: ${error.message}`);
  }

  return data as Match;
}

async function getDirectionalMatch(
  userAId: string,
  userBId: string
): Promise<Match | null> {
  const { data, error } = await supabaseClient
    .from('matches')
    .select(
      `
      *,
      user_a:profiles!matches_user_a_id_fkey(*),
      user_b:profiles!matches_user_b_id_fkey(*)
    `
    )
    .eq('user_a_id', userAId)
    .eq('user_b_id', userBId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch directional match: ${error.message}`);
  }

  return (data as Match | null) ?? null;
}

async function ensureChatForMatch(matchId: string): Promise<void> {
  const { data: existingChat, error: readError } = await supabaseClient
    .from('chats')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Failed to verify chat for match: ${readError.message}`);
  }

  if (existingChat?.id) return;

  const { error: insertError } = await supabaseClient
    .from('chats')
    .insert({ match_id: matchId });

  if (insertError && !insertError.message.includes('duplicate key value')) {
    throw new Error(`Failed to create chat for match: ${insertError.message}`);
  }
}

async function updateMatch(
  matchId: string,
  userId: string,
  updates: Partial<Match>
): Promise<Match> {
  const { data: existingMatch, error: fetchError } = await supabaseClient
    .from('matches')
    .select(
      `
      *,
      user_a:profiles!matches_user_a_id_fkey(*),
      user_b:profiles!matches_user_b_id_fkey(*)
    `
    )
    .eq('id', matchId)
    .single();

  if (fetchError || !existingMatch) {
    throw new Error('Match not found');
  }

  const userAId = existingMatch.user_a_id;
  const userBId = existingMatch.user_b_id;

  if (userId !== userAId && userId !== userBId) {
    throw new Error('Unauthorized: You can only update matches you participate in');
  }

  const { data, error } = await supabaseClient
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select(
      `
      *,
      user_a:profiles!matches_user_a_id_fkey(*),
      user_b:profiles!matches_user_b_id_fkey(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to update match: ${error.message}`);
  }

  return data as Match;
}

function validateMatchData(
  data: MatchValidationData
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.user_a_id || typeof data.user_a_id !== 'string') {
    errors.push('User A ID is required');
  }

  if (!data.user_b_id || typeof data.user_b_id !== 'string') {
    errors.push('User B ID is required');
  }

  if (data.user_a_id === data.user_b_id) {
    errors.push('User A and User B cannot be the same');
  }

  if (
    data.status &&
    !['pending', 'accepted', 'rejected', 'room_offer', 'room_assigned', 'room_declined'].includes(
      data.status
    )
  ) {
    errors.push('Invalid status value');
  }

  return { isValid: errors.length === 0, errors };
}

const handler = withAuth(
  async (req: Request, payload: JWTPayload): Promise<Response> => {
    const userId = getUserId(payload);
    const url = new URL(req.url);
    const method = req.method;

    try {
      if (method === 'GET') {
        const matchId = url.searchParams.get('id');

        if (matchId) {
          const { data, error } = await supabaseClient
            .from('matches')
            .select(
              `
              *,
              user_a:profiles!matches_user_a_id_fkey(*),
              user_b:profiles!matches_user_b_id_fkey(*)
            `
            )
            .eq('id', matchId)
            .single();

          if (error || !data) {
            return new Response(JSON.stringify({ error: 'Match not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (userId !== data.user_a_id && userId !== data.user_b_id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const response: ApiResponse<Match> = { data: data as Match };
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const matches = await getUserMatches(userId);
        const response: ApiResponse<Match[]> = { data: matches };
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (method === 'POST') {
        const body = await req.json();

        const matchData = {
          user_a_id: userId,
          user_b_id: body.user_b_id,
        };

        const validation = validateMatchData(matchData);
        if (!validation.isValid) {
          return new Response(
            JSON.stringify({
              error: 'Validation failed',
              details: validation.errors,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const [forwardMatch, inverseMatch] = await Promise.all([
          getDirectionalMatch(matchData.user_a_id, matchData.user_b_id),
          getDirectionalMatch(matchData.user_b_id, matchData.user_a_id),
        ]);

        const action = resolveLikeAction(forwardMatch, inverseMatch);

        if (action === 'return_existing_accepted') {
          const acceptedMatch = forwardMatch ?? inverseMatch;
          if (!acceptedMatch) {
            throw new Error('Accepted match state could not be resolved');
          }
          await ensureChatForMatch(acceptedMatch.id);
          const response: ApiResponse<Match> = { data: acceptedMatch };
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (action === 'return_existing') {
          const existingMatch = forwardMatch ?? inverseMatch;
          if (!existingMatch) {
            throw new Error('Existing match state could not be resolved');
          }
          const response: ApiResponse<Match> = { data: existingMatch };
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (action === 'accept_inverse_pending') {
          if (!inverseMatch) {
            throw new Error('Inverse pending match not found');
          }

          const updatedMatch = await updateMatch(inverseMatch.id, userId, {
            status: 'accepted',
          });
          await ensureChatForMatch(updatedMatch.id);

          void (async () => {
            const tokens = await getTokensForUsers([
              updatedMatch.user_a_id as string,
              updatedMatch.user_b_id as string,
            ]);
            if (tokens.length === 0) return;
            fireAndForgetPush({
              tokens,
              title: 'Nuevo match',
              body: 'Tienes un nuevo match. Abre la seccion de matches.',
              data: {
                screen: 'Matches',
              },
            });
          })().catch((error) => {
            console.error('[matches] push trigger error:', error);
          });

          const response: ApiResponse<Match> = { data: updatedMatch };
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const match = await createMatch(matchData);
          const response: ApiResponse<Match> = { data: match };
          return new Response(JSON.stringify(response), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (
            message.includes('duplicate key value') ||
            message.includes('matches_unique_pair')
          ) {
            const [resolvedForward, resolvedInverse] = await Promise.all([
              getDirectionalMatch(matchData.user_a_id, matchData.user_b_id),
              getDirectionalMatch(matchData.user_b_id, matchData.user_a_id),
            ]);
            const resolved = resolvedForward ?? resolvedInverse;
            if (resolved) {
              const response: ApiResponse<Match> = { data: resolved };
              return new Response(JSON.stringify(response), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          }
          throw error;
        }
      }

      if (method === 'PATCH') {
        const matchId = url.searchParams.get('id');

        if (!matchId) {
          return new Response(
            JSON.stringify({ error: 'Match ID parameter is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const updates = await req.json();

        const { data: previousMatch } = await supabaseClient
          .from('matches')
          .select('status, user_a_id, user_b_id')
          .eq('id', matchId)
          .single();

        if (
          updates.status &&
          !['pending', 'accepted', 'rejected', 'room_offer', 'room_assigned', 'room_declined'].includes(
            updates.status
          )
        ) {
          return new Response(
            JSON.stringify({ error: 'Invalid status value' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const updatedMatch = await updateMatch(matchId, userId, updates);

        if (updates.status === 'accepted' && previousMatch?.status !== 'accepted') {
          await ensureChatForMatch(updatedMatch.id);
          void (async () => {
            const tokens = await getTokensForUsers([
              previousMatch.user_a_id as string,
              previousMatch.user_b_id as string,
            ]);
            if (tokens.length === 0) return;
            fireAndForgetPush({
              tokens,
              title: 'Nuevo match',
              body: 'Tienes un nuevo match. Abre la seccion de matches.',
              data: {
                screen: 'Matches',
              },
            });
          })().catch((error) => {
            console.error('[matches] push trigger error:', error);
          });
        }

        const response: ApiResponse<Match> = { data: updatedMatch };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Matches function error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes('duplicate key value') ||
        errorMessage.includes('matches_unique_pair')
      ) {
        return new Response(JSON.stringify({ error: 'Match already exists' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: errorMessage,
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
