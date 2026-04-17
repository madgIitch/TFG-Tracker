import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';

class PushTokenService {
  private async getAuthHeaders(): Promise<HeadersInit_> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async fetchWithAuth(input: RequestInfo, init: RequestInit) {
    let headers = await this.getAuthHeaders();
    const tryFetch = () => fetch(input, { ...init, headers });
    let response = await tryFetch();

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await tryFetch();
      }
    }

    return response;
  }

  async requestPermission(): Promise<'granted' | 'denied'> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled ? 'granted' : 'denied';
      } else if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return 'denied';
          }
        }
        return 'granted';
      }
      return 'denied';
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return 'denied';
    }
  }

  async registerToken(): Promise<void> {
    try {
      // We don't use Supabase SDK directly anymore, we expect auth state to exist in AsyncStorage
      const tokenLocal = await AsyncStorage.getItem('authToken');
      if (!tokenLocal) return;

      const perm = await this.requestPermission();
      if (perm !== 'granted') {
        return; // Normal flow, do not log as error
      }

      const fcmToken = await messaging().getToken();

      const response = await this.fetchWithAuth(
        `${API_CONFIG.FUNCTIONS_URL}/device-tokens`,
        {
          method: 'POST',
          body: JSON.stringify({ token: fcmToken, platform: Platform.OS }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error registering device token:', errorText);
      }
    } catch (error) {
      console.error('registerToken error:', error);
    }
  }

  async unregisterToken(): Promise<void> {
    try {
      const tokenLocal = await AsyncStorage.getItem('authToken');
      if (!tokenLocal) return;

      const fcmToken = await messaging().getToken();

      const response = await this.fetchWithAuth(
        `${API_CONFIG.FUNCTIONS_URL}/device-tokens`,
        {
          method: 'DELETE',
          body: JSON.stringify({ token: fcmToken }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error unregistering device token:', errorText);
      }
    } catch (error) {
      console.error('unregisterToken error:', error);
    }
  }
}

export const pushTokenService = new PushTokenService();
