import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { EditProfileScreen } from '../../src/screens/EditProfileScreen';
import { profileService } from '../../src/services/profileService';
import { ThemeProvider } from '../../src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { SwipeFiltersProvider } from '../../src/context/SwipeFiltersContext';
import { AuthContext } from '../../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../../src/services/profileService');
jest.mock('../../src/services/profilePhotoService');
jest.mock('../../src/services/locationService', () => ({
  locationService: {
    searchCities: jest.fn().mockResolvedValue([]),
    getCityPlaces: jest.fn().mockResolvedValue([]),
  }
}));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn() }
}));
jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/messaging', () => () => ({}));
jest.mock('../../src/context/SwipeFiltersContext', () => ({
  useSwipeFilters: () => ({
    filters: {},
    setFilters: jest.fn()
  })
}));

describe('EditProfileScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = (msg, ...args) => { throw new Error('WARNING: ' + msg + args.join(' ')); };
    console.error = (msg, ...args) => { throw new Error('ERROR: ' + msg + args.join(' ')); };
    jest.spyOn(Alert, 'alert');
    (profileService.getProfile as jest.Mock).mockResolvedValue({
      id: '123',
      housing_situation: 'seeking',
      lifestyles: [],
    });
  });

  const mockMetrics = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };

  const renderScreen = () => render(
    <SafeAreaProvider initialMetrics={mockMetrics}>
      <AuthContext.Provider value={{
        handleAuthError: jest.fn(),
        session: null,
        user: null
      } as any}>
        <ThemeProvider>
          <NavigationContainer>
            <EditProfileScreen />
          </NavigationContainer>
        </ThemeProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );

  it('limits lifestyles selection to 5 items', async () => {
    const { getByText } = renderScreen();
    // we need to wait for profile to load
    await waitFor(() => {
      expect(profileService.getProfile).toHaveBeenCalled();
    });

    // select 6 lifestyles based on ESTILO_VIDA_OPTIONS labels
    const chipsToClick = [
      'Madrugador',
      'Noctambulo',
      'No fumador',
      'Deportista',
      'Tiene mascota',
      'Vegano/Vegetariano'
    ];
    
    for (const chip of chipsToClick.slice(0, 5)) {
      fireEvent.press(getByText(chip));
    }
    
    // click 6th
    fireEvent.press(getByText(chipsToClick[5]));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Limite',
      'Puedes seleccionar hasta 5 estilos de vida.'
    );
  });
});
