import type { Profile, RoomRecommendation } from './types.ts';

export interface CompatibilityBreakdown {
  housing_situation: number;
  preferred_zones: number;
  budget_overlap: number;
  interests: number;
  lifestyle: number;
  total: number;
}

const POINTS = {
  housing: 25,
  zones: 20,
  budget: 20,
  interestPerMatch: 5,
  interestMax: 25,
  lifestylePerTag: 2,
  lifestyleTagMax: 10,
  lifestyleSchedule: 2,
  lifestyleCleaning: 1,
  lifestyleGuests: 1,
} as const;

type BudgetRange = {
  min: number;
  max: number;
};

function isComplementaryHousingSituation(
  a?: string | null,
  b?: string | null
): boolean {
  return (
    (a === 'offering' && b === 'seeking') ||
    (a === 'seeking' && b === 'offering')
  );
}

function intersectionSize(a: string[], b: string[]): number {
  const setA = new Set(a);
  let count = 0;
  for (const item of b) {
    if (setA.has(item)) count += 1;
  }
  return count;
}

function toBudgetRange(profile: Profile): BudgetRange | null {
  const hasMin = typeof profile.budget_min === 'number';
  const hasMax = typeof profile.budget_max === 'number';

  if (!hasMin && !hasMax) return null;

  const rawMin = hasMin ? (profile.budget_min as number) : (profile.budget_max as number);
  const rawMax = hasMax ? (profile.budget_max as number) : (profile.budget_min as number);

  const min = Math.max(0, Math.min(rawMin, rawMax));
  const max = Math.max(min, Math.max(rawMin, rawMax));

  return { min, max };
}

function calculateBudgetOverlapPoints(a: Profile, b: Profile): number {
  const rangeA = toBudgetRange(a);
  const rangeB = toBudgetRange(b);
  if (!rangeA || !rangeB) return 0;

  const overlapMin = Math.max(rangeA.min, rangeB.min);
  const overlapMax = Math.min(rangeA.max, rangeB.max);
  const overlap = overlapMax - overlapMin;
  if (overlap <= 0) return 0;

  const unionMin = Math.min(rangeA.min, rangeB.min);
  const unionMax = Math.max(rangeA.max, rangeB.max);
  const union = unionMax - unionMin;
  if (union <= 0) return POINTS.budget;

  const ratio = overlap / union;
  return Math.round(POINTS.budget * ratio);
}

function calculateLifestylePoints(a: Profile, b: Profile): number {
  const tagsA = Array.from(new Set(a.lifestyle_tags ?? []));
  const tagsB = Array.from(new Set(b.lifestyle_tags ?? []));
  const sharedTagCount = intersectionSize(tagsA, tagsB);
  let points = Math.min(
    POINTS.lifestyleTagMax,
    sharedTagCount * POINTS.lifestylePerTag
  );

  const first = a.lifestyle_preferences ?? {};
  const second = b.lifestyle_preferences ?? {};

  if (first.schedule && second.schedule && first.schedule === second.schedule) {
    points += POINTS.lifestyleSchedule;
  }
  if (first.cleaning && second.cleaning && first.cleaning === second.cleaning) {
    points += POINTS.lifestyleCleaning;
  }
  if (first.guests && second.guests && first.guests === second.guests) {
    points += POINTS.lifestyleGuests;
  }

  return Math.min(POINTS.lifestyleTagMax, points);
}

export function calculateProfileCompatibilityScore(
  sourceProfile: Profile,
  targetProfile: Profile
): { score: number; breakdown: CompatibilityBreakdown } {
  const housingPoints = isComplementaryHousingSituation(
    sourceProfile.housing_situation,
    targetProfile.housing_situation
  )
    ? POINTS.housing
    : 0;

  const sourceZones = sourceProfile.preferred_zones ?? [];
  const targetZones = targetProfile.preferred_zones ?? [];
  const zonePoints =
    intersectionSize(sourceZones, targetZones) > 0 ? POINTS.zones : 0;

  const budgetPoints = calculateBudgetOverlapPoints(sourceProfile, targetProfile);

  const sourceInterests = Array.from(new Set(sourceProfile.interests ?? []));
  const targetInterests = Array.from(new Set(targetProfile.interests ?? []));
  const sharedInterests = intersectionSize(sourceInterests, targetInterests);
  const interestPoints = Math.min(
    POINTS.interestMax,
    sharedInterests * POINTS.interestPerMatch
  );

  const lifestylePoints = calculateLifestylePoints(sourceProfile, targetProfile);

  const total =
    housingPoints + zonePoints + budgetPoints + interestPoints + lifestylePoints;

  return {
    score: total,
    breakdown: {
      housing_situation: housingPoints,
      preferred_zones: zonePoints,
      budget_overlap: budgetPoints,
      interests: interestPoints,
      lifestyle: lifestylePoints,
      total,
    },
  };
}

export function sortRecommendationsByCompatibility(
  recommendations: RoomRecommendation[]
): RoomRecommendation[] {
  return recommendations
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const scoreDiff = b.item.compatibility_score - a.item.compatibility_score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
