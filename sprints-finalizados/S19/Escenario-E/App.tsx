/**
 * HomiMatch - App de búsqueda de compañeros de piso
 * @format
 */

import 'react-native-url-polyfill/auto';

import React, { useContext, useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { SwipeFiltersProvider } from './src/context/SwipeFiltersContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/config/google';
import { pushTokenService } from './src/services/pushTokenService';
import { activeChatId } from './src/utils/activeChatRef';
import { navigate } from './src/navigation/navigationRef';

// Ejecutar configuración al iniciar
configureGoogleSignIn();

// Canal de notificaciones Android (se crea una sola vez)
const CHANNEL_ID = 'homimatch-default';

async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'HomiMatch',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

async function displayNotification(
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: CHANNEL_ID,
      pressAction: { id: 'default' },
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_launcher',
    },
  });
}

// Handler de mensajes en background — usa notifee para mostrar la notificación
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const data = (remoteMessage.data ?? {}) as Record<string, string>;
  const title = remoteMessage.notification?.title ?? 'HomiMatch';
  const body = remoteMessage.notification?.body ?? '';
  await createNotificationChannel();
  await displayNotification(title, body, data);
});

// Tap en notificación desde notifee (foreground y background)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { PressType } = await import('@notifee/react-native');
  if (type === PressType?.PRESS || type === 1 /* PRESS */) {
    const data = (detail.notification?.data ?? {}) as Record<string, string>;
    if (data.screen) {
      navigate(data.screen, data);
    }
  }
});

function PushNotificationHandler() {
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated ?? false;

  // Crear canal y registrar token al autenticarse
  useEffect(() => {
    createNotificationChannel();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    pushTokenService.requestPermission().then((status) => {
      if (status === 'granted') {
        pushTokenService.registerToken();
      }
    });
  }, [isAuthenticated]);

  // Notificaciones en foreground — mostrar notificación real con notifee
  useEffect(() => {
    const unsubscribeFCM = messaging().onMessage(async (remoteMessage) => {
      const data = (remoteMessage.data ?? {}) as Record<string, string>;

      // Suprimir si el usuario ya está en ese chat
      if (data.screen === 'Chat' && data.chatId === activeChatId) {
        return;
      }

      const title = remoteMessage.notification?.title ?? 'HomiMatch';
      const body = remoteMessage.notification?.body ?? '';
      await displayNotification(title, body, data);
    });
    return unsubscribeFCM;
  }, []);

  // Tap en notificación de notifee en foreground
  useEffect(() => {
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === 1 /* EventType.PRESS */) {
        const data = (detail.notification?.data ?? {}) as Record<string, string>;
        if (data.screen) {
          navigate(data.screen, data);
        }
      }
    });
    return unsubscribeNotifee;
  }, []);

  // Tap en notificación FCM con app en background (sin notifee)
  useEffect(() => {
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      const data = (remoteMessage.data ?? {}) as Record<string, string>;
      if (data.screen) {
        navigate(data.screen, data);
      }
    });
    return unsubscribe;
  }, []);

  // Tap en notificación con app cerrada (quit state)
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (!remoteMessage?.data?.screen) return;
        const data = remoteMessage.data as Record<string, string>;
        setTimeout(() => navigate(data.screen, data), 500);
      });
  }, []);

  return null;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ThemeProvider>
        <AuthProvider>
          <PremiumProvider>
            <SwipeFiltersProvider>
              <PushNotificationHandler />
              <AppNavigator />
            </SwipeFiltersProvider>
          </PremiumProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
