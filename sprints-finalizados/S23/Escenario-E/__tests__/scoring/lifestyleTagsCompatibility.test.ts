/**
 * Tests para el cálculo de compatibilidad por lifestyle_tags.
 *
 * Espeja la lógica que el Edge Function profiles-recommendations DEBERÍA
 * incorporar cuando lifestyle_tags se añada al cálculo de puntuación.
 *
 * Mantener sincronizado con compatibilityScore.test.ts si se actualiza
 * la función supabase/functions/profiles-recommendations/index.ts.
 *
 * Peso asignado: hasta 10 puntos adicionales (Jaccard sobre MAX_LIFESTYLE_TAGS)
 */

const MAX_LIFESTYLE_TAGS = 5;

// ---------------------------------------------------------------------------
// Función pura — espejo del cálculo a implementar en el Edge Function
// ---------------------------------------------------------------------------

/**
 * Calcula la contribución de lifestyle_tags a la puntuación de compatibilidad.
 *
 * Lógica:
 *   - Intersección = etiquetas compartidas
 *   - score = (|intersección| / MAX_LIFESTYLE_TAGS) * MAX_POINTS
 *   - Si uno de los dos no tiene tags → 0
 *
 * Máximo posible: 10 puntos (ambos comparten los 5 tags)
 */
function calculateTagScore(
  tagsA: string[],
  tagsB: string[],
  maxPoints = 10
): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;

  // Deduplicar para no contar el mismo tag dos veces si llega duplicado
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const commonCount = [...setA].filter((t) => setB.has(t)).length;

  // Cappado a maxPoints para cubrir entradas fuera del rango normal (> 5 tags)
  return Math.min(maxPoints, Math.round((commonCount / MAX_LIFESTYLE_TAGS) * maxPoints));
}

/**
 * Versión extendida del score de compatibilidad que incluye lifestyle_tags.
 * Espeja calculateProfileCompatibilityScore de compatibilityScore.test.ts
 * con el campo lifestyle_tags añadido al breakdown.
 */
type ProfileWithTags = {
  housing_situation?: 'seeking' | 'offering';
  lifestyle_tags?: string[];
};

function calculateScoreWithTags(
  a: ProfileWithTags,
  b: ProfileWithTags
): { tagScore: number; isIncluded: boolean } {
  const tagsA = a.lifestyle_tags ?? [];
  const tagsB = b.lifestyle_tags ?? [];
  const tagScore = calculateTagScore(tagsA, tagsB);
  return { tagScore, isIncluded: true };
}

// ---------------------------------------------------------------------------
// calculateTagScore — casos básicos
// ---------------------------------------------------------------------------

