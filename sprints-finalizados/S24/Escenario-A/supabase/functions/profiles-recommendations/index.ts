// supabase/functions/profiles-recommendations/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import type {
  Profile,
  RecommendationResponse,
  RoomRecommendation,
  JWTPayload,
} from '../_shared/types.ts';
import {
  calculateProfileCompatibilityScore,
  sortRecommendationsByCompatibility,
} from '../_shared/compatibility.ts';
import {
  buildOwnerSummary,
  matchesAgeRangeFilter,
  matchesCityAndRoomCountFilters,
  matchesUserTypeFilter,
} from './filter-utils.ts';

/**
 * Edge Function para generar recomendaciones de perfiles en HomiMatch.
 * Devuelve todos los perfiles (menos el propio) para el swipe.
 */

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const DEBUG_PROFILES_RECOMMENDATIONS =
  (Deno.env.get('DEBUG_PROFILES_RECOMMENDATIONS') ?? '').toLowerCase() === 'true';

function debugLog(message: string, payload?: Record<string, unknown>) {
  if (!DEBUG_PROFILES_RECOMMENDATIONS) return;
  if (payload) {
    console.log(`[profiles-recommendations][debug] ${message}`, payload);
    return;
  }
  console.log(`[profiles-recommendations][debug] ${message}`);
}

type RecommendationFilters = {
  housingSituation?: 'any' | 'seeking' | 'offering';
  budgetMin?: number;
  budgetMax?: number;
  zones?: string[];
  city?: string[];
  cityIds?: string[];
  zoneIds?: string[];
  roomCount?: number[];
  userType?: ('student' | 'professional' | 'any')[];
  ageRange?: [number, number];
  lifestyle?: string[];
  interests?: string[];
  rules?: Record<string, string | null>;
};

type FlatGenderPolicy = 'mixed' | 'men_only' | 'flinta';

type RoomWithFlat = {
  id: string;
  owner_id: string;
  price_per_month: number;
  is_available?: boolean | null;
  flat?: {
    gender_policy?: FlatGenderPolicy | null;
    district?: string | null;
    district_id?: string | null;
    city?: string | null;
    city_id?: string | null;
    province_code?: string | null;
    rules?: string | null;
  } | null;
};

type OwnerLocation = {
  district?: string | null;
  district_id?: string | null;
  city_id?: string | null;
  province_code?: string | null;
};

const lifestyleLabelById = new Map<string, string>([
  ['madrugador', 'Madrugador'],
  ['noctambulo', 'Noctambulo'],
  ['no_fumador', 'No fumador'],
  ['fumador', 'Fumador'],
  ['deportista', 'Deportista'],
  ['tiene_mascota', 'Tiene mascota'],
  ['sin_mascotas', 'Sin mascotas'],
  ['trabaja_desde_casa', 'Trabaja desde casa'],
  ['fiestero', 'Fiestero'],
  ['tranquilo', 'Tranquilo'],
]);

const RULE_OPTIONS = [
  { id: 'ruido', label: 'Ruido' },
  { id: 'visitas', label: 'Visitas' },
  { id: 'limpieza', label: 'Limpieza' },
  { id: 'fumar', label: 'Fumar' },
  { id: 'mascotas', label: 'Mascotas' },
  { id: 'cocina', label: 'Dejar la cocina limpia tras usarla' },
  { id: 'banos', label: 'Mantener banos en orden' },
  { id: 'basura', label: 'Sacar la basura segun el turno' },
  { id: 'seguridad', label: 'Cerrar siempre la puerta con llave' },
  { id: 'otros', label: 'Otros' },
];

