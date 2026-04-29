type UserTypeFilter = 'student' | 'professional' | 'any';

export type RecommendationFiltersSubset = {
  city?: string[];
  cityIds?: string[];
  zoneIds?: string[];
  roomCount?: number[];
  userType?: UserTypeFilter[];
  ageRange?: [number, number];
};

export type ProfileFilterTarget = {
  birth_date?: string | null;
  university?: string | null;
  field_of_study?: string | null;
  occupation?: string | null;
};

export type OwnerRoomRow = {
  owner_id: string;
  flat?: {
    city?: string | null;
    city_id?: string | null;
    district_id?: string | null;
    province_code?: string | null;
  } | null;
};

export type OwnerSummary = Map<
  string,
  {
    count: number;
    cities: Set<string>;
    cityIds: Set<string>;
    zoneIds: Set<string>;
    provinceCodes: Set<string>;
  }
>;

export function matchesUserTypeFilter(
  profile: ProfileFilterTarget,
  userTypeFilters?: UserTypeFilter[]
): boolean {
  if (!userTypeFilters || userTypeFilters.length === 0) return true;

  const selected = userTypeFilters.filter((type) => type !== 'any');
  if (selected.length === 0) return true;

  const isStudent = Boolean(profile.university || profile.field_of_study);
  const isProfessional = Boolean(profile.occupation);

  return selected.some((type) => {
    if (type === 'student') return isStudent;
    if (type === 'professional') return isProfessional;
    return false;
  });
}

export function matchesAgeRangeFilter(
  profile: ProfileFilterTarget,
  ageRange?: [number, number],
  now: Date = new Date()
): boolean {
  if (!ageRange || ageRange.length !== 2) return true;
  if (!profile.birth_date) return true;

  const birth = new Date(profile.birth_date);
  if (Number.isNaN(birth.getTime())) return true;

  const min = Math.min(ageRange[0], ageRange[1]);
  const max = Math.max(ageRange[0], ageRange[1]);

  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= min && age <= max;
}

export function buildOwnerSummary(ownerRooms: OwnerRoomRow[]): OwnerSummary {
  const ownerSummary: OwnerSummary = new Map();

  ownerRooms.forEach((room) => {
    const current = ownerSummary.get(room.owner_id) ?? {
      count: 0,
      cities: new Set<string>(),
      cityIds: new Set<string>(),
      zoneIds: new Set<string>(),
      provinceCodes: new Set<string>(),
    };
    current.count += 1;
    if (room.flat?.city) current.cities.add(room.flat.city);
    if (room.flat?.city_id) current.cityIds.add(room.flat.city_id);
    if (room.flat?.district_id) current.zoneIds.add(room.flat.district_id);
    if (room.flat?.province_code) current.provinceCodes.add(room.flat.province_code);
    ownerSummary.set(room.owner_id, current);
  });

  return ownerSummary;
}

export function matchesCityAndRoomCountFilters(
  summary:
    | {
        count: number;
        cities: Set<string>;
        cityIds: Set<string>;
        zoneIds: Set<string>;
      }
    | undefined,
  filters?: RecommendationFiltersSubset
): boolean {
  const hasCityFilters = Boolean(filters?.city && filters.city.length > 0);
  const hasCityIdFilters = Boolean(filters?.cityIds && filters.cityIds.length > 0);
  const hasZoneIdFilters = Boolean(filters?.zoneIds && filters.zoneIds.length > 0);
  const hasRoomCountFilters = Boolean(filters?.roomCount && filters.roomCount.length > 0);
  if (!hasCityFilters && !hasCityIdFilters && !hasZoneIdFilters && !hasRoomCountFilters) {
    return true;
  }
  if (!summary) return false;

  if (hasCityFilters) {
    const matchesCity = filters?.city?.some((city) => summary.cities.has(city));
    if (!matchesCity) return false;
  }
  if (hasCityIdFilters) {
    const matchesCityId = filters?.cityIds?.some((cityId) => summary.cityIds.has(cityId));
    if (!matchesCityId) return false;
  }
  if (hasZoneIdFilters) {
    const matchesZoneId = filters?.zoneIds?.some((zoneId) => summary.zoneIds.has(zoneId));
    if (!matchesZoneId) return false;
  }

  if (hasRoomCountFilters) {
    const matchesRooms = filters?.roomCount?.some((selected) =>
      selected === 4 ? summary.count >= 4 : summary.count === selected
    );
    if (!matchesRooms) return false;
  }

  return true;
}
