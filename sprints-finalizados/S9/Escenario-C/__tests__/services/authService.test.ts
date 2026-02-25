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

  it('registerPhase3 returns auth payload and forwards birth_date and gender', async () => {
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
      gender: 'male',
    } as Phase3Data & { gender: string };

    const result = await authService.registerPhase3('tmp-z', phase3Data);

    expect(result.token).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"birth_date":"1998-10-10"');
    expect(init.body).toContain('"gender":"male"');
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
