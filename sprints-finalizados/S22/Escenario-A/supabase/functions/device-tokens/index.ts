import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import type { JWTPayload } from '../_shared/types.ts';

type DeviceTokenBody = {
  token?: string;
  platform?: 'android' | 'ios';
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(
  withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
    const userId = getUserId(payload);

    if (req.method === 'POST') {
      const body = (await req.json()) as DeviceTokenBody;
      const token = body.token?.trim();
      const platform = body.platform;

      if (!token || !platform || !['android', 'ios'].includes(platform)) {
        return jsonResponse(400, { error: 'token and platform are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('device_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        )
        .select('id, user_id, token, platform, created_at, updated_at')
        .single();

      if (error || !data) {
        console.error('[device-tokens][POST] Upsert error:', error);
        return jsonResponse(500, { error: 'Failed to register device token' });
      }

      return jsonResponse(201, { data });
    }

    if (req.method === 'DELETE') {
      const body = (await req.json()) as DeviceTokenBody;
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
        console.error('[device-tokens][DELETE] Delete error:', error);
        return jsonResponse(500, { error: 'Failed to remove device token' });
      }

      return jsonResponse(200, { data: { deleted: true } });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  })
);
