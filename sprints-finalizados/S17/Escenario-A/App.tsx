/**
 * HomiMatch - App de búsqueda de compañeros de piso
 * @format
 */

// 👇 AÑADE ESTO COMO PRIMER IMPORT (justo después del comentario)
import 'react-native-url-polyfill/auto';

import React, { useContext, useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { SwipeFiltersProvider } from './src/context/SwipeFiltersContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/config/google';
import { pushTokenService } from './src/services/pushTokenService';
import { activeChatId } from './src/utils/activeChatRef';
import { navigate } from './src/navigation/navigationRef';

// Ejecutar configuración al iniciar
configureGoogleSignIn();

const navigateFromPushData = (data?: Record<string, string>) => {
  const screen = data?.screen;
  if (!screen) return;

  if (screen === 'Chat' && data.chatId) {
    navigate('Chat', {
      chatId: data.chatId,
      name: data.name ?? 'Chat',
      avatarUrl: data.avatarUrl ?? '',
    });
    return;
  }

  if (screen === 'FlatExpenses') {
    navigate('FlatExpenses', {
      flatId: data?.flatId,
      flatAddress: data?.flatAddress,
    });
    return;
  }

  if (screen === 'FlatSettlement') {
    navigate('FlatSettlement', {
      flatId: data?.flatId,
      flatAddress: data?.flatAddress,
    });
    return;
  }

  if (screen === 'Matches') {
    navigate('Main', { screen: 'Matches' });
  }
};

const PushNotificationsManager: React.FC = () => {
  const authContext = useContext(AuthContext);
  const isAuthenticated = !!authContext?.isAuthenticated;

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeOnMessage: (() => void) | undefined;
    let unsubscribeOpenedApp: (() => void) | undefined;
    let unsubscribeNotifeeForeground: (() => void) | undefined;

    const setupMessaging = async () => {
      try {
        await pushTokenService.requestPermission();
        await pushTokenService.registerToken();
      } catch (error) {
        console.error('[push] setup error:', error);
      }

      const channelId =
        Platform.OS === 'android'
          ? await notifee.createChannel({
              id: 'homimatch-default',
              name: 'HomiMatch Notifications',
              importance: AndroidImportance.HIGH,
            })
          : undefined;

      unsubscribeOnMessage = messaging().onMessage(
        async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          const data = (remoteMessage.data ?? {}) as Record<string, string>;
          if (data.screen === 'Chat' && data.chatId && data.chatId === activeChatId) {
            return;
          }

          const title = remoteMessage.notification?.title ?? 'Notificacion';
          const body = remoteMessage.notification?.body ?? 'Tienes una nueva actualizacion.';
          await notifee.displayNotification({
            title,
            body,
            data,
            android: {
              channelId: channelId ?? 'homimatch-default',
              importance: AndroidImportance.HIGH,
              pressAction: { id: 'default' },
            },
          });
        }
      );

      unsubscribeNotifeeForeground = notifee.onForegroundEvent(({ type, detail }) => {
        if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;
        const data = (detail.notification?.data ?? {}) as Record<string, string>;
        navigateFromPushData(data);
      });

      unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
        navigateFromPushData((remoteMessage?.data ?? {}) as Record<string, string>);
      });

      const initialMessage = await messaging().getInitialNotification();
      if (initialMessage?.data) {
        navigateFromPushData(initialMessage.data as Record<string, string>);
      }
    };

    setupMessaging().catch((error) => {
      console.error('[push] setupMessaging error:', error);
    });

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      if (unsubscribeOpenedApp) unsubscribeOpenedApp();
      if (unsubscribeNotifeeForeground) unsubscribeNotifeeForeground();
    };
  }, [isAuthenticated]);

  return null;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ThemeProvider>
        <AuthProvider>
          <PushNotificationsManager />
          <SwipeFiltersProvider>
            <AppNavigator />
          </SwipeFiltersProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
