jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('flatInvitationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('validateCode returns parsed payload data on success', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          code: 'HM-ABCD1234',
          room_id: 'r1',
          flat_id: 'f1',
          owner_id: 'u1',
          expires_at: '2026-12-01T10:00:00.000Z',
          remaining_uses: 2,
        },
      }),
    });

    const { flatInvitationService } = require('../../src/services/flatInvitationService');
    const result = await flatInvitationService.validateCode('HM-ABCD1234');

    expect(result).toEqual({
      code: 'HM-ABCD1234',
      room_id: 'r1',
      flat_id: 'f1',
      owner_id: 'u1',
      expires_at: '2026-12-01T10:00:00.000Z',
      remaining_uses: 2,
    });

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toContain('"type":"validate"');
    expect(init.body).toContain('"code":"HM-ABCD1234"');
  });

  it('validateCode returns null when backend responds non-ok', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
    });

    const { flatInvitationService } = require('../../src/services/flatInvitationService');
    const result = await flatInvitationService.validateCode('BADCODE');

    expect(result).toBeNull();
  });
});

export {};
