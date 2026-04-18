import type { GenderFilter } from './gender';

export type HousingFilter = 'any' | 'seeking' | 'offering';

export interface SwipeFilters {
  housingSituation: HousingFilter;
  gender: GenderFilter;
  budgetMin: number;
  budgetMax: number;
  ageRange: [number, number];
  zones: string[];
  city: string[];
  roomCount: number[];
  userType: string[];
  lifestyle: string[];
  interests: string[];
  rules?: Record<string, string | null>;
}
