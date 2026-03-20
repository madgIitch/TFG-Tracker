import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FiltersScreen } from '../../src/screens/FiltersScreen';
import { useSwipeFilters, DEFAULT_SWIPE_FILTERS } from '../../src/context/SwipeFiltersContext';
import { usePremium } from '../../src/context/PremiumContext';

// Mock contexts
jest.mock('../../src/context/SwipeFiltersContext', () => ({
  useSwipeFilters: jest.fn(),
  DEFAULT_SWIPE_FILTERS: {
    housingSituation: 'any',
    gender: 'any',
    budgetMin: 0,
    budgetMax: 1200,
    ageMin: 18,
    ageMax: 99,
    roomsMin: 1,
    roomsMax: 10,
    userType: [],
    city: [],
    zones: [],
    lifestyle: [],
    interests: [],
    rules: {},
  },
}));

jest.mock('../../src/context/PremiumContext', () => ({
  usePremium: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/services/profileService', () => ({
  profileService: {
    getProfile: jest.fn().mockResolvedValue({ housing_situation: 'seeking', gender: 'any', is_premium: false }),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

describe('FiltersScreen', () => {
  const mockSetFilters = jest.fn();
  const mockResetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSwipeFilters as jest.Mock).mockReturnValue({
      filters: DEFAULT_SWIPE_FILTERS,
      setFilters: mockSetFilters,
      resetFilters: mockResetFilters,
    });
  });

  it('renders correctly and hides premium features when not premium', async () => {
    (usePremium as jest.Mock).mockReturnValue({ isPremium: false, loading: false });

    let root: any;
    await waitFor(async () => {
      root = render(<FiltersScreen />);
    });
    
    const { getByText } = root;
    expect(getByText('Premium')).toBeTruthy(); // Premium indicator lock
    expect(getByText('Limpiar')).toBeTruthy();
  });

  it('active filters counter updates based on draft comparison', async () => {
    (usePremium as jest.Mock).mockReturnValue({ isPremium: false, loading: false });
    const filtersWithChanges = { ...DEFAULT_SWIPE_FILTERS, ageMin: 25, city: ['madrid'] };
    
    (useSwipeFilters as jest.Mock).mockReturnValue({
      filters: filtersWithChanges,
      setFilters: mockSetFilters,
      resetFilters: mockResetFilters,
    });

    let root: any;
    await waitFor(async () => {
      root = render(<FiltersScreen />);
    });
    
    const { getByText } = root;
    
    // Counter should show 2 changes (age limits count as 1, city as 1 => actually age is 1 field differ)  
    // Wait, the hook uses the initial filters from context to populate draft.
    expect(getByText('Filtros (2)')).toBeTruthy();
  });

  it('unlocks premium filters when user is premium', async () => {
    (usePremium as jest.Mock).mockReturnValue({ isPremium: true, loading: false });

    let root: any;
    await waitFor(async () => {
      root = render(<FiltersScreen />);
    });
    const { queryByText } = root;
    
    expect(queryByText('Premium')).toBeNull(); // No lock indicator
  });

  it('resets draft to defaults and saves on apply', async () => {
    (usePremium as jest.Mock).mockReturnValue({ isPremium: true, loading: false });
    
    let root: any;
    await waitFor(async () => {
      root = render(<FiltersScreen />);
    });
    const { getByText } = root;

    const resetBtn = getByText('Limpiar');
    fireEvent.press(resetBtn);

    const applyBtn = getByText('Aplicar filtros');
    fireEvent.press(applyBtn);

    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining(DEFAULT_SWIPE_FILTERS));
    });
  });
});
