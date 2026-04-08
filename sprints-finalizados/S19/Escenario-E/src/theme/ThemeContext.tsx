// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { lightTheme, darkTheme, Theme } from './index';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  colorScheme: 'light',
  toggleTheme: () => {},
  setColorScheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  const toggleTheme = () =>
    setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const theme = colorScheme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook principal — interfaz idéntica a la anterior, sin romper nada
export const useTheme = (): Theme => useContext(ThemeContext).theme;

// Hook nuevo para el futuro toggle de tema
export const useThemeScheme = () => {
  const { colorScheme, toggleTheme, setColorScheme } = useContext(ThemeContext);
  return { colorScheme, toggleTheme, setColorScheme };
};
