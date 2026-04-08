const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

const mockRefreshToken = jest.fn();

jest.mock('../../src/services/authService', () => ({
  authService: {
    refreshToken: mockRefreshToken,
  },
}));

describe('chatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockImplementation(async (key: string) => {
      if (key === 'authToken') return 'token-1';
      if (key === 'authUser') return JSON.stringify({ id: 'me' });
      return null;
    });
  });

  it('getMessages maps API message fields to app message shape', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'm1',
            chat_id: 'c1',
            sender_id: 'me',
            body: 'hola',
            created_at: '2026-01-01T10:00:00.000Z',
            read_at: '2026-01-01T10:05:00.000Z',
          },
          {
            id: 'm2',
            chat_id: 'c1',
            sender_id: 'other',
            body: 'ok',
            created_at: '2026-01-01T10:01:00.000Z',
            read_at: null,
          },
        ],
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMessages('c1');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'm1',
      chatId: 'c1',
      text: 'hola',
      isMine: true,
      status: 'read',
      readAt: '2026-01-01T10:05:00.000Z',
    });
    expect(result[1]).toMatchObject({
      id: 'm2',
      chatId: 'c1',
      text: 'ok',
      isMine: false,
      status: undefined,
      readAt: null,
    });
    expect(result[0].createdAt).toEqual(expect.any(String));
  });

  it('sendMessage posts body and maps response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 'm3',
          chat_id: 'c9',
          sender_id: 'me',
          body: 'nuevo',
          created_at: '2026-01-01T10:00:00.000Z',
          read_at: null,
        },
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const msg = await chatService.sendMessage('c9', 'nuevo');

    expect(msg).toMatchObject({
      id: 'm3',
      chatId: 'c9',
      text: 'nuevo',
      isMine: true,
      status: 'sent',
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"chat_id":"c9"');
    expect(init.body).toContain('"body":"nuevo"');
  });

  it('retries once on 401 when refreshToken returns a new token', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'unauthorized',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });
    mockRefreshToken.mockResolvedValue('token-2');

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMessages('chat-1');

    expect(result).toEqual([]);
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('getChatDetails maps match_id, status and counterpart profile', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 'chat-1',
          match_id: 'match-1',
          updated_at: '2026-01-01T12:00:00.000Z',
          match: {
            user_a_id: 'me',
            user_b: {
              id: 'u2',
              display_name: 'Laura',
              avatar_url: null,
            },
            status: 'room_offer',
          },
        },
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const chat = await chatService.getChatDetails('chat-1');

    expect(chat).toMatchObject({
      id: 'chat-1',
      matchId: 'match-1',
      name: 'Laura',
      profileId: 'u2',
      matchStatus: 'room_offer',
    });
  });

  // -------------------------------------------------------------------------
  // getMatches — filtro accepted
  // -------------------------------------------------------------------------

  it('getMatches devuelve solo los matches con status accepted', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'm1',
            user_a_id: 'me',
            user_b_id: 'u2',
            status: 'accepted',
            user_b: { id: 'u2', display_name: 'Ana', avatar_url: null },
          },
          {
            id: 'm2',
            user_a_id: 'me',
            user_b_id: 'u3',
            status: 'pending',
            user_b: { id: 'u3', display_name: 'Bob', avatar_url: null },
          },
          {
            id: 'm3',
            user_a_id: 'u4',
            user_b_id: 'me',
            status: 'rejected',
            user_a: { id: 'u4', display_name: 'Carlos', avatar_url: null },
          },
        ],
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMatches();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('m1');
    expect(result[0].status).toBe('accepted');
  });

  it('getMatches devuelve array vacío si solo hay matches pending o rejected', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'm1',
            user_a_id: 'me',
            user_b_id: 'u2',
            status: 'pending',
            user_b: { id: 'u2', display_name: 'Ana', avatar_url: null },
          },
        ],
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMatches();

    expect(result).toHaveLength(0);
  });

  it('getMatches devuelve array vacío si la respuesta no contiene matches', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMatches();

    expect(result).toEqual([]);
  });

  it('getMatches mapea correctamente el perfil contrario siendo user_b', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'm1',
            user_a_id: 'me',
            user_b_id: 'u9',
            status: 'accepted',
            user_b: { id: 'u9', display_name: 'Diana', avatar_url: null },
          },
        ],
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMatches();

    expect(result[0].profileId).toBe('u9');
    expect(result[0].name).toBe('Diana');
  });

  it('getMatches mapea correctamente el perfil contrario siendo user_a', async () => {
    // El usuario actual es user_b en este match
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'm1',
            user_a_id: 'u9',
            user_b_id: 'me',
            status: 'accepted',
            user_a: { id: 'u9', display_name: 'Erik', avatar_url: null },
          },
        ],
      }),
    });

    const { chatService } = require('../../src/services/chatService');
    const result = await chatService.getMatches();

    expect(result[0].profileId).toBe('u9');
    expect(result[0].name).toBe('Erik');
  });
});
