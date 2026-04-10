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
  match_reasons: string[];
}

interface ProfileRecommendationsResponse {
  recommendations: ProfileRecommendation[];
}

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
      console.error(
        '[ProfileService.getProfile] Error al obtener el perfil:',
        response.status
      );
      throw new Error(`Error al obtener el perfil (${response.status})`);
    }

    const data: ProfileResponse = await response.json();
    return data.data;
  }

  async getProfileRecommendations(filters?: unknown): Promise<ProfileRecommendation[]> {
    let headers = await this.getAuthHeaders();

    const recommendationsUrl = `${API_CONFIG.FUNCTIONS_URL}/profiles-recommendations`;
    const tryFetch = async (url: string) =>
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(filters ? { filters } : {}),
      });

    let response = await tryFetch(recommendationsUrl);

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await tryFetch(recommendationsUrl);
      }
    }

    if (!response.ok) {
      let errorMessage = 'Error al obtener recomendaciones';
      try {
        const error = await response.json();
        errorMessage = error?.error || errorMessage;
      } catch {
        // ignore json parse failures
      }
      throw new Error(errorMessage);
    }

    const data: ProfileRecommendationsResponse = await response.json();
    return (data.recommendations ?? []).map((rec) => ({
      ...rec,
      compatibility_score: Math.min(100, Math.max(0, rec.compatibility_score)),
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
      console.error('[ProfileService.createProfile] Error:', error?.error || error);
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
      console.error('[ProfileService.updateProfile] Error:', error);
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
