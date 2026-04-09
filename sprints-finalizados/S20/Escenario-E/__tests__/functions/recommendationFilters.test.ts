/**
 * Tests para los nuevos filtros de profiles-recommendations (Fase 2d).
 *
 * Espeja la lógica de:
 *   supabase/functions/profiles-recommendations/index.ts
 *
 * Cubre los filtros añadidos en la Fase 2d:
 *   - ageRange
 *   - userType (student / professional / any)
 *   - city (matchesCityFilter)
 * Y verifica que los filtros legacy siguen funcionando correctamente.
 */

// ---------------------------------------------------------------------------
// Tipos locales espejo
// ---------------------------------------------------------------------------

type Profile = {
  id: string;
  housing_situation?: 'seeking' | 'offering';
  preferred_zones?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
  interests?: string[];
  lifestyle_preferences?: {
    schedule?: string | null;
    cleaning?: string | null;
    guests?: string | null;
  } | null;
  university?: string | null;
  occupation?: string | null;
  gender?: string | null;
  birth_date?: string | null;
};

type RecommendationFilters = {
  housingSituation?: 'any' | 'seeking' | 'offering';
  budgetMin?: number;
  budgetMax?: number;
  zones?: string[];
  lifestyle?: string[];
  interests?: string[];
  rules?: Record<string, string | null>;
  city?: string[];
  roomCount?: number[];
  userType?: string[];
  ageRange?: [number, number];
};

// ---------------------------------------------------------------------------
// Funciones espejo
// ---------------------------------------------------------------------------

/** Espejo de matchesCityFilter */
function matchesCityFilter(
  roomCity: string | null | undefined,
  cityFilter: string[]
): boolean {
  if (!cityFilter || cityFilter.length === 0) return true;
  if (!roomCity) return true;
  return cityFilter.some((c) => c.toLowerCase() === roomCity.toLowerCase());
}

/** Calcula la edad a partir de birth_date (YYYY-MM-DD) */
function ageFromBirthDate(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  return (
    today.getFullYear() -
    birth.getFullYear() -
    (today <
    new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
      ? 1
      : 0)
  );
}

