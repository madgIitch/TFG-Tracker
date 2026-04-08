import type { GenderFilter } from './gender';

export type HousingFilter = 'any' | 'seeking' | 'offering';

export interface SwipeFilters {
  housingSituation: HousingFilter;
  gender: GenderFilter;
  budgetMin: number;
  budgetMax: number;
  ageMin?: number;
  ageMax?: number;
  roomsMin?: number;
  roomsMax?: number;
  userType: string[];
  city: string[];
  zones: string[];
  lifestyle: string[];
  interests: string[];
  rules?: Record<string, string | null>;
}
