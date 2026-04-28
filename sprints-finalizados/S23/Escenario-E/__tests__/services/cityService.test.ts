/**
 * Tests unitarios — cityService
 *
 * Cubre:
 *   - searchCities: éxito, array vacío, error HTTP, codificación de query
 *   - getCityPlaces: éxito con y sin query, omisión de q vacío, error HTTP
 */

jest.mock('../../src/config/api', () => ({
  API_CONFIG: {
    FUNCTIONS_URL: 'https://test.supabase.co/functions/v1',
    SUPABASE_ANON_KEY: 'anon-key-test',
  },
}));

describe('cityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    global.fetch = jest.fn();
  });

  // ─── searchCities ────────────────────────────────────────────────────────

  describe('searchCities', () => {
    it('devuelve el array de ciudades cuando la respuesta es ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          cities: [
            { id: 'sevilla', name: 'Sevilla' },
            { id: 'madrid', name: 'Madrid' },
          ],
        }),
      });

      const { cityService } = require('../../src/services/cityService');
      const result = await cityService.searchCities('sev');

      expect(result).toEqual([
        { id: 'sevilla', name: 'Sevilla' },
        { id: 'madrid', name: 'Madrid' },
      ]);
    });

    it('construye la URL con el parámetro q y limit=12', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cities: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.searchCities('mad');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/cities');
      expect(url).toContain('q=mad');
      expect(url).toContain('limit=12');
    });

    it('codifica caracteres especiales en el parámetro q', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cities: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.searchCities('san sebastián');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain(encodeURIComponent('san sebastián'));
    });

    it('devuelve array vacío cuando la respuesta no tiene la clave "cities"', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { cityService } = require('../../src/services/cityService');
      const result = await cityService.searchCities('xyz');

      expect(result).toEqual([]);
    });

    it('lanza error cuando la respuesta HTTP no es ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const { cityService } = require('../../src/services/cityService');

      await expect(cityService.searchCities('foo')).rejects.toThrow(
        'Error buscando ciudades'
      );
    });

    it('llama a fetch una sola vez por búsqueda', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cities: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.searchCities('val');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getCityPlaces ────────────────────────────────────────────────────────

  describe('getCityPlaces', () => {
    it('devuelve el array de zonas para una ciudad', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          places: [
            { id: 'triana', city_id: 'sevilla', name: 'Triana' },
            { id: 'macarena', city_id: 'sevilla', name: 'Macarena' },
          ],
        }),
      });

      const { cityService } = require('../../src/services/cityService');
      const result = await cityService.getCityPlaces('sevilla');

      expect(result).toEqual([
        { id: 'triana', city_id: 'sevilla', name: 'Triana' },
        { id: 'macarena', city_id: 'sevilla', name: 'Macarena' },
      ]);
    });

    it('incluye city_id y limit=40 en la URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.getCityPlaces('madrid');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('city_id=madrid');
      expect(url).toContain('limit=40');
    });

    it('añade el parámetro q cuando se proporciona una query', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.getCityPlaces('madrid', 'retiro');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('city_id=madrid');
      expect(url).toContain('q=retiro');
    });

    it('no añade el parámetro q cuando la query es cadena vacía', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.getCityPlaces('barcelona', '');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).not.toContain('&q=');
    });

    it('no añade el parámetro q cuando es solo espacios en blanco', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.getCityPlaces('valencia', '   ');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).not.toContain('&q=');
    });

    it('devuelve array vacío cuando la respuesta no tiene la clave "places"', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const { cityService } = require('../../src/services/cityService');
      const result = await cityService.getCityPlaces('bilbao');

      expect(result).toEqual([]);
    });

    it('lanza error cuando la respuesta HTTP no es ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const { cityService } = require('../../src/services/cityService');

      await expect(cityService.getCityPlaces('sevilla')).rejects.toThrow(
        'Error buscando zonas'
      );
    });

    it('codifica caracteres especiales en city_id', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ places: [] }),
      });

      const { cityService } = require('../../src/services/cityService');
      await cityService.getCityPlaces('san sebastián');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain(encodeURIComponent('san sebastián'));
    });
  });
});
