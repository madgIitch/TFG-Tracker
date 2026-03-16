const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('SwipeFiltersContext helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('countActiveFilters returns 0 for DEFAULT_SWIPE_FILTERS', () => {
    const {
      countActiveFilters,
      DEFAULT_SWIPE_FILTERS,
    } = require('../../src/context/SwipeFiltersContext');

    expect(countActiveFilters(DEFAULT_SWIPE_FILTERS)).toBe(0);
  });

  it('countActiveFilters counts extended filters (age/city/roomCount/userType)', () => {
    const {
      countActiveFilters,
      DEFAULT_SWIPE_FILTERS,
    } = require('../../src/context/SwipeFiltersContext');

    const filters = {
      ...DEFAULT_SWIPE_FILTERS,
      ageRange: [20, 30],
      city: ['sevilla'],
      roomCount: [2],
      userType: ['student'],
    };

    expect(countActiveFilters(filters)).toBe(4);
  });

  it('countActiveFilters counts rules only when non-flexible values are selected', () => {
    const {
      countActiveFilters,
      DEFAULT_SWIPE_FILTERS,
    } = require('../../src/context/SwipeFiltersContext');

    const flexibleOnly = {
      ...DEFAULT_SWIPE_FILTERS,
      rules: { ruido: 'flexible' },
    };
    const strictRule = {
      ...DEFAULT_SWIPE_FILTERS,
      rules: { ruido: 'ruido_23_08' },
    };

    expect(countActiveFilters(flexibleOnly)).toBe(0);
    expect(countActiveFilters(strictRule)).toBe(1);
  });
});
