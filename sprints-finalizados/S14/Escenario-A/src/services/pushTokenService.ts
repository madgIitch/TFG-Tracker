import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { API_CONFIG } from '../config/api';

type PermissionResult = 'granted' | 'denied';
type PlatformType = 'android' | 'ios';

const DEVICE_TOKENS_ENDPOINT = `${API_CONFIG.FUNCTIONS_URL}/device-tokens`;

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getPlatform = (): PlatformType =>
  Platform.OS === 'ios' ? 'ios' : 'android';

class PushTokenService {
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

    const headers = await getAuthHeaders();
    const response = await fetch(DEVICE_TOKENS_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token,
        platform: getPlatform(),
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

      const headers = await getAuthHeaders();
      const response = await fetch(DEVICE_TOKENS_ENDPOINT, {
        method: 'DELETE',
        headers,
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
