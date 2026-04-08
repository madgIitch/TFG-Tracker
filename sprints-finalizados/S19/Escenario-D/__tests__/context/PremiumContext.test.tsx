import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { PremiumProvider, usePremium } from '../../src/context/PremiumContext';
import { profileService } from '../../src/services/profileService';
import { AuthContext } from '../../src/context/AuthContext';
import { Text } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    onMessage: jest.fn(),
    getToken: jest.fn(),
  })),
}));

jest.mock('../../src/services/profileService', () => ({
  profileService: {
    getProfile: jest.fn(),
  },
}));

const TestComponent = () => {
  const { isPremium, loading } = usePremium();
  if (loading) return <Text>Loading...</Text>;
  return <Text>{isPremium ? 'Premium User' : 'Standard User'}</Text>;
};

describe('PremiumContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithAuthProvider = (isAuthenticated: boolean) => {
    const mockAuthContext = {
      isAuthenticated,
      user: null as any,
      login: jest.fn(),
      loginWithSession: jest.fn(),
      logout: jest.fn(),
      handleAuthError: jest.fn(),
      loading: false,
    };

    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <PremiumProvider>
          <TestComponent />
        </PremiumProvider>
      </AuthContext.Provider>
    );
  };

  it('renders standard user by default when not authenticated', async () => {
    const { getByText } = renderWithAuthProvider(false);
    expect(getByText('Standard User')).toBeTruthy();
    expect(profileService.getProfile).not.toHaveBeenCalled();
  });

  it('fetches profile and sets premium status if authenticated', async () => {
    (profileService.getProfile as jest.Mock).mockResolvedValue({ is_premium: true });
    
    const { getByText } = renderWithAuthProvider(true);
    
    await waitFor(() => {
      expect(getByText('Premium User')).toBeTruthy();
    });
    
    expect(profileService.getProfile).toHaveBeenCalled();
  });

  it('fetches profile and sets standard status if user is not premium', async () => {
    (profileService.getProfile as jest.Mock).mockResolvedValue({ is_premium: false });
    
    const { getByText } = renderWithAuthProvider(true);
    
    await waitFor(() => {
      expect(getByText('Standard User')).toBeTruthy();
    });
  });

  it('sets standard status if profile ends up being null or 404', async () => {
    (profileService.getProfile as jest.Mock).mockRejectedValue(new Error('Not found'));
    
    const { getByText } = renderWithAuthProvider(true);
    
    await waitFor(() => {
      expect(getByText('Standard User')).toBeTruthy();
    });
  });
});
