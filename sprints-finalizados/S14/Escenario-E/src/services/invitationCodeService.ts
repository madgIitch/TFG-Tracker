// src/services/invitationCodeService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const ENDPOINT = `${API_CONFIG.FUNCTIONS_URL}/flat-invitation`;

const anonHeaders = {
  'Content-Type': 'application/json',
  apikey: API_CONFIG.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
};

export interface GeneratedCode {
  code: string;
  expires_at: string;
  room_title: string;
  flat_address: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: 'not_found' | 'used' | 'expired';
  room?: { id: string; title: string; price_per_month: number };
  flat?: { address: string; city: string };
}

class InvitationCodeService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async generate(roomId: string): Promise<GeneratedCode> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'generate', room_id: roomId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? 'Error generando el código');
    }
    return data as GeneratedCode;
  }

  async validate(code: string): Promise<ValidationResult> {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: anonHeaders,
      body: JSON.stringify({ action: 'validate', code: code.toUpperCase() }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { valid: false, reason: 'not_found' };
    }
    return data as ValidationResult;
  }

  async redeem(code: string, token: string): Promise<void> {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'redeem', code: code.toUpperCase() }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? 'Error al unirse al piso');
    }
  }
}

export const invitationCodeService = new InvitationCodeService();
