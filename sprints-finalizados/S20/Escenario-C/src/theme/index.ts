// src/theme/index.ts
import {
  borderRadius,
  darkColors,
  lightColors,
  shadows,
  spacing,
  typography,
} from '../styles/tokens';

export { borderRadius, darkColors, lightColors, shadows, spacing, typography };

export type ThemeColors = typeof lightColors;

export type Theme = {
  mode: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
};

export const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export const theme = lightTheme;