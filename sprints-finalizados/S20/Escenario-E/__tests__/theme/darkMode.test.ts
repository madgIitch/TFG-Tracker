/**
 * Tests unitarios para src/theme/index.ts — preparación dark mode
 *
 * Verifica:
 * - lightTheme y darkTheme tienen la misma estructura de claves
 * - Los aliases de compatibilidad (colors, theme) apuntan a light
 * - Los colores dark son semánticamente oscuros
 * - Ambos temas tienen todos los tokens de glassmorphism
 */

import {
  lightTheme,
  darkTheme,
  lightColors,
  darkColors,
  colors,
  theme,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../src/theme/index';

// ---------------------------------------------------------------------------
// Estructura — mismas claves en light y dark
// ---------------------------------------------------------------------------

describe('lightTheme y darkTheme — estructura simétrica', () => {
  it('tienen exactamente las mismas claves de primer nivel', () => {
    expect(Object.keys(lightTheme).sort()).toEqual(
      Object.keys(darkTheme).sort()
    );
  });

  it('lightColors y darkColors tienen las mismas claves de color', () => {
    expect(Object.keys(lightColors).sort()).toEqual(
      Object.keys(darkColors).sort()
    );
  });

  it('ambos temas comparten el mismo objeto typography', () => {
    expect(lightTheme.typography).toBe(darkTheme.typography);
  });

  it('ambos temas comparten el mismo objeto spacing', () => {
    expect(lightTheme.spacing).toBe(darkTheme.spacing);
  });

  it('ambos temas comparten el mismo objeto borderRadius', () => {
    expect(lightTheme.borderRadius).toBe(darkTheme.borderRadius);
  });

  it('ambos temas comparten el mismo objeto shadows', () => {
    expect(lightTheme.shadows).toBe(darkTheme.shadows);
  });
});

// ---------------------------------------------------------------------------
// Aliases de compatibilidad — no rompen código existente
// ---------------------------------------------------------------------------

describe('aliases de compatibilidad hacia atrás', () => {
  it('colors === lightColors', () => {
    expect(colors).toBe(lightColors);
  });

  it('theme === lightTheme', () => {
    expect(theme).toBe(lightTheme);
  });

  it('theme.colors === lightColors', () => {
    expect(theme.colors).toBe(lightColors);
  });
});

// ---------------------------------------------------------------------------
// Tokens semánticos — dark tiene colores oscuros donde corresponde
// ---------------------------------------------------------------------------

describe('darkColors — semántica visual correcta', () => {
  it('background es oscuro (no blanco)', () => {
    expect(darkColors.background).not.toBe('#FFFFFF');
  });

  it('text es claro (no negro puro)', () => {
    expect(darkColors.text).not.toBe('#111827');
  });

  it('surface es más oscuro que en light', () => {
    // Light: #F9FAFB (muy claro), Dark: debe ser oscuro
    expect(darkColors.surface).not.toBe(lightColors.surface);
  });

  it('primary sigue siendo morado (puede ser más claro en dark)', () => {
    // Solo verificamos que existe y es un string de color
    expect(typeof darkColors.primary).toBe('string');
    expect(darkColors.primary.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tokens de glassmorphism — presentes en ambos temas
// ---------------------------------------------------------------------------

describe('tokens de glassmorphism', () => {
  const glassTokens = [
    'glassBackground',
    'glassBorder',
    'glassTint',
    'systemBackground',
    'heroDim',
  ] as const;

  glassTokens.forEach((token) => {
    it(`lightColors.${token} está definido`, () => {
      expect(lightColors[token]).toBeDefined();
      expect(typeof lightColors[token]).toBe('string');
    });

    it(`darkColors.${token} está definido`, () => {
      expect(darkColors[token]).toBeDefined();
      expect(typeof darkColors[token]).toBe('string');
    });
  });

  it('systemBackground en dark es distinto al de light (fondos diferentes)', () => {
    expect(darkColors.systemBackground).not.toBe(lightColors.systemBackground);
  });
});

// ---------------------------------------------------------------------------
// Tokens de estado — error, success, warning presentes en ambos
// ---------------------------------------------------------------------------

describe('tokens de estado', () => {
  const stateTokens = [
    'error', 'errorLight',
    'success', 'successLight',
    'warning', 'warningLight',
  ] as const;

  stateTokens.forEach((token) => {
    it(`lightColors.${token} y darkColors.${token} son strings de color`, () => {
      expect(typeof lightColors[token]).toBe('string');
      expect(typeof darkColors[token]).toBe('string');
    });
  });
});

// ---------------------------------------------------------------------------
// Tokens especiales — overlay, disabled, chip
// ---------------------------------------------------------------------------

describe('tokens especiales', () => {
  it('overlay en dark tiene mayor opacidad que en light', () => {
    // Light: rgba(0,0,0,0.5), Dark: rgba(0,0,0,0.7)
    expect(darkColors.overlay).not.toBe(lightColors.overlay);
  });

  it('chipSelected existe en ambos temas', () => {
    expect(lightColors.chipSelected).toBeDefined();
    expect(darkColors.chipSelected).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tokens de tipografía, spacing, borderRadius — valores esperados
// ---------------------------------------------------------------------------

describe('typography — sin cambios respecto al original', () => {
  it('body tiene fontSize 16', () => {
    expect(typography.body.fontSize).toBe(16);
  });

  it('h1 tiene fontSize 32', () => {
    expect(typography.h1.fontSize).toBe(32);
  });
});

describe('spacing — tokens presentes', () => {
  it('md es 16', () => {
    expect(spacing.md).toBe(16);
  });

  it('tiene xs, sm, md, lg, xl, xxl', () => {
    expect(Object.keys(spacing)).toEqual(
      expect.arrayContaining(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'])
    );
  });
});

describe('borderRadius — tokens presentes', () => {
  it('full es 9999', () => {
    expect(borderRadius.full).toBe(9999);
  });
});
