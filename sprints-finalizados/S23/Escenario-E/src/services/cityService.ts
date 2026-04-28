// src/services/cityService.ts
import { API_CONFIG } from '../config/api';

const BASE_URL = `${API_CONFIG.FUNCTIONS_URL}/cities`;

async function authHeaders(): Promise<Record<string, string>> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-native-async-storage/async-storage');
  const AsyncStorage = (mod.default ?? mod) as { getItem: (key: string) => Promise<string | null> };
  const token = await AsyncStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface City {
  id: string;
  name: string;
}

export interface CityPlace {
  id: string;
  city_id: string;
  name: string;
}

export const cityService = {
  async searchCities(q: string): Promise<City[]> {
    const url = `${BASE_URL}?q=${encodeURIComponent(q)}&limit=12`;
    const res = await fetch(url, { headers: await authHeaders() });
    if (!res.ok) throw new Error('Error buscando ciudades');
    const data = await res.json();
    return (data.cities ?? []) as City[];
  },

  async getCityPlaces(cityId: string, q?: string): Promise<CityPlace[]> {
    let url = `${BASE_URL}?city_id=${encodeURIComponent(cityId)}&limit=40`;
    if (q && q.trim()) {
      url += `&q=${encodeURIComponent(q.trim())}`;
    }
    const res = await fetch(url, { headers: await authHeaders() });
    if (!res.ok) throw new Error('Error buscando zonas');
    const data = await res.json();
    return (data.places ?? []) as CityPlace[];
  },
};
