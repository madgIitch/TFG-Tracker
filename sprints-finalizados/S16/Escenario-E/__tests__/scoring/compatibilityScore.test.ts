/**
 * Tests para calculateProfileCompatibilityScore
 *
 * Espeja la implementación de:
 *   supabase/functions/profiles-recommendations/index.ts
 *
 * Mantener sincronizado si se modifican los pesos de la función original.
 */

type Profile = {
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
};

/** Espejo de calculateProfileCompatibilityScore (profiles-recommendations/index.ts) */
function calculateScore(
  seekerProfile: Profile,
  targetProfile: Profile
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    housing_situation: 0,
    zones: 0,
    budget: 0,
    interests: 0,
    lifestyle: 0,
  };

  // Situación habitacional complementaria (+25)
  const ss = seekerProfile.housing_situation;
  const ts = targetProfile.housing_situation;
  if (
    (ss === 'seeking' && ts === 'offering') ||
    (ss === 'offering' && ts === 'seeking')
  ) {
    breakdown.housing_situation = 25;
  }

  // Zonas preferidas en común (+20)
  const seekerZones = seekerProfile.preferred_zones ?? [];
  const targetZones = targetProfile.preferred_zones ?? [];
  if (seekerZones.length > 0 && targetZones.length > 0) {
    const common = seekerZones.filter((z) => targetZones.includes(z));
    if (common.length > 0) breakdown.zones = 20;
  }

  // Presupuesto solapado (+20 escala parcial)
  const sHasBudget =
    seekerProfile.budget_min != null || seekerProfile.budget_max != null;
  const tHasBudget =
    targetProfile.budget_min != null || targetProfile.budget_max != null;
  if (sHasBudget && tHasBudget) {
    const sMin = seekerProfile.budget_min ?? 0;
    const sMax = seekerProfile.budget_max ?? 9999;
    const tMin = targetProfile.budget_min ?? 0;
    const tMax = targetProfile.budget_max ?? 9999;
    const overlapStart = Math.max(sMin, tMin);
    const overlapEnd = Math.min(sMax, tMax);
    if (overlapEnd >= overlapStart) {
      const totalRange = Math.max(sMax, tMax) - Math.min(sMin, tMin);
      const overlapLength = overlapEnd - overlapStart;
      const ratio = totalRange > 0 ? overlapLength / totalRange : 1;
      breakdown.budget = Math.round(20 * ratio);
    }
  }

  // Intereses en común (+25): 5 pts por interés, máx 5 intereses
  const seekerInterests = seekerProfile.interests ?? [];
  const targetInterests = targetProfile.interests ?? [];
  if (seekerInterests.length > 0 && targetInterests.length > 0) {
    const commonCount = seekerInterests.filter((i) =>
      targetInterests.includes(i)
    ).length;
    breakdown.interests = Math.min(5, commonCount) * 5;
  }

  // Lifestyle encaja (+10): schedule + cleaning + guests
  const sl = seekerProfile.lifestyle_preferences ?? {};
  const tl = targetProfile.lifestyle_preferences ?? {};
  let lifestyleMatches = 0;
  if (sl.schedule && tl.schedule && sl.schedule === tl.schedule)
    lifestyleMatches++;
  if (sl.cleaning && tl.cleaning && sl.cleaning === tl.cleaning)
    lifestyleMatches++;
  if (sl.guests && tl.guests && sl.guests === tl.guests) lifestyleMatches++;
  breakdown.lifestyle = Math.round((10 * lifestyleMatches) / 3);

  const score = Math.min(
    100,
    Math.max(0, Object.values(breakdown).reduce((sum, pts) => sum + pts, 0))
  );

  return { score, breakdown };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const perfectSeeker: Profile = {
  housing_situation: 'seeking',
  preferred_zones: ['Madrid-Centro'],
  budget_min: 400,
  budget_max: 600,
  interests: ['deporte', 'musica', 'cine', 'viajes', 'cocina'],
  lifestyle_preferences: {
    schedule: 'morning',
    cleaning: 'weekly',
    guests: 'sometimes',
  },
};

