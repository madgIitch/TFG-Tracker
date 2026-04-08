import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { EditProfileScreen } from '../../src/screens/EditProfileScreen';
import { profileService } from '../../src/services/profileService';
import { ThemeProvider } from '../../src/theme/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { SwipeFiltersProvider } from '../../src/context/SwipeFiltersContext';
import { AuthContext } from '../../src/context/AuthContext';

jest.mock('../../src/services/profileService');
jest.mock('../../src/services/profilePhotoService');
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
    jest.spyOn(Alert, 'alert');
    (profileService.getProfile as jest.Mock).mockResolvedValue({
      id: '123',
      housing_situation: 'seeking',
      lifestyles: [],
    });
  });

  const renderScreen = () => render(
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
