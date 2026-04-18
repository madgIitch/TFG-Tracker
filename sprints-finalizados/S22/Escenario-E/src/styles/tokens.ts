// src/styles/tokens.ts
// Re-exports all tokens from the theme plus additional color constants
// used across screens that aren't covered by the dynamic theme.
export { colors as themeColors, typography, spacing, borderRadius, shadows } from '../theme/index';

/** Extended static color palette (use themeColors for theme-aware colors). */
export const extraColors = {
  // Neutral surface variants
  surfaceApp: '#F4F5F7',     // Container background in EditProfileScreen
  surfaceSubtle: '#F8FAFC',  // Container background in Flat/Room management screens

  // Info / indigo tones
  infoBg: '#EEF2FF',
  infoText: '#4F46E5',

  // Primary tints used for chips, bubbles, active states
  primaryTint: '#F5F3FF',     // Chip active background
  primaryBubble: '#EDE9FE',   // Chat message bubble (mine)
  primaryMedium: '#C4B5FD',   // Disabled / muted primary
  primaryInlineAction: '#F3E8FF', // Background of inline action buttons

  // Text shades not in base theme
  textEmphasis: '#374151',    // Slightly darker than textSecondary
  textStrong: '#1F2937',      // Strong secondary text

  // iOS system color palette (used in SwipeScreen)
  iosLabel: '#1C1C1E',
  iosBackground: '#F2F2F7',
  iosSecondaryLabel: '#3A3A3C',
  iosTertiaryLabel: '#6C6C70',
  iosGray: '#8E8E93',
} as const;
