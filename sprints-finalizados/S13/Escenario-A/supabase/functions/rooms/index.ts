// supabase/functions/rooms/index.ts  
  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'  
import { corsHeaders } from '../_shared/cors.ts'  
import { withAuth, getUserId } from '../_shared/auth.ts'  
import {       
  Flat,       
  Room,       
  FlatCreateRequest,       
  RoomCreateRequest,      
  ApiResponse,       
  JWTPayload,      
} from '../_shared/types.ts'  
  
/**      
 * Edge Function para gestión de flats y rooms en HomiMatch      
 * Maneja CRUD operations para propiedades y listados de habitaciones      
 */  
  
// Crear cliente de Supabase  
const supabaseClient = createClient(  
  Deno.env.get('SUPABASE_URL') ?? '',  
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''  
)  
  
interface FlatValidationData {  
  address?: string  
  city?: string  
  district?: string  
}  
  
interface RoomValidationData {  
  flat_id?: string  
  title?: string  
  description?: string  
  price_per_month?: number  
  size_m2?: number  
  is_available?: boolean  
  available_from?: string  
}  

interface FlatInvitationCode {
  id: string
  room_id: string
  created_by: string
  code: string
  expires_at: string
  max_uses: number
  used_count: number
  is_active: boolean
  created_at: string
  last_used_at?: string | null
}
  
/**      
 * Obtener flats del usuario autenticado      
 */  
async function getUserFlats(userId: string): Promise<Flat[]> {  
  const { data, error } = await supabaseClient  
    .from('flats')  
    .select('*')  
    .eq('owner_id', userId)  
    .order('created_at', { ascending: false })  
        
  if (error) {  
    throw new Error(`Failed to fetch flats: ${error.message}`)  
  }  
        
  return data as Flat[]  
}  
  
/**      
 * Obtener rooms del usuario autenticado      
 */  
async function getUserRooms(userId: string): Promise<Room[]> {  
  const { data, error } = await supabaseClient  
    .from('rooms')  
    .select(`  
      *,  
      flat:flats(*)  
    `)  
    .eq('owner_id', userId)  
    .order('created_at', { ascending: false })  
        
  if (error) {  
    throw new Error(`Failed to fetch rooms: ${error.message}`)  
  }  
        
  return data as Room[]  
}  

async function getRoomById(roomId: string): Promise<Room | null> {
  const { data, error } = await supabaseClient
    .from('rooms')
    .select(
      `
      *,
      flat:flats(*)
    `
    )
    .eq('id', roomId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Room;
}

async function ensureRoomOwnership(roomId: string, ownerId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('rooms')
    .select('id, owner_id')
    .eq('id', roomId)
    .single();

  if (error || !data) return false;
  return data.owner_id === ownerId;
}

async function countAvailableSlotsForRoom(roomId: string): Promise<number> {
  const { data: room, error: roomError } = await supabaseClient
    .from('rooms')
    .select('id, is_available')
    .eq('id', roomId)
    .eq('is_available', true);

  if (roomError || !room || room.length === 0) return 0;
  const { data: assignments, error: assignmentError } = await supabaseClient
    .from('room_assignments')
    .select('id')
    .eq('room_id', roomId)
    .eq('status', 'accepted');

  if (assignmentError) return 0;
  return assignments && assignments.length > 0 ? 0 : 1;
}

function buildInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return code;
}

async function generateUniqueInviteCode(): Promise<string> {
  const attempts = 8;
  for (let i = 0; i < attempts; i += 1) {
    const candidate = buildInviteCode();
    const { data, error } = await supabaseClient
      .from('flat_invitation_codes')
      .select('id')
      .eq('code', candidate)
      .limit(1);
    if (!error && (!data || data.length === 0)) {
      return candidate;
    }
  }
  throw new Error('Failed to generate unique invitation code');
}

async function getActiveInvitationCode(roomId: string): Promise<FlatInvitationCode | null> {
  const availableSlots = await countAvailableSlotsForRoom(roomId);
  if (availableSlots <= 0) return null;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseClient
    .from('flat_invitation_codes')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_active', true)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as FlatInvitationCode;
}

