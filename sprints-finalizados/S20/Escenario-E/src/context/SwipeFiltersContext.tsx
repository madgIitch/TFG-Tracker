import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_BUDGET_MAX, DEFAULT_BUDGET_MIN } from '../constants/swipeFilters';
import type { SwipeFilters } from '../types/swipeFilters';

type SwipeFiltersContextType = {
  filters: SwipeFilters;
  setFilters: (next: SwipeFilters) => Promise<void>;
  resetFilters: () => Promise<void>;
  loading: boolean;
};

const STORAGE_KEY = 'swipeFilters';

export const DEFAULT_AGE_MIN = 18;
export const DEFAULT_AGE_MAX = 60;

export const DEFAULT_SWIPE_FILTERS: SwipeFilters = {
  housingSituation: 'any',
  gender: 'any',
  budgetMin: DEFAULT_BUDGET_MIN,
  budgetMax: DEFAULT_BUDGET_MAX,
  zones: [],
  lifestyle: [],
  interests: [],
  rules: {},
  city: [],
  roomCount: [],
  userType: [],
  ageRange: [DEFAULT_AGE_MIN, DEFAULT_AGE_MAX],
};

export function countActiveFilters(filters: SwipeFilters): number {
  let count = 0;
  if (filters.housingSituation !== 'any') count++;
  if (filters.gender !== 'any') count++;
  if (
    filters.budgetMin !== DEFAULT_BUDGET_MIN ||
    filters.budgetMax !== DEFAULT_BUDGET_MAX
  )
    count++;
  if ((filters.zones ?? []).length > 0) count++;
  if ((filters.lifestyle ?? []).length > 0) count++;
  if ((filters.interests ?? []).length > 0) count++;
  if (filters.rules && Object.values(filters.rules).some((v) => v != null))
    count++;
  if ((filters.city ?? []).length > 0) count++;
  if ((filters.roomCount ?? []).length > 0) count++;
  if ((filters.userType ?? []).length > 0) count++;
  if (
    (filters.ageRange?.[0] ?? DEFAULT_AGE_MIN) !== DEFAULT_AGE_MIN ||
    (filters.ageRange?.[1] ?? DEFAULT_AGE_MAX) !== DEFAULT_AGE_MAX
  )
    count++;
  return count;
}

const SwipeFiltersContext = createContext<SwipeFiltersContextType | undefined>(
  undefined
);

export const SwipeFiltersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [filters, setFiltersState] = useState<SwipeFilters>(
    DEFAULT_SWIPE_FILTERS
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<SwipeFilters>;
          // Defensive merge: fill any missing or null fields with defaults
          const merged = { ...DEFAULT_SWIPE_FILTERS, ...parsed };
          setFiltersState({
            ...merged,
            zones: Array.isArray(merged.zones) ? merged.zones : [],
            lifestyle: Array.isArray(merged.lifestyle) ? merged.lifestyle : [],
            interests: Array.isArray(merged.interests) ? merged.interests : [],
            city: Array.isArray(merged.city) ? merged.city : [],
            roomCount: Array.isArray(merged.roomCount) ? merged.roomCount : [],
            userType: Array.isArray(merged.userType) ? merged.userType : [],
            ageRange: Array.isArray(merged.ageRange) && merged.ageRange.length === 2
              ? merged.ageRange
              : [DEFAULT_AGE_MIN, DEFAULT_AGE_MAX],
          });
        }
      } catch (error) {
        console.warn('Error loading swipe filters:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadFilters();
  }, []);

  const persistFilters = async (next: SwipeFilters) => {
    setFiltersState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setFilters = async (next: SwipeFilters) => {
    await persistFilters(next);
  };

  const resetFilters = async () => {
    await persistFilters(DEFAULT_SWIPE_FILTERS);
  };

  return (
    <SwipeFiltersContext.Provider
      value={{ filters, setFilters, resetFilters, loading }}
    >
      {children}
    </SwipeFiltersContext.Provider>
  );
};

export const useSwipeFilters = () => {
  const context = useContext(SwipeFiltersContext);
  if (!context) {
    throw new Error('useSwipeFilters must be used within SwipeFiltersProvider');
  }
  return context;
};
