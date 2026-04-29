/**
 * Tests de comportamiento — CityZoneSelector
 *
 * Cubre modo single:
 *   - Renderiza el campo de búsqueda de ciudad cuando no hay ciudad seleccionada
 *   - Muestra el chip de ciudad seleccionada tras selección
 *   - Oculta la búsqueda al seleccionar una ciudad
 *   - Muestra el campo de zona al seleccionar una ciudad
 *   - Muestra el chip de zona cuando hay zona seleccionada
 *   - Llama a onChange al limpiar la ciudad
 *   - No renderiza el campo de zona si no hay ciudad seleccionada
 *
 * Cubre modo multi:
 *   - Renderiza el campo "Buscar ciudad..." inicialmente
 *   - Muestra el bloque de ciudad cuando hay ciudades añadidas
 *   - Muestra chips de zona por cada zona añadida
 *   - Llama a onChange sin la ciudad eliminada al borrarla
 *   - Renderiza un buscador de zona por cada ciudad añadida
 *   - Llama a searchCities al escribir en el buscador (tras debounce)
 *   - El resultado de búsqueda aparece en el árbol tras debounce
 */

import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('../../src/services/cityService', () => ({
  cityService: {
    searchCities: jest.fn(),
    getCityPlaces: jest.fn(),
  },
}));

import {
  CityZoneSelector,
  type CityZoneEntry,
} from '../../src/components/CityZoneSelector';
import { cityService } from '../../src/services/cityService';

const mockSearchCities = cityService.searchCities as jest.Mock;
const mockGetCityPlaces = cityService.getCityPlaces as jest.Mock;

// ─── Helper ──────────────────────────────────────────────────────────────────

const findInputByPlaceholder = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  placeholder: string
): ReactTestRenderer.ReactTestInstance | undefined =>
  renderer.root.findAll(
    (n) => n.type === TextInput && n.props.placeholder === placeholder
  )[0];

// Busca TouchableOpacity que contengan un nodo hijo con el prop `name` dado (iconos)
const findButtonsByIconName = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  iconName: string
): ReactTestRenderer.ReactTestInstance[] =>
  renderer.root.findAll((n) => {
    if (n.type !== TouchableOpacity) return false;
    try {
      return n.findAll((child) => child.props?.name === iconName).length > 0;
    } catch {
      return false;
    }
  });

// Drain microtask queue (safe with fake timers — uses only Promise microtasks)
const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

// ─── Modo single ──────────────────────────────────────────────────────────────

describe('CityZoneSelector — modo single', () => {
  const emptySingle = { cityId: null, cityName: '', zoneId: null, zoneName: '' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearchCities.mockResolvedValue([]);
    mockGetCityPlaces.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renderiza el campo de búsqueda de ciudad cuando no hay ciudad seleccionada', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={emptySingle} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(findInputByPlaceholder(renderer!, 'Buscar ciudad...')).toBeDefined();
  });

  it('muestra el chip con el nombre de la ciudad cuando hay una seleccionada', async () => {
    const selected = { cityId: 'sevilla', cityName: 'Sevilla', zoneId: null, zoneName: '' };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={selected} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Sevilla');
  });

  it('NO muestra el campo de búsqueda de ciudad cuando hay ciudad seleccionada', async () => {
    const selected = { cityId: 'sevilla', cityName: 'Sevilla', zoneId: null, zoneName: '' };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={selected} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(findInputByPlaceholder(renderer!, 'Buscar ciudad...')).toBeUndefined();
  });

  it('muestra el campo de búsqueda de zona cuando hay ciudad pero no zona', async () => {
    const selected = { cityId: 'sevilla', cityName: 'Sevilla', zoneId: null, zoneName: '' };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={selected} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(findInputByPlaceholder(renderer!, 'Buscar zona...')).toBeDefined();
  });

  it('muestra el chip de zona cuando hay zona seleccionada', async () => {
    const selected = { cityId: 'sevilla', cityName: 'Sevilla', zoneId: 'triana', zoneName: 'Triana' };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={selected} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Triana');
  });

  it('llama a onChange con valores vacíos al pulsar el botón de borrar ciudad', async () => {
    const selected = { cityId: 'sevilla', cityName: 'Sevilla', zoneId: null, zoneName: '' };
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={selected} onChange={onChange} />
      );
      await flushPromises();
    });

    const closeButtons = findButtonsByIconName(renderer!, 'close');
    await ReactTestRenderer.act(async () => {
      closeButtons[0]?.props.onPress();
      await flushPromises();
    });

    expect(onChange).toHaveBeenCalledWith({
      cityId: null,
      cityName: '',
      zoneId: null,
      zoneName: '',
    });
  });

  it('no renderiza el campo de zona si no hay ciudad seleccionada', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="single" value={emptySingle} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(findInputByPlaceholder(renderer!, 'Buscar zona...')).toBeUndefined();
  });
});

