import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/LoginScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { authService } from '../../src/services/authService';
import { profileService } from '../../src/services/profileService';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mocks
jest.mock('../../src/services/authService', () => ({
  authService: {
    loginWithGoogle: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    onMessage: jest.fn(),
    getToken: jest.fn(),
  })),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../src/services/profileService', () => ({
  profileService: {
    getProfile: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../src/components/GoogleSignInButton', () => {
  const { Button } = require('react-native');
  return {
    GoogleSignInButton: ({ onPress }: any) => (
      <Button testID="google-sign-in" title="Google" onPress={onPress} />
    ),
  };
});

describe('LoginScreen Google SignIn Flow', () => {
  const mockNavigate = jest.fn();
  const mockLoginWithSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
  });

  const renderWithContext = () => {
    const mockAuthContext = {
      isAuthenticated: false,
      user: null as any,
      login: jest.fn(),
      loginWithSession: mockLoginWithSession,
      logout: jest.fn(),
      handleAuthError: jest.fn(),
      loading: false,
    };

    return render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <AuthContext.Provider value={mockAuthContext}>
          <LoginScreen />
        </AuthContext.Provider>
      </SafeAreaProvider>
    );
  };

  it('redirects to Register if profile does not exist', async () => {
    const mockUser = { id: '123', email: 'test@google.com' };
    (authService.loginWithGoogle as jest.Mock).mockResolvedValue({ user: mockUser, token: 'token123' });
    (profileService.getProfile as jest.Mock).mockRejectedValue(new Error('404 Not Found'));

    const { getByTestId } = renderWithContext();
    
    // Act
    fireEvent.press(getByTestId('google-sign-in'));

    // Assert
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'token123');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockNavigate).toHaveBeenCalledWith('Register', { prefilledGoogleUser: mockUser });
    });
  });

  it('calls loginWithSession if profile exists', async () => {
    const mockUser = { id: '123', email: 'test@google.com' };
    (authService.loginWithGoogle as jest.Mock).mockResolvedValue({ user: mockUser, token: 'token123', refreshToken: 'refresh123' });
    (profileService.getProfile as jest.Mock).mockResolvedValue({ id: 'prof1' });

    const { getByTestId } = renderWithContext();
    
    // Act
    fireEvent.press(getByTestId('google-sign-in'));

    // Assert
    await waitFor(() => {
      expect(mockLoginWithSession).toHaveBeenCalledWith(mockUser, 'token123', 'refresh123');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
