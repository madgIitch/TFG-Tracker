// src/services/pushTokenService.ts
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const PUSH_TOKEN_KEY = 'fcmToken';

export const pushTokenService = {
  async requestPermission(): Promise<'granted' | 'denied'> {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    return enabled ? 'granted' : 'denied';
  },

  async registerToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (!token) return;

      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken === token) return;

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/device-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });

      if (response.ok) {
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('[pushTokenService] registerToken error:', error);
    }
  },

  async unregisterToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (!token) return;

      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) return;

      await fetch(`${API_CONFIG.FUNCTIONS_URL}/device-tokens`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('[pushTokenService] unregisterToken error:', error);
    }
  },
};
