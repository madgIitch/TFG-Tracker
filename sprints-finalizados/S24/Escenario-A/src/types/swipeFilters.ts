import type { GenderFilter } from './gender';

export type HousingFilter = 'any' | 'seeking' | 'offering';
export type UserTypeFilter = 'student' | 'professional' | 'any';

export interface SwipeFilters {
  housingSituation: HousingFilter;
  gender: GenderFilter;
  budgetMin: number;
  budgetMax: number;
  zones: string[];
  city: string[];
  roomCount: number[];
  userType: UserTypeFilter[];
  ageRange: [number, number];
  lifestyle: string[];
  interests: string[];
  rules?: Record<string, string | null>;
}
