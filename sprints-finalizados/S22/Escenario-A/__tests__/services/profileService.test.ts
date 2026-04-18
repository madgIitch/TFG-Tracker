const mockGetAccessToken = jest.fn();
const mockRefreshToken = jest.fn();
const mockLogTokenDiagnostics = jest.fn();

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
    global.fetch = jest.fn();
    mockGetAccessToken.mockResolvedValue('token-1');
  });

  it('getProfile returns null on 404', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { profileService } = require('../../src/services/profileService');
    const result = await profileService.getProfile();
    expect(result).toBeNull();
  });

  it('getProfile retries on 401 after token refresh', async () => {
    (global.fetch as jest.Mock)
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
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('createOrUpdateProfile updates when profile already exists', async () => {
    (global.fetch as jest.Mock)
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
    const updateCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(updateCall[1].method).toBe('PATCH');
  });

  it('getProfileRecommendations keeps compatibility score in 0-100 scale', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        recommendations: [
          {
            profile: {
              id: 'p2',
              user_id: 'p2',
              display_name: 'Marta',
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
            compatibility_score: 82.4,
            match_reasons: [],
          },
        ],
      }),
    });

    const { profileService } = require('../../src/services/profileService');
    const result = await profileService.getProfileRecommendations();

    expect(result).toHaveLength(1);
    expect(result[0].compatibility_score).toBe(82);
  });

  it('getProfileRecommendations forwards advanced filters payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ recommendations: [] }),
    });

    const { profileService } = require('../../src/services/profileService');
    await profileService.getProfileRecommendations({
      housingSituation: 'seeking',
      gender: 'any',
      budgetMin: 400,
      budgetMax: 900,
      zones: ['nervion'],
      city: ['Sevilla'],
      roomCount: [1, 2],
      userType: ['student'],
      ageRange: [21, 33],
      lifestyle: [],
      interests: ['musica'],
      rules: {},
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.filters.city).toEqual(['Sevilla']);
    expect(body.filters.roomCount).toEqual([1, 2]);
    expect(body.filters.userType).toEqual(['student']);
    expect(body.filters.ageRange).toEqual([21, 33]);
  });
});
