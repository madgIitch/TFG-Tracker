// src/theme/ThemeContext.tsx  
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { darkTheme, lightTheme, Theme, ThemeMode } from './index';

type ThemeContextValue = {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedTheme = themeMode === 'dark' ? darkTheme : lightTheme;
    return {
      theme: resolvedTheme,
      themeMode,
      setThemeMode,
      toggleTheme,
    };
  }, [themeMode, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context.theme;
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
