/**
 * Tests para countActiveFilters y DEFAULT_SWIPE_FILTERS
 *
 * Espeja la lógica exportada de:
 *   src/context/SwipeFiltersContext.tsx
 *
 * Se usa la función como copia pura para evitar dependencias nativas.
 */

// ---------------------------------------------------------------------------
// Tipos y constantes espejo
// ---------------------------------------------------------------------------

const DEFAULT_BUDGET_MIN = 0;
const DEFAULT_BUDGET_MAX = 1200;
const DEFAULT_AGE_MIN = 18;
const DEFAULT_AGE_MAX = 60;

type SwipeFilters = {
  housingSituation: 'any' | 'seeking' | 'offering';
  gender: string;
  budgetMin: number;
  budgetMax: number;
  zones: string[];
  lifestyle: string[];
  interests: string[];
  rules?: Record<string, string | null>;
  city: string[];
  roomCount: number[];
  userType: string[];
  ageRange: [number, number];
};

const DEFAULT_SWIPE_FILTERS: SwipeFilters = {
  housingSituation: 'any',
  gender: 'any',
  budgetMin: DEFAULT_BUDGET_MIN,
  budgetMax: DEFAULT_BUDGET_MAX,
  zones: [],
  lifestyle: [],
  interests: [],
  rules: {},
  city: [],
  roomCount: [],
  userType: [],
  ageRange: [DEFAULT_AGE_MIN, DEFAULT_AGE_MAX],
};

