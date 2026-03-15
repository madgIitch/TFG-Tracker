const mockGetAccessToken = jest.fn();
const mockRefreshToken = jest.fn();
const mockLogTokenDiagnostics = jest.fn();

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

jest.mock('../../src/services/authService', () => ({
  authService: {
    getAccessToken: mockGetAccessToken,
    refreshToken: mockRefreshToken,
    logTokenDiagnostics: mockLogTokenDiagnostics,
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    mockGetAccessToken.mockResolvedValue('token-1');
    mockStorage.getItem.mockResolvedValue('token-1');
  });

  it('getProfile returns null on 404', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { profileService } = require('../../src/services/profileService');
    const result = await profileService.getProfile();
    expect(result).toBeNull();
  });

  it('getProfile retries on 401 after token refresh', async () => {
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        clone: () => ({ json: async () => ({ error: 'expired' }) }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'p1',
            user_id: 'p1',
            display_name: 'Ana',
            bio: null,
            occupation: null,
            university: null,
            field_of_study: null,
            interests: [],
            lifestyle_preferences: null,
            housing_situation: null,
            preferred_zones: [],
            budget_min: null,
            budget_max: null,
            avatar_url: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        }),
      });
    mockRefreshToken.mockResolvedValue('token-2');

    const { profileService } = require('../../src/services/profileService');
    const result = await profileService.getProfile();

    expect(result?.id).toBe('p1');
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('createOrUpdateProfile updates when profile already exists', async () => {
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'p1',
            user_id: 'p1',
            display_name: 'Ana',
            bio: null,
            occupation: null,
            university: null,
            field_of_study: null,
            interests: [],
            lifestyle_preferences: null,
            housing_situation: null,
            preferred_zones: [],
            budget_min: null,
            budget_max: null,
            avatar_url: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'p1',
            user_id: 'p1',
            display_name: 'Ana Updated',
            bio: null,
            occupation: null,
            university: null,
            field_of_study: null,
            interests: [],
            lifestyle_preferences: null,
            housing_situation: null,
            preferred_zones: [],
            budget_min: null,
            budget_max: null,
            avatar_url: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-02',
          },
        }),
      });

    const { profileService } = require('../../src/services/profileService');
    const result = await profileService.createOrUpdateProfile({
      display_name: 'Ana Updated',
    });

    expect(result.display_name).toBe('Ana Updated');
    const updateCall = (globalThis.fetch as jest.Mock).mock.calls[1];
    expect(updateCall[1].method).toBe('PATCH');
  });

  it('getProfileRecommendations normalizes compatibility score to 0-100', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        recommendations: [
          {
            profile: {
              id: 'p2',
              user_id: 'p2',
              display_name: 'Luna',
              bio: null,
              occupation: null,
              university: null,
              field_of_study: null,
              interests: [],
              lifestyle_preferences: null,
              housing_situation: null,
              preferred_zones: [],
              budget_min: null,
              budget_max: null,
              avatar_url: null,
              created_at: '2026-01-01',
              updated_at: '2026-01-01',
            },
            compatibility_score: 0.82,
            compatibility_breakdown: {
              housing_complementarity: 25,
              preferred_zones: 20,
              budget_overlap: 12,
              shared_interests: 20,
              lifestyle_fit: 5,
            },
            match_reasons: [],
          },
          {
            profile: {
              id: 'p3',
              user_id: 'p3',
              display_name: 'Sara',
              bio: null,
              occupation: null,
              university: null,
              field_of_study: null,
              interests: [],
              lifestyle_preferences: null,
              housing_situation: null,
              preferred_zones: [],
              budget_min: null,
              budget_max: null,
              avatar_url: null,
              created_at: '2026-01-01',
              updated_at: '2026-01-01',
            },
            compatibility_score: 105,
            match_reasons: [],
          },
        ],
      }),
    });

    const { profileService } = require('../../src/services/profileService');
    const recommendations = await profileService.getProfileRecommendations();

    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].compatibility_score).toBe(82);
    expect(recommendations[0].compatibility_breakdown).toMatchObject({
      housing_complementarity: 25,
      lifestyle_fit: 5,
    });
    expect(recommendations[1].compatibility_score).toBe(100);
  });
});

export {};
