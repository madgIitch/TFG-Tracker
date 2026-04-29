import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import type { Profile } from '../types/profile';
import type { MatchStatus } from '../types/chat';

type ApiMatch = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status?: MatchStatus;
  user_a?: Profile;
  user_b?: Profile;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

class MatchService {
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

  async getMatch(matchId: string): Promise<ApiMatch | null> {
    const response = await this.fetchWithAuth(
      `${API_CONFIG.FUNCTIONS_URL}/matches?id=${matchId}`,
      {
        method: 'GET',
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error al obtener match');
    }

    const payload = (await response.json()) as ApiResponse<ApiMatch>;
    return payload.data ?? null;
  }
}

export const matchService = new MatchService();
