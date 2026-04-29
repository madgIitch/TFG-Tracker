import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { API_CONFIG } from '../config/api';
import { authService } from './authService';

type PermissionResult = 'granted' | 'denied';
type PlatformType = 'android' | 'ios';

const DEVICE_TOKENS_ENDPOINT = `${API_CONFIG.FUNCTIONS_URL}/device-tokens`;

class PushTokenService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async fetchWithAuth(init: RequestInit): Promise<Response> {
    let headers = await this.getAuthHeaders();
    let response = await fetch(DEVICE_TOKENS_ENDPOINT, { ...init, headers });
    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await fetch(DEVICE_TOKENS_ENDPOINT, { ...init, headers });
      }
    }
    return response;
  }

  private getPlatform(): PlatformType {
    return Platform.OS === 'ios' ? 'ios' : 'android';
  }

  async requestPermission(): Promise<PermissionResult> {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    }

    const authStatus = await messaging().requestPermission();
    const isGranted =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return isGranted ? 'granted' : 'denied';
  }

  async registerToken(): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') return;

    const token = await messaging().getToken();
    if (!token) return;

    const response = await this.fetchWithAuth({
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: this.getPlatform(),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`registerToken failed: ${response.status} ${details}`);
    }
  }

  async unregisterToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (!token) return;

      const response = await this.fetchWithAuth({
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`unregisterToken failed: ${response.status} ${details}`);
      }
    } catch (error) {
      console.error('[pushTokenService] unregisterToken error:', error);
    }
  }
}

export const pushTokenService = new PushTokenService();