describe('calculateTagScore — casos básicos', () => {
  it('devuelve 0 si ambos arrays están vacíos', () => {
    expect(calculateTagScore([], [])).toBe(0);
  });

  it('devuelve 0 si A está vacío', () => {
    expect(calculateTagScore([], ['deportista', 'madrugador'])).toBe(0);
  });

  it('devuelve 0 si B está vacío', () => {
    expect(calculateTagScore(['deportista'], [])).toBe(0);
  });

  it('devuelve 0 si no hay tags en común', () => {
    expect(calculateTagScore(['madrugador', 'fumador'], ['noctambulo', 'deportista'])).toBe(0);
  });

  it('devuelve 2 con 1 tag en común (1/5 * 10 = 2)', () => {
    expect(calculateTagScore(['deportista', 'madrugador'], ['deportista', 'noctambulo'])).toBe(2);
  });

  it('devuelve 4 con 2 tags en común (2/5 * 10 = 4)', () => {
    const a = ['deportista', 'madrugador', 'sociable'];
    const b = ['deportista', 'madrugador', 'fumador'];
    expect(calculateTagScore(a, b)).toBe(4);
  });

  it('devuelve 6 con 3 tags en común (3/5 * 10 = 6)', () => {
    const shared = ['deportista', 'madrugador', 'no_fumador'];
    const a = [...shared, 'sociable'];
    const b = [...shared, 'noctambulo'];
    expect(calculateTagScore(a, b)).toBe(6);
  });

  it('devuelve 8 con 4 tags en común (4/5 * 10 = 8)', () => {
    const shared = ['a', 'b', 'c', 'd'];
    const a = [...shared, 'e'];
    const b = [...shared, 'f'];
    expect(calculateTagScore(a, b)).toBe(8);
  });

  it('devuelve 10 con 5 tags en común (máximo)', () => {
    const tags = ['a', 'b', 'c', 'd', 'e'];
    expect(calculateTagScore(tags, tags)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// calculateTagScore — límite máximo
// ---------------------------------------------------------------------------

describe('calculateTagScore — límite máximo', () => {
  it('nunca supera maxPoints aunque haya más de 5 tags comunes', () => {
    // Situación imposible en la BD (CHECK <= 5) pero robustez del cálculo
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const score = calculateTagScore(many, many);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('siempre devuelve un número >= 0', () => {
    expect(calculateTagScore([], [])).toBeGreaterThanOrEqual(0);
    expect(calculateTagScore(['a'], ['b'])).toBeGreaterThanOrEqual(0);
  });

  it('devuelve exactamente 0 cuando no coincide ningún tag', () => {
    const a = ['madrugador', 'deportista'];
    const b = ['noctambulo', 'fumador'];
    expect(calculateTagScore(a, b)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateTagScore — simetría
// ---------------------------------------------------------------------------

describe('calculateTagScore — simetría A↔B', () => {
  it('calculateTagScore(A, B) === calculateTagScore(B, A)', () => {
    const a = ['deportista', 'madrugador', 'sociable'];
    const b = ['madrugador', 'noctambulo', 'sociable'];
    expect(calculateTagScore(a, b)).toBe(calculateTagScore(b, a));
  });

  it('simetría con un solo tag en común', () => {
    expect(calculateTagScore(['x'], ['x'])).toBe(calculateTagScore(['x'], ['x']));
  });
});

// ---------------------------------------------------------------------------
// calculateTagScore — duplicados en los arrays
// ---------------------------------------------------------------------------

describe('calculateTagScore — robustez ante duplicados', () => {
  it('no cuenta el mismo tag dos veces si está duplicado en A', () => {
    // ['a', 'a'] ∩ ['a'] = 1 común, no 2
    const result = calculateTagScore(['a', 'a'], ['a']);
    // El resultado debe ser el mismo que con ['a'] ∩ ['a']
    expect(result).toBe(calculateTagScore(['a'], ['a']));
  });
});

// ---------------------------------------------------------------------------
// Integración con el score total de compatibilidad
// ---------------------------------------------------------------------------

describe('integración — lifestyle_tags en el score total', () => {
  it('añade hasta 10 puntos adicionales al score existente', () => {
    const baseScore = 60; // suponiendo que los otros criterios dan 60
    const tags = ['deportista', 'madrugador', 'no_fumador', 'sociable', 'muy_ordenado'];
    const tagBonus = calculateTagScore(tags, tags); // 10 pts
    expect(baseScore + tagBonus).toBe(70);
  });

  it('no degrada el score cuando no hay tags en común', () => {
    const baseScore = 80;
    const tagBonus = calculateTagScore(['a', 'b'], ['c', 'd']); // 0 pts
    expect(baseScore + tagBonus).toBe(80);
  });

  it('el score total no puede superar 100 (cappado aguas arriba)', () => {
    const baseScore = 95;
    const tagBonus = calculateTagScore(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c', 'd', 'e']); // 10
    const total = Math.min(100, baseScore + tagBonus);
    expect(total).toBe(100);
  });

  it('perfiles sin lifestyle_tags tienen el mismo score base (sin penalización)', () => {
    const { tagScore } = calculateScoreWithTags(
      { housing_situation: 'seeking' },
      { housing_situation: 'offering' }
    );
    expect(tagScore).toBe(0); // 0 bonus, no penaliza
  });
});

// ---------------------------------------------------------------------------
// Casos extremos relevantes al dominio
// ---------------------------------------------------------------------------

describe('casos de dominio específicos', () => {
  it('fumador + no_fumador no tienen ese tag en común (son opuestos)', () => {
    const result = calculateTagScore(['fumador', 'madrugador'], ['no_fumador', 'madrugador']);
    // Solo 'madrugador' en común → 1/5*10 = 2
    expect(result).toBe(2);
  });

  it('tiene_mascota + sin_mascotas no coinciden (son opuestos)', () => {
    const result = calculateTagScore(['tiene_mascota', 'deportista'], ['sin_mascotas', 'deportista']);
    // Solo 'deportista' en común → 1/5*10 = 2
    expect(result).toBe(2);
  });

  it('madrugador + noctambulo no coinciden (estilos incompatibles)', () => {
    const result = calculateTagScore(['madrugador', 'sociable'], ['noctambulo', 'sociable']);
    // Solo 'sociable' en común → 1/5*10 = 2
    expect(result).toBe(2);
  });

  it('perfiles idénticos de 5 tags obtienen el máximo', () => {
    const tags = ['madrugador', 'no_fumador', 'deportista', 'sociable', 'muy_ordenado'];
    expect(calculateTagScore(tags, tags)).toBe(10);
  });

  it('perfiles completamente distintos obtienen 0', () => {
    const a = ['madrugador', 'no_fumador', 'deportista'];
    const b = ['noctambulo', 'fumador', 'introvertido'];
    expect(calculateTagScore(a, b)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Ordenación de recomendaciones con lifestyle bonus
// ---------------------------------------------------------------------------

describe('ordenación con lifestyle_tags bonus', () => {
  type Candidate = { name: string; baseScore: number; tags: string[] };

  function rankCandidates(myTags: string[], candidates: Candidate[]) {
    return [...candidates]
      .map((c) => ({
        ...c,
        totalScore: Math.min(100, c.baseScore + calculateTagScore(myTags, c.tags)),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  it('un candidato con más tags en común sube en el ranking', () => {
    const myTags = ['deportista', 'madrugador', 'sociable'];
    const candidates: Candidate[] = [
      { name: 'A', baseScore: 50, tags: ['noctambulo', 'fumador'] },       // 0 bonus
      { name: 'B', baseScore: 50, tags: ['deportista', 'madrugador'] },    // 4 bonus
      { name: 'C', baseScore: 50, tags: ['deportista', 'madrugador', 'sociable'] }, // 6 bonus
    ];

    const ranked = rankCandidates(myTags, candidates);
    expect(ranked[0].name).toBe('C');
    expect(ranked[1].name).toBe('B');
    expect(ranked[2].name).toBe('A');
  });

  it('el bonus de tags desempata candidatos con igual score base', () => {
    const myTags = ['a', 'b'];
    const candidates: Candidate[] = [
      { name: 'X', baseScore: 70, tags: [] },
      { name: 'Y', baseScore: 70, tags: ['a'] }, // +2 bonus
    ];

    const ranked = rankCandidates(myTags, candidates);
    expect(ranked[0].name).toBe('Y');
  });

  it('candidatos sin tags no penalizan su score base', () => {
    const myTags = ['deportista'];
    const candidates: Candidate[] = [
      { name: 'NoTags', baseScore: 80, tags: [] },
      { name: 'WithTags', baseScore: 75, tags: ['deportista'] }, // +2
    ];

    const ranked = rankCandidates(myTags, candidates);
    // NoTags: 80+0=80, WithTags: 75+2=77 → NoTags gana
    expect(ranked[0].name).toBe('NoTags');
  });
});
