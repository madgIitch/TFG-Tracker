// src/theme/ThemeContext.tsx  
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme, Theme, ThemeMode } from './index';

const THEME_STORAGE_KEY = 'app_theme_mode';

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  isThemeReady: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrateTheme = async () => {
      try {
        const storedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!mounted) return;
        if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
          setThemeModeState(storedThemeMode);
        }
      } catch (error) {
        console.error('[theme] Error loading theme mode:', error);
      } finally {
        if (mounted) {
          setIsThemeReady(true);
        }
      }
    };

    hydrateTheme().catch((error) => {
      console.error('[theme] Error hydrating theme:', error);
      if (mounted) {
        setIsThemeReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
      console.error('[theme] Error saving theme mode:', error);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  }, [setThemeMode, themeMode]);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = themeMode === 'dark';
    const resolvedTheme = isDark ? darkTheme : lightTheme;
    return {
      theme: resolvedTheme,
      isDark,
      isThemeReady,
      themeMode,
      setThemeMode,
      toggleTheme,
    };
  }, [isThemeReady, setThemeMode, themeMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context.theme;
};

export const useThemeState = (): Pick<ThemeContextValue, 'isDark' | 'isThemeReady' | 'toggleTheme'> => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeState debe ser usado dentro de ThemeProvider');
  }
  return {
    isDark: context.isDark,
    isThemeReady: context.isThemeReady,
    toggleTheme: context.toggleTheme,
  };
};

export const useThemeMode = (): Pick<
  ThemeContextValue,
  'themeMode' | 'setThemeMode' | 'toggleTheme'
> => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode debe ser usado dentro de ThemeProvider');
  }
  return {
    themeMode: context.themeMode,
    setThemeMode: context.setThemeMode,
    toggleTheme: context.toggleTheme,
  };
};
