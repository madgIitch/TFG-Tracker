// src/theme/ThemeContext.tsx  
import React, { createContext, useContext, useState } from 'react';  
import { useColorScheme } from 'react-native';
import { theme, Theme } from './index';  

interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  mode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const defaultContext: ThemeContextValue = {
  theme,
  isDarkMode: false,
  mode: 'system',
  setThemeMode: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultContext);  
  
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const systemColorScheme = useColorScheme();
  const [mode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');

  const isDarkMode = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
  
  // NOTE: For the next sprint, we'd uncomment or define darkTheme:
  // const currentTheme = isDarkMode ? darkTheme : theme;
  const currentTheme = theme;

  return (  
    <ThemeContext.Provider value={{ theme: currentTheme, isDarkMode, mode, setThemeMode }}>  
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

// Legacy support for existing components
export const useTheme = (): Theme => {  
  const context = useContext(ThemeContext);  
  if (!context) {  
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');  
  }  
  return context.theme;  
};