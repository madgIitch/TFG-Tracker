import type { Phase1Data, PhaseGenderData, Phase3Data } from '../../src/types/auth';
import { validateEmailForRegistration } from '../../src/services/emailValidationService';

const mockGetSession = jest.fn();
const mockSetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockUsersMaybeSingle = jest.fn();
const mockProfilesMaybeSingle = jest.fn();
const mockFrom = jest.fn((table: string) => {
  if (table === 'users') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockUsersMaybeSingle,
        })),
      })),
    };
  }

  if (table === 'profiles') {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockProfilesMaybeSingle,
        })),
      })),
    };
  }

  throw new Error(`Unexpected table mocked in authService test: ${table}`);
});

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
jest.mock('../../src/services/emailValidationService', () => ({
  validateEmailForRegistration: jest.fn(async (email: string) => ({
    valid: true,
    normalizedEmail: email.trim().toLowerCase(),
  })),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockUsersMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockProfilesMaybeSingle.mockResolvedValue({ data: null, error: null });
    (validateEmailForRegistration as jest.Mock).mockResolvedValue({
      valid: true,
      normalizedEmail: 'user@test.com',
    });
  });

  it('registerPhase1 maps temp registration and supports google flow without password', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
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

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"is_google_user":true');
    expect(init.body).toContain('"email":"user@test.com"');
  });

  it('registerPhase2 sends expected payload and throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
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

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"temp_token":"tmp-x"');
    expect(init.body).toContain('"gender":"female"');
  });

  it('registerPhase3 returns auth payload and forwards birth_date and invitation_code', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
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
      invitationCode: 'ABCD1234',
    } as Phase3Data;

    const result = await authService.registerPhase3('tmp-z', phase3Data);

    expect(result.token).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"birth_date":"1998-10-10"');
    expect(init.body).toContain('"invitation_code":"ABCD1234"');
  });

  it('registerPhase1 throws when email validation fails for non-google users', async () => {
    (validateEmailForRegistration as jest.Mock).mockResolvedValueOnce({
      valid: false,
      normalizedEmail: 'bad@bad.tld',
      code: 'invalid_domain',
      message: 'El dominio del email no existe o no acepta correo.',
    });

    const { authService } = require('../../src/services/authService');

    await expect(
      authService.registerPhase1({
        email: 'bad@bad.tld',
        password: '123456',
      })
    ).rejects.toThrow('El dominio del email no existe o no acepta correo.');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('registerPhase3 forwards google_user_id when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { id: 'u2', email: 'google@test.com' },
        access_token: 'access',
        refresh_token: 'refresh',
      }),
    });

    const { authService } = require('../../src/services/authService');
    const phase3Data = {
      birthDate: '2000-01-01',
    } as Phase3Data;

    await authService.registerPhase3('tmp-google', phase3Data, {
      googleUserId: 'google-user-123',
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toContain('"google_user_id":"google-user-123"');
  });

  it('loginWithGoogle marks existing users as not new and does not call phase1', async () => {
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({
      data: { idToken: 'id-token' },
    });
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        user: {
          id: 'u-existing',
          email: 'existing@test.com',
          created_at: '2026-01-01',
          user_metadata: { first_name: 'Ana', last_name: 'Lopez' },
        },
        session: {
          access_token: 'token-existing',
          refresh_token: 'refresh-existing',
        },
      },
      error: null,
    });
    mockUsersMaybeSingle.mockResolvedValue({
      data: {
        first_name: 'Ana',
        last_name: 'Lopez',
        birth_date: '1999-01-01',
        gender: 'female',
        is_premium: true,
      },
      error: null,
    });
    mockProfilesMaybeSingle.mockResolvedValue({
      data: { id: 'u-existing' },
      error: null,
    });

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(false);
    expect(result.tempToken).toBeNull();
    expect(result.user.is_premium).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loginWithGoogle marks new users and creates temp registration', async () => {
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({
      data: { idToken: 'id-token' },
    });
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        user: {
          id: 'u-new',
          email: 'new@test.com',
          created_at: '2026-01-01',
          user_metadata: { first_name: 'Nuevo', last_name: 'Usuario' },
        },
        session: {
          access_token: 'token-new',
          refresh_token: 'refresh-new',
        },
      },
      error: null,
    });
    mockUsersMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockProfilesMaybeSingle.mockResolvedValue({ data: null, error: null });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      url: 'http://test',
      json: async () => ({
        temp_token: 'tmp-new-user',
        email: 'new@test.com',
      }),
    });

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(true);
    expect(result.tempToken).toBe('tmp-new-user');
    expect(result.googleUserId).toBe('u-new');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('login throws mapped UI error on invalid credentials', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
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
