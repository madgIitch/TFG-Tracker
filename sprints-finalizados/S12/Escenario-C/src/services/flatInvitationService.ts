import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type {
  FlatInvitationCode,
  FlatInvitationValidation,
} from '../types/flatInvitation';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class FlatInvitationService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getActiveCode(roomId: string): Promise<FlatInvitationCode | null> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-invitations?room_id=${roomId}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'No se pudo obtener el codigo');
    }

    const payload = (await response.json()) as ApiResponse<FlatInvitationCode | null>;
    return payload.data ?? null;
  }

  async generateCode(input: {
    roomId: string;
    ttlHours?: number;
    maxUses?: number;
  }): Promise<FlatInvitationCode> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-invitations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        room_id: input.roomId,
        ttl_hours: input.ttlHours,
        max_uses: input.maxUses,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'No se pudo generar el codigo');
    }

    const payload = (await response.json()) as ApiResponse<FlatInvitationCode>;
    if (!payload.data) {
      throw new Error('Respuesta invalida al generar codigo');
    }

    return payload.data;
  }

  async validateCode(code: string): Promise<FlatInvitationValidation | null> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
    };

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-invitations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'validate',
        code,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiResponse<FlatInvitationValidation>;
    return payload.data ?? null;
  }
}

export const flatInvitationService = new FlatInvitationService();
