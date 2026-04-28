/**
 * Tests para la migración defensiva de AsyncStorage en SwipeFiltersContext.
 *
 * Verifica que datos guardados con versiones antiguas del tipo SwipeFilters
 * (sin los campos nuevos: city, roomCount, userType, ageRange) se mezclan
 * correctamente con los defaults al cargar, sin crash ni valores undefined.
 *
 * Espeja la lógica de:
 *   src/context/SwipeFiltersContext.tsx  →  { ...DEFAULT_SWIPE_FILTERS, ...parsed }
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

/** Espejo del merge defensivo al cargar de AsyncStorage */
function mergeWithDefaults(stored: Partial<SwipeFilters>): SwipeFilters {
  return { ...DEFAULT_SWIPE_FILTERS, ...stored };
}

// ---------------------------------------------------------------------------
// Helpers: datos almacenados en versiones anteriores
// ---------------------------------------------------------------------------

/** Datos de versión pre-Fase2a (sin city, roomCount, userType, ageRange) */
const legacyFiltersV1: Partial<SwipeFilters> = {
  housingSituation: 'seeking',
  gender: 'any',
  budgetMin: 300,
  budgetMax: 900,
  zones: ['triana', 'macarena'],
  lifestyle: ['schedule_flexible'],
  interests: ['deportes', 'musica'],
  rules: { ruido: 'ruido_22_08' },
  // city, roomCount, userType, ageRange ausentes (versión antigua)
};

/** Datos completamente vacíos (primer uso sin nada guardado) */
const emptyStored: Partial<SwipeFilters> = {};

// ---------------------------------------------------------------------------
// Tests: campos nuevos se rellenan con defaults
// ---------------------------------------------------------------------------

describe('SwipeFiltersContext — merge defensivo', () => {
  it('datos legacy sin city → city se rellena con [] por defecto', () => {
    const result = mergeWithDefaults(legacyFiltersV1);
    expect(result.city).toEqual([]);
  });

  it('datos legacy sin roomCount → roomCount se rellena con [] por defecto', () => {
    const result = mergeWithDefaults(legacyFiltersV1);
    expect(result.roomCount).toEqual([]);
  });

  it('datos legacy sin userType → userType se rellena con [] por defecto', () => {
    const result = mergeWithDefaults(legacyFiltersV1);
    expect(result.userType).toEqual([]);
  });

  it('datos legacy sin ageRange → ageRange se rellena con [18,60] por defecto', () => {
    const result = mergeWithDefaults(legacyFiltersV1);
    expect(result.ageRange).toEqual([DEFAULT_AGE_MIN, DEFAULT_AGE_MAX]);
  });

  it('datos legacy preservan campos originales sin sobreescribirlos', () => {
    const result = mergeWithDefaults(legacyFiltersV1);
    expect(result.housingSituation).toBe('seeking');
    expect(result.budgetMin).toBe(300);
    expect(result.budgetMax).toBe(900);
    expect(result.zones).toEqual(['triana', 'macarena']);
    expect(result.lifestyle).toEqual(['schedule_flexible']);
    expect(result.interests).toEqual(['deportes', 'musica']);
    expect(result.rules).toEqual({ ruido: 'ruido_22_08' });
  });

  it('stored vacío → resultado es idéntico a DEFAULT_SWIPE_FILTERS', () => {
    const result = mergeWithDefaults(emptyStored);
    expect(result).toEqual(DEFAULT_SWIPE_FILTERS);
  });

  it('ningún campo del resultado es undefined', () => {
    const result = mergeWithDefaults(legacyFiltersV1);
    const undefinedFields = Object.entries(result)
      .filter(([, v]) => v === undefined)
      .map(([k]) => k);
    expect(undefinedFields).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: datos nuevos se preservan correctamente
// ---------------------------------------------------------------------------

describe('SwipeFiltersContext — campos nuevos en datos guardados', () => {
  it('city guardada se preserva sobre el default vacío', () => {
    const stored: Partial<SwipeFilters> = { city: ['madrid', 'barcelona'] };
    const result = mergeWithDefaults(stored);
    expect(result.city).toEqual(['madrid', 'barcelona']);
  });

  it('roomCount guardado se preserva', () => {
    const stored: Partial<SwipeFilters> = { roomCount: [1, 2, 3] };
    const result = mergeWithDefaults(stored);
    expect(result.roomCount).toEqual([1, 2, 3]);
  });

  it('userType guardado se preserva', () => {
    const stored: Partial<SwipeFilters> = { userType: ['student'] };
    const result = mergeWithDefaults(stored);
    expect(result.userType).toEqual(['student']);
  });

  it('ageRange guardado se preserva', () => {
    const stored: Partial<SwipeFilters> = { ageRange: [22, 45] };
    const result = mergeWithDefaults(stored);
    expect(result.ageRange).toEqual([22, 45]);
  });

  it('mix de campos nuevos y legacy guardados correctamente', () => {
    const stored: Partial<SwipeFilters> = {
      housingSituation: 'offering',
      city: ['sevilla'],
      ageRange: [25, 50],
    };
    const result = mergeWithDefaults(stored);
    expect(result.housingSituation).toBe('offering');
    expect(result.city).toEqual(['sevilla']);
    expect(result.ageRange).toEqual([25, 50]);
    // Campos no presentes → default
    expect(result.roomCount).toEqual([]);
    expect(result.userType).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: resetFilters devuelve exactamente DEFAULT_SWIPE_FILTERS
// ---------------------------------------------------------------------------

describe('DEFAULT_SWIPE_FILTERS — estructura completa', () => {
  const requiredKeys: (keyof SwipeFilters)[] = [
    'housingSituation',
    'gender',
    'budgetMin',
    'budgetMax',
    'zones',
    'lifestyle',
    'interests',
    'rules',
    'city',
    'roomCount',
    'userType',
    'ageRange',
  ];

  it('contiene todas las claves requeridas', () => {
    requiredKeys.forEach((key) => {
      expect(DEFAULT_SWIPE_FILTERS).toHaveProperty(key);
    });
  });

  it('housingSituation por defecto es "any"', () => {
    expect(DEFAULT_SWIPE_FILTERS.housingSituation).toBe('any');
  });

  it('gender por defecto es "any"', () => {
    expect(DEFAULT_SWIPE_FILTERS.gender).toBe('any');
  });

  it('budgetMin/Max por defecto son 0 y 1200', () => {
    expect(DEFAULT_SWIPE_FILTERS.budgetMin).toBe(0);
    expect(DEFAULT_SWIPE_FILTERS.budgetMax).toBe(1200);
  });

  it('ageRange por defecto es [18, 60]', () => {
    expect(DEFAULT_SWIPE_FILTERS.ageRange).toEqual([18, 60]);
  });

  it('arrays nuevos por defecto están vacíos', () => {
    expect(DEFAULT_SWIPE_FILTERS.city).toEqual([]);
    expect(DEFAULT_SWIPE_FILTERS.roomCount).toEqual([]);
    expect(DEFAULT_SWIPE_FILTERS.userType).toEqual([]);
  });
});
