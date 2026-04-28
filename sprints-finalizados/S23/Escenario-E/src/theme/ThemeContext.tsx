// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './index';

const STORAGE_KEY = '@theme';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  colorScheme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setColorScheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // undefined = cargando desde AsyncStorage (anti-flash)
  const [colorScheme, setColorSchemeState] = useState<ColorScheme | undefined>(undefined);
  // Si el usuario ha guardado preferencia propia no seguimos al sistema
  const [hasUserPreference, setHasUserPreference] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setColorSchemeState(stored);
        setHasUserPreference(true);
      } else {
        const system = Appearance.getColorScheme();
        setColorSchemeState(system === 'dark' ? 'dark' : 'light');
      }
    });
  }, []);

  useEffect(() => {
    if (hasUserPreference) return;
    const sub = Appearance.addChangeListener(({ colorScheme: sys }) => {
      setColorSchemeState(sys === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [hasUserPreference]);

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    setHasUserPreference(true);
    await AsyncStorage.setItem(STORAGE_KEY, scheme);
  };

  const toggleTheme = () =>
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');

  // Mientras carga AsyncStorage no montamos nada (evita flash blanco)
  if (colorScheme === undefined) {
    return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
  }

  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, isDark, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook principal — retrocompatible con toda la app
export const useTheme = (): Theme => useContext(ThemeContext).theme;

// Hook para acceder al toggle y isDark
export const useThemeScheme = () => {
  const { colorScheme, isDark, toggleTheme, setColorScheme } = useContext(ThemeContext);
  return { colorScheme, isDark, toggleTheme, setColorScheme };
};
