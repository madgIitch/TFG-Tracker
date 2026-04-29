import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationCity, LocationZone } from '../types/location';

type LocationsCitiesResponse = { cities?: LocationCity[] };
type LocationsZonesResponse = { zones?: LocationZone[] };

class LocationService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async searchCities(query: string, limit = 10): Promise<LocationCity[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const headers = await this.getAuthHeaders();
    const url = `${API_CONFIG.FUNCTIONS_URL}/locations-search?type=cities&q=${encodeURIComponent(
      q
    )}&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as LocationsCitiesResponse;
    return payload.cities ?? [];
  }

  async getZonesByCity(
    cityId: string,
    query = '',
    limit = 200
  ): Promise<LocationZone[]> {
    const trimmed = cityId.trim();
    if (!trimmed) return [];
    const q = query.trim();

    const headers = await this.getAuthHeaders();
    const url = `${API_CONFIG.FUNCTIONS_URL}/locations-search?type=zones&city_id=${encodeURIComponent(
      trimmed
    )}&q=${encodeURIComponent(q)}&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as LocationsZonesResponse;
    return payload.zones ?? [];
  }
}

export const locationService = new LocationService();
