// src/services/roomService.ts
import {
  Flat,
  Room,
  FlatCreateRequest,
  RoomCreateRequest,
  RoomFilters,
  FlatInvitationCode,
} from '../types/room';
import { API_CONFIG } from '../config/api';
import { authService } from './authService';

interface FlatResponse {
  data: Flat[];
}

interface RoomResponse {
  data: Room[];
}

interface SingleFlatResponse {
  data: Flat;
}

interface SingleRoomResponse {
  data: Room;
}

interface InvitationCodeResponse {
  data: FlatInvitationCode | null;
}

interface PaginatedRoomResponse {
  data: Room[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

class RoomService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
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

  // === FLATS OPERATIONS ===

  async getFlats(): Promise<Flat[]> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms?type=flats`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Error al obtener los pisos');
    }

    const data: FlatResponse = await response.json();
    return data.data;
  }

  async getFlatsByOwner(ownerId: string): Promise<Flat[]> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/rooms?type=flats&owner_id=${ownerId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      let details = '';
      try {
        details = await response.text();
      } catch {
        details = '';
      }
      throw new Error(
        details
          ? `Error al obtener los pisos (${response.status}): ${details}`
          : `Error al obtener los pisos (${response.status})`
      );
    }

    const data: FlatResponse = await response.json();
    return data.data;
  }

  async createFlat(flatData: FlatCreateRequest): Promise<Flat> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms?type=flat`, {
      method: 'POST',
      body: JSON.stringify(flatData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el piso');
    }

    const data: SingleFlatResponse = await response.json();
    return data.data;
  }

  async updateFlat(flatId: string, updates: Partial<FlatCreateRequest>): Promise<Flat> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms/${flatId}?type=flat`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el piso');
    }

    const data: SingleFlatResponse = await response.json();
    return data.data;
  }

  // === ROOMS OPERATIONS ===

  async getRooms(): Promise<Room[]> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms?type=rooms`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Error al obtener las habitaciones');
    }

    const data: RoomResponse = await response.json();
    return data.data;
  }

  async getRoomsByOwner(ownerId: string): Promise<Room[]> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/rooms?type=rooms&owner_id=${ownerId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      let details = '';
      try {
        details = await response.text();
      } catch {
        details = '';
      }
      throw new Error(
        details
          ? `Error al obtener las habitaciones (${response.status}): ${details}`
          : `Error al obtener las habitaciones (${response.status})`
      );
    }

    const data: RoomResponse = await response.json();
    return data.data;
  }

  async createRoom(roomData: RoomCreateRequest): Promise<Room> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms?type=room`, {
      method: 'POST',
      body: JSON.stringify(roomData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear la habitación');
    }

    const data: SingleRoomResponse = await response.json();
    return data.data;
  }

  async updateRoom(roomId: string, updates: Partial<RoomCreateRequest>): Promise<Room> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms/${roomId}?type=room`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar la habitación');
    }

    const data: SingleRoomResponse = await response.json();
    return data.data;
  }

  async getRoomById(roomId: string): Promise<Room> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/rooms/${roomId}?type=room`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al obtener la habitacion');
    }

    const data: SingleRoomResponse = await response.json();
    return data.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/rooms/${roomId}?type=room`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar la habitacion');
    }
  }

  async getRoomInvitationCode(roomId: string): Promise<FlatInvitationCode | null> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/rooms?type=invite-code&room_id=${roomId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al obtener el codigo de invitacion');
    }

    const data: InvitationCodeResponse = await response.json();
    return data.data ?? null;
  }

  async createRoomInvitationCode(roomId: string): Promise<FlatInvitationCode> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms?type=invite-code`, {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al generar el codigo de invitacion');
    }

    const data: InvitationCodeResponse = await response.json();
    if (!data.data) {
      throw new Error('No se pudo generar el codigo');
    }
    return data.data;
  }

  // === SEARCH OPERATIONS ===

  async searchRooms(
    filters: RoomFilters = {},
    page: number = 1,
    perPage: number = 20
  ): Promise<PaginatedRoomResponse> {
    const response = await this.fetchWithAuth(`${API_CONFIG.FUNCTIONS_URL}/rooms/search`, {
      method: 'POST',
      body: JSON.stringify({
        filters,
        page,
        per_page: perPage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la búsqueda de habitaciones');
    }

    const data: PaginatedRoomResponse = await response.json();
    return data;
  }

  // === UTILITY METHODS ===

  async getMyRooms(): Promise<Room[]> {
    return this.getRooms();
  }

  async getMyFlats(): Promise<Flat[]> {
    return this.getFlats();
  }
}

export const roomService = new RoomService();
