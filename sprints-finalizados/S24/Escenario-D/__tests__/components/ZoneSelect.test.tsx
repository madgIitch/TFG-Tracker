import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ZoneSelect } from '../../src/components/ZoneSelect';
import { locationService } from '../../src/services/locationService';
import { ThemeProvider } from '../../src/theme/ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../src/services/locationService', () => ({
  locationService: {
    getCityPlaces: jest.fn(),
  },
}));

describe('ZoneSelect', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider>
        <ZoneSelect cityId={null} value={[]} onSelect={mockOnSelect} {...props} />
      </ThemeProvider>
    );
  };

  it('renders disabled state when cityId is null', () => {
    const { getByText } = renderComponent();
    expect(getByText('Selecciona una ciudad primero para ver sus zonas.')).toBeTruthy();
  });

  it('fetches and displays zones when cityId is provided', async () => {
    (locationService.getCityPlaces as jest.Mock).mockResolvedValueOnce([
      { id: 'z1', name: 'Triana' },
      { id: 'z2', name: 'Nervión' },
    ]);

    const { getByText } = renderComponent({ cityId: 'city1' });

    await waitFor(() => {
      expect(locationService.getCityPlaces).toHaveBeenCalledWith('city1');
    });

    expect(getByText('Triana')).toBeTruthy();
    expect(getByText('Nervión')).toBeTruthy();
  });

  it('handles multiple selection correctly', async () => {
    (locationService.getCityPlaces as jest.Mock).mockResolvedValueOnce([
      { id: 'z1', name: 'Triana' },
      { id: 'z2', name: 'Nervión' },
    ]);

    const { getByText } = renderComponent({ cityId: 'city1', value: ['z1'], multiple: true });

    await waitFor(() => {
      expect(getByText('Nervión')).toBeTruthy();
    });

    fireEvent.press(getByText('Nervión'));
    expect(mockOnSelect).toHaveBeenCalledWith(['z1', 'z2']);

    fireEvent.press(getByText('Triana'));
    expect(mockOnSelect).toHaveBeenCalledWith([]);
  });

  it('handles single selection correctly', async () => {
    (locationService.getCityPlaces as jest.Mock).mockResolvedValueOnce([
      { id: 'z1', name: 'Triana' },
      { id: 'z2', name: 'Nervión' },
    ]);

    const { getByText } = renderComponent({ cityId: 'city1', value: 'z1', multiple: false });

    await waitFor(() => {
      expect(getByText('Nervión')).toBeTruthy();
    });

    fireEvent.press(getByText('Nervión'));
    expect(mockOnSelect).toHaveBeenCalledWith('z2');

    fireEvent.press(getByText('Triana'));
    expect(mockOnSelect).toHaveBeenCalledWith(null); // deselects
  });
});