/** Espejo de countActiveFilters (SwipeFiltersContext.tsx) */
function countActiveFilters(filters: SwipeFilters): number {
  let count = 0;
  if (filters.housingSituation !== 'any') count++;
  if (filters.gender !== 'any') count++;
  if (
    filters.budgetMin !== DEFAULT_BUDGET_MIN ||
    filters.budgetMax !== DEFAULT_BUDGET_MAX
  )
    count++;
  if (filters.zones.length > 0) count++;
  if (filters.lifestyle.length > 0) count++;
  if (filters.interests.length > 0) count++;
  if (filters.rules && Object.values(filters.rules).some((v) => v != null))
    count++;
  if (filters.city.length > 0) count++;
  if (filters.roomCount.length > 0) count++;
  if (filters.userType.length > 0) count++;
  if (
    filters.ageRange[0] !== DEFAULT_AGE_MIN ||
    filters.ageRange[1] !== DEFAULT_AGE_MAX
  )
    count++;
  return count;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const base = (): SwipeFilters => ({ ...DEFAULT_SWIPE_FILTERS });

// ---------------------------------------------------------------------------
// Default filters → 0 activos
// ---------------------------------------------------------------------------

describe('countActiveFilters — filtros por defecto', () => {
  it('DEFAULT_SWIPE_FILTERS devuelve 0 filtros activos', () => {
    expect(countActiveFilters(DEFAULT_SWIPE_FILTERS)).toBe(0);
  });

  it('DEFAULT_SWIPE_FILTERS tiene los nuevos campos con valores vacíos', () => {
    expect(DEFAULT_SWIPE_FILTERS.city).toEqual([]);
    expect(DEFAULT_SWIPE_FILTERS.roomCount).toEqual([]);
    expect(DEFAULT_SWIPE_FILTERS.userType).toEqual([]);
    expect(DEFAULT_SWIPE_FILTERS.ageRange).toEqual([DEFAULT_AGE_MIN, DEFAULT_AGE_MAX]);
  });
});

// ---------------------------------------------------------------------------
// Campos legacy
// ---------------------------------------------------------------------------

describe('countActiveFilters — campos legacy', () => {
  it('housingSituation "seeking" cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), housingSituation: 'seeking' })).toBe(1);
  });

  it('housingSituation "offering" cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), housingSituation: 'offering' })).toBe(1);
  });

  it('gender distinto de "any" cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), gender: 'male' })).toBe(1);
    expect(countActiveFilters({ ...base(), gender: 'flinta' })).toBe(1);
  });

  it('budgetMin modificado cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), budgetMin: 200 })).toBe(1);
  });

  it('budgetMax modificado cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), budgetMax: 900 })).toBe(1);
  });

  it('ambos budget modificados cuentan como 1 (no como 2)', () => {
    expect(countActiveFilters({ ...base(), budgetMin: 100, budgetMax: 800 })).toBe(1);
  });

  it('zones no vacío cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), zones: ['triana'] })).toBe(1);
  });

  it('lifestyle no vacío cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), lifestyle: ['schedule_flexible'] })).toBe(1);
  });

  it('interests no vacío cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), interests: ['deportes'] })).toBe(1);
  });

  it('rules con valor no-null cuenta como 1', () => {
    expect(
      countActiveFilters({ ...base(), rules: { ruido: 'ruido_22_08' } })
    ).toBe(1);
  });

  it('rules con todos los valores null no cuenta', () => {
    expect(
      countActiveFilters({ ...base(), rules: { ruido: null, visitas: null } })
    ).toBe(0);
  });

  it('rules undefined no cuenta', () => {
    const f = { ...base() };
    delete f.rules;
    expect(countActiveFilters(f)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Nuevos campos (Fase 2a)
// ---------------------------------------------------------------------------

describe('countActiveFilters — nuevos campos', () => {
  it('city no vacío cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), city: ['sevilla'] })).toBe(1);
  });

  it('city vacío no cuenta', () => {
    expect(countActiveFilters({ ...base(), city: [] })).toBe(0);
  });

  it('roomCount no vacío cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), roomCount: [2, 3] })).toBe(1);
  });

  it('roomCount vacío no cuenta', () => {
    expect(countActiveFilters({ ...base(), roomCount: [] })).toBe(0);
  });

  it('userType no vacío cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), userType: ['student'] })).toBe(1);
  });

  it('userType vacío no cuenta', () => {
    expect(countActiveFilters({ ...base(), userType: [] })).toBe(0);
  });

  it('ageRange con min distinto cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), ageRange: [22, DEFAULT_AGE_MAX] })).toBe(1);
  });

  it('ageRange con max distinto cuenta como 1', () => {
    expect(countActiveFilters({ ...base(), ageRange: [DEFAULT_AGE_MIN, 45] })).toBe(1);
  });

  it('ageRange por defecto no cuenta', () => {
    expect(
      countActiveFilters({ ...base(), ageRange: [DEFAULT_AGE_MIN, DEFAULT_AGE_MAX] })
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Combinaciones y totales
// ---------------------------------------------------------------------------

describe('countActiveFilters — combinaciones', () => {
  it('todos los campos activos cuentan individualmente', () => {
    const full: SwipeFilters = {
      housingSituation: 'seeking',        // +1
      gender: 'flinta',                   // +1
      budgetMin: 200,                     // +1 (junto con budgetMax)
      budgetMax: 800,
      zones: ['triana'],                  // +1
      lifestyle: ['schedule_flexible'],   // +1
      interests: ['deportes'],            // +1
      rules: { ruido: 'ruido_22_08' },    // +1
      city: ['sevilla'],                  // +1
      roomCount: [2],                     // +1
      userType: ['student'],              // +1
      ageRange: [20, 50],                 // +1
    };
    expect(countActiveFilters(full)).toBe(11);
  });

  it('mezcla de activos e inactivos suma correctamente', () => {
    const partial: SwipeFilters = {
      ...base(),
      housingSituation: 'offering',       // +1
      city: ['madrid', 'barcelona'],      // +1
      ageRange: [25, 55],                 // +1
    };
    expect(countActiveFilters(partial)).toBe(3);
  });

  it('activar solo nuevos campos sin tocar los legacy', () => {
    const onlyNew: SwipeFilters = {
      ...base(),
      city: ['sevilla'],
      roomCount: [1, 2],
      userType: ['professional'],
      ageRange: [21, DEFAULT_AGE_MAX],
    };
    expect(countActiveFilters(onlyNew)).toBe(4);
  });
});
