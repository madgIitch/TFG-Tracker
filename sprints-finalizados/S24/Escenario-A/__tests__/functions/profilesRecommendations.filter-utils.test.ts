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
      {
        owner_id: 'owner-1',
        flat: {
          city: 'Sevilla',
          city_id: 'city-sevilla',
          district_id: 'zone-triana',
          province_code: '41',
        },
      },
      {
        owner_id: 'owner-1',
        flat: {
          city: 'Sevilla',
          city_id: 'city-sevilla',
          district_id: 'zone-nervion',
          province_code: '41',
        },
      },
      {
        owner_id: 'owner-1',
        flat: {
          city: 'Madrid',
          city_id: 'city-madrid',
          district_id: 'zone-centro',
          province_code: '28',
        },
      },
      {
        owner_id: 'owner-2',
        flat: {
          city: 'Bilbao',
          city_id: 'city-bilbao',
          district_id: 'zone-abando',
          province_code: '48',
        },
      },
    ]);

    expect(summary.get('owner-1')?.cityIds.has('city-sevilla')).toBe(true);
    expect(summary.get('owner-1')?.zoneIds.has('zone-triana')).toBe(true);
    expect(summary.get('owner-1')?.provinceCodes.has('41')).toBe(true);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        city: ['Sevilla'],
        roomCount: [2, 3],
      })
    ).toBe(true);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        cityIds: ['city-sevilla'],
      })
    ).toBe(true);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-1'), {
        zoneIds: ['zone-nervion'],
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

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-2'), {
        cityIds: ['city-sevilla'],
      })
    ).toBe(false);

    expect(
      matchesCityAndRoomCountFilters(summary.get('owner-2'), {
        zoneIds: ['zone-triana'],
      })
    ).toBe(false);
  });
});
