// src/theme/ThemeContext.tsx  
import React, { createContext, useContext, useState, useEffect } from 'react';  
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as defaultFallbackTheme, lightTheme, darkTheme, Theme } from './index';  

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isReady: boolean;
}

const defaultContext: ThemeContextValue = {
  theme: defaultFallbackTheme,
  isDarkMode: false,
  mode: 'system',
  toggleTheme: () => {},
  setThemeMode: () => {},
  isReady: false,
};

const ThemeContext = createContext<ThemeContextValue>(defaultContext);  
  
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('@theme_preference');
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          setModeState(storedMode as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    };
    loadThemePreference();
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    try {
      setModeState(newMode);
      await AsyncStorage.setItem('@theme_preference', newMode);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const isDarkMode = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
  
  const toggleTheme = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // We return early and render nothing until AsyncStorage is read.
  // This prevents the "White flash" completely on startup.
  if (!isReady) {
    return null;
  }

  return (  
    <ThemeContext.Provider value={{ theme: currentTheme, isDarkMode, mode, toggleTheme, setThemeMode, isReady }}>  
      {children}  
    </ThemeContext.Provider>  
  );  
};  
  
export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext debe ser usado dentro de ThemeProvider');
  }
  return context;
};

// Hook for accessing the current resolved theme easily
export const useTheme = (): Theme => {  
  const context = useContext(ThemeContext);  
  if (!context) {  
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');  
  }  
  return context.theme;  
};