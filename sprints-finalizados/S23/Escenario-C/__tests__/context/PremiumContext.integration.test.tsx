import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { AuthContext } from '../../src/context/AuthContext';
import { PremiumProvider, usePremium } from '../../src/context/PremiumContext';

const mockGetProfile = jest.fn();

jest.mock('../../src/services/profileService', () => ({
  profileService: {
    getProfile: (...args: unknown[]) => mockGetProfile(...args),
  },
}));

const PremiumConsumer: React.FC = () => {
  const premium = usePremium();
  return (
    <>
      <Text testID="isPremium">{String(premium.isPremium)}</Text>
      <Text testID="canAdvanced">{String(premium.canUseFeature('advanced_filters'))}</Text>
    </>
  );
};

const renderWithAuth = async (authValue: React.ContextType<typeof AuthContext>) => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <AuthContext.Provider value={authValue}>
        <PremiumProvider>
          <PremiumConsumer />
        </PremiumProvider>
      </AuthContext.Provider>
    );
    await Promise.resolve();
  });

  return tree!;
};

describe('PremiumContext integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables premium features when profile returns is_premium true', async () => {
    mockGetProfile.mockResolvedValue({ is_premium: true });

    const tree = await renderWithAuth({
      user: { id: 'u1', email: 'a@a.com', first_name: 'A', last_name: 'A', birth_date: '2000-01-01', created_at: '', is_premium: false },
      isAuthenticated: true,
      login: jest.fn(),
      loginWithSession: jest.fn(),
      logout: jest.fn(),
      handleAuthError: jest.fn(),
      loading: false,
    });

    const isPremium = tree.root.findByProps({ testID: 'isPremium' });
    const canAdvanced = tree.root.findByProps({ testID: 'canAdvanced' });

    expect(isPremium.props.children).toBe('true');
    expect(canAdvanced.props.children).toBe('true');
  });

  it('falls back to auth user is_premium when profile fetch fails', async () => {
    mockGetProfile.mockRejectedValue(new Error('boom'));

    const tree = await renderWithAuth({
      user: { id: 'u1', email: 'a@a.com', first_name: 'A', last_name: 'A', birth_date: '2000-01-01', created_at: '', is_premium: true },
      isAuthenticated: true,
      login: jest.fn(),
      loginWithSession: jest.fn(),
      logout: jest.fn(),
      handleAuthError: jest.fn(),
      loading: false,
    });

    const isPremium = tree.root.findByProps({ testID: 'isPremium' });
    expect(isPremium.props.children).toBe('true');
  });

  it('disables premium when not authenticated', async () => {
    mockGetProfile.mockResolvedValue({ is_premium: true });

    const tree = await renderWithAuth({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      loginWithSession: jest.fn(),
      logout: jest.fn(),
      handleAuthError: jest.fn(),
      loading: false,
    });

    const isPremium = tree.root.findByProps({ testID: 'isPremium' });
    const canAdvanced = tree.root.findByProps({ testID: 'canAdvanced' });

    expect(isPremium.props.children).toBe('false');
    expect(canAdvanced.props.children).toBe('false');
  });
});
