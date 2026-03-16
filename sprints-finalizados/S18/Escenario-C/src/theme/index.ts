// src/theme/index.ts
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../styles/tokens';

export { borderRadius, colors, shadows, spacing, typography };
  
export const theme = {  
  colors,  
  typography,  
  spacing,  
  borderRadius,  
  shadows,  
};  
  
export type Theme = typeof theme;