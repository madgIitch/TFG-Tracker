import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SwipeFiltersProvider,
  countActiveFilters,
  useSwipeFilters,
} from '../../src/context/SwipeFiltersContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SwipeFiltersContext', () => {
  it('hydrates old storage payloads with new defaults', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        housingSituation: 'any',
        gender: 'any',
        budgetMin: 100,
        budgetMax: 800,
        zones: ['nervion'],
        lifestyle: [],
        interests: [],
      })
    );

    let latest: ReturnType<typeof useSwipeFilters> | null = null;
    const Probe = () => {
      latest = useSwipeFilters();
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <SwipeFiltersProvider>
          <Probe />
        </SwipeFiltersProvider>
      );
    });

    expect(latest).not.toBeNull();
    expect(latest?.filters.city).toEqual([]);
    expect(latest?.filters.roomCount).toEqual([]);
    expect(latest?.filters.userType).toEqual([]);
    expect(latest?.filters.ageRange).toEqual([18, 60]);
  });

  it('normalizes reversed age range when setting filters', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    let latest: ReturnType<typeof useSwipeFilters> | null = null;
    const Probe = () => {
      latest = useSwipeFilters();
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <SwipeFiltersProvider>
          <Probe />
        </SwipeFiltersProvider>
      );
    });

    await ReactTestRenderer.act(async () => {
      await latest?.setFilters({
        housingSituation: 'any',
        gender: 'any',
        budgetMin: 0,
        budgetMax: 1200,
        zones: [],
        city: [],
        roomCount: [],
        userType: [],
        ageRange: [60, 18],
        lifestyle: [],
        interests: [],
        rules: {},
      });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const saved = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1] as string
    );
    expect(saved.ageRange).toEqual([18, 60]);
  });

  it('counts newly added filters as active', () => {
    const count = countActiveFilters({
      housingSituation: 'any',
      gender: 'any',
      budgetMin: 0,
      budgetMax: 1200,
      zones: [],
      city: ['Sevilla'],
      roomCount: [2],
      userType: ['student'],
      ageRange: [20, 30],
      lifestyle: [],
      interests: [],
      rules: {},
    });

    expect(count).toBe(4);
  });
});
