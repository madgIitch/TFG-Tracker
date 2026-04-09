import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import type { JWTPayload } from '../_shared/types.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

type RegisterBody = {
  token?: string;
  platform?: 'android' | 'ios';
};

type DeleteBody = {
  token?: string;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(
  withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
    const userId = getUserId(payload);

    if (req.method === 'POST') {
      const body = (await req.json()) as RegisterBody;
      const token = body.token?.trim();
      const platform = body.platform;

      if (!token || (platform !== 'android' && platform !== 'ios')) {
        return jsonResponse(400, { error: 'token and platform are required' });
      }

      const { error } = await supabaseAdmin.from('device_tokens').upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );

      if (error) {
        console.error('[device-tokens] upsert error:', error);
        return jsonResponse(500, { error: 'Failed to register token' });
      }

      return jsonResponse(200, { ok: true });
    }

    if (req.method === 'DELETE') {
      const body = (await req.json()) as DeleteBody;
      const token = body.token?.trim();
      if (!token) {
        return jsonResponse(400, { error: 'token is required' });
      }

      const { error } = await supabaseAdmin
        .from('device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        console.error('[device-tokens] delete error:', error);
        return jsonResponse(500, { error: 'Failed to unregister token' });
      }

      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  })
);
