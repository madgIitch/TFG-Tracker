import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import type { RoomExtras } from '../types/room';

interface RoomExtrasResponse {
  data: RoomExtras[];
}

interface SingleRoomExtrasResponse {
  data: RoomExtras;
}

class RoomExtrasService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async fetchWithAuth(input: RequestInfo, init: RequestInit): Promise<Response> {
    let headers = await this.getAuthHeaders();
    let response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await fetch(input, { ...init, headers });
      }
    }
    return response;
  }

  async getExtras(roomId: string): Promise<RoomExtras | null> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/room-extras?room_id=${roomId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener extras de habitacion');
    }

    const data: RoomExtrasResponse = await response.json();
    return data.data?.[0] ?? null;
  }

  async getExtrasForRooms(roomIds: string[]): Promise<RoomExtras[]> {
    if (roomIds.length === 0) return [];
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/room-extras?room_ids=${roomIds.join(',')}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener extras de habitaciones');
    }

    const data: RoomExtrasResponse = await response.json();
    return data.data ?? [];
  }

  async upsertExtras(payload: {
    room_id: string;
    category?: string | null;
    room_type?: string | null;
    common_area_type?: string | null;
    common_area_custom?: string | null;
    photos: string[];
  }): Promise<RoomExtras> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/room-extras`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = `status ${response.status}`;
      try {
        const error = await response.json();
        detail = error?.details || error?.error || detail;
      } catch {
        // ignore parse errors
      }
      throw new Error(`Error al guardar extras de habitacion: ${detail}`);
    }

    const data: SingleRoomExtrasResponse = await response.json();
    return data.data;
  }
}

export const roomExtrasService = new RoomExtrasService();
