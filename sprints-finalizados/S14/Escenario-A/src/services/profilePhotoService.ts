// src/services/profilePhotoService.ts
import { API_CONFIG } from '../config/api';
import type { ProfilePhoto } from '../types/profile';
import { authService } from './authService';

interface ProfilePhotosResponse {
  data: ProfilePhoto[];
}

interface ProfilePhotoResponse {
  data: ProfilePhoto;
}

class ProfilePhotoService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    authService.logTokenDiagnostics('[ProfilePhotoService.getAuthHeaders]', token);
    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async fetchWithAuthRetry(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    let response = await fetch(url, init);

    if (response.status !== 401) {
      return response;
    }

    const newToken = await authService.refreshToken();
    if (!newToken) {
      return response;
    }

    const retryHeaders = await this.getAuthHeaders();
    return fetch(url, {
      ...init,
      headers: retryHeaders,
    });
  }

  async getPhotos(): Promise<ProfilePhoto[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithAuthRetry(`${API_CONFIG.FUNCTIONS_URL}/profile-photos`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        try {
          const errorBody = await response.clone().json();
          console.log('[ProfilePhotoService.getPhotos] 401 body:', errorBody);
        } catch {
          const errorText = await response.clone().text();
          console.log('[ProfilePhotoService.getPhotos] 401 text:', errorText);
        }
      }
      throw new Error(`Error al obtener fotos (${response.status})`);
    }

    const data: ProfilePhotosResponse = await response.json();
    return data.data ?? [];
  }

  async getPhotosForProfile(profileId: string): Promise<ProfilePhoto[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithAuthRetry(
      `${API_CONFIG.FUNCTIONS_URL}/profile-photos-public?profile_id=${profileId}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        try {
          const errorBody = await response.clone().json();
          console.log('[ProfilePhotoService.getPhotosForProfile] 401 body:', errorBody);
        } catch {
          const errorText = await response.clone().text();
          console.log('[ProfilePhotoService.getPhotosForProfile] 401 text:', errorText);
        }
      }
      throw new Error(`Error al obtener fotos (${response.status})`);
    }

    const data: ProfilePhotosResponse = await response.json();
    return data.data ?? [];
  }

  async uploadPhoto(
    uri: string,
    fileName?: string,
    mimeType?: string
  ): Promise<ProfilePhoto> {
    const token = await authService.getAccessToken();
    authService.logTokenDiagnostics('[ProfilePhotoService.uploadPhoto]', token);
    if (!token) {
      throw new Error('No auth token found');
    }

    const name = fileName || `photo-${Date.now()}.jpg`;
    const type = mimeType || 'image/jpeg';

    const formData = new FormData();
    formData.append('photo', {
      uri,
      name,
      type,
    } as any);

    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/profile-photos`,
      {
        method: 'POST',
        headers: {
          apikey: API_CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al subir la foto');
    }

    const data: ProfilePhotoResponse = await response.json();
    return data.data;
  }

  async setPrimary(photoId: string): Promise<ProfilePhoto> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithAuthRetry(`${API_CONFIG.FUNCTIONS_URL}/profile-photos`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: photoId }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al actualizar la foto principal');
    }

    const data: ProfilePhotoResponse = await response.json();
    return data.data;
  }

  async deletePhoto(photoId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await this.fetchWithAuthRetry(`${API_CONFIG.FUNCTIONS_URL}/profile-photos`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id: photoId }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al eliminar la foto');
    }
  }
}

export const profilePhotoService = new ProfilePhotoService();