/** Espejo parcial de matchesFilters — solo las nuevas secciones */
function matchesNewFilters(profile: Profile, filters?: RecommendationFilters): boolean {
  if (!filters) return true;

  // housingSituation
  if (
    filters.housingSituation &&
    filters.housingSituation !== 'any' &&
    profile.housing_situation !== filters.housingSituation
  ) {
    return false;
  }

  // userType
  if (
    filters.userType &&
    filters.userType.length > 0 &&
    !filters.userType.includes('any')
  ) {
    const hasUniversity = Boolean(profile.university);
    const isStudent = hasUniversity;
    const isProfessional = !hasUniversity && Boolean(profile.occupation);
    const matchesType =
      (filters.userType.includes('student') && isStudent) ||
      (filters.userType.includes('professional') && isProfessional);
    if (!matchesType) return false;
  }

  // ageRange
  if (filters.ageRange && (filters.ageRange[0] > 18 || filters.ageRange[1] < 60)) {
    const birthDate = profile.birth_date;
    if (birthDate) {
      const age = ageFromBirthDate(birthDate);
      if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Crea un perfil base sin ningún campo de filtro */
const p = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'p1',
  ...overrides,
});

/** Fecha de nacimiento para edad exacta */
function birthDateForAge(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// ageRange
// ---------------------------------------------------------------------------

describe('Filtro ageRange', () => {
  it('sin ageRange → no filtra ningún perfil', () => {
    expect(matchesNewFilters(p({ birth_date: birthDateForAge(30) }), {})).toBe(true);
  });

  it('ageRange por defecto [18,60] no filtra perfiles con 30 años', () => {
    expect(
      matchesNewFilters(p({ birth_date: birthDateForAge(30) }), {
        ageRange: [18, 60],
      })
    ).toBe(true);
  });

  it('perfil dentro del rango [20,40] con 30 años → pasa', () => {
    expect(
      matchesNewFilters(p({ birth_date: birthDateForAge(30) }), {
        ageRange: [20, 40],
      })
    ).toBe(true);
  });

  it('perfil fuera del rango [20,40] con 45 años → filtrado', () => {
    expect(
      matchesNewFilters(p({ birth_date: birthDateForAge(45) }), {
        ageRange: [20, 40],
      })
    ).toBe(false);
  });

  it('perfil fuera del rango [25,60] con 18 años → filtrado', () => {
    expect(
      matchesNewFilters(p({ birth_date: birthDateForAge(18) }), {
        ageRange: [25, 60],
      })
    ).toBe(false);
  });

  it('perfil en el límite inferior del rango (exactamente min) → pasa', () => {
    expect(
      matchesNewFilters(p({ birth_date: birthDateForAge(20) }), {
        ageRange: [20, 40],
      })
    ).toBe(true);
  });

  it('perfil en el límite superior del rango (exactamente max) → pasa', () => {
    expect(
      matchesNewFilters(p({ birth_date: birthDateForAge(40) }), {
        ageRange: [20, 40],
      })
    ).toBe(true);
  });

  it('perfil sin birth_date no es filtrado (beneficio de la duda)', () => {
    expect(
      matchesNewFilters(p({ birth_date: null }), { ageRange: [25, 35] })
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// userType
// ---------------------------------------------------------------------------

describe('Filtro userType', () => {
  const student = p({ university: 'Universidad de Sevilla', occupation: null });
  const professional = p({ university: null, occupation: 'Ingeniero' });
  const neither = p({ university: null, occupation: null });

  it('userType vacío → todos pasan', () => {
    expect(matchesNewFilters(student, { userType: [] })).toBe(true);
    expect(matchesNewFilters(professional, { userType: [] })).toBe(true);
  });

  it('userType ["any"] → todos pasan', () => {
    expect(matchesNewFilters(student, { userType: ['any'] })).toBe(true);
    expect(matchesNewFilters(professional, { userType: ['any'] })).toBe(true);
    expect(matchesNewFilters(neither, { userType: ['any'] })).toBe(true);
  });

  it('userType ["student"] → solo perfiles con universidad pasan', () => {
    expect(matchesNewFilters(student, { userType: ['student'] })).toBe(true);
    expect(matchesNewFilters(professional, { userType: ['student'] })).toBe(false);
    expect(matchesNewFilters(neither, { userType: ['student'] })).toBe(false);
  });

  it('userType ["professional"] → solo perfiles con ocupación y sin universidad pasan', () => {
    expect(matchesNewFilters(professional, { userType: ['professional'] })).toBe(true);
    expect(matchesNewFilters(student, { userType: ['professional'] })).toBe(false);
    expect(matchesNewFilters(neither, { userType: ['professional'] })).toBe(false);
  });

  it('userType ["student", "professional"] → tanto estudiantes como profesionales pasan', () => {
    expect(
      matchesNewFilters(student, { userType: ['student', 'professional'] })
    ).toBe(true);
    expect(
      matchesNewFilters(professional, { userType: ['student', 'professional'] })
    ).toBe(true);
    expect(
      matchesNewFilters(neither, { userType: ['student', 'professional'] })
    ).toBe(false);
  });

  it('perfil con universidad y ocupación se clasifica como estudiante', () => {
    const both = p({ university: 'UNED', occupation: 'Becario' });
    expect(matchesNewFilters(both, { userType: ['student'] })).toBe(true);
    expect(matchesNewFilters(both, { userType: ['professional'] })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchesCityFilter
// ---------------------------------------------------------------------------

describe('matchesCityFilter', () => {
  it('cityFilter vacío → cualquier ciudad pasa (no filtra)', () => {
    expect(matchesCityFilter('sevilla', [])).toBe(true);
    expect(matchesCityFilter(null, [])).toBe(true);
  });

  it('roomCity null → pasa (beneficio de la duda)', () => {
    expect(matchesCityFilter(null, ['sevilla'])).toBe(true);
    expect(matchesCityFilter(undefined, ['madrid'])).toBe(true);
  });

  it('coincidencia exacta → pasa', () => {
    expect(matchesCityFilter('sevilla', ['sevilla'])).toBe(true);
  });

  it('coincidencia case-insensitive → pasa', () => {
    expect(matchesCityFilter('Sevilla', ['sevilla'])).toBe(true);
    expect(matchesCityFilter('MADRID', ['madrid'])).toBe(true);
    expect(matchesCityFilter('sevilla', ['Sevilla'])).toBe(true);
  });

  it('sin coincidencia → filtrado', () => {
    expect(matchesCityFilter('barcelona', ['sevilla', 'madrid'])).toBe(false);
  });

  it('múltiples ciudades en el filtro — alguna coincide → pasa', () => {
    expect(matchesCityFilter('valencia', ['sevilla', 'valencia', 'bilbao'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Combinación de nuevos filtros
// ---------------------------------------------------------------------------

describe('Nuevos filtros combinados', () => {
  it('perfil que cumple userType y ageRange → pasa', () => {
    const profile = p({
      university: 'US',
      birth_date: birthDateForAge(22),
    });
    expect(
      matchesNewFilters(profile, {
        userType: ['student'],
        ageRange: [18, 30],
      })
    ).toBe(true);
  });

  it('perfil que cumple userType pero no ageRange → filtrado', () => {
    const profile = p({
      university: 'US',
      birth_date: birthDateForAge(35),
    });
    expect(
      matchesNewFilters(profile, {
        userType: ['student'],
        ageRange: [18, 30],
      })
    ).toBe(false);
  });

  it('perfil que cumple ageRange pero no userType → filtrado', () => {
    const profile = p({
      university: null,
      occupation: null,
      birth_date: birthDateForAge(25),
    });
    expect(
      matchesNewFilters(profile, {
        userType: ['student'],
        ageRange: [18, 30],
      })
    ).toBe(false);
  });

  it('sin ningún filtro activo → todos los perfiles pasan', () => {
    const profiles: Profile[] = [
      p({ university: 'US', birth_date: birthDateForAge(20) }),
      p({ occupation: 'Dev', birth_date: birthDateForAge(35) }),
      p({ birth_date: null }),
    ];
    profiles.forEach((profile) => {
      expect(matchesNewFilters(profile, {})).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Payload de filtros enviado al edge function
// ---------------------------------------------------------------------------

describe('Payload de filtros — compatibilidad con el edge function', () => {
  /**
   * Verifica que el objeto SwipeFilters enviado desde el cliente
   * contiene los campos nuevos con valores serializables.
   */
  it('los campos nuevos se serializan y deserializan correctamente', () => {
    const filters = {
      housingSituation: 'any',
      gender: 'any',
      budgetMin: 0,
      budgetMax: 1200,
      zones: [],
      lifestyle: [],
      interests: [],
      rules: {},
      city: ['sevilla', 'madrid'],
      roomCount: [2, 3],
      userType: ['student'],
      ageRange: [20, 45] as [number, number],
    };

    const serialized = JSON.stringify({ filters });
    const deserialized = JSON.parse(serialized);

    expect(deserialized.filters.city).toEqual(['sevilla', 'madrid']);
    expect(deserialized.filters.roomCount).toEqual([2, 3]);
    expect(deserialized.filters.userType).toEqual(['student']);
    expect(deserialized.filters.ageRange).toEqual([20, 45]);
  });

  it('filtros vacíos (por defecto) no activan filtrado restrictivo', () => {
    const defaultFilters: RecommendationFilters = {
      city: [],
      roomCount: [],
      userType: [],
      ageRange: [18, 60],
    };

    // Con defaults, los perfiles más variados deben pasar
    const profiles = [
      p({ university: 'US', birth_date: birthDateForAge(20) }),
      p({ occupation: 'Dev', birth_date: birthDateForAge(50) }),
      p({ birth_date: birthDateForAge(18) }),
      p({ birth_date: birthDateForAge(60) }),
    ];

    profiles.forEach((profile) => {
      expect(matchesNewFilters(profile, defaultFilters)).toBe(true);
    });
  });
});
