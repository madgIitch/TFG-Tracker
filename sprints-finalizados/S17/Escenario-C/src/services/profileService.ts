// src/services/profileService.ts

import { Profile, ProfileCreateRequest } from '../types/profile';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

interface ProfileResponse {
  data: Profile;
}

interface ProfileRecommendation {
  profile: Profile;
  compatibility_score: number;
  compatibility_breakdown?: {
    housing_complementarity: number;
    preferred_zones: number;
    budget_overlap: number;
    shared_interests: number;
    lifestyle_fit: number;
  };
  match_reasons: string[];
}

interface ProfileRecommendationsResponse {
  recommendations: ProfileRecommendation[];
}

const normalizeCompatibilityScore = (rawScore: number) => {
  if (!Number.isFinite(rawScore)) {
    return 0;
  }
  const percentage = rawScore > 1 ? rawScore : rawScore * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
};

class ProfileService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getProfile(): Promise<Profile | null> {
    let headers = await this.getAuthHeaders();

    let response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
      method: 'GET',
      headers,
    });

    // Si el token expiró (401), intenta refresh
    if (response.status === 401) {
      const newToken = await authService.refreshToken();

      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
          method: 'GET',
          headers,
        });
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error al obtener el perfil (${response.status})`);
    }

    const data: ProfileResponse = await response.json();
    return data.data;
  }

  async getProfileRecommendations(filters?: unknown): Promise<ProfileRecommendation[]> {
    let headers = await this.getAuthHeaders();

    const tryFetch = async (url: string) =>
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(filters ? { filters } : {}),
      });

    const recommendationsUrl = `${API_CONFIG.FUNCTIONS_URL}/profiles-recommendations`;
    let response = await tryFetch(recommendationsUrl);

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await tryFetch(recommendationsUrl);
      }
    }

    if (!response.ok) {
      try {
        await response.json();
      } catch {
        // ignore json parse failures
      }

      if (response.status === 404) return [];
    }

    if (!response.ok) {
      let errorDetail = 'Error al obtener recomendaciones';
      try {
        const error = await response.json();
        errorDetail = error?.error || errorDetail;
      } catch {
        // ignore json parse failures
      }
      throw new Error(errorDetail);
    }

    const data: ProfileRecommendationsResponse = await response.json();
    return (data.recommendations ?? []).map((recommendation) => ({
      ...recommendation,
      compatibility_score: normalizeCompatibilityScore(
        recommendation.compatibility_score
      ),
    }));
  }

  async createProfile(profileData: ProfileCreateRequest): Promise<Profile> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el perfil');
    }

    const data: ProfileResponse = await response.json();
    return data.data;
  }

  async updateProfile(updates: Partial<ProfileCreateRequest>): Promise<Profile> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {  
      const error = await response.json();  
      throw new Error(error.error || 'Error al actualizar el perfil');  
    }

    const data: ProfileResponse = await response.json();
    return data.data;
  }

  async createOrUpdateProfile(
    profileData: ProfileCreateRequest
  ): Promise<Profile> {
    const existingProfile = await this.getProfile();

    if (existingProfile) {
      return this.updateProfile(profileData);
    } else {
      return this.createProfile(profileData);
    }
  }
}

export const profileService = new ProfileService();
