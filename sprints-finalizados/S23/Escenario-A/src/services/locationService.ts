import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import type { CityOption, ZoneOption } from '../types/location';

class LocationService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async fetchWithAuthRetry(url: string): Promise<Response> {
    let headers = await this.getAuthHeaders();
    const doFetch = () =>
      fetch(url, {
        method: 'GET',
        headers,
      });
    let response = await doFetch();
    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await doFetch();
      }
    }
    return response;
  }

  async searchCities(query: string, limit = 20): Promise<CityOption[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });
    const response = await this.fetchWithAuthRetry(
      `${API_CONFIG.FUNCTIONS_URL}/locations/cities?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Error searching cities (${response.status})`);
    }
    const body = await response.json();
    return (body?.data ?? []) as CityOption[];
  }

  async searchZones(cityId: string, query: string, limit = 50): Promise<ZoneOption[]> {
    const params = new URLSearchParams({
      city_id: cityId,
      q: query,
      limit: String(limit),
    });
    const response = await this.fetchWithAuthRetry(
      `${API_CONFIG.FUNCTIONS_URL}/locations/zones?${params.toString()}`
    );
    if (!response.ok) {
      throw new Error(`Error searching zones (${response.status})`);
    }
    const body = await response.json();
    return (body?.data ?? []) as ZoneOption[];
  }
}

export const locationService = new LocationService();
