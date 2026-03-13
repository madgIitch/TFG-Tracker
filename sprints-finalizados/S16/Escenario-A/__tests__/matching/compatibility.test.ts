import {
  calculateProfileCompatibilityScore,
  sortRecommendationsByCompatibility,
} from '../../supabase/functions/_shared/compatibility';
import type { Profile, RoomRecommendation } from '../../supabase/functions/_shared/types';

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: overrides.id ?? 'p-1',
  updated_at: overrides.updated_at ?? '2026-03-13T00:00:00.000Z',
  display_name: overrides.display_name ?? 'User',
  interests: overrides.interests ?? [],
  preferred_zones: overrides.preferred_zones ?? [],
  housing_situation: overrides.housing_situation,
  budget_min: overrides.budget_min,
  budget_max: overrides.budget_max,
  lifestyle_preferences: overrides.lifestyle_preferences,
  ...overrides,
});

describe('compatibility scoring', () => {
  it('returns 100 for perfectly complementary profiles', () => {
    const source = makeProfile({
      housing_situation: 'seeking',
      preferred_zones: ['Centro', 'Salamanca'],
      budget_min: 700,
      budget_max: 1200,
      interests: ['music', 'fitness', 'tech', 'travel', 'books'],
      lifestyle_preferences: {
        schedule: 'early',
        cleaning: 'high',
        guests: 'few',
      },
    });
    const target = makeProfile({
      id: 'p-2',
      housing_situation: 'offering',
      preferred_zones: ['Centro'],
      budget_min: 700,
      budget_max: 1200,
      interests: ['music', 'fitness', 'tech', 'travel', 'books', 'cinema'],
      lifestyle_preferences: {
        schedule: 'early',
        cleaning: 'high',
        guests: 'few',
      },
    });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.score).toBe(100);
    expect(result.breakdown.total).toBe(100);
  });

  it('returns 0 when no criteria match', () => {
    const source = makeProfile({
      housing_situation: 'seeking',
      preferred_zones: ['Norte'],
      budget_min: 500,
      budget_max: 600,
      interests: ['music'],
      lifestyle_preferences: {
        schedule: 'early',
        cleaning: 'high',
        guests: 'few',
      },
    });
    const target = makeProfile({
      id: 'p-3',
      housing_situation: 'seeking',
      preferred_zones: ['Sur'],
      budget_min: 1000,
      budget_max: 1300,
      interests: ['gaming'],
      lifestyle_preferences: {
        schedule: 'late',
        cleaning: 'low',
        guests: 'many',
      },
    });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.score).toBe(0);
    expect(result.breakdown.total).toBe(0);
  });

  it('gives proportional points for partial budget overlap', () => {
    const source = makeProfile({ budget_min: 500, budget_max: 1000 });
    const target = makeProfile({ id: 'p-4', budget_min: 800, budget_max: 1400 });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.breakdown.budget_overlap).toBe(4);
  });

  it('caps shared interests at 25 points', () => {
    const source = makeProfile({
      interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    });
    const target = makeProfile({
      id: 'p-5',
      interests: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    });

    const result = calculateProfileCompatibilityScore(source, target);
    expect(result.breakdown.interests).toBe(25);
  });

  it('breakdown totals always match final score', () => {
    const source = makeProfile({
      housing_situation: 'offering',
      preferred_zones: ['Centro'],
      budget_min: 700,
      budget_max: 1500,
      interests: ['run', 'read'],
      lifestyle_preferences: { schedule: 'early', cleaning: 'high', guests: 'few' },
    });
    const target = makeProfile({
      id: 'p-6',
      housing_situation: 'seeking',
      preferred_zones: ['Centro'],
      budget_min: 900,
      budget_max: 1200,
      interests: ['run'],
      lifestyle_preferences: { schedule: 'early', cleaning: 'low', guests: 'few' },
    });

    const result = calculateProfileCompatibilityScore(source, target);
    const partials =
      result.breakdown.housing_situation +
      result.breakdown.preferred_zones +
      result.breakdown.budget_overlap +
      result.breakdown.interests +
      result.breakdown.lifestyle;

    expect(result.score).toBe(partials);
    expect(result.breakdown.total).toBe(result.score);
  });

  it('sorts by score descending and keeps stable order on ties', () => {
    const list: RoomRecommendation[] = [
      { profile: makeProfile({ id: 'a' }), compatibility_score: 80, match_reasons: [] },
      { profile: makeProfile({ id: 'b' }), compatibility_score: 95, match_reasons: [] },
      { profile: makeProfile({ id: 'c' }), compatibility_score: 80, match_reasons: [] },
    ];

    const sorted = sortRecommendationsByCompatibility(list);
    expect(sorted.map((item) => item.profile.id)).toEqual(['b', 'a', 'c']);
  });
});
