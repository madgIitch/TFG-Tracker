/**
 * HomiMatch - App de búsqueda de compañeros de piso
 * @format
 */

// 👇 AÑADE ESTO COMO PRIMER IMPORT (justo después del comentario)
import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, Alert } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { SwipeFiltersProvider } from './src/context/SwipeFiltersContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/config/google';
import { navigate } from './src/navigation/navigationRef';
import { activeChatId } from './src/utils/activeChatRef';

// Ejecutar configuración al iniciar
configureGoogleSignIn();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const { data, notification } = remoteMessage;

      // Suprimir notificacion si es del chat activo
      if (data?.screen === 'Chat' && data?.chatId === activeChatId) {
        return;
      }

      if (notification) {
        const channelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
          title: notification.title || 'Nueva notificación',
          body: notification.body,
          data: data,
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
            },
          },
        });
      }
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.screen) {
        const screen = detail.notification.data.screen;
        if (typeof screen === 'string') {
          navigate(screen, detail.notification.data);
        }
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      const screen = remoteMessage?.data?.screen;
      if (typeof screen === 'string') {
        navigate(screen, remoteMessage.data);
      }
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (!remoteMessage) return;
      const screen = remoteMessage.data?.screen;
      if (typeof screen === 'string') {
        setTimeout(() => navigate(screen, remoteMessage.data), 1000);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ThemeProvider>
        <AuthProvider>
          <SwipeFiltersProvider>
            <AppNavigator />
          </SwipeFiltersProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
