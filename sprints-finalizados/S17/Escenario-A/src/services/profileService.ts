// src/services/profileService.ts

import { Profile, ProfileCreateRequest } from '../types/profile';
import { API_CONFIG } from '../config/api';
import { authService } from './authService';

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
  private isDebugEnabled(): boolean {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      return true;
    }
    const runtimeDebugFlag = (globalThis as { DEBUG_AUTH?: string }).DEBUG_AUTH;
    return runtimeDebugFlag === 'true';
  }

  private debugLog(...args: unknown[]): void {
    if (this.isDebugEnabled()) {
      console.log(...args);
    }
  }

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
    this.debugLog('[ProfileService.getAuthHeaders] Token exists:', !!token);

    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getProfile(): Promise<Profile | null> {
    this.debugLog('[ProfileService.getProfile] Fetching profile...');
    let headers = await this.getAuthHeaders();

    let response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
      method: 'GET',
      headers,
    });

    this.debugLog('[ProfileService.getProfile] Initial response:', {
      status: response.status,
      ok: response.ok,
    });
    if (response.status === 401) {
      try {
        const initialErrorBody = await response.clone().json();
        this.debugLog('[ProfileService.getProfile] Initial 401 body:', initialErrorBody);
      } catch {
        const initialErrorText = await response.clone().text();
        this.debugLog('[ProfileService.getProfile] Initial 401 text:', initialErrorText);
      }
    }

    // Si el token expiró (401), intenta refresh
    if (response.status === 401) {
      this.debugLog('[ProfileService.getProfile] 401 received. Attempting token refresh...');
      const newToken = await authService.refreshToken();
      this.debugLog(
        '[ProfileService.getProfile] Refresh result:',
        newToken ? 'success' : 'failed'
      );

      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
          method: 'GET',
          headers,
        });
        this.debugLog('[ProfileService.getProfile] Retried response:', {
          status: response.status,
          ok: response.ok,
        });
        if (response.status === 401) {
          try {
            const retryErrorBody = await response.clone().json();
            this.debugLog('[ProfileService.getProfile] Retry 401 body:', retryErrorBody);
          } catch {
            const retryErrorText = await response.clone().text();
            this.debugLog('[ProfileService.getProfile] Retry 401 text:', retryErrorText);
          }
        }
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        this.debugLog('[ProfileService.getProfile] Perfil no encontrado (404)');
        return null;
      }
      console.error(
        '[ProfileService.getProfile] Error al obtener el perfil:',
        response.status
      );
      throw new Error(`Error al obtener el perfil (${response.status})`);
    }

    const data: ProfileResponse = await response.json();
    this.debugLog('[ProfileService.getProfile] Perfil cargado correctamente');
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
    this.debugLog(
      '[ProfileService.getProfileRecommendations] url:',
      recommendationsUrl
    );

    let response = await tryFetch(recommendationsUrl);
    this.debugLog(
      '[ProfileService.getProfileRecommendations] response:',
      response.status,
      response.ok
    );

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await tryFetch(recommendationsUrl);
        this.debugLog(
          '[ProfileService.getProfileRecommendations] retry:',
          response.status,
          response.ok
        );
      }
    }

    if (!response.ok) {
      try {
        const error = await response.json();
        this.debugLog(
          '[ProfileService.getProfileRecommendations] primary error body:',
          error
        );
      } catch {
        // ignore json parse failures
      }

      if (response.status === 404) {
        this.debugLog(
          '[ProfileService.getProfileRecommendations] not found:',
          recommendationsUrl
        );
      }
    }

    if (!response.ok) {
      let errorDetail = 'Error al obtener recomendaciones';
      try {
        const error = await response.json();
        errorDetail = error?.error || errorDetail;
        this.debugLog(
          '[ProfileService.getProfileRecommendations] final error body:',
          error
        );
      } catch {
        // ignore json parse failures
      }
      throw new Error(errorDetail);
    }

    const data: ProfileRecommendationsResponse = await response.json();
    this.debugLog(
      '[ProfileService.getProfileRecommendations] ok count:',
      data.recommendations?.length ?? 0
    );
    return (data.recommendations ?? []).map((recommendation) => ({
      ...recommendation,
      compatibility_score: this.normalizeCompatibilityScore(
        recommendation.compatibility_score
      ),
    }));
  }

  async createProfile(profileData: ProfileCreateRequest): Promise<Profile> {
    this.debugLog('[ProfileService.createProfile] Creating profile...');
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });

    this.debugLog('[ProfileService.createProfile] Response:', {
      status: response.status,
      ok: response.ok,
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
    this.debugLog('[ProfileService.updateProfile] Updating profile...');
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/profiles`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });

    this.debugLog('[ProfileService.updateProfile] Response:', {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {  
      const error = await response.json();  
      console.error('[ProfileService.updateProfile] Full error:', error);  
      // This will show the validation details array  
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
