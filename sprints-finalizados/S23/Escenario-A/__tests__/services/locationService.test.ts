const mockGetAccessToken = jest.fn();
const mockRefreshToken = jest.fn();

jest.mock('../../src/services/authService', () => ({
  authService: {
    getAccessToken: mockGetAccessToken,
    refreshToken: mockRefreshToken,
  },
}));

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockGetAccessToken.mockResolvedValue('token-1');
    mockRefreshToken.mockResolvedValue(null);
  });

  it('searchCities returns normalized list from edge function', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'city-sevilla', name: 'Sevilla', province_code: '41' },
          { id: 'city-madrid', name: 'Madrid', province_code: '28' },
        ],
      }),
    });

    const { locationService } = require('../../src/services/locationService');
    const cities = await locationService.searchCities('se');

    expect(cities).toHaveLength(2);
    expect(cities[0]).toEqual({
      id: 'city-sevilla',
      name: 'Sevilla',
      province_code: '41',
    });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/locations/cities?');
  });

  it('searchZones retries once on 401 and succeeds after token refresh', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 'zone-triana', city_id: 'city-sevilla', name: 'Triana' }],
        }),
      });
    mockRefreshToken.mockResolvedValueOnce('token-2');
    mockGetAccessToken.mockResolvedValueOnce('token-1').mockResolvedValueOnce('token-2');

    const { locationService } = require('../../src/services/locationService');
    const zones = await locationService.searchZones('city-sevilla', 'tri');

    expect(zones).toEqual([
      { id: 'zone-triana', city_id: 'city-sevilla', name: 'Triana' },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });

  it('searchCities throws when backend responds non-2xx', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'failed' }),
    });

    const { locationService } = require('../../src/services/locationService');

    await expect(locationService.searchCities('x')).rejects.toThrow(
      'Error searching cities (500)'
    );
  });
});
