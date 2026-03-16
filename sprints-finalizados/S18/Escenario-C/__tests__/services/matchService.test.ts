jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('matchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('getMatch returns mapped payload data on 200', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 'm1',
          user_a_id: 'u1',
          user_b_id: 'u2',
          status: 'accepted',
        },
      }),
    });

    const { matchService } = require('../../src/services/matchService');
    const result = await matchService.getMatch('m1');

    expect(result).toEqual({
      id: 'm1',
      user_a_id: 'u1',
      user_b_id: 'u2',
      status: 'accepted',
    });
  });

  it('getMatch returns null on 404', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { matchService } = require('../../src/services/matchService');
    const result = await matchService.getMatch('missing');

    expect(result).toBeNull();
  });
});

export {};
