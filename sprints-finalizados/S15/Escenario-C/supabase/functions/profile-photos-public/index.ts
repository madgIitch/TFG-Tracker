// supabase/functions/profile-photos-public/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth } from '../_shared/auth.ts';
import type { JWTPayload } from '../_shared/types.ts';

interface ProfilePhotoRow {
  id: string;
  profile_id: string;
  path: string;
  position: number;
  is_primary: boolean;
  created_at: string;
}

function normalizeStoragePath(rawPath: string): string | null {
  if (!rawPath) return null;
  if (!rawPath.startsWith('http')) return rawPath;

  try {
    const url = new URL(rawPath);
    const pathname = url.pathname;
    const prefixes = [
      '/storage/v1/object/sign/avatars/',
      '/storage/v1/object/public/avatars/',
      '/storage/v1/object/avatars/',
    ];

    for (const prefix of prefixes) {
      const index = pathname.indexOf(prefix);
      if (index !== -1) {
        return decodeURIComponent(pathname.substring(index + prefix.length));
      }
    }
  } catch (error) {
    console.error('[profile-photos-public] Failed to parse path:', rawPath, error);
  }

  return null;
}

async function signedUrlForPath(path: string): Promise<string | null> {
  const storagePath = normalizeStoragePath(path);
  if (!storagePath) {
    if (path.startsWith('http')) {
      console.warn('[profile-photos-public] Using passthrough URL:', path);
      return path;
    }
    return null;
  }

  const { data, error } = await supabaseAdmin.storage
    .from('avatars')
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    console.error('[profile-photos-public] Signed URL error:', {
      path,
      storagePath,
      error,
    });
    return null;
  }

  return data.signedUrl;
}

async function listPhotos(profileId: string): Promise<ProfilePhotoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('profile_photos')
    .select('*')
    .eq('profile_id', profileId)
    .order('is_primary', { ascending: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as ProfilePhotoRow[];
}

serve(
  withAuth(async (req: Request, _payload: JWTPayload): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const profileId = url.searchParams.get('profile_id');

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Missing profile_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = await listPhotos(profileId);
    const data = await Promise.all(
      rows.map(async (row) => {
        const signedUrl = await signedUrlForPath(row.path);
        return {
          ...row,
          signedUrl: signedUrl ?? '',
          signedUrlError: signedUrl ? null : 'SIGNED_URL_UNAVAILABLE',
        };
      })
    );

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  })
);
