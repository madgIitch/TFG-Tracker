import {
  buildOwnerSummary,
  matchesAgeRangeFilter,
  matchesCityAndRoomCountFilters,
  matchesUserTypeFilter,
} from '../../supabase/functions/profiles-recommendations/filter-utils';

describe('profiles-recommendations filter utils', () => {
  it('matches userType for students and professionals', () => {
    const studentProfile = {
      university: 'US',
      field_of_study: 'CS',
      occupation: null,
    };
    const professionalProfile = {
      university: null,
      field_of_study: null,
      occupation: 'Engineer',
    };

    expect(matchesUserTypeFilter(studentProfile, ['student'])).toBe(true);
    expect(matchesUserTypeFilter(studentProfile, ['professional'])).toBe(false);
    expect(matchesUserTypeFilter(professionalProfile, ['professional'])).toBe(true);
    expect(matchesUserTypeFilter(professionalProfile, ['any'])).toBe(true);
  });

  it('matches age ranges using birth_date', () => {
    const now = new Date('2026-03-16T00:00:00.000Z');
    const profileInRange = { birth_date: '2000-03-10' };
    const profileOutRange = { birth_date: '1980-01-01' };

    expect(matchesAgeRangeFilter(profileInRange, [20, 30], now)).toBe(true);
    expect(matchesAgeRangeFilter(profileInRange, [30, 20], now)).toBe(true);
    expect(matchesAgeRangeFilter(profileOutRange, [20, 30], now)).toBe(false);
  });

  it('builds owner room summaries and applies city/roomCount filters', () => {
    const summary = buildOwnerSummary([
      { owner_id: 'owner-1', flat: { city: 'Sevilla' } },
      { owner_id: 'owner-1', flat: { city: 'Sevilla' } },
      { owner_id: 'owner-1', flat: { city: 'Madrid' } },
      { owner_id: 'owner-2', flat: { city: 'Bilbao' } },
    ]);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        city: ['Sevilla'],
        roomCount: [2, 3],
      })
    ).toBe(true);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        city: ['Barcelona'],
      })
    ).toBe(false);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        roomCount: [4],
      })
    ).toBe(false);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        roomCount: [3],
      })
    ).toBe(true);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-2'), {
        city: ['Bilbao'],
        roomCount: [1],
      })
    ).toBe(true);
  });
});
