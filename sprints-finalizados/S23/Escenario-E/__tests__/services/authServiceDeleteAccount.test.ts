/**
 * Tests unitarios — authService.deleteAccount
 *
 * Cubre:
 *   - Lanza error si no hay token en AsyncStorage
 *   - Realiza DELETE al endpoint correcto con la cabecera Authorization
 *   - Incluye la apikey en las cabeceras
 *   - Elimina authToken y authRefreshToken al tener éxito
 *   - Lanza error sin borrar tokens si el servidor responde con error
 *   - Lanza error sin borrar tokens si fetch lanza excepción de red
 */

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
};
jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

jest.mock('../../src/config/api', () => ({
  API_CONFIG: {
    FUNCTIONS_URL: 'https://test.supabase.co/functions/v1',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key-test',
  },
}));

// authService crea un supabaseClient con createClient al importar el módulo
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getSession: jest.fn(), setSession: jest.fn() },
    realtime: { setAuth: jest.fn() },
    channel: jest.fn(() => ({ on: jest.fn(), subscribe: jest.fn() })),
    removeChannel: jest.fn(),
  })),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { hasPlayServices: jest.fn(), signIn: jest.fn() },
}));

describe('authService.deleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    global.fetch = jest.fn();
  });

  it('lanza error si no hay authToken en AsyncStorage', async () => {
    mockStorage.getItem.mockResolvedValue(null);

    const { authService } = require('../../src/services/authService');
    await expect(authService.deleteAccount()).rejects.toThrow('No hay sesión activa');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('realiza una petición DELETE al endpoint /delete-account', async () => {
    mockStorage.getItem.mockResolvedValue('token-abc');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => '' });

    const { authService } = require('../../src/services/authService');
    await authService.deleteAccount();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/delete-account');
    expect(init.method).toBe('DELETE');
  });

  it('incluye el token de autorización en la cabecera', async () => {
    mockStorage.getItem.mockResolvedValue('my-secret-token');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => '' });

    const { authService } = require('../../src/services/authService');
    await authService.deleteAccount();

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer my-secret-token');
  });

  it('incluye la apikey en las cabeceras', async () => {
    mockStorage.getItem.mockResolvedValue('tok');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => '' });

    const { authService } = require('../../src/services/authService');
    await authService.deleteAccount();

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['apikey']).toBe('anon-key-test');
  });

  it('elimina authToken y authRefreshToken de AsyncStorage al tener éxito', async () => {
    mockStorage.getItem.mockResolvedValue('valid-token');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => '' });

    const { authService } = require('../../src/services/authService');
    await authService.deleteAccount();

    expect(mockStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('authRefreshToken');
  });

  it('lanza error y NO elimina tokens si el servidor responde con error', async () => {
    mockStorage.getItem.mockResolvedValue('valid-token');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, text: async () => 'Server Error' });

    const { authService } = require('../../src/services/authService');
    await expect(authService.deleteAccount()).rejects.toThrow('No se pudo eliminar la cuenta');
    expect(mockStorage.removeItem).not.toHaveBeenCalled();
  });

  it('lanza error si fetch lanza excepción de red', async () => {
    mockStorage.getItem.mockResolvedValue('valid-token');
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { authService } = require('../../src/services/authService');
    await expect(authService.deleteAccount()).rejects.toThrow();
    expect(mockStorage.removeItem).not.toHaveBeenCalled();
  });
});
