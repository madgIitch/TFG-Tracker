import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  DEFAULT_BUDGET_MAX, 
  DEFAULT_BUDGET_MIN, 
  DEFAULT_AGE_MAX, 
  DEFAULT_AGE_MIN, 
  DEFAULT_ROOMS_MAX, 
  DEFAULT_ROOMS_MIN 
} from '../constants/swipeFilters';
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
  ageMin: DEFAULT_AGE_MIN,
  ageMax: DEFAULT_AGE_MAX,
  roomsMin: DEFAULT_ROOMS_MIN,
  roomsMax: DEFAULT_ROOMS_MAX,
  userType: [],
  city: [],
  zones: [],
  lifestyle: [],
  interests: [],
  rules: {},
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
          const parsed = JSON.parse(stored) as SwipeFilters;
          setFiltersState({
            ...DEFAULT_SWIPE_FILTERS,
            ...parsed,
            userType: parsed.userType || [],
            city: parsed.city || [],
            zones: parsed.zones || [],
            lifestyle: parsed.lifestyle || [],
            interests: parsed.interests || [],
            rules: parsed.rules || {},
          });
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