// ─── Modo multi ───────────────────────────────────────────────────────────────

describe('CityZoneSelector — modo multi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearchCities.mockResolvedValue([]);
    mockGetCityPlaces.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renderiza el campo "Buscar ciudad..." inicialmente', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={[]} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(findInputByPlaceholder(renderer!, 'Buscar ciudad...')).toBeDefined();
  });

  it('muestra el nombre de la ciudad cuando hay ciudades añadidas', async () => {
    const entries: CityZoneEntry[] = [
      { city_id: 'madrid', city_name: 'Madrid', zone_ids: [], zone_names: [] },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={entries} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    expect(JSON.stringify(renderer!.toJSON())).toContain('Madrid');
  });

  it('muestra los chips de zona de cada ciudad añadida', async () => {
    const entries: CityZoneEntry[] = [
      {
        city_id: 'sevilla',
        city_name: 'Sevilla',
        zone_ids: ['triana', 'macarena'],
        zone_names: ['Triana', 'Macarena'],
      },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={entries} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Triana');
    expect(json).toContain('Macarena');
  });

  it('llama a onChange sin la ciudad eliminada al pulsar su botón de borrar', async () => {
    const entries: CityZoneEntry[] = [
      { city_id: 'madrid', city_name: 'Madrid', zone_ids: [], zone_names: [] },
      { city_id: 'sevilla', city_name: 'Sevilla', zone_ids: [], zone_names: [] },
    ];
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={entries} onChange={onChange} />
      );
      await flushPromises();
    });

    const closeButtons = findButtonsByIconName(renderer!, 'close-circle');
    await ReactTestRenderer.act(async () => {
      closeButtons[0]?.props.onPress();
      await flushPromises();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const result: CityZoneEntry[] = onChange.mock.calls[0][0];
    expect(result).toHaveLength(1);
  });

  it('renderiza un buscador de zona por cada ciudad añadida', async () => {
    const entries: CityZoneEntry[] = [
      { city_id: 'madrid', city_name: 'Madrid', zone_ids: [], zone_names: [] },
      { city_id: 'sevilla', city_name: 'Sevilla', zone_ids: [], zone_names: [] },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={entries} onChange={jest.fn()} />
      );
      await flushPromises();
    });
    const zoneInputs = renderer!.root.findAll(
      (n) => n.type === TextInput && n.props.placeholder === 'Buscar zona...'
    );
    expect(zoneInputs).toHaveLength(2);
  });

  it('llama a searchCities tras el debounce al escribir en el buscador', async () => {
    mockSearchCities.mockResolvedValue([{ id: 'barcelona', name: 'Barcelona' }]);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={[]} onChange={jest.fn()} />
      );
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      findInputByPlaceholder(renderer!, 'Buscar ciudad...')?.props.onChangeText('bar');
    });

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(400);
      await flushPromises();
    });

    expect(mockSearchCities).toHaveBeenCalledWith('bar');
  });

  it('el resultado de búsqueda de ciudad aparece en el árbol tras debounce', async () => {
    mockSearchCities.mockResolvedValue([{ id: 'granada', name: 'Granada' }]);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <CityZoneSelector mode="multi" value={[]} onChange={jest.fn()} />
      );
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      findInputByPlaceholder(renderer!, 'Buscar ciudad...')?.props.onChangeText('gra');
    });

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(400);
      await flushPromises();
    });

    expect(JSON.stringify(renderer!.toJSON())).toContain('Granada');
  });
});
