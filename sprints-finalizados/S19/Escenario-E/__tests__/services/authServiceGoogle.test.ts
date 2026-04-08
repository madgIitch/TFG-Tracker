/**
 * Tests para el flujo Google en authService (Fase 3).
 *
 * Cubre:
 *  - loginWithGoogle() → isNewUser: true  cuando GET /profiles devuelve 404
 *  - loginWithGoogle() → isNewUser: false cuando GET /profiles devuelve 200
 *  - loginWithGoogle() → isNewUser: false cuando el fetch de /profiles falla
 *  - completeGoogleRegistration() envía el payload correcto con el token del usuario
 *  - completeGoogleRegistration() lanza error en respuesta no-ok
 */

// ---------------------------------------------------------------------------
// Mocks nativos (deben declararse antes del require del módulo)
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockSetSession = jest.fn();
const mockRefreshSession = jest.fn();

jest.mock('../../src/services/authService', () => {
  // Re-importamos para que los mocks internos (supabaseClient) sean sustituidos.
  // Usamos la implementación real pero con el cliente de supabase mockeado.
  return jest.requireActual('../../src/services/authService');
});

// Mockeamos el cliente de Supabase exportado
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signInWithIdToken: mockSignInWithIdToken,
      setSession: mockSetSession,
      refreshSession: mockRefreshSession,
    },
  })),
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

// ---------------------------------------------------------------------------
// Setup común
// ---------------------------------------------------------------------------

const FAKE_TOKEN = 'google-access-token-xyz';
const FAKE_REFRESH = 'google-refresh-token-xyz';
const FAKE_USER_META = {
  id: 'google-uid-1',
  email: 'test@gmail.com',
  user_metadata: {
    full_name: 'Ana Garcia',
    first_name: 'Ana',
    last_name: 'Garcia',
  },
  created_at: '2026-01-01',
};

function mockSuccessfulGoogleSignIn() {
  mockHasPlayServices.mockResolvedValue(undefined);
  mockGoogleSignIn.mockResolvedValue({ data: { idToken: 'google-id-token' } });
  mockSignInWithIdToken.mockResolvedValue({
    data: {
      user: FAKE_USER_META,
      session: {
        access_token: FAKE_TOKEN,
        refresh_token: FAKE_REFRESH,
      },
    },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// loginWithGoogle — detección de isNewUser
// ---------------------------------------------------------------------------

describe('authService.loginWithGoogle — isNewUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue(null);
  });

  it('devuelve isNewUser: true cuando GET /profiles responde 404', async () => {
    mockSuccessfulGoogleSignIn();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(true);
    expect(result.token).toBe(FAKE_TOKEN);
    expect(result.user.email).toBe('test@gmail.com');
  });

  it('devuelve isNewUser: false cuando GET /profiles responde 200', async () => {
    mockSuccessfulGoogleSignIn();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 'google-uid-1' } }),
    });

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(false);
  });

  it('devuelve isNewUser: false cuando el fetch de /profiles lanza excepción', async () => {
    mockSuccessfulGoogleSignIn();

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { authService } = require('../../src/services/authService');
    const result = await authService.loginWithGoogle();

    expect(result.isNewUser).toBe(false);
  });

  it('el fetch de /profiles usa el token del usuario (no el anon key)', async () => {
    mockSuccessfulGoogleSignIn();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const { authService } = require('../../src/services/authService');
    await authService.loginWithGoogle();

    const [, fetchInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchInit.headers['Authorization']).toContain(FAKE_TOKEN);
  });

  it('lanza error si Google signIn falla', async () => {
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({ data: { idToken: null } });

    const { authService } = require('../../src/services/authService');
    await expect(authService.loginWithGoogle()).rejects.toThrow(
      'No se pudo obtener el idToken de Google'
    );
  });

  it('lanza error si Supabase signInWithIdToken falla', async () => {
    mockHasPlayServices.mockResolvedValue(undefined);
    mockGoogleSignIn.mockResolvedValue({ data: { idToken: 'token' } });
    mockSignInWithIdToken.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error('Provider error'),
    });

    const { authService } = require('../../src/services/authService');
    await expect(authService.loginWithGoogle()).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// completeGoogleRegistration
// ---------------------------------------------------------------------------

describe('authService.completeGoogleRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockStorage.getItem.mockResolvedValue(null);
  });

  const registrationData = {
    firstName: 'Ana',
    lastName: 'Garcia',
    gender: 'female',
    birthDate: '1998-05-15',
  };

  it('hace POST a auth-register-phase3 con is_google_user: true', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const { authService } = require('../../src/services/authService');
    await authService.completeGoogleRegistration(FAKE_TOKEN, registrationData);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('auth-register-phase3');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body);
    expect(body.is_google_user).toBe(true);
  });

  it('envía first_name, last_name, gender y birth_date correctamente', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { authService } = require('../../src/services/authService');
    await authService.completeGoogleRegistration(FAKE_TOKEN, registrationData);

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.first_name).toBe('Ana');
    expect(body.last_name).toBe('Garcia');
    expect(body.gender).toBe('female');
    expect(body.birth_date).toBe('1998-05-15');
  });

  it('usa el token del usuario en el header Authorization (no el anon key)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { authService } = require('../../src/services/authService');
    await authService.completeGoogleRegistration(FAKE_TOKEN, registrationData);

    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.headers['Authorization']).toBe(`Bearer ${FAKE_TOKEN}`);
  });

  it('lanza error si la respuesta no es ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    });

    const { authService } = require('../../src/services/authService');
    await expect(
      authService.completeGoogleRegistration(FAKE_TOKEN, registrationData)
    ).rejects.toThrow('Error al completar el registro con Google');
  });

  it('lanza error si la respuesta es 401 (token inválido)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid or expired token',
    });

    const { authService } = require('../../src/services/authService');
    await expect(
      authService.completeGoogleRegistration(FAKE_TOKEN, registrationData)
    ).rejects.toThrow('Error al completar el registro con Google');
  });
});