const SUB_RULE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  ruido: [
    { id: 'ruido_22_08', label: 'Silencio 22:00 - 08:00' },
    { id: 'ruido_23_08', label: 'Silencio 23:00 - 08:00' },
    { id: 'ruido_flexible', label: 'Horario flexible' },
    { id: 'ruido_otros', label: 'Otros' },
  ],
  visitas: [
    { id: 'visitas_si', label: 'Si, con aviso' },
    { id: 'visitas_no', label: 'No permitidas' },
    { id: 'visitas_sin_dormir', label: 'Si, pero sin dormir' },
    { id: 'visitas_libre', label: 'Sin problema' },
    { id: 'visitas_otros', label: 'Otros' },
  ],
  limpieza: [
    { id: 'limpieza_semanal', label: 'Turnos semanales' },
    { id: 'limpieza_quincenal', label: 'Turnos quincenales' },
    { id: 'limpieza_por_uso', label: 'Limpieza por uso' },
    { id: 'limpieza_profesional', label: 'Servicio de limpieza' },
    { id: 'limpieza_otros', label: 'Otros' },
  ],
  fumar: [
    { id: 'fumar_no', label: 'No fumar' },
    { id: 'fumar_terraza', label: 'Solo en terraza/balcon' },
    { id: 'fumar_si', label: 'Permitido en zonas comunes' },
    { id: 'fumar_otros', label: 'Otros' },
  ],
  mascotas: [
    { id: 'mascotas_no', label: 'No se permiten' },
    { id: 'mascotas_gatos', label: 'Solo gatos' },
    { id: 'mascotas_perros', label: 'Solo perros' },
    { id: 'mascotas_acuerdo', label: 'Permitidas bajo acuerdo' },
    { id: 'mascotas_otros', label: 'Otros' },
  ],
};

function normalizeLocationToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matchesFilters(
  profile: Profile,
  filters?: RecommendationFilters,
  options?: { skipBudgetForOffering?: boolean }
): boolean {
  if (!filters) return true;

  if (
    filters.housingSituation &&
    filters.housingSituation !== 'any' &&
    profile.housing_situation !== filters.housingSituation
  ) {
    return false;
  }

  if (filters.zones && filters.zones.length > 0) {
    const profileZones = profile.preferred_zones ?? [];
    const matchesZone = profileZones.some((zone) => filters.zones?.includes(zone));
    if (!matchesZone) return false;
  }
  if (filters.zoneIds && filters.zoneIds.length > 0) {
    const profileZoneIds = profile.preferred_zone_ids ?? [];
    const matchesZoneId = profileZoneIds.some((zoneId) =>
      filters.zoneIds?.includes(zoneId)
    );
    if (!matchesZoneId) return false;
  }

  if (filters.interests && filters.interests.length > 0) {
    const profileInterests = profile.interests ?? [];
    const matchesInterest = profileInterests.some((interest) =>
      filters.interests?.includes(interest)
    );
    if (!matchesInterest) return false;
  }

  if (filters.userType && filters.userType.length > 0) {
    if (!matchesUserTypeFilter(profile, filters.userType)) return false;
  }

  if (!matchesAgeRangeFilter(profile, filters.ageRange)) return false;

  if (filters.lifestyle && filters.lifestyle.length > 0) {
    const requestedLifestyleIds = filters.lifestyle;
    if (profile.housing_situation !== 'offering') {
      const profileLifestyle =
        profile.lifestyle_tags && profile.lifestyle_tags.length > 0
          ? profile.lifestyle_tags
          : profile.lifestyle_preferences
            ? Object.values(profile.lifestyle_preferences).filter(
                (item): item is string => Boolean(item)
              )
            : [];
      if (profileLifestyle.length > 0) {
        const requestedLifestyle = requestedLifestyleIds.map(
          (id) => lifestyleLabelById.get(id) ?? id
        );
        const matchesLifestyle = profileLifestyle.some((chip) =>
          requestedLifestyle.includes(chip) || requestedLifestyleIds.includes(chip)
        );
        if (!matchesLifestyle) return false;
      }
    }
  }

  const hasBudgetFilter =
    typeof filters.budgetMin === 'number' || typeof filters.budgetMax === 'number';
  if (
    hasBudgetFilter &&
    !(options?.skipBudgetForOffering && filters.housingSituation === 'offering')
  ) {
    const profileMin = profile.budget_min ?? null;
    const profileMax = profile.budget_max ?? null;
    if (profileMin == null && profileMax == null) return false;
    const min = typeof filters.budgetMin === 'number' ? filters.budgetMin : -Infinity;
    const max = typeof filters.budgetMax === 'number' ? filters.budgetMax : Infinity;
    const effectiveMin = profileMin ?? min;
    const effectiveMax = profileMax ?? max;
    if (effectiveMax < min || effectiveMin > max) return false;
  }

  return true;
}

