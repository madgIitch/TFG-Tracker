const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

const mockRefreshToken = jest.fn();
jest.mock('../../src/services/authService', () => ({
  authService: {
    refreshToken: (...args: unknown[]) => mockRefreshToken(...args),
  },
}));

describe('chatService lifestyle integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockImplementation(async (key: string) => {
      if (key === 'authToken') return 'token-1';
      if (key === 'authUser') return JSON.stringify({ id: 'me' });
      return null;
    });
  });

  it('maps lifestyle_tags from chat detail counterpart profile', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 'chat-1',
          match_id: 'match-1',
          updated_at: '2026-03-20T10:00:00.000Z',
          match: {
            user_a_id: 'me',
            user_b: {
              id: 'u2',
              display_name: 'Lucia',
              avatar_url: null,
              lifestyle_tags: ['madrugador', 'deportista'],
              interests: ['musica'],
            },
            status: 'accepted',
          },
        },
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const chat = await chatService.getChatDetails('chat-1');

    expect(chat.profile).toBeDefined();
    expect(chat.profile.lifestyle_tags).toEqual(['madrugador', 'deportista']);
    expect(chat.profile.interests).toEqual(['musica']);
  });
});

