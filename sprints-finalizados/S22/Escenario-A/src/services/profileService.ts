import { Profile, ProfileCreateRequest } from '../types/profile';
import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import type { SwipeFilters } from '../types/swipeFilters';

interface ProfileResponse {
  data: Profile;
}

interface ProfileRecommendation {
  profile: Profile;
  compatibility_score: number;
  compatibility_breakdown?: {
    housing_situation: number;
    preferred_zones: number;
    budget_overlap: number;
    interests: number;
    lifestyle: number;
    total: number;
  };
  match_reasons: string[];
}

interface ProfileRecommendationsResponse {
  recommendations: ProfileRecommendation[];
}

class ProfileService {
  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private normalizeCompatibilityScore(rawScore: number): number {
    if (!Number.isFinite(rawScore)) {
      return 0;
    }
    return Math.round(this.clamp(rawScore, 0, 100));
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();

    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
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

  async getProfileRecommendations(
    filters?: SwipeFilters
  ): Promise<ProfileRecommendation[]> {
    let headers = await this.getAuthHeaders();
    const filtersPayload = filters
      ? {
          ...filters,
          city: filters.city,
          roomCount: filters.roomCount,
          userType: filters.userType,
          ageRange: filters.ageRange,
        }
      : undefined;

    const tryFetch = async (url: string) =>
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(filtersPayload ? { filters: filtersPayload } : {}),
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
      compatibility_score: this.normalizeCompatibilityScore(
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
      console.error(
        '[ProfileService.createProfile] Error:',
        error?.error || error
      );
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
    }
    return this.createProfile(profileData);
  }
}

export const profileService = new ProfileService();