const ruleLabelById = new Map(RULE_OPTIONS.map((rule) => [rule.id, rule.label]));

const subOptionLabelMap = new Map<string, { ruleId: string; optionId: string }>();
Object.entries(SUB_RULE_OPTIONS).forEach(([ruleId, options]) => {
  options.forEach((option) => {
    subOptionLabelMap.set(option.label.toLowerCase(), {
      ruleId,
      optionId: option.id,
    });
  });
});

const addRuleSelection = (
  map: Record<string, Set<string>>,
  ruleId: string,
  optionId: string
) => {
  if (!map[ruleId]) {
    map[ruleId] = new Set();
  }
  map[ruleId].add(optionId);
};

function parseFlatRules(rulesText?: string | null): Record<string, Set<string>> {
  const selections: Record<string, Set<string>> = {};
  if (!rulesText) return selections;

  const pieces = rulesText
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  pieces.forEach((rule) => {
    const lower = rule.toLowerCase();
    const matchSub = subOptionLabelMap.get(lower);
    if (matchSub) {
      addRuleSelection(selections, matchSub.ruleId, matchSub.optionId);
      return;
    }

    const prefixed = Array.from(ruleLabelById.entries()).find(([id, label]) => {
      if (!SUB_RULE_OPTIONS[id]) return false;
      return lower.startsWith(`${label.toLowerCase()}:`);
    });
    if (prefixed) {
      const [ruleId] = prefixed;
      addRuleSelection(selections, ruleId, `${ruleId}_otros`);
      return;
    }

    const match = RULE_OPTIONS.find(
      (option) => option.label.toLowerCase() === lower
    );
    if (match) {
      addRuleSelection(selections, match.id, match.id);
      return;
    }

    addRuleSelection(selections, 'otros', 'otros');
  });

  return selections;
}

function matchesRulePreferences(
  rulePreferences: Record<string, string | null>,
  flatRules: Record<string, Set<string>>
): boolean {
  const entries = Object.entries(rulePreferences);
  if (entries.length === 0) return true;

  for (const [ruleId, preference] of entries) {
    if (!preference || preference === 'flexible') continue;
    const flatOptions = flatRules[ruleId];
    if (!flatOptions || flatOptions.size === 0) {
      return false;
    }
    const hasOther = Array.from(flatOptions).some(
      (option) => option === 'otros' || option.endsWith('_otros')
    );
    if (hasOther) continue;
    if (!flatOptions.has(preference)) return false;
  }

  return true;
}

function matchesOfferingLocationConstraints(
  profile: Profile,
  ownerLocations: OwnerLocation[]
): boolean {
  if (profile.housing_situation !== 'seeking') return false;
  if (ownerLocations.length === 0) return false;

  const preferredZoneIds = new Set(profile.preferred_zone_ids ?? []);
  const preferredZones = new Set(
    (profile.preferred_zones ?? []).map((zone) => normalizeLocationToken(zone))
  );
  const preferredCityId = profile.preferred_city_id ?? null;
  const preferredProvince = preferredCityId?.slice(0, 2) ?? null;

  return ownerLocations.some((location) => {
    const districtId = location.district_id ?? null;
    const districtNameRaw = location.district ?? null;
    const districtName = districtNameRaw
      ? normalizeLocationToken(districtNameRaw)
      : null;
    const cityId = location.city_id ?? null;
    const provinceCode = location.province_code ?? null;

    if (districtId && preferredZoneIds.has(districtId)) return true;
    if (districtName && preferredZones.has(districtName)) return true;
    if (preferredCityId && cityId && preferredCityId === cityId) return true;
    if (preferredProvince && provinceCode && preferredProvince === provinceCode) return true;

    return false;
  });
}

