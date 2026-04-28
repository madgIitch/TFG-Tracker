import { supabaseClient as supabase } from './authService';
import type { CityOption, CityPlaceOption } from '../types/location';

export const locationService = {
  async searchCities(query: string): Promise<CityOption[]> {
    try {
      const functionPath = query ? `locations/cities?q=${encodeURIComponent(query)}` : 'locations/cities';
      const { data, error } = await supabase.functions.invoke(functionPath, {
        method: 'GET',
      });

      if (error) throw error;
      return data?.data || [];
    } catch (error) {
      console.error('Error in searchCities:', error);
      throw error;
    }
  },

  async getCityPlaces(cityId: string): Promise<CityPlaceOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke(`locations/cities/${cityId}/places`, {
        method: 'GET',
      });

      if (error) throw error;
      return data?.data || [];
    } catch (error) {
      console.error('Error in getCityPlaces:', error);
      throw error;
    }
  }
};
