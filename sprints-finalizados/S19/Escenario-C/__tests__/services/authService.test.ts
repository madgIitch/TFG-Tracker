import type { Phase1Data, PhaseGenderData, Phase3Data } from '../../src/types/auth';

const mockGetSession = jest.fn();
const mockSetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockSignInWithIdToken = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      setSession: mockSetSession,
      refreshSession: mockRefreshSession,
      signInWithIdToken: mockSignInWithIdToken,
    },
  }),
}));

const mockHasPlayServices = jest.fn();
const mockGoogleSignIn = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: mockHasPlayServices,
    signIn: mockGoogleSignIn,
  },
}));

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('registerPhase1 maps temp registration and supports google flow without password', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      url: 'http://test',
      json: async () => ({
        temp_token: 'tmp-123',
        email: 'user@test.com',
      }),
    });

    const { authService } = require('../../src/services/authService');
    const input: Phase1Data = {
      email: 'user@test.com',
      isGoogleUser: true,
    };

    const result = await authService.registerPhase1(input);

    expect(result).toEqual({
      tempToken: 'tmp-123',
      email: 'user@test.com',
      isGoogleUser: true,
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"is_google_user":true');
    expect(init.body).toContain('"email":"user@test.com"');
  });

  it('registerPhase2 sends expected payload and throws on non-ok response', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => 'expired token',
    });

    const { authService } = require('../../src/services/authService');
    const phase2Data: PhaseGenderData = {
      firstName: 'Ana',
      lastName: 'Lopez',
      gender: 'female',
    };

    await expect(authService.registerPhase2('tmp-x', phase2Data)).rejects.toThrow(
      'Error en fase 2 del registro'
    );

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"temp_token":"tmp-x"');
    expect(init.body).toContain('"gender":"female"');
  });

  it('registerPhase3 returns auth payload and forwards birth_date and invite_code', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { id: 'u1', email: 'test@test.com' },
        access_token: 'access',
        refresh_token: 'refresh',
      }),
    });

    const { authService } = require('../../src/services/authService');
    const phase3Data = {
      birthDate: '1998-10-10',
      inviteCode: 'HM-ABCD1234',
    } as Phase3Data;

    const result = await authService.registerPhase3('tmp-z', phase3Data, {
      accessToken: 'google-access',
      refreshToken: 'google-refresh',
    });

    expect(result.token).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"birth_date":"1998-10-10"');
    expect(init.body).toContain('"invite_code":"HM-ABCD1234"');
    expect(init.body).toContain('"access_token":"google-access"');
    expect(init.body).toContain('"refresh_token":"google-refresh"');
  });

  it('loginWithGoogle marks user as new when profile endpoint returns 404', async () => {
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({
      data: { idToken: 'google-id-token' },
    });
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        user: {
          id: 'u-google',
          email: 'new@google.com',
          user_metadata: { first_name: 'New', last_name: 'User' },
          created_at: '2026-01-01T00:00:00.000Z',
        },
        session: {
          access_token: 'access-google',
          refresh_token: 'refresh-google',
        },
      },
      error: null,
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer access-google');
  });

  it('loginWithGoogle marks user as existing when profile is complete', async () => {
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({
      data: { idToken: 'google-id-token' },
    });
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        user: {
          id: 'u-google-2',
          email: 'existing@google.com',
          user_metadata: { first_name: 'Existing', last_name: 'User' },
          created_at: '2026-01-01T00:00:00.000Z',
        },
        session: {
          access_token: 'access-existing',
          refresh_token: 'refresh-existing',
        },
      },
      error: null,
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: { gender: 'female', birth_date: '1998-10-10' },
      }),
    });

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(false);
  });

  it('login throws mapped UI error on invalid credentials', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'invalid',
    });

    const { authService } = require('../../src/services/authService');

    await expect(
      authService.login({ email: 'bad@test.com', password: 'bad' })
    ).rejects.toThrow('Credenciales inválidas');
  });
});

export {};