async function getProvinceByCityIds(cityIds: string[]): Promise<Map<string, string>> {
  if (cityIds.length === 0) return new Map();
  const { data, error } = await supabaseClient
    .from('cities')
    .select('id, ine_municipio, ref_ine')
    .in('id', cityIds);
  if (error || !data) return new Map();
  const entries = (data as { id: string; ine_municipio?: string | null; ref_ine?: string | null }[])
    .map((city) => {
      const ineMunicipio = city.ine_municipio ?? '';
      const fromMunicipio = ineMunicipio.length >= 2 ? ineMunicipio.slice(0, 2) : null;
      const digitsRef = (city.ref_ine ?? '').replace(/\D/g, '');
      const fromRef = digitsRef.length >= 2 ? digitsRef.slice(0, 2) : null;
      const province = fromMunicipio ?? fromRef;
      return province ? ([city.id, province] as const) : null;
    })
    .filter((item): item is readonly [string, string] => Boolean(item));
  return new Map(entries);
}

function calculateOfferingLocationProximity(
  targetProfile: Profile,
  ownerLocations: OwnerLocation[]
): number {
  if (targetProfile.housing_situation !== 'seeking') return 0;
  if (ownerLocations.length === 0) return 0;

  const preferredZoneIds = new Set(targetProfile.preferred_zone_ids ?? []);
  const preferredZones = new Set(
    (targetProfile.preferred_zones ?? []).map((zone) => normalizeLocationToken(zone))
  );
  const preferredCityId = targetProfile.preferred_city_id ?? null;
  const preferredProvince = preferredCityId?.slice(0, 2) ?? null;

  let maxScore = 0;
  for (const location of ownerLocations) {
    const districtId = location.district_id ?? null;
    const districtNameRaw = location.district ?? null;
    const districtName = districtNameRaw
      ? normalizeLocationToken(districtNameRaw)
      : null;
    const cityId = location.city_id ?? null;
    const provinceCode = location.province_code ?? null;

    if (districtId && preferredZoneIds.has(districtId)) {
      maxScore = Math.max(maxScore, 10);
      continue;
    }
    if (districtName && preferredZones.has(districtName)) {
      maxScore = Math.max(maxScore, 9);
      continue;
    }
    if (preferredCityId && cityId && preferredCityId === cityId) {
      maxScore = Math.max(maxScore, 8);
      continue;
    }
    if (preferredProvince && provinceCode && preferredProvince === provinceCode) {
      maxScore = Math.max(maxScore, 5);
    }
  }

  return maxScore;
}

function extractAvatarPath(avatarUrl: string): string | null {
  if (!avatarUrl) return null;
  if (!avatarUrl.startsWith('http')) return avatarUrl;

  try {
    const url = new URL(avatarUrl);
    const pathname = url.pathname;
    const prefixes = [
      '/storage/v1/object/sign/avatars/',
      '/storage/v1/object/public/avatars/',
      '/storage/v1/object/avatars/',
    ];

    for (const prefix of prefixes) {
      const index = pathname.indexOf(prefix);
      if (index !== -1) {
        return pathname.substring(index + prefix.length);
      }
    }
  } catch (error) {
    console.error('[profiles-recommendations] Failed to parse avatar_url:', error);
  }

  return null;
}

