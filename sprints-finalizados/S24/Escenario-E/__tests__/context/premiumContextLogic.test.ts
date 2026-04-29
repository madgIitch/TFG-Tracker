/**
 * Tests unitarios — lógica pura de PremiumContext
 *
 * Copia la lógica de src/context/PremiumContext.tsx para evitar
 * dependencias nativas (misma técnica que countActiveFilters.test.ts).
 *
 * Qué cubre:
 *   - canUseFeature() para usuario free
 *   - canUseFeature() para usuario premium
 *   - El mapa PREMIUM_FEATURES cubre todas las features conocidas
 */

// ---------------------------------------------------------------------------
// Espejo de tipos y lógica de PremiumContext
// ---------------------------------------------------------------------------

type Feature = 'unlimited_swipes' | 'gender_filter' | 'age_filter';

const PREMIUM_FEATURES: Record<Feature, boolean> = {
  unlimited_swipes: true,
  gender_filter: true,
  age_filter: true,
};

/** Espejo de canUseFeature tal como se define en PremiumContext */
const canUseFeature =
  (isPremium: boolean) =>
  (feature: Feature): boolean =>
    isPremium || !PREMIUM_FEATURES[feature];

// ---------------------------------------------------------------------------
// Usuario free
// ---------------------------------------------------------------------------

describe('canUseFeature — usuario free (isPremium=false)', () => {
  const can = canUseFeature(false);

  it('unlimited_swipes → false', () => {
    expect(can('unlimited_swipes')).toBe(false);
  });

  it('gender_filter → false', () => {
    expect(can('gender_filter')).toBe(false);
  });

  it('age_filter → false', () => {
    expect(can('age_filter')).toBe(false);
  });

  it('ninguna feature premium es accesible', () => {
    const features: Feature[] = ['unlimited_swipes', 'gender_filter', 'age_filter'];
    for (const f of features) {
      expect(can(f)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Usuario premium
// ---------------------------------------------------------------------------

describe('canUseFeature — usuario premium (isPremium=true)', () => {
  const can = canUseFeature(true);

  it('unlimited_swipes → true', () => {
    expect(can('unlimited_swipes')).toBe(true);
  });

  it('gender_filter → true', () => {
    expect(can('gender_filter')).toBe(true);
  });

  it('age_filter → true', () => {
    expect(can('age_filter')).toBe(true);
  });

  it('todas las features premium son accesibles', () => {
    const features: Feature[] = ['unlimited_swipes', 'gender_filter', 'age_filter'];
    for (const f of features) {
      expect(can(f)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// PREMIUM_FEATURES — integridad del mapa
// ---------------------------------------------------------------------------

describe('PREMIUM_FEATURES — mapa de features', () => {
  it('unlimited_swipes requiere premium', () => {
    expect(PREMIUM_FEATURES.unlimited_swipes).toBe(true);
  });

  it('gender_filter requiere premium', () => {
    expect(PREMIUM_FEATURES.gender_filter).toBe(true);
  });

  it('age_filter requiere premium', () => {
    expect(PREMIUM_FEATURES.age_filter).toBe(true);
  });

  it('todas las features definidas tienen valor booleano', () => {
    const features: Feature[] = ['unlimited_swipes', 'gender_filter', 'age_filter'];
    for (const f of features) {
      expect(typeof PREMIUM_FEATURES[f]).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------------
// Casos límite
// ---------------------------------------------------------------------------

describe('canUseFeature — transición free → premium', () => {
  it('el mismo usuario pasa de false a true al activarse premium', () => {
    const freeCan = canUseFeature(false);
    const premiumCan = canUseFeature(true);

    expect(freeCan('unlimited_swipes')).toBe(false);
    expect(premiumCan('unlimited_swipes')).toBe(true);
  });
});