async function createInvitationCode(roomId: string, ownerId: string): Promise<FlatInvitationCode> {
  const ownsRoom = await ensureRoomOwnership(roomId, ownerId);
  if (!ownsRoom) {
    throw new Error('Unauthorized: You can only create codes for your own rooms');
  }

  const availableSlots = await countAvailableSlotsForRoom(roomId);
  if (availableSlots <= 0) {
    throw new Error('Room is not available');
  }

  const code = await generateUniqueInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await supabaseClient
    .from('flat_invitation_codes')
    .update({ is_active: false })
    .eq('room_id', roomId)
    .eq('is_active', true);

  const { data, error } = await supabaseClient
    .from('flat_invitation_codes')
    .insert({
      room_id: roomId,
      created_by: ownerId,
      code,
      expires_at: expiresAt,
      max_uses: 1,
      used_count: 0,
      is_active: true,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create invitation code: ${error?.message ?? 'unknown error'}`);
  }

  return data as FlatInvitationCode;
}
  
/**      
 * Crear nuevo flat      
 */  
async function createFlat(flatData: FlatCreateRequest): Promise<Flat> {  
  const { data, error } = await supabaseClient  
    .from('flats')  
    .insert(flatData)  
    .select()  
    .single()  
        
  if (error) {  
    throw new Error(`Failed to create flat: ${error.message}`)  
  }  
        
  return data as Flat  
}  
  
/**      
 * Crear nuevo room      
 */  
async function createRoom(roomData: RoomCreateRequest): Promise<Room> {  
  const { data, error } = await supabaseClient  
    .from('rooms')  
    .insert(roomData)  
    .select(`  
      *,  
      flat:flats(*)  
    `)  
    .single()  
        
  if (error) {  
    throw new Error(`Failed to create room: ${error.message}`)  
  }  
        
  return data as Room  
}  
  
/**      
 * Actualizar flat existente      
 */  
async function updateFlat(flatId: string, userId: string, updates: Partial<Flat>): Promise<Flat> {  
  // Verificar que el usuario es el propietario  
  const { data: existingFlat, error: fetchError } = await supabaseClient  
    .from('flats')  
    .select('*')  
    .eq('id', flatId)  
    .single()  
        
  if (fetchError || !existingFlat) {  
    throw new Error('Flat not found')  
  }  
        
  if (existingFlat.owner_id !== userId) {  
    throw new Error('Unauthorized: You can only update your own flats')  
  }  
  
  const { data, error } = await supabaseClient  
    .from('flats')  
    .update(updates)  
    .eq('id', flatId)  
    .select()  
    .single()  
        
  if (error) {  
    throw new Error(`Failed to update flat: ${error.message}`)  
  }  
        
  return data as Flat  
}  
  
/**      
 * Actualizar room existente      
 */  
async function updateRoom(roomId: string, userId: string, updates: Partial<Room>): Promise<Room> {  
  // Verificar que el usuario es el propietario  
  const { data: existingRoom, error: fetchError } = await supabaseClient  
    .from('rooms')  
    .select('*')  
    .eq('id', roomId)  
    .single()  
        
  if (fetchError || !existingRoom) {  
    throw new Error('Room not found')  
  }  
        
  if (existingRoom.owner_id !== userId) {  
    throw new Error('Unauthorized: You can only update your own rooms')  
  }  
  
  const { data, error } = await supabaseClient  
    .from('rooms')  
    .update(updates)  
    .eq('id', roomId)  
    .select(`  
      *,  
      flat:flats(*)  
    `)  
    .single()  
        
  if (error) {  
    throw new Error(`Failed to update room: ${error.message}`)  
  }  
        
  return data as Room  
}  

/**      
 * Eliminar room existente      
 */  
async function deleteRoom(roomId: string, userId: string): Promise<void> {  
  const { data: existingRoom, error: fetchError } = await supabaseClient  
    .from('rooms')  
    .select('id, owner_id')  
    .eq('id', roomId)  
    .single()  

  if (fetchError || !existingRoom) {  
    throw new Error('Room not found')  
  }  

  if (existingRoom.owner_id !== userId) {  
    throw new Error('Unauthorized: You can only delete your own rooms')  
  }  

  const { data: extras } = await supabaseClient  
    .from('room_extras')  
    .select('photos')  
    .eq('room_id', roomId)  
    .single()  

  const photoPaths = Array.isArray(extras?.photos) ? extras.photos : []  
  if (photoPaths.length > 0) {  
    await supabaseClient.storage.from('room-photos').remove(photoPaths)  
  }  

  await supabaseClient.from('room_extras').delete().eq('room_id', roomId)  

  const { error } = await supabaseClient  
    .from('rooms')  
    .delete()  
    .eq('id', roomId)  

  if (error) {  
    throw new Error(`Failed to delete room: ${error.message}`)  
  }  
}  
  
/**      
 * Validar datos de flat      
 */  
function validateFlatData(data: FlatValidationData): { isValid: boolean; errors: string[] } {  
  const errors: string[] = []  
        
  if (data.address !== undefined) {  
    if (typeof data.address !== 'string' || data.address.trim().length < 5) {  
      errors.push('Address must be at least 5 characters long')  
    }  
  }  
        
  if (data.city !== undefined) {  
    if (typeof data.city !== 'string' || data.city.trim().length < 2) {  
      errors.push('City is required')  
    }  
  }  
        
  return {  
    isValid: errors.length === 0,  
    errors  
  }  
}  
  
/**      
 * Validar datos de room      
 */  
function validateRoomData(data: RoomValidationData): { isValid: boolean; errors: string[] } {  
  const errors: string[] = []  
        
  if (!data.flat_id || typeof data.flat_id !== 'string') {  
    errors.push('Flat ID is required')  
  }  
        
  if (data.price_per_month == null || typeof data.price_per_month !== 'number' || data.price_per_month < 0) {  
    errors.push('Price per month must be a non-negative number')  
  }  
        
  if (!data.available_from) {  
    errors.push('Available from date is required')  
  }  
        
  if (data.size_m2 && (typeof data.size_m2 !== 'number' || data.size_m2 < 5)) {  
    errors.push('Size m2 must be at least 5')  
  }  
        
  return {  
    isValid: errors.length === 0,  
    errors  
  }  
}  
  
/**      
 * Handler principal con autenticación      
 */  
const handler = withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {  
  const userId = getUserId(payload)  
  const url = new URL(req.url)  
  const method = req.method  
  const pathParts = url.pathname.split('/')  
  
  try {  
    // GET - Obtener flats y rooms del usuario  
    if (method === 'GET') {  
      const type = url.searchParams.get('type') // 'flats' or 'rooms'  
      const ownerIdParam = url.searchParams.get('owner_id')?.trim()
      const targetOwnerId = ownerIdParam || userId
      const resourceId = pathParts[pathParts.length - 1]
      const isResourceRequest = resourceId && resourceId !== 'rooms'

      if (type === 'invite-code') {
        const roomId = url.searchParams.get('room_id')?.trim();
        if (!roomId) {
          return new Response(
            JSON.stringify({ error: 'room_id is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const ownsRoom = await ensureRoomOwnership(roomId, userId);
        if (!ownsRoom) {
          return new Response(
            JSON.stringify({ error: 'Room not found or unauthorized' }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const codeData = await getActiveInvitationCode(roomId);
        if (!codeData) {
          return new Response(
            JSON.stringify({ data: null }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const availableSlots = await countAvailableSlotsForRoom(roomId);
        return new Response(
          JSON.stringify({
            data: {
              ...codeData,
              available_slots: availableSlots,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (isResourceRequest && type === 'room') {
        const room = await getRoomById(resourceId)
        if (!room) {
          return new Response(
            JSON.stringify({ error: 'Room not found or unauthorized' }),
            {       
              status: 404,       
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
            }  
          )
        }

        const response: ApiResponse<Room> = { data: room }
        return new Response(
          JSON.stringify(response),
          {       
            status: 200,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )
      }
            
      if (type === 'flats') {  
        const flats = await getUserFlats(targetOwnerId)  
        const response: ApiResponse<Flat[]> = { data: flats }  
        return new Response(  
          JSON.stringify(response),  
          {       
            status: 200,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
            
      if (type === 'rooms' || !type) {  
        const rooms = await getUserRooms(targetOwnerId)  
        const response: ApiResponse<Room[]> = { data: rooms }  
        return new Response(  
          JSON.stringify(response),  
          {       
            status: 200,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
    }  
  
    // POST - Crear nuevo flat o room  
    if (method === 'POST') {  
      const body = await req.json()  
      const type = url.searchParams.get('type') // 'flat' or 'room'  

      if (type === 'invite-code') {
        const roomId = (body?.room_id as string | undefined)?.trim();
        if (!roomId) {
          return new Response(
            JSON.stringify({ error: 'room_id is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const codeData = await createInvitationCode(roomId, userId);
        const availableSlots = await countAvailableSlotsForRoom(roomId);
        return new Response(
          JSON.stringify({
            data: {
              ...codeData,
              available_slots: availableSlots,
            },
          }),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
            
      if (type === 'flat') {  
        const flatData: FlatCreateRequest = {  
          ...body,  
          owner_id: userId // Forzar el owner_id del token  
        }  
  
        const validation = validateFlatData(flatData)  
        if (!validation.isValid) {  
          return new Response(  
            JSON.stringify({       
              error: 'Validation failed',       
              details: validation.errors       
            }),  
            {       
              status: 400,       
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
            }  
          )  
        }  
  
        const flat = await createFlat(flatData)  
        const response: ApiResponse<Flat> = { data: flat }  
              
        return new Response(  
          JSON.stringify(response),  
          {       
            status: 201,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
            
      if (type === 'room') {  
        const roomData: RoomCreateRequest = {  
          ...body,  
          owner_id: userId // Forzar el owner_id del token  
        }  
  
        const validation = validateRoomData(roomData)  
        if (!validation.isValid) {  
          return new Response(  
            JSON.stringify({       
              error: 'Validation failed',       
              details: validation.errors       
            }),  
            {       
              status: 400,       
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
            }  
          )  
        }  
  
        const room = await createRoom(roomData)  
        const response: ApiResponse<Room> = { data: room }  
              
        return new Response(  
          JSON.stringify(response),  
          {       
            status: 201,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
    }  
  
    // PATCH - Actualizar flat o room existente  
    if (method === 'PATCH') {  
      const resourceId = pathParts[pathParts.length - 1]  
      const type = url.searchParams.get('type') // 'flat' or 'room'  
      const updates = await req.json()  
            
      // No permitir cambiar owner_id  
      delete updates.owner_id  
      delete updates.id  
      delete updates.created_at  
            
      if (type === 'flat') {  
        const validation = validateFlatData(updates)  
        if (!validation.isValid) {  
          return new Response(  
            JSON.stringify({       
              error: 'Validation failed',       
              details: validation.errors       
            }),  
            {       
              status: 400,       
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
            }  
          )  
        }  
  
        const updatedFlat = await updateFlat(resourceId, userId, updates)  
        const response: ApiResponse<Flat> = { data: updatedFlat }  
              
        return new Response(  
          JSON.stringify(response),  
          {       
            status: 200,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
            
      if (type === 'room') {  
        const validation = validateRoomData(updates)  
        if (!validation.isValid) {  
          return new Response(  
            JSON.stringify({       
              error: 'Validation failed',       
              details: validation.errors       
            }),  
            {       
              status: 400,       
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
            }  
          )  
        }  
  
        const updatedRoom = await updateRoom(resourceId, userId, updates)  
        const response: ApiResponse<Room> = { data: updatedRoom }  
              
        return new Response(  
          JSON.stringify(response),  
          {       
            status: 200,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
    }  
  
    // DELETE - Eliminar room existente  
    if (method === 'DELETE') {  
      const resourceId = pathParts[pathParts.length - 1]  
      const type = url.searchParams.get('type') // 'room'  
  
      if (type === 'room') {  
        await deleteRoom(resourceId, userId)  
        return new Response(  
          JSON.stringify({ message: 'Room deleted successfully' }),  
          {       
            status: 200,       
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
          }  
        )  
      }  
    }  
  
    // Método no permitido  
    return new Response(  
      JSON.stringify({ error: 'Method not allowed' }),  
      {       
        status: 405,       
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }  
      }  
    )  
  
  } catch (error) {  
    console.error('Rooms function error:', error)  
    const errorMessage = error instanceof Error ? error.message : String(error)  
    return new Response(  
      JSON.stringify({     
        error: 'Internal server error',     
        details: errorMessage     
      }),  
      {     
        status: 500,     
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }     
      }  
    )  
  }  
})  
  
// Exportar handler para Deno  
Deno.serve(handler)