async function getSignedAvatarUrl(avatarUrl: string): Promise<string | null> {
  const path = extractAvatarPath(avatarUrl);
  if (!path) return null;

  const { data, error } = await supabaseClient.storage
    .from('avatars')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    console.error('[profiles-recommendations] Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

function generateProfileMatchReasons(
  seekerProfile: Profile,
  targetProfile: Profile
): string[] {
  const reasons: string[] = [];

  if (
    seekerProfile.gender &&
    targetProfile.gender &&
    seekerProfile.gender === targetProfile.gender
  ) {
    reasons.push(`Mismo genero: ${targetProfile.gender}`);
  }

  if (
    seekerProfile.occupation &&
    targetProfile.occupation &&
    seekerProfile.occupation === targetProfile.occupation
  ) {
    reasons.push(`Misma ocupacion: ${targetProfile.occupation}`);
  }

  if (seekerProfile.smoker !== undefined && targetProfile.smoker !== undefined) {
    if (seekerProfile.smoker === targetProfile.smoker) {
      reasons.push(seekerProfile.smoker ? 'Ambos son fumadores' : 'Ninguno fuma');
    } else {
      reasons.push('Diferentes habitos de fumar');
    }
  }

  if (
    seekerProfile.has_pets !== undefined &&
    targetProfile.has_pets !== undefined
  ) {
    if (seekerProfile.has_pets === targetProfile.has_pets) {
      reasons.push(
        seekerProfile.has_pets ? 'Ambos tienen mascotas' : 'Ninguno tiene mascotas'
      );
    }
  }

  return reasons;
}

const handler = withAuth(
  async (req: Request, payload: JWTPayload): Promise<Response> => {
    const userId = getUserId(payload);

    try {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: seekerProfile, error: seekerError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (seekerError || !seekerProfile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json().catch(() => ({}));
      const filters = (body?.filters ?? undefined) as RecommendationFilters | undefined;
      let cityIdProvinceMap = await getProvinceByCityIds(filters?.cityIds ?? []);
      const selectedCityIds = new Set(filters?.cityIds ?? []);
      const selectedZoneIds = new Set(filters?.zoneIds ?? []);
      let offeringOwnerLocations: OwnerLocation[] = [];
      debugLog('Request received', {
        userId,
        hasFilters: Boolean(filters),
        housingSituationFilter: filters?.housingSituation ?? null,
        cityIdsCount: filters?.cityIds?.length ?? 0,
        zoneIdsCount: filters?.zoneIds?.length ?? 0,
        roomCountCount: filters?.roomCount?.length ?? 0,
      });

      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('*, users!profiles_id_fkey(birth_date)')
        .eq('swipe_visibility_active', true)
        .neq('id', userId);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profiles' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const recommendations: RoomRecommendation[] = [];

      const normalizedProfiles = (profiles || []).map((row) => {
        const { users, ...profileData } = row as Profile & {
          users?: { birth_date?: string | null };
        };
        return {
          ...profileData,
          birth_date: users?.birth_date ?? null,
        } as Profile;
      });
      debugLog('Profiles loaded', {
        seekerHousing: seekerProfile.housing_situation ?? null,
        totalProfiles: normalizedProfiles.length,
      });

      let filteredProfiles = normalizedProfiles.filter((profile) =>
        matchesFilters(profile, filters, { skipBudgetForOffering: true })
      );
      debugLog('After base filters', {
        filteredCount: filteredProfiles.length,
      });

      if (seekerProfile.housing_situation === 'offering') {
        filteredProfiles = normalizedProfiles;
        debugLog('Offering mode activated', {
          resetFilteredCount: filteredProfiles.length,
        });
        const { data: ownerFlats, error: flatsError } = await supabaseClient
          .from('flats')
          .select(
            `
            district,
            district_id,
            city_id,
            province_code
          `
          )
          .eq('owner_id', userId);

        if (flatsError) {
          console.error(
            '[profiles-recommendations] Error loading flats for offering location:',
            flatsError
          );
          return new Response(
            JSON.stringify({ error: 'Failed to load owner flats' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        offeringOwnerLocations = (ownerFlats ?? []) as OwnerLocation[];
        debugLog('Offering flats loaded', {
          ownerLocationsCount: offeringOwnerLocations.length,
        });
        if (offeringOwnerLocations.length === 0) {
          debugLog('No flats for offering profile, returning empty response');
          return new Response(
            JSON.stringify({ recommendations: [] }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        filteredProfiles = filteredProfiles.filter((profile) =>
          matchesOfferingLocationConstraints(profile, offeringOwnerLocations)
        );
        debugLog('After offering location constraints', {
          filteredCount: filteredProfiles.length,
        });
        if (filteredProfiles.length === 0) {
          debugLog('Offering location filter returned 0 candidates', {
            ownerLocations: offeringOwnerLocations.slice(0, 5).map((location) => ({
              city_id: location.city_id ?? null,
              district_id: location.district_id ?? null,
              district: location.district ?? null,
              province_code: location.province_code ?? null,
            })),
            sampleCandidates: normalizedProfiles.slice(0, 10).map((profile) => ({
              id: profile.id,
              housing_situation: profile.housing_situation ?? null,
              preferred_city_id: profile.preferred_city_id ?? null,
              preferred_zone_ids_count: profile.preferred_zone_ids?.length ?? 0,
              preferred_zones: profile.preferred_zones ?? [],
            })),
          });
        }
      } else {
        const hasCityFilters = Boolean(filters?.city && filters.city.length > 0);
        const hasCityIdFilters = Boolean(filters?.cityIds && filters.cityIds.length > 0);
        const hasZoneIdFilters = Boolean(filters?.zoneIds && filters.zoneIds.length > 0);
        const hasRoomCountFilters = Boolean(
          filters?.roomCount && filters.roomCount.length > 0
        );
        if (hasCityFilters || hasCityIdFilters || hasZoneIdFilters || hasRoomCountFilters) {
          const ownerIds = filteredProfiles
            .filter((profile) => profile.housing_situation === 'offering')
            .map((profile) => profile.id);

          if (ownerIds.length > 0) {
            const { data: ownerRooms, error: ownerRoomsError } = await supabaseClient
              .from('rooms')
              .select('owner_id, flat:flats(city, city_id, district_id, province_code)')
              .in('owner_id', ownerIds)
              .eq('is_available', true);

            if (!ownerRoomsError) {
              const ownerSummary = buildOwnerSummary(ownerRooms ?? []);

              filteredProfiles = filteredProfiles.filter((profile) => {
                if (profile.housing_situation !== 'offering') {
                  return !hasCityFilters && !hasCityIdFilters && !hasZoneIdFilters && !hasRoomCountFilters;
                }
                return matchesCityAndRoomCountFilters(
                  ownerSummary.get(profile.id),
                  {
                    ...filters,
                    cityIds: filters?.cityIds,
                    zoneIds: filters?.zoneIds,
                  }
                );
              });
              debugLog('After city/zone/roomCount filters (seeking mode)', {
                filteredCount: filteredProfiles.length,
                ownerRoomsCount: (ownerRooms ?? []).length,
              });
            }
          } else {
            filteredProfiles = filteredProfiles.filter(
              (profile) => profile.housing_situation !== 'offering'
            );
            debugLog('No offering owners available for room filters', {
              filteredCount: filteredProfiles.length,
            });
          }
        }

        const hasBudgetFilter =
          typeof filters?.budgetMin === 'number' ||
          typeof filters?.budgetMax === 'number';
        const rulePreferences = filters?.rules ?? {};
        const hasRuleFilters = Object.values(rulePreferences).some(
          (value) => value && value !== 'flexible'
        );

        if (
          filters?.housingSituation === 'offering' &&
          (hasBudgetFilter || hasRuleFilters)
        ) {
          const min =
            typeof filters.budgetMin === 'number' ? filters.budgetMin : 0;
          const max =
            typeof filters.budgetMax === 'number' ? filters.budgetMax : 1000000;
          const ownerIds = filteredProfiles.map((profile) => profile.id);
          if (ownerIds.length > 0) {
            let roomsQuery = supabaseClient
              .from('rooms')
              .select('id, owner_id, price_per_month, flat:flats(rules)')
              .in('owner_id', ownerIds)
              .eq('is_available', true);

            if (hasBudgetFilter) {
              roomsQuery = roomsQuery
                .gte('price_per_month', min)
                .lte('price_per_month', max);
            }

            const { data: roomsInRange, error: roomsError } = await roomsQuery;

            if (roomsError) {
              console.error(
                '[profiles-recommendations] rooms filter error:',
                roomsError
              );
            } else {
              const ownersWithRooms = new Set<string>();
              (roomsInRange ?? []).forEach((room) => {
                if (!hasRuleFilters) {
                  ownersWithRooms.add(room.owner_id);
                  return;
                }
                const flatRules = parseFlatRules(room.flat?.rules ?? null);
                if (matchesRulePreferences(rulePreferences, flatRules)) {
                  ownersWithRooms.add(room.owner_id);
                }
              });

              const filteredByRooms = filteredProfiles.filter((profile) =>
                ownersWithRooms.has(profile.id)
              );
              filteredProfiles = filteredByRooms;
              debugLog('After offering budget/rules room filters', {
                filteredCount: filteredProfiles.length,
                ownersWithRoomsCount: ownersWithRooms.size,
              });
            }
          }
        }
      }

      const relevantCityIds = new Set<string>(filters?.cityIds ?? []);
      if (seekerProfile.preferred_city_id) {
        relevantCityIds.add(seekerProfile.preferred_city_id);
      }
      filteredProfiles.forEach((profile) => {
        if (profile.preferred_city_id) {
          relevantCityIds.add(profile.preferred_city_id);
        }
      });
      cityIdProvinceMap = await getProvinceByCityIds(Array.from(relevantCityIds));

      for (const profile of filteredProfiles) {
        if (profile.avatar_url) {
          const signedUrl = await getSignedAvatarUrl(profile.avatar_url);
          if (signedUrl) {
            profile.avatar_url = signedUrl;
          }
        }

        const compatibility = calculateProfileCompatibilityScore(
          seekerProfile,
          profile
        );
        let locationProximity = 0;
        if (seekerProfile.housing_situation === 'offering') {
          locationProximity = calculateOfferingLocationProximity(
            profile,
            offeringOwnerLocations
          );
        } else if (profile.preferred_city_id && seekerProfile.preferred_city_id) {
          if (profile.preferred_city_id === seekerProfile.preferred_city_id) {
            locationProximity = 10;
          } else {
            const sourceProvince = cityIdProvinceMap.get(seekerProfile.preferred_city_id) ?? null;
            const targetProvince = cityIdProvinceMap.get(profile.preferred_city_id) ?? null;
            if (sourceProvince && targetProvince && sourceProvince === targetProvince) {
              locationProximity = 5;
            }
          }
        } else if (profile.preferred_city_id && selectedCityIds.size > 0) {
          if (selectedCityIds.has(profile.preferred_city_id)) {
            locationProximity = 10;
          } else {
            const profileProvince = cityIdProvinceMap.get(profile.preferred_city_id) ?? null;
            const hasSameProvinceSelected = Array.from(selectedCityIds).some((cityId) => {
              const selectedProvince = cityIdProvinceMap.get(cityId) ?? null;
              return selectedProvince && profileProvince && selectedProvince === profileProvince;
            });
            if (hasSameProvinceSelected) locationProximity = 5;
          }
        }

        if (selectedZoneIds.size > 0) {
          const hasZoneMatch = (profile.preferred_zone_ids ?? []).some((zoneId) =>
            selectedZoneIds.has(zoneId)
          );
          if (hasZoneMatch) {
            locationProximity = Math.max(locationProximity, 10);
          }
        }

        const matchReasons = generateProfileMatchReasons(
          seekerProfile,
          profile
        );

        recommendations.push({
          profile,
          compatibility_score: compatibility.score + locationProximity,
          compatibility_breakdown: {
            ...compatibility.breakdown,
            location_proximity: locationProximity,
            total: compatibility.breakdown.total + locationProximity,
          },
          match_reasons: matchReasons,
        });
      }
      debugLog('Recommendations built', {
        recommendationsCount: recommendations.length,
      });

      const sortedRecommendations = sortRecommendationsByCompatibility(
        recommendations
      );
      debugLog('Recommendations sorted', {
        sortedCount: sortedRecommendations.length,
        topProfileIds: sortedRecommendations.slice(0, 5).map((item) => item.profile.id),
      });

      const response: RecommendationResponse = {
        recommendations: sortedRecommendations,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Profile recommendations function error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: errorMessage,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }
);

Deno.serve(handler);