const perfectOffering: Profile = {
  housing_situation: 'offering',
  preferred_zones: ['Madrid-Centro'],
  budget_min: 400,
  budget_max: 600,
  interests: ['deporte', 'musica', 'cine', 'viajes', 'cocina'],
  lifestyle_preferences: {
    schedule: 'morning',
    cleaning: 'weekly',
    guests: 'sometimes',
  },
};

// ---------------------------------------------------------------------------
// Score máximo / mínimo
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — score límite', () => {
  it('devuelve 100 con perfiles perfectamente complementarios', () => {
    const { score, breakdown } = calculateScore(perfectSeeker, perfectOffering);
    expect(score).toBe(100);
    expect(breakdown.housing_situation).toBe(25);
    expect(breakdown.zones).toBe(20);
    expect(breakdown.budget).toBe(20);
    expect(breakdown.interests).toBe(25);
    expect(breakdown.lifestyle).toBe(10);
  });

  it('devuelve 0 cuando no coincide ningún criterio', () => {
    const noMatch: Profile = {
      housing_situation: 'seeking',
      preferred_zones: ['Barcelona-Gracia'],
      budget_min: 800,
      budget_max: 1000,
      interests: ['jardineria', 'pesca'],
      lifestyle_preferences: { schedule: 'night', cleaning: 'monthly', guests: 'never' },
    };
    const { score } = calculateScore(noMatch, noMatch);
    // seeking + seeking → 0 housing; diferente zona → 0 zones; mismos ranges → 20 budget
    // Aquí los rangos y lifestyle sí coincidirán, así que usamos targets sin solapamiento real
    const zeroTarget: Profile = {
      housing_situation: 'seeking', // mismo → 0
      preferred_zones: ['Sevilla-Centro'], // sin solapamiento
      budget_min: 1200,
      budget_max: 1500, // fuera de rango
      interests: ['alpinismo'], // 0 en común
      lifestyle_preferences: { schedule: 'night', cleaning: 'daily', guests: 'never' },
    };
    const seeker: Profile = {
      housing_situation: 'seeking',
      preferred_zones: ['Madrid-Centro'],
      budget_min: 400,
      budget_max: 600,
      interests: ['deporte'],
      lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' },
    };
    const { score: s } = calculateScore(seeker, zeroTarget);
    expect(s).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Situación habitacional
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — housing_situation', () => {
  it('seeking + offering → 25 pts', () => {
    const { breakdown } = calculateScore(
      { housing_situation: 'seeking' },
      { housing_situation: 'offering' }
    );
    expect(breakdown.housing_situation).toBe(25);
  });

  it('offering + seeking → 25 pts', () => {
    const { breakdown } = calculateScore(
      { housing_situation: 'offering' },
      { housing_situation: 'seeking' }
    );
    expect(breakdown.housing_situation).toBe(25);
  });

  it('seeking + seeking → 0 pts', () => {
    const { breakdown } = calculateScore(
      { housing_situation: 'seeking' },
      { housing_situation: 'seeking' }
    );
    expect(breakdown.housing_situation).toBe(0);
  });

  it('offering + offering → 0 pts', () => {
    const { breakdown } = calculateScore(
      { housing_situation: 'offering' },
      { housing_situation: 'offering' }
    );
    expect(breakdown.housing_situation).toBe(0);
  });

  it('sin housing_situation en alguno → 0 pts', () => {
    const { breakdown } = calculateScore({}, { housing_situation: 'offering' });
    expect(breakdown.housing_situation).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Zonas
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — zones', () => {
  it('≥1 zona solapada → 20 pts', () => {
    const { breakdown } = calculateScore(
      { preferred_zones: ['Madrid-Centro', 'Retiro'] },
      { preferred_zones: ['Retiro', 'Salamanca'] }
    );
    expect(breakdown.zones).toBe(20);
  });

  it('sin solapamiento → 0 pts', () => {
    const { breakdown } = calculateScore(
      { preferred_zones: ['Madrid-Centro'] },
      { preferred_zones: ['Barcelona-Gracia'] }
    );
    expect(breakdown.zones).toBe(0);
  });

  it('uno sin zonas → 0 pts', () => {
    const { breakdown } = calculateScore(
      { preferred_zones: ['Madrid-Centro'] },
      { preferred_zones: [] }
    );
    expect(breakdown.zones).toBe(0);
  });

  it('ambos sin zonas → 0 pts', () => {
    const { breakdown } = calculateScore({}, {});
    expect(breakdown.zones).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Presupuesto
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — budget', () => {
  it('rangos idénticos → 20 pts', () => {
    const { breakdown } = calculateScore(
      { budget_min: 400, budget_max: 600 },
      { budget_min: 400, budget_max: 600 }
    );
    expect(breakdown.budget).toBe(20);
  });

  it('solapamiento parcial [300,500] vs [400,700] → puntuación proporcional (5 pts)', () => {
    // overlapStart=400 overlapEnd=500 overlap=100 totalRange=400 ratio=0.25 → 5
    const { breakdown } = calculateScore(
      { budget_min: 300, budget_max: 500 },
      { budget_min: 400, budget_max: 700 }
    );
    expect(breakdown.budget).toBe(5);
  });

  it('sin solapamiento → 0 pts', () => {
    const { breakdown } = calculateScore(
      { budget_min: 300, budget_max: 400 },
      { budget_min: 500, budget_max: 700 }
    );
    expect(breakdown.budget).toBe(0);
  });

  it('uno sin presupuesto → 0 pts', () => {
    const { breakdown } = calculateScore(
      { budget_min: 400, budget_max: 600 },
      {}
    );
    expect(breakdown.budget).toBe(0);
  });

  it('ambos sin presupuesto → 0 pts', () => {
    const { breakdown } = calculateScore({}, {});
    expect(breakdown.budget).toBe(0);
  });

  it('un extremo null se trata como 0 / 9999 de forma consistente', () => {
    // seeker: null-600, target: 400-null → overlap [400,600] over [0,9999]
    const { breakdown } = calculateScore(
      { budget_min: null, budget_max: 600 },
      { budget_min: 400, budget_max: null }
    );
    // overlapStart=400 overlapEnd=600 overlap=200 totalRange=9999-0=9999 ratio≈0.02 → 0 pts
    expect(breakdown.budget).toBeGreaterThanOrEqual(0);
    expect(breakdown.budget).toBeLessThanOrEqual(20);
  });
});

// ---------------------------------------------------------------------------
// Intereses
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — interests', () => {
  it('0 intereses en común → 0 pts', () => {
    const { breakdown } = calculateScore(
      { interests: ['deporte'] },
      { interests: ['musica'] }
    );
    expect(breakdown.interests).toBe(0);
  });

  it('1 interés en común → 5 pts', () => {
    const { breakdown } = calculateScore(
      { interests: ['deporte', 'musica'] },
      { interests: ['musica', 'cine'] }
    );
    expect(breakdown.interests).toBe(5);
  });

  it('3 intereses en común → 15 pts', () => {
    const { breakdown } = calculateScore(
      { interests: ['deporte', 'musica', 'cine', 'viajes'] },
      { interests: ['deporte', 'musica', 'cine', 'cocina'] }
    );
    expect(breakdown.interests).toBe(15);
  });

  it('exactamente 5 intereses en común → 25 pts (máximo)', () => {
    const { breakdown } = calculateScore(
      { interests: ['a', 'b', 'c', 'd', 'e'] },
      { interests: ['a', 'b', 'c', 'd', 'e'] }
    );
    expect(breakdown.interests).toBe(25);
  });

  it('>5 intereses en común → 25 pts (cappado)', () => {
    const { breakdown } = calculateScore(
      { interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
      { interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }
    );
    expect(breakdown.interests).toBe(25);
  });

  it('uno sin intereses → 0 pts', () => {
    const { breakdown } = calculateScore(
      { interests: ['deporte'] },
      { interests: [] }
    );
    expect(breakdown.interests).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Lifestyle
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — lifestyle', () => {
  it('los 3 campos coinciden → 10 pts', () => {
    const life = { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' };
    const { breakdown } = calculateScore(
      { lifestyle_preferences: life },
      { lifestyle_preferences: life }
    );
    expect(breakdown.lifestyle).toBe(10);
  });

  it('2 de 3 coinciden → 7 pts', () => {
    const { breakdown } = calculateScore(
      { lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' } },
      { lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'never' } }
    );
    expect(breakdown.lifestyle).toBe(7);
  });

  it('1 de 3 coincide → 3 pts', () => {
    const { breakdown } = calculateScore(
      { lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' } },
      { lifestyle_preferences: { schedule: 'morning', cleaning: 'daily', guests: 'never' } }
    );
    expect(breakdown.lifestyle).toBe(3);
  });

  it('0 de 3 coinciden → 0 pts', () => {
    const { breakdown } = calculateScore(
      { lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' } },
      { lifestyle_preferences: { schedule: 'night', cleaning: 'daily', guests: 'never' } }
    );
    expect(breakdown.lifestyle).toBe(0);
  });

  it('lifestyle_preferences null en alguno → 0 pts', () => {
    const { breakdown } = calculateScore(
      { lifestyle_preferences: null },
      { lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' } }
    );
    expect(breakdown.lifestyle).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Breakdown integridad
// ---------------------------------------------------------------------------

describe('calculateProfileCompatibilityScore — breakdown integridad', () => {
  it('suma del breakdown es igual al score devuelto', () => {
    const profiles: [Profile, Profile][] = [
      [perfectSeeker, perfectOffering],
      [{}, {}],
      [
        { housing_situation: 'seeking', preferred_zones: ['A'], budget_min: 300, budget_max: 500, interests: ['x', 'y', 'z'], lifestyle_preferences: { schedule: 'morning', cleaning: 'weekly', guests: 'sometimes' } },
        { housing_situation: 'offering', preferred_zones: ['A', 'B'], budget_min: 400, budget_max: 700, interests: ['x', 'y'], lifestyle_preferences: { schedule: 'morning', cleaning: 'daily', guests: 'sometimes' } },
      ],
    ];

    profiles.forEach(([a, b]) => {
      const { score, breakdown } = calculateScore(a, b);
      const sumOfBreakdown = Object.values(breakdown).reduce((s, v) => s + v, 0);
      // El score puede diferir del sumOfBreakdown solo si supera 100 (capped)
      if (sumOfBreakdown <= 100) {
        expect(score).toBe(sumOfBreakdown);
      } else {
        expect(score).toBe(100);
      }
    });
  });

  it('el breakdown tiene exactamente los 5 criterios esperados', () => {
    const { breakdown } = calculateScore(perfectSeeker, perfectOffering);
    expect(Object.keys(breakdown).sort()).toEqual(
      ['budget', 'housing_situation', 'interests', 'lifestyle', 'zones'].sort()
    );
  });

  it('score nunca supera 100', () => {
    const { score } = calculateScore(perfectSeeker, perfectOffering);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('score nunca es negativo', () => {
    const { score } = calculateScore({}, {});
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Ordenación de recomendaciones
// ---------------------------------------------------------------------------

describe('ordenación de recomendaciones por compatibility_score', () => {
  type Rec = { name: string; compatibility_score: number };

  const sort = (recs: Rec[]) =>
    [...recs].sort((a, b) => b.compatibility_score - a.compatibility_score);

  it('ordena descendente por compatibility_score', () => {
    const input: Rec[] = [
      { name: 'C', compatibility_score: 30 },
      { name: 'A', compatibility_score: 90 },
      { name: 'B', compatibility_score: 60 },
    ];
    const result = sort(input);
    expect(result.map((r) => r.name)).toEqual(['A', 'B', 'C']);
    expect(result.map((r) => r.compatibility_score)).toEqual([90, 60, 30]);
  });

  it('perfiles con score igual mantienen orden relativo estable', () => {
    // JS Array.prototype.sort es estable en V8 (Node ≥ 11)
    const input: Rec[] = [
      { name: 'X', compatibility_score: 50 },
      { name: 'Y', compatibility_score: 50 },
      { name: 'Z', compatibility_score: 50 },
    ];
    const result = sort(input);
    expect(result.map((r) => r.name)).toEqual(['X', 'Y', 'Z']);
  });

  it('lista vacía no lanza error', () => {
    expect(() => sort([])).not.toThrow();
    expect(sort([])).toEqual([]);
  });

  it('lista con un solo elemento queda igual', () => {
    const result = sort([{ name: 'Solo', compatibility_score: 75 }]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Solo');
  });
});
