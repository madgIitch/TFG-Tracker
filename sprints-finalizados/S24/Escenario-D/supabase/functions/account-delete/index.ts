import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getAuthUser } from '../_shared/auth.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = getSupabaseAdmin()
    
    // Obtener usuario autenticado usando el token de la petición
    const user = await getAuthUser(req)
    const userId = user.id

    console.log(`Iniciando borrado de cuenta para el usuario: ${userId}`)

    // 1. Obtener y borrar fotos de perfil (Storage)
    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single()
    if (profile?.avatar_url) {
      try {
        const urlParts = profile.avatar_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        await supabase.storage.from('avatars').remove([`${userId}/${fileName}`])
      } catch (e) {
        console.warn('Error borrando avatar de storage:', e)
      }
    }

    // 2. Obtener pisos propios para borrar fotos de habitaciones asociadas
    const { data: flats } = await supabase.from('flats').select('id').eq('owner_id', userId)
    if (flats && flats.length > 0) {
      const flatIds = flats.map(f => f.id)
      const { data: rooms } = await supabase.from('rooms').select('id').in('flat_id', flatIds)
      
      if (rooms && rooms.length > 0) {
        const roomIds = rooms.map(r => r.id)
        const { data: roomExtras } = await supabase.from('room_extras').select('photos').in('room_id', roomIds)
        
        if (roomExtras && roomExtras.length > 0) {
          const filesToRemove = roomExtras.flatMap(re => {
            const photos = re.photos || []
            return photos.map((p: any) => p.path)
          }).filter(Boolean)
          
          if (filesToRemove.length > 0) {
            try {
              await supabase.storage.from('room-photos').remove(filesToRemove)
            } catch (e) {
              console.warn('Error borrando fotos de habitaciones de storage:', e)
            }
          }
        }
      }
    }

    // 3. Borrar de auth.users (El hard delete también en cascada eliminaría perfiles, device_tokens, flats, rooms, etc si están configurados on delete cascade)
    // Sin embargo, para estar seguros y porque es un requirement explícito de supabase auth admin deleteUser, llamamos al service role.
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
      throw deleteAuthError
    }

    console.log(`Usuario ${userId} eliminado correctamente de auth.users`)

    return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error en account-delete:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
