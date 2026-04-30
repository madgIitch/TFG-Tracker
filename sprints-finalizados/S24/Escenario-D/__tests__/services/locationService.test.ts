import { locationService } from '../../src/services/locationService';
import { authService } from '../../src/services/authService';

const mockInvoke = jest.fn();

jest.mock('../../src/services/authService', () => ({
  supabaseClient: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCities', () => {
    it('appends query to URL when provided', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { data: [{ id: '1', name: 'Sevilla' }] }, error: null });

      const result = await locationService.searchCities('Sevilla');

      expect(mockInvoke).toHaveBeenCalledWith('locations/cities?q=Sevilla', { method: 'GET' });
      expect(result).toEqual([{ id: '1', name: 'Sevilla' }]);
    });

    it('does not append query to URL when empty', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { data: [{ id: '2', name: 'Madrid' }] }, error: null });

      const result = await locationService.searchCities('');

      expect(mockInvoke).toHaveBeenCalledWith('locations/cities', { method: 'GET' });
      expect(result).toEqual([{ id: '2', name: 'Madrid' }]);
    });

    it('throws error if invoke returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Edge function failed') });

      await expect(locationService.searchCities('test')).rejects.toThrow('Edge function failed');
    });
  });

  describe('getCityPlaces', () => {
    it('constructs the correct URL with cityId', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { data: [{ id: 'z1', name: 'Triana' }] }, error: null });

      const result = await locationService.getCityPlaces('city123');

      expect(mockInvoke).toHaveBeenCalledWith('locations/cities/city123/places', { method: 'GET' });
      expect(result).toEqual([{ id: 'z1', name: 'Triana' }]);
    });

    it('throws error if invoke returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Edge function failed') });

      await expect(locationService.getCityPlaces('city123')).rejects.toThrow('Edge function failed');
    });
  });
});
