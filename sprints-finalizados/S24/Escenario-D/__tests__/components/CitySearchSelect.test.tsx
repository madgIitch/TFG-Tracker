import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CitySearchSelect } from '../../src/components/CitySearchSelect';
import { locationService } from '../../src/services/locationService';
import { ThemeProvider } from '../../src/theme/ThemeContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../src/services/locationService', () => ({
  locationService: {
    searchCities: jest.fn(),
  },
}));

describe('CitySearchSelect', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider>
        <CitySearchSelect value={null} onSelect={mockOnSelect} {...props} />
      </ThemeProvider>
    );
  };

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderComponent();
    expect(getByText('Ciudad')).toBeTruthy();
    expect(getByPlaceholderText('Buscar ciudad...')).toBeTruthy();
  });

  it('searches and displays results on text input', async () => {
    (locationService.searchCities as jest.Mock).mockResolvedValueOnce([
      { id: '1', name: 'Madrid' },
      { id: '2', name: 'Málaga' },
    ]);

    const { getByPlaceholderText, getByText, queryByText } = renderComponent();
    const input = getByPlaceholderText('Buscar ciudad...');
    
    fireEvent.focus(input);
    fireEvent.changeText(input, 'Mad');

    await waitFor(() => {
      expect(locationService.searchCities).toHaveBeenCalledWith('Mad');
    });

    await waitFor(() => {
      expect(getByText('Madrid')).toBeTruthy();
      expect(getByText('Málaga')).toBeTruthy();
    });
  });

  it('calls onSelect and hides list when a result is clicked', async () => {
    (locationService.searchCities as jest.Mock).mockResolvedValueOnce([
      { id: '1', name: 'Madrid' },
    ]);

    const { getByPlaceholderText, getByText, queryByText } = renderComponent();
    const input = getByPlaceholderText('Buscar ciudad...');
    
    fireEvent.focus(input);
    fireEvent.changeText(input, 'Mad');

    await waitFor(() => {
      expect(getByText('Madrid')).toBeTruthy();
    });

    fireEvent.press(getByText('Madrid'));

    expect(mockOnSelect).toHaveBeenCalledWith('1', 'Madrid');
    expect(input.props.value).toBe('Madrid');
    // List should be hidden since query matches selected city name
    expect(queryByText('Málaga')).toBeNull(); 
  });

  it('clears selection when clear button is pressed', () => {
    const { getByText, getByPlaceholderText } = renderComponent({
      value: '1',
      initialCityName: 'Sevilla',
    });

    const clearButton = getByText('✕');
    fireEvent.press(clearButton);

    expect(mockOnSelect).toHaveBeenCalledWith(null, null);
    const input = getByPlaceholderText('Buscar ciudad...');
    expect(input.props.value).toBe('');
  });
});
