import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { supabaseClient as supabase } from '../services/authService';

export const pushTokenService = {
    async requestPermission() {
        try {
            if (Platform.OS === 'ios') {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                return enabled ? 'granted' : 'denied';
            } else if (Platform.OS === 'android') {
                if (Platform.Version >= 33) {
                    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        return 'denied';
                    }
                }
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

                return enabled ? 'granted' : 'denied';
            }
            return 'denied';
        } catch (error) {
            console.error('Error requesting push permission:', error);
            return 'denied';
        }
    },

    async registerToken() {
        try {
            const authResponse = await supabase.auth.getSession();
            if (!authResponse.data.session) return;

            const perm = await this.requestPermission();
            if (perm !== 'granted') {
                console.log('Push permission not granted');
                return;
            }

            const token = await messaging().getToken();

            const { data, error } = await supabase.functions.invoke('device-tokens', {
                body: { token, platform: Platform.OS },
            });

            if (error) {
                console.error('Error registering device token:', error);
            }
        } catch (error) {
            console.error('registerToken error:', error);
        }
    },

    async unregisterToken() {
        try {
            const authResponse = await supabase.auth.getSession();
            if (!authResponse.data.session) return;

            const token = await messaging().getToken();

            const { data, error } = await supabase.functions.invoke('device-tokens', {
                method: 'DELETE',
                body: { token },
            });

            if (error) {
                console.error('Error unregistering device token:', error);
            }
        } catch (error) {
            console.error('unregisterToken error:', error);
        }
    }
};
