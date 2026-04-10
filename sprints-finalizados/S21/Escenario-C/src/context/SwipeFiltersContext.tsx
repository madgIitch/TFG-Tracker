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
const DEFAULT_AGE_RANGE: [number, number] = [18, 60];

export const DEFAULT_SWIPE_FILTERS: SwipeFilters = {
  housingSituation: 'any',
  gender: 'any',
  budgetMin: DEFAULT_BUDGET_MIN,
  budgetMax: DEFAULT_BUDGET_MAX,
  ageRange: DEFAULT_AGE_RANGE,
  zones: [],
  city: [],
  roomCount: [],
  userType: [],
  lifestyle: [],
  interests: [],
  rules: {},
};

const sanitizeStoredFilters = (raw: unknown): SwipeFilters => {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SWIPE_FILTERS;
  }

  const parsed = raw as Partial<SwipeFilters>;
  const maybeAgeRange = parsed.ageRange;
  const ageRange: [number, number] =
    Array.isArray(maybeAgeRange) &&
    maybeAgeRange.length === 2 &&
    typeof maybeAgeRange[0] === 'number' &&
    typeof maybeAgeRange[1] === 'number'
      ? [
          Math.max(DEFAULT_AGE_RANGE[0], maybeAgeRange[0]),
          Math.min(DEFAULT_AGE_RANGE[1], maybeAgeRange[1]),
        ]
      : DEFAULT_AGE_RANGE;

  return {
    ...DEFAULT_SWIPE_FILTERS,
    ...parsed,
    ageRange,
    zones: Array.isArray(parsed.zones) ? parsed.zones : [],
    city: Array.isArray(parsed.city) ? parsed.city : [],
    roomCount: Array.isArray(parsed.roomCount) ? parsed.roomCount : [],
    userType: Array.isArray(parsed.userType) ? parsed.userType : [],
    lifestyle: Array.isArray(parsed.lifestyle) ? parsed.lifestyle : [],
    interests: Array.isArray(parsed.interests) ? parsed.interests : [],
    rules:
      parsed.rules && typeof parsed.rules === 'object' ? parsed.rules : {},
  };
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
  if (
    filters.ageRange[0] !== DEFAULT_SWIPE_FILTERS.ageRange[0] ||
    filters.ageRange[1] !== DEFAULT_SWIPE_FILTERS.ageRange[1]
  ) {
    count += 1;
  }
  if (filters.zones.length > 0) count += 1;
  if (filters.city.length > 0) count += 1;
  if (filters.roomCount.length > 0) count += 1;
  if (filters.userType.length > 0) count += 1;
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
          const parsed = JSON.parse(stored) as unknown;
          setFiltersState(sanitizeStoredFilters(parsed));
        }
      } catch (error) {
        console.warn('Error loading swipe filters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilters().catch((error) => {
      console.warn('Error loading swipe filters:', error);
    });
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
