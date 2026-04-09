import { colors, spacing, typography, radius } from '../styles/tokens';

export const borderRadius = radius;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

type ThemeColors = Record<keyof typeof colors, string>;

const darkColors: ThemeColors = {
  ...colors,
  background: '#0B1220',
  surface: '#111827',
  surfaceLight: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  border: '#374151',
  borderLight: '#4B5563',
  glassBg: 'rgba(17, 24, 39, 0.44)',
  glassBgStrong: 'rgba(17, 24, 39, 0.62)',
  glassBorder: 'rgba(156, 163, 175, 0.35)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  darkOverlay: 'rgba(0, 0, 0, 0.64)',
};

export const lightTheme = {
  colors: colors as ThemeColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export const darkTheme = {
  ...lightTheme,
  colors: darkColors,
};

export const theme = lightTheme;

export type Theme = {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
};
export type ThemeMode = 'light' | 'dark';
