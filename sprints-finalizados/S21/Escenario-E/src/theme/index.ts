// src/theme/index.ts
export const lightColors = {
  // Colores primarios (morado)
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',

  // Colores secundarios
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',

  // Colores neutros
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceLight: '#F3F4F6',

  // Texto
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Bordes
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Estados
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Especiales
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#D1D5DB',
  chipSelected: '#7C3AED',
  chipUnselected: '#F3F4F6',

  // Glassmorphism
  glassBackground: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.50)',
  glassTint: 'rgba(255, 255, 255, 0.10)',
  systemBackground: '#F2F2F7',
  heroDim: 'rgba(0, 0, 0, 0.30)',
  glassHeaderTint: 'rgba(242, 242, 247, 0.55)',
  glassPanel: 'rgba(255, 255, 255, 0.80)',
  separator: 'rgba(0, 0, 0, 0.08)',
};

// Alias de compatibilidad — los estilos existentes que usan colors siguen funcionando
export const colors = lightColors;

export const darkColors = {
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryDark: '#7C3AED',
  secondary: '#22D3EE',
  secondaryLight: '#67E8F9',
  background: '#111827',
  surface: '#1F2937',
  surfaceLight: '#374151',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  border: '#374151',
  borderLight: '#1F2937',
  error: '#F87171',
  errorLight: '#450A0A',
  success: '#34D399',
  successLight: '#052E16',
  warning: '#FCD34D',
  warningLight: '#451A03',
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#4B5563',
  chipSelected: '#A78BFA',
  chipUnselected: '#374151',
  glassBackground: 'rgba(31, 41, 55, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassTint: 'rgba(255, 255, 255, 0.05)',
  systemBackground: '#0F172A',
  heroDim: 'rgba(0, 0, 0, 0.50)',
  glassHeaderTint: 'rgba(15, 23, 42, 0.55)',
  glassPanel: 'rgba(31, 41, 55, 0.80)',
  separator: 'rgba(255, 255, 255, 0.08)',
};  
  
export const typography = {  
  h1: {  
    fontSize: 32,  
    fontWeight: '700' as const,  
    lineHeight: 40,  
    letterSpacing: -0.5,  
  },  
  h2: {  
    fontSize: 28,  
    fontWeight: '700' as const,  
    lineHeight: 36,  
    letterSpacing: -0.3,  
  },  
  h3: {  
    fontSize: 24,  
    fontWeight: '600' as const,  
    lineHeight: 32,  
  },  
  h4: {  
    fontSize: 20,  
    fontWeight: '600' as const,  
    lineHeight: 28,  
  },  
  sectionTitle: {  
    fontSize: 18,  
    fontWeight: '600' as const,  
    lineHeight: 26,  
  },  
  body: {  
    fontSize: 16,  
    fontWeight: '400' as const,  
    lineHeight: 24,  
  },  
  bodyMedium: {  
    fontSize: 16,  
    fontWeight: '500' as const,  
    lineHeight: 24,  
  },  
  bodyBold: {  
    fontSize: 16,  
    fontWeight: '600' as const,  
    lineHeight: 24,  
  },  
  label: {  
    fontSize: 14,  
    fontWeight: '500' as const,  
    lineHeight: 20,  
  },  
  caption: {  
    fontSize: 14,  
    fontWeight: '400' as const,  
    lineHeight: 20,  
  },  
  captionMedium: {  
    fontSize: 14,  
    fontWeight: '500' as const,  
    lineHeight: 20,  
  },  
  small: {  
    fontSize: 12,  
    fontWeight: '400' as const,  
    lineHeight: 16,  
  },  
  smallMedium: {  
    fontSize: 12,  
    fontWeight: '500' as const,  
    lineHeight: 16,  
  },  
};
  
export const spacing = {  
  xs: 4,  
  sm: 8,  
  md: 16,  
  lg: 24,  
  xl: 32,  
  xxl: 48,  
};  
  
export const borderRadius = {  
  sm: 8,  
  md: 12,  
  lg: 16,  
  xl: 24,  
  full: 9999,  
};  
  
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
  
export const lightTheme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export const darkTheme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

// Alias de compatibilidad
export const theme = lightTheme;

export type Theme = typeof lightTheme;