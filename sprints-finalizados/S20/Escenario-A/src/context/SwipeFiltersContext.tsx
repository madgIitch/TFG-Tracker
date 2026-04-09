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

export const DEFAULT_SWIPE_FILTERS: SwipeFilters = {
  housingSituation: 'any',
  gender: 'any',
  budgetMin: DEFAULT_BUDGET_MIN,
  budgetMax: DEFAULT_BUDGET_MAX,
  zones: [],
  city: [],
  roomCount: [],
  userType: [],
  ageRange: [18, 60],
  lifestyle: [],
  interests: [],
  rules: {},
};

const normalizeFilters = (raw: Partial<SwipeFilters>): SwipeFilters => {
  const next: SwipeFilters = {
    ...DEFAULT_SWIPE_FILTERS,
    ...raw,
  };

  const ageRange = Array.isArray(raw.ageRange) ? raw.ageRange : undefined;
  if (ageRange && ageRange.length === 2) {
    const min = Number(ageRange[0]);
    const max = Number(ageRange[1]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      next.ageRange = [Math.min(min, max), Math.max(min, max)];
    }
  }

  return next;
};

export const countActiveFilters = (filters: SwipeFilters): number => {
  let count = 0;

  if (filters.housingSituation !== DEFAULT_SWIPE_FILTERS.housingSituation) count += 1;
  if (filters.gender !== DEFAULT_SWIPE_FILTERS.gender) count += 1;
  if (
    filters.budgetMin !== DEFAULT_SWIPE_FILTERS.budgetMin ||
    filters.budgetMax !== DEFAULT_SWIPE_FILTERS.budgetMax
  ) {
    count += 1;
  }
  if (filters.zones.length > 0) count += 1;
  if (filters.city.length > 0) count += 1;
  if (filters.roomCount.length > 0) count += 1;
  if (
    filters.userType.length > 0 &&
    !filters.userType.includes('any')
  ) {
    count += 1;
  }
  if (
    filters.ageRange[0] !== DEFAULT_SWIPE_FILTERS.ageRange[0] ||
    filters.ageRange[1] !== DEFAULT_SWIPE_FILTERS.ageRange[1]
  ) {
    count += 1;
  }
  if (filters.lifestyle.length > 0) count += 1;
  if (filters.interests.length > 0) count += 1;

  const hasRuleFilters = Object.values(filters.rules ?? {}).some(
    (value) => value && value !== 'flexible'
  );
  if (hasRuleFilters) count += 1;

  return count;
};

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
          setFiltersState(normalizeFilters(parsed));
        }
      } catch (error) {
        console.warn('Error loading swipe filters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, []);

  const persistFilters = async (next: SwipeFilters) => {
    const normalized = normalizeFilters(next);
    setFiltersState(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
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
