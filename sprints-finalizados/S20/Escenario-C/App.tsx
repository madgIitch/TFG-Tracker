/**
 * HomiMatch - App de búsqueda de compañeros de piso
 * @format
 */

// 👇 AÑADE ESTO COMO PRIMER IMPORT (justo después del comentario)
import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ThemeProvider, useTheme, useThemeMode } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { PremiumProvider } from './src/context/PremiumContext';
import { SwipeFiltersProvider } from './src/context/SwipeFiltersContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/config/google';
import messaging from '@react-native-firebase/messaging';
import { activeChatId } from './src/utils/activeChatRef';
import { navigate } from './src/navigation/navigationRef';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// Ejecutar configuración al iniciar
configureGoogleSignIn();

const PushNotificationsManager: React.FC = () => {
  useEffect(() => {
    const initLocalNotifications = async () => {
      if (Platform.OS === 'ios') {
        await notifee.requestPermission();
      }

      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'default',
          name: 'Default',
          importance: AndroidImportance.HIGH,
        });
      }
    };

    initLocalNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent((event: any) => {
      const { type, detail } = event;
      if (type !== EventType.PRESS) return;
      const data = (detail.notification?.data ?? {}) as Record<string, string>;
      const screen = data.screen;
      if (!screen) return;

      const params: any = {};
      Object.keys(data).forEach((key) => {
        if (key === 'screen') return;
        params[key] = data[key];
      });

      if (screen === 'Matches' || screen === 'Expenses') {
        navigate('Main', { screen });
        return;
      }

      navigate(screen, params);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      const data = remoteMessage.data ?? {};
      if (data.screen === 'Chat' && data.chatId && data.chatId === activeChatId) {
        return;
      }

      const title = remoteMessage.notification?.title ?? 'HomiMatch';
      const body = remoteMessage.notification?.body ?? '';

      await notifee.displayNotification({
        title,
        body,
        data: data as Record<string, string>,
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribeOnMessage;
  }, []);

  useEffect(() => {
    const openFromMessage = (remoteMessage: any) => {
      const data = remoteMessage?.data ?? {};
      const screen = data.screen;
      if (!screen) return;

      const params: any = {};
      Object.keys(data).forEach((key) => {
        if (key === 'screen') return;
        params[key] = data[key];
      });

      if (screen === 'Matches' || screen === 'Expenses') {
        navigate('Main', { screen });
        return;
      }

      navigate(screen, params);
    };

    const unsubscribeOpened = messaging().onNotificationOpenedApp(openFromMessage);
    messaging()
      .getInitialNotification()
      .then((initial) => {
        if (initial) openFromMessage(initial);
      });

    return unsubscribeOpened;
  }, []);

  return null;
};

const ThemedAppShell: React.FC = () => {
  const theme = useTheme();
  const { hydrated, isDark } = useThemeMode();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AuthProvider>
        <PushNotificationsManager />
        <PremiumProvider>
          <SwipeFiltersProvider>
            <AppNavigator />
          </SwipeFiltersProvider>
        </PremiumProvider>
      </AuthProvider>
    </>
  );
};

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedAppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
