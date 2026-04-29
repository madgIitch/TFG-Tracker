import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { SwipeScreen } from '../../src/screens/SwipeScreen';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('@react-native-community/blur', () => ({ BlurView: 'BlurView' }));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      text: '#111827',
      textSecondary: '#6B7280',
      primary: '#7C3AED',
      error: '#DC2626',
      border: '#E5E7EB',
      cardSurface: '#FFFFFF',
      cardSurfaceAlt: '#F8FAFC',
      glassStroke: 'rgba(255,255,255,0.5)',
      glassSurface: 'rgba(255,255,255,0.7)',
      glassSurfaceStrong: 'rgba(255,255,255,0.85)',
      glassOverlayStrong: 'rgba(15,23,42,0.45)',
      contentBackgroundMuted: '#F3F4F6',
      background: '#FFFFFF',
    },
  }),
}));

const mockCanUseFeature = jest.fn();

jest.mock('../../src/context/PremiumContext', () => ({
  usePremium: () => ({
    isPremium: false,
    loading: false,
    canUseFeature: (...args: unknown[]) => mockCanUseFeature(...args),
    requiresUpgrade: () => false,
    refetch: jest.fn(),
  }),
}));

const mockResetFilters = jest.fn();
const mockSetFilters = jest.fn();

jest.mock('../../src/context/SwipeFiltersContext', () => ({
  useSwipeFilters: () => ({
    filters: {
      housingSituation: 'any',
      gender: 'any',
      budgetMin: 0,
      budgetMax: 1200,
      ageRange: [18, 60],
      zones: [],
      city: [],
      roomCount: [],
      userType: [],
      lifestyle: [],
      interests: [],
      rules: {},
    },
    resetFilters: (...args: unknown[]) => mockResetFilters(...args),
    setFilters: (...args: unknown[]) => mockSetFilters(...args),
  }),
  countActiveFilters: () => 0,
}));

const mockGetProfile = jest.fn();
const mockGetProfileRecommendations = jest.fn();

jest.mock('../../src/services/profileService', () => ({
  profileService: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
    getProfileRecommendations: (...args: unknown[]) => mockGetProfileRecommendations(...args),
  },
}));

const mockGetMatches = jest.fn();
jest.mock('../../src/services/chatService', () => ({
  chatService: {
    getMatches: (...args: unknown[]) => mockGetMatches(...args),
  },
}));

const mockGetRejections = jest.fn();
jest.mock('../../src/services/swipeRejectionService', () => ({
  swipeRejectionService: {
    getRejections: (...args: unknown[]) => mockGetRejections(...args),
    rejectProfile: jest.fn(),
  },
}));

jest.mock('../../src/services/profilePhotoService', () => ({
  profilePhotoService: {
    getPhotosForProfile: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../src/services/authService', () => ({
  authService: {
    refreshToken: jest.fn(),
  },
}));

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('SwipeScreen premium limits integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue({ housing_situation: 'seeking' });
    mockGetProfileRecommendations.mockResolvedValue([]);
    mockGetMatches.mockResolvedValue([]);
    mockGetRejections.mockResolvedValue([]);
  });

  it('shows remaining free swipes text for non premium users', async () => {
    mockCanUseFeature.mockReturnValue(false);
    mockStorage.getItem.mockResolvedValue(JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: 5 }));

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<SwipeScreen />);
      await Promise.resolve();
    });

    const texts = tree!.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(texts.some((value) => value.includes('libres'))).toBe(true);
  });

  it('shows unlimited text for premium users', async () => {
    mockCanUseFeature.mockImplementation((feature: string) => feature === 'daily_swipe_limit_bypass');
    mockStorage.getItem.mockResolvedValue(JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: 20 }));

    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<SwipeScreen />);
      await Promise.resolve();
    });

    const texts = tree!.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(texts).toContain('Ilimitados');
  });
});
