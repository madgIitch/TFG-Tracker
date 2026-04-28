/**
 * Tests de integración — flujo Ciudad/Zona + deleteAccount
 *
 * CityZoneSelector ↔ cityService (fetch mockeado, servicio real):
 *   - Buscar ciudad llama a fetch con la query correcta
 *   - Seleccionar ciudad activa carga de zonas (segunda petición a fetch)
 *   - Añadir ciudad en modo multi pre-carga zonas automáticamente
 *   - Fallo de fetch deja el componente en estado válido (array vacío)
 *
 * authService.deleteAccount — flujo completo:
 *   - Éxito: lee token → DELETE → elimina ambos tokens de AsyncStorage
 *   - Error HTTP: conserva tokens y lanza excepción
 *   - Sin sesión: no hace fetch y lanza excepción
 */

import React, { useState } from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('../../src/config/api', () => ({
  API_CONFIG: {
    FUNCTIONS_URL: 'https://test.supabase.co/functions/v1',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key-test',
  },
}));

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
};
jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

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

import {
  CityZoneSelector,
  type CityZoneEntry,
} from '../../src/components/CityZoneSelector';
// authService is require()'d inside tests to pick up beforeEach mocks

// ─── Helpers ─────────────────────────────────────────────────────────────────

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const findInputByPlaceholder = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  placeholder: string
) =>
  renderer.root.findAll(
    (n) => n.type === TextInput && n.props.placeholder === placeholder
  )[0];

// Busca TouchableOpacity que tenga un hijo Text con el texto exacto dado
const findButtonContainingText = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string
): ReactTestRenderer.ReactTestInstance[] =>
  renderer.root.findAll((n) => {
    if (n.type !== TouchableOpacity) return false;
    try {
      return n.findAll(
        (child) => child.type === 'Text' && child.props.children === text
      ).length > 0;
    } catch {
      return false;
    }
  });

// ─── Wrappers con estado controlado ──────────────────────────────────────────

function ControlledSingle() {
  const [value, setValue] = useState({
    cityId: null as string | null,
    cityName: '',
    zoneId: null as string | null,
    zoneName: '',
  });
  return <CityZoneSelector mode="single" value={value} onChange={setValue} />;
}

function ControlledMulti({ initial = [] }: { initial?: CityZoneEntry[] }) {
  const [value, setValue] = useState<CityZoneEntry[]>(initial);
  return <CityZoneSelector mode="multi" value={value} onChange={setValue} />;
}

// ─── Integración: CityZoneSelector ↔ cityService (fetch real mockeado) ───────

describe('Integración: CityZoneSelector ↔ cityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('modo single: escribir en el buscador llama a fetch con la query correcta', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ cities: [{ id: 'sevilla', name: 'Sevilla' }] }),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ControlledSingle />);
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      findInputByPlaceholder(renderer!, 'Buscar ciudad...')?.props.onChangeText('sev');
    });

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(400);
      await flushPromises();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('q=sev');
    expect(url).not.toContain('city_id');
  });

  it('modo single: seleccionar ciudad activa carga de zonas (segunda petición fetch)', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: [{ id: 'sevilla', name: 'Sevilla' }] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          places: [{ id: 'triana', city_id: 'sevilla', name: 'Triana' }],
        }),
      });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ControlledSingle />);
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      findInputByPlaceholder(renderer!, 'Buscar ciudad...')?.props.onChangeText('sev');
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(400);
      await flushPromises();
    });

    // Pulsar el resultado "Sevilla" en el dropdown
    const sevillaButton = findButtonContainingText(renderer!, 'Sevilla');
    await ReactTestRenderer.act(async () => {
      sevillaButton[0]?.props.onPress();
      await flushPromises();
    });

    // Debe haber hecho 2 peticiones: búsqueda de ciudad + carga automática de zonas
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [url2] = (global.fetch as jest.Mock).mock.calls[1];
    expect(url2).toContain('city_id=sevilla');
  });

  it('modo multi: añadir ciudad pre-carga sus zonas inmediatamente', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cities: [{ id: 'madrid', name: 'Madrid' }] }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ places: [{ id: 'retiro', city_id: 'madrid', name: 'Retiro' }] }),
      });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ControlledMulti />);
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      findInputByPlaceholder(renderer!, 'Buscar ciudad...')?.props.onChangeText('mad');
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(400);
      await flushPromises();
    });

    const madridButton = findButtonContainingText(renderer!, 'Madrid');
    await ReactTestRenderer.act(async () => {
      madridButton[0]?.props.onPress();
      await flushPromises();
    });

    // Verifica que al menos una de las llamadas carga zonas para Madrid
    const allUrls = (global.fetch as jest.Mock).mock.calls.map(([url]) => url as string);
    expect(allUrls.some((url) => url.includes('city_id=madrid'))).toBe(true);
  });

  it('modo multi: fallo de fetch no rompe el componente', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ControlledMulti />);
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      findInputByPlaceholder(renderer!, 'Buscar ciudad...')?.props.onChangeText('err');
    });
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(400);
      await flushPromises();
    });

    // El componente sigue renderizando sin lanzar error
    expect(renderer!.toJSON()).not.toBeNull();
  });
});

// ─── Integración: authService.deleteAccount — flujo completo ─────────────────

describe('Integración: authService.deleteAccount — flujo completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('éxito: lee token → DELETE → elimina ambos tokens de AsyncStorage', async () => {
    mockStorage.getItem.mockResolvedValue('valid-jwt');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => '' });

    const { authService } = require('../../src/services/authService');
    await authService.deleteAccount();

    expect(mockStorage.getItem).toHaveBeenCalledWith('authToken');
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/delete-account');
    expect(init.method).toBe('DELETE');
    expect(init.headers['Authorization']).toBe('Bearer valid-jwt');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('authRefreshToken');
    expect(mockStorage.removeItem).toHaveBeenCalledTimes(2);
  });

  it('error HTTP: conserva tokens y lanza excepción', async () => {
    mockStorage.getItem.mockResolvedValue('valid-jwt');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, text: async () => 'Forbidden' });

    const { authService } = require('../../src/services/authService');
    await expect(authService.deleteAccount()).rejects.toThrow();
    expect(mockStorage.removeItem).not.toHaveBeenCalled();
  });

  it('sin sesión: no llama a fetch y lanza excepción de sesión', async () => {
    mockStorage.getItem.mockResolvedValue(null);

    const { authService } = require('../../src/services/authService');
    await expect(authService.deleteAccount()).rejects.toThrow('No hay sesión activa');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
