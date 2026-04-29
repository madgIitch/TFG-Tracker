import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import type { RoomInterest } from '../types/room';

interface InterestsResponse {
  data: RoomInterest[];
}

class InterestService {
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

  async getReceivedInterests(): Promise<RoomInterest[]> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/interests?type=received`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener intereses recibidos');
    }

    const data: InterestsResponse = await response.json();
    return data.data;
  }

  async getGivenInterests(): Promise<RoomInterest[]> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/interests?type=given`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener intereses');
    }

    const data: InterestsResponse = await response.json();
    return data.data;
  }
}

export const interestService = new InterestService();
