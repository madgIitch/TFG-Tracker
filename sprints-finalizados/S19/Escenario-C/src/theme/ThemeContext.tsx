// src/theme/ThemeContext.tsx  
import React, { createContext, useContext, useMemo, useState } from 'react';  
import { theme as lightTheme, Theme } from './index';  
  
export type ThemeMode = 'light' | 'dark';  
  
type ThemeContextValue = {  
  theme: Theme;  
  mode: ThemeMode;  
  setMode: (mode: ThemeMode) => void;  
  toggleMode: () => void;  
};  
  
const darkTheme: Theme = {  
  ...lightTheme,  
};  
  
const themeByMode: Record<ThemeMode, Theme> = {  
  light: lightTheme,  
  dark: darkTheme,  
};  
  
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);  
  
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const [mode, setMode] = useState<ThemeMode>('light');  
  
  const contextValue = useMemo<ThemeContextValue>(  
    () => ({  
      theme: themeByMode[mode],  
      mode,  
      setMode,  
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),  
    }),  
    [mode]  
  );  
  
  return (  
    <ThemeContext.Provider value={contextValue}>  
      {children}  
    </ThemeContext.Provider>  
  );  
};  
  
export const useTheme = (): Theme => {  
  const context = useContext(ThemeContext);  
  if (!context) {  
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');  
  }  
  return context.theme;  
};  
  
export const useThemeMode = () => {  
  const context = useContext(ThemeContext);  
  if (!context) {  
    throw new Error('useThemeMode debe ser usado dentro de ThemeProvider');  
  }  
  return {  
    mode: context.mode,  
    setMode: context.setMode,  
    toggleMode: context.toggleMode,  
  };  
};