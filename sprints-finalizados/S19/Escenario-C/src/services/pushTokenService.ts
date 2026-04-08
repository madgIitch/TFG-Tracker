import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { API_CONFIG } from '../config/api';

type PermissionStatus = 'granted' | 'denied';

const DEVICE_TOKENS_ENDPOINT = `${API_CONFIG.FUNCTIONS_URL}/device-tokens`;
const LAST_PUSH_TOKEN_KEY = 'lastRegisteredPushToken';

class PushTokenService {
  async requestPermission(): Promise<PermissionStatus> {
    if (Platform.OS === 'android') {
      const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
      if (apiLevel >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
      }
      return 'granted';
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled ? 'granted' : 'denied';
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async registerToken(): Promise<string | null> {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    if (!token) return null;

    const lastRegisteredToken = await AsyncStorage.getItem(LAST_PUSH_TOKEN_KEY);
    if (lastRegisteredToken === token) {
      return token;
    }

    const headers = await this.getAuthHeaders();
    const response = await fetch(DEVICE_TOKENS_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      }),
    });

    if (!response.ok) {
      throw new Error('No se pudo registrar el token push');
    }

    await AsyncStorage.setItem(LAST_PUSH_TOKEN_KEY, token);
    return token;
  }

  async unregisterToken(): Promise<void> {
    const token = await messaging().getToken();
    const headers = await this.getAuthHeaders();
    const lastRegisteredToken = await AsyncStorage.getItem(LAST_PUSH_TOKEN_KEY);
    const targetToken = token || lastRegisteredToken;
    if (!targetToken) return;

    await fetch(DEVICE_TOKENS_ENDPOINT, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ token: targetToken }),
    });
    await AsyncStorage.removeItem(LAST_PUSH_TOKEN_KEY);

    try {
      await messaging().deleteToken();
    } catch {
      // ignore
    }
  }
}

export const pushTokenService = new PushTokenService();
export type { PermissionStatus };
