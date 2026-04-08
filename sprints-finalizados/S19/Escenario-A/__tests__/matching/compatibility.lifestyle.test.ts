import { calculateProfileCompatibilityScore } from '../../supabase/functions/_shared/compatibility';
import type { Profile } from '../../supabase/functions/_shared/types';

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: overrides.id ?? 'p-1',
  updated_at: overrides.updated_at ?? '2026-03-20T00:00:00.000Z',
  display_name: overrides.display_name ?? 'User',
  interests: overrides.interests ?? [],
  preferred_zones: overrides.preferred_zones ?? [],
  housing_situation: overrides.housing_situation,
  budget_min: overrides.budget_min,
  budget_max: overrides.budget_max,
  lifestyle_preferences: overrides.lifestyle_preferences,
  lifestyle_tags: overrides.lifestyle_tags ?? [],
  ...overrides,
});

describe('compatibility lifestyle_tags', () => {
  it('awards full lifestyle points when many tags overlap (capped)', () => {
    const source = makeProfile({
      lifestyle_tags: [
        'madrugador',
        'no_fumador',
        'deportista',
        'tranquilo',
        'trabaja_desde_casa',
        'fiestero',
      ],
    });
    const target = makeProfile({
      id: 'p-2',
      lifestyle_tags: [
        'madrugador',
        'no_fumador',
        'deportista',
        'tranquilo',
        'trabaja_desde_casa',
        'tiene_mascota',
      ],
    });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.breakdown.lifestyle).toBe(10);
  });

  it('still supports legacy lifestyle_preferences matching as fallback', () => {
    const source = makeProfile({
      lifestyle_preferences: { schedule: 'early', cleaning: 'high', guests: 'few' },
    });
    const target = makeProfile({
      id: 'p-3',
      lifestyle_preferences: { schedule: 'early', cleaning: 'high', guests: 'few' },
    });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.breakdown.lifestyle).toBeGreaterThan(0);
  });

  it('returns 100 for perfect compatibility including lifestyle tags', () => {
    const source = makeProfile({
      housing_situation: 'seeking',
      preferred_zones: ['Centro'],
      budget_min: 700,
      budget_max: 1000,
      interests: ['cine', 'musica', 'deportes', 'cocina', 'viajes'],
      lifestyle_tags: [
        'madrugador',
        'no_fumador',
        'deportista',
        'tranquilo',
        'trabaja_desde_casa',
      ],
    });

    const target = makeProfile({
      id: 'p-4',
      housing_situation: 'offering',
      preferred_zones: ['Centro', 'Triana'],
      budget_min: 700,
      budget_max: 1000,
      interests: ['cine', 'musica', 'deportes', 'cocina', 'viajes', 'series'],
      lifestyle_tags: [
        'madrugador',
        'no_fumador',
        'deportista',
        'tranquilo',
        'trabaja_desde_casa',
      ],
    });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.score).toBe(100);
    expect(result.breakdown.total).toBe(100);
  });
});

