import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme, Theme } from './index';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleMode: () => void;
};

const STORAGE_KEY = 'themeMode';

const getSystemMode = (): ThemeMode =>
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

const themeByMode: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(getSystemMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrateTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode === 'light' || savedMode === 'dark') {
          setModeState(savedMode);
        } else {
          setModeState(getSystemMode());
        }
      } catch (error) {
        console.warn('Error loading theme mode:', error);
      } finally {
        setHydrated(true);
      }
    };

    hydrateTheme().catch((error) => {
      console.warn('Error hydrating theme mode:', error);
      setHydrated(true);
    });
  }, []);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch((error) => {
      console.warn('Error saving theme mode:', error);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setThemeMode]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme: themeByMode[mode],
      mode,
      isDark: mode === 'dark',
      hydrated,
      setThemeMode,
      setMode: setThemeMode,
      toggleTheme,
      toggleMode: toggleTheme,
    }),
    [hydrated, mode, setThemeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('Theme hooks must be used within ThemeProvider');
  }
  return context;
};

export const useTheme = (): Theme => useThemeContext().theme;

export const useThemeMode = () => {
  const context = useThemeContext();
  return {
    mode: context.mode,
    isDark: context.isDark,
    hydrated: context.hydrated,
    setMode: context.setMode,
    setThemeMode: context.setThemeMode,
    toggleMode: context.toggleMode,
    toggleTheme: context.toggleTheme,
  };
};