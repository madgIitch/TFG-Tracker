const mockGetSession = jest.fn();
const mockSetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      setSession: mockSetSession,
      refreshSession: mockRefreshSession,
      signInWithIdToken: mockSignInWithIdToken,
    },
    from: mockFrom,
  },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('authService account deletion integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue('token-1');
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token-1' } },
    });
  });

  it('deleteAccountPermanently calls account-delete endpoint and clears tokens', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { authService } = require('../../src/services/authService');
    await authService.deleteAccountPermanently();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/account-delete');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toContain('Bearer token-1');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('authToken');
  });

  it('deleteAccountPermanently throws when backend fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to delete auth user' }),
    });

    const { authService } = require('../../src/services/authService');
    await expect(authService.deleteAccountPermanently()).rejects.toThrow(
      'Failed to delete auth user'
    );
  });
});
