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

/**
 * Edge Function para generar recomendaciones de perfiles en HomiMatch.
 * Devuelve todos los perfiles (menos el propio) para el swipe.
 */

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

type RecommendationFilters = {
  housingSituation?: 'any' | 'seeking' | 'offering';
  budgetMin?: number;
  budgetMax?: number;
  ageRange?: [number, number];
  zones?: string[];
  city?: string[];
  roomCount?: number[];
  userType?: string[];
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
    city?: string | null;
    rules?: string | null;
  } | null;
};

const lifestyleLabelById = new Map<string, string>([
  ['schedule_flexible', 'Flexible'],
  ['cleaning_muy_limpio', 'Muy limpio'],
  ['guests_algunos', 'Algunos invitados'],
  ['madrugador', 'madrugador'],
  ['noctambulo', 'noctambulo'],
  ['no_fumador', 'no fumador'],
  ['deportista', 'deportista'],
  ['social', 'social'],
  ['tiene_mascota', 'tiene mascota'],
  ['teletrabaja', 'teletrabaja'],
  ['ordenado', 'ordenado'],
]);

const normalizeLifestyleToken = (value: string) => value.toLowerCase().trim();

const getProfileLifestyleValues = (profile: Profile): string[] => {
  const tagValues = (profile.lifestyle_tags ?? [])
    .filter((item): item is string => Boolean(item))
    .map((item) => normalizeLifestyleToken(item));
  const preferenceValues = profile.lifestyle_preferences
    ? Object.values(profile.lifestyle_preferences)
        .filter((item): item is string => Boolean(item))
        .map((item) => normalizeLifestyleToken(item))
    : [];
  return Array.from(new Set([...tagValues, ...preferenceValues]));
};

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

  if (filters.interests && filters.interests.length > 0) {
    const profileInterests = profile.interests ?? [];
    const matchesInterest = profileInterests.some((interest) =>
      filters.interests?.includes(interest)
    );
    if (!matchesInterest) return false;
  }

  if (filters.lifestyle && filters.lifestyle.length > 0) {
    if (profile.housing_situation !== 'offering') {
      const profileLifestyle = getProfileLifestyleValues(profile);
      if (profileLifestyle.length > 0) {
        const lifestyleLabels = filters.lifestyle.map((id) =>
          normalizeLifestyleToken(lifestyleLabelById.get(id) ?? id)
        );
        const matchesLifestyle = profileLifestyle.some((chip) =>
          lifestyleLabels.includes(chip)
        );
        if (!matchesLifestyle) return false;
      }
    }
  }

  if (filters.ageRange && filters.ageRange.length === 2) {
    const [minAge, maxAge] = filters.ageRange;
    if (profile.birth_date) {
      const birth = new Date(profile.birth_date);
      if (!Number.isNaN(birth.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        const dayDiff = today.getDate() - birth.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age -= 1;
        }
        if (age < minAge || age > maxAge) {
          return false;
        }
      }
    }
  }

  if (filters.userType && filters.userType.length > 0 && !filters.userType.includes('any')) {
    const occupation = (profile.occupation ?? '').toLowerCase();
    const profileUserType =
      occupation.includes('estud') || occupation.includes('student')
        ? 'student'
        : 'professional';
    if (!filters.userType.includes(profileUserType)) {
      return false;
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

function matchesGenderPolicy(
  profileGender: string | undefined,
  policy?: FlatGenderPolicy | null
): boolean {
  if (!policy || policy === 'mixed') return true;
  if (policy === 'men_only') return profileGender === 'male';
  if (policy === 'flinta') return Boolean(profileGender && profileGender !== 'male');
  return true;
}

function matchesRoomForProfile(profile: Profile, room: RoomWithFlat): boolean {
  const roomPrice = room.price_per_month;
  const min = profile.budget_min ?? null;
  const max = profile.budget_max ?? null;
  if (min == null && max == null) return false;
  if (min != null && roomPrice < min) return false;
  if (max != null && roomPrice > max) return false;

  if (!matchesGenderPolicy(profile.gender, room.flat?.gender_policy ?? null)) {
    return false;
  }

  const zones = profile.preferred_zones ?? [];
  if (zones.length > 0) {
    const district = room.flat?.district ?? null;
    if (district && !zones.includes(district)) {
      return false;
    }
  }

  return true;
}

function matchesOfferingConstraints(
  profile: Profile,
  availableRooms: RoomWithFlat[]
): boolean {
  if (profile.housing_situation !== 'seeking') return false;
  return availableRooms.some((room) => matchesRoomForProfile(profile, room));
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

function calculateProfileCompatibilityScore(
  seekerProfile: Profile,
  targetProfile: Profile
): {
  score: number;
  breakdown: {
    housing_complementarity: number;
    preferred_zones: number;
    budget_overlap: number;
    shared_interests: number;
    lifestyle_fit: number;
  };
} {
  const POINTS = {
    housingComplementarity: 25,
    preferredZones: 20,
    budgetOverlap: 20,
    sharedInterests: 25,
    lifestyleFit: 10,
  } as const;

  const housingComplementarity =
    seekerProfile.housing_situation &&
    targetProfile.housing_situation &&
    seekerProfile.housing_situation !== targetProfile.housing_situation
      ? POINTS.housingComplementarity
      : 0;

  const seekerZones = seekerProfile.preferred_zones ?? [];
  const targetZones = targetProfile.preferred_zones ?? [];
  const hasZoneOverlap =
    seekerZones.length > 0 &&
    targetZones.length > 0 &&
    seekerZones.some((zone) => targetZones.includes(zone));
  const preferredZones = hasZoneOverlap ? POINTS.preferredZones : 0;

  const seekerMin = seekerProfile.budget_min ?? null;
  const seekerMax = seekerProfile.budget_max ?? null;
  const targetMin = targetProfile.budget_min ?? null;
  const targetMax = targetProfile.budget_max ?? null;

  let budgetOverlap = 0;
  if (
    seekerMin != null &&
    seekerMax != null &&
    targetMin != null &&
    targetMax != null &&
    seekerMin <= seekerMax &&
    targetMin <= targetMax
  ) {
    const overlapMin = Math.max(seekerMin, targetMin);
    const overlapMax = Math.min(seekerMax, targetMax);
    const overlap = Math.max(0, overlapMax - overlapMin);
    const unionMin = Math.min(seekerMin, targetMin);
    const unionMax = Math.max(seekerMax, targetMax);
    const union = Math.max(0, unionMax - unionMin);

    if (overlap > 0 && union > 0) {
      budgetOverlap = Math.round((overlap / union) * POINTS.budgetOverlap);
    } else if (seekerMin === targetMin && seekerMax === targetMax) {
      budgetOverlap = POINTS.budgetOverlap;
    }
  }

  const seekerInterests = seekerProfile.interests ?? [];
  const targetInterests = targetProfile.interests ?? [];
  const sharedInterestsCount = seekerInterests.filter((interest) =>
    targetInterests.includes(interest)
  ).length;
  const sharedInterests = Math.min(sharedInterestsCount, 5) * 5;

  const seekerLifestyle = seekerProfile.lifestyle_preferences ?? {};
  const targetLifestyle = targetProfile.lifestyle_preferences ?? {};
  const lifestyleKeys: Array<'schedule' | 'cleaning' | 'guests'> = [
    'schedule',
    'cleaning',
    'guests',
  ];
  const comparableLifestyleKeys = lifestyleKeys.filter(
    (key) => Boolean(seekerLifestyle[key]) && Boolean(targetLifestyle[key])
  );
  const matchingLifestyleCount = comparableLifestyleKeys.filter(
    (key) => seekerLifestyle[key] === targetLifestyle[key]
  ).length;
  const lifestyleFit =
    comparableLifestyleKeys.length > 0
      ? Math.round(
          (matchingLifestyleCount / comparableLifestyleKeys.length) *
            Math.round(POINTS.lifestyleFit / 2)
        )
      : 0;

  const seekerLifestyleTags = new Set(getProfileLifestyleValues(seekerProfile));
  const targetLifestyleTags = new Set(getProfileLifestyleValues(targetProfile));
  const sharedLifestyleTags = Array.from(seekerLifestyleTags).filter((tag) =>
    targetLifestyleTags.has(tag)
  ).length;
  const lifestyleTagsFit = Math.min(sharedLifestyleTags, 3);
  const totalLifestyleFit = Math.min(
    POINTS.lifestyleFit,
    lifestyleFit + lifestyleTagsFit
  );

  const total = Math.min(
    100,
    Math.max(
      0,
      housingComplementarity +
        preferredZones +
        budgetOverlap +
        sharedInterests +
        totalLifestyleFit
    )
  );

  return {
    score: total,
    breakdown: {
      housing_complementarity: housingComplementarity,
      preferred_zones: preferredZones,
      budget_overlap: budgetOverlap,
      shared_interests: sharedInterests,
      lifestyle_fit: totalLifestyleFit,
    },
  };
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

      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('*, users!profiles_id_fkey(birth_date)')
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

      let filteredProfiles = normalizedProfiles.filter((profile) =>
        matchesFilters(profile, filters, { skipBudgetForOffering: true })
      );

      if (seekerProfile.housing_situation === 'offering') {
        filteredProfiles = normalizedProfiles;
        const { data: rooms, error: roomsError } = await supabaseClient
          .from('rooms')
          .select(
            `
            id,
            owner_id,
            price_per_month,
            is_available,
            flat:flats(gender_policy, district, city, rules)
          `
          )
          .eq('owner_id', userId)
          .eq('is_available', true);

        if (roomsError) {
          console.error(
            '[profiles-recommendations] Error loading rooms:',
            roomsError
          );
          return new Response(
            JSON.stringify({ error: 'Failed to load rooms' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const availableRooms = (rooms ?? []) as RoomWithFlat[];
        if (availableRooms.length === 0) {
          return new Response(
            JSON.stringify({ recommendations: [] }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        filteredProfiles = filteredProfiles.filter((profile) =>
          matchesOfferingConstraints(profile, availableRooms)
        );
      } else {
        const hasBudgetFilter =
          typeof filters?.budgetMin === 'number' ||
          typeof filters?.budgetMax === 'number';
        const hasCityFilter = (filters?.city ?? []).length > 0;
        const hasRoomCountFilter = (filters?.roomCount ?? []).length > 0;
        const rulePreferences = filters?.rules ?? {};
        const hasRuleFilters = Object.values(rulePreferences).some(
          (value) => value && value !== 'flexible'
        );

        if (
          filters?.housingSituation === 'offering' &&
          (hasBudgetFilter || hasRuleFilters || hasCityFilter || hasRoomCountFilter)
        ) {
          const min =
            typeof filters.budgetMin === 'number' ? filters.budgetMin : 0;
          const max =
            typeof filters.budgetMax === 'number' ? filters.budgetMax : 1000000;
          const ownerIds = filteredProfiles.map((profile) => profile.id);
          if (ownerIds.length > 0) {
            let roomsQuery = supabaseClient
              .from('rooms')
              .select('id, owner_id, price_per_month, flat:flats(rules, city)')
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
              const roomCountByOwner = new Map<string, number>();
              const ownerHasMatchingRules = new Map<string, boolean>();
              (roomsInRange ?? []).forEach((room) => {
                const flatData = Array.isArray(room.flat) ? room.flat[0] : room.flat;
                const roomCity = flatData?.city ?? null;
                if (
                  hasCityFilter &&
                  (!roomCity || !(filters?.city ?? []).includes(roomCity))
                ) {
                  return;
                }

                roomCountByOwner.set(
                  room.owner_id,
                  (roomCountByOwner.get(room.owner_id) ?? 0) + 1
                );

                if (!hasRuleFilters) {
                  ownerHasMatchingRules.set(room.owner_id, true);
                  return;
                }
                const flatRules = parseFlatRules(flatData?.rules ?? null);
                if (matchesRulePreferences(rulePreferences, flatRules)) {
                  ownerHasMatchingRules.set(room.owner_id, true);
                }
              });

              roomCountByOwner.forEach((count, ownerId) => {
                if (hasRoomCountFilter) {
                  const requested = filters?.roomCount ?? [];
                  const matchesRoomCount = requested.some((item) =>
                    item >= 4 ? count >= 4 : count === item
                  );
                  if (!matchesRoomCount) return;
                }
                if (hasRuleFilters && !ownerHasMatchingRules.get(ownerId)) return;
                ownersWithRooms.add(ownerId);
              });

              const filteredByRooms = filteredProfiles.filter((profile) =>
                ownersWithRooms.has(profile.id)
              );
              filteredProfiles = filteredByRooms;
            }
          }
        }
      }

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

        const matchReasons = generateProfileMatchReasons(
          seekerProfile,
          profile
        );

        recommendations.push({
          profile,
          compatibility_score: compatibility.score,
          compatibility_breakdown: compatibility.breakdown,
          match_reasons: matchReasons,
        });
      }

      recommendations
        .map((recommendation, index) => ({ recommendation, index }))
        .sort((a, b) => {
          const scoreDiff =
            b.recommendation.compatibility_score -
            a.recommendation.compatibility_score;
          return scoreDiff !== 0 ? scoreDiff : a.index - b.index;
        })
        .forEach((item, index) => {
          recommendations[index] = item.recommendation;
        });

      const response: RecommendationResponse = {
        recommendations,
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
