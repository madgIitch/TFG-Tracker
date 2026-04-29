import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../src/context/AuthContext', () => {
  const ReactLocal = require('react');
  return {
    AuthContext: ReactLocal.createContext(undefined),
  };
});

const mockNavigate = jest.fn();
const mockRoute = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockRegisterPhase1 = jest.fn();
const mockRegisterPhase2 = jest.fn();
const mockRegisterPhase3 = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useRoute: () => mockRoute(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff',
      primary: '#111',
      text: '#111',
      textSecondary: '#666',
      textTertiary: '#999',
      border: '#ddd',
      surface: '#fff',
    },
    borderRadius: { md: 8 },
  }),
}));

jest.mock('../../src/hooks/useKeyboardAutoScroll', () => ({
  useKeyboardAutoScroll: () => ({
    scrollRef: { current: null },
    handleInputFocus: jest.fn(),
  }),
}));

jest.mock('../../src/components/GlassBackground', () => ({
  GlassBackground: () => null,
}));

jest.mock('../../src/components/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
    (() => {
      const ReactLocal = require('react');
      const { TouchableOpacity: RNTouchableOpacity, Text: RNText } = require('react-native');
      return ReactLocal.createElement(
        RNTouchableOpacity,
        { testID: `button-${title}`, onPress },
        ReactLocal.createElement(RNText, null, title)
      );
    })()
  ),
}));

jest.mock('../../src/components/GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onPress }: { onPress: () => void }) => (
    (() => {
      const ReactLocal = require('react');
      const { TouchableOpacity: RNTouchableOpacity, Text: RNText } = require('react-native');
      return ReactLocal.createElement(
        RNTouchableOpacity,
        { testID: 'google-signin', onPress },
        ReactLocal.createElement(RNText, null, 'Google Sign In')
      );
    })()
  ),
}));

jest.mock('../../src/screens/register/Phase1Email', () => ({
  Phase1Email: () => {
    const ReactLocal = require('react');
    const { Text: RNText } = require('react-native');
    return ReactLocal.createElement(RNText, null, 'Phase1Email');
  },
}));

jest.mock('../../src/screens/register/Phase2Name', () => ({
  Phase2Name: ({
    onNext,
    initialFirstName,
    initialLastName,
  }: {
    onNext: (data: { firstName: string; lastName: string }) => void;
    initialFirstName?: string;
    initialLastName?: string;
  }) => {
    const ReactLocal = require('react');
    const {
      Text: RNText,
      TouchableOpacity: RNTouchableOpacity,
      View: RNView,
    } = require('react-native');
    return ReactLocal.createElement(
      RNView,
      null,
      ReactLocal.createElement(RNText, null, 'Phase2Name'),
      ReactLocal.createElement(
        RNText,
        { testID: 'phase2-initial' },
        `${initialFirstName ?? ''}|${initialLastName ?? ''}`
      ),
      ReactLocal.createElement(
        RNTouchableOpacity,
        {
          testID: 'phase2-next',
          onPress: () => onNext({ firstName: 'Ana', lastName: 'Lopez' }),
        },
        ReactLocal.createElement(RNText, null, 'Next Phase 2')
      )
    );
  },
}));

jest.mock('../../src/screens/register/Phase3Gender', () => ({
  Phase3Gender: ({ onNext }: { onNext: (gender: 'female') => void }) => {
    const ReactLocal = require('react');
    const { TouchableOpacity: RNTouchableOpacity, Text: RNText } = require('react-native');
    return ReactLocal.createElement(
      RNTouchableOpacity,
      { testID: 'phase3-next', onPress: () => onNext('female') },
      ReactLocal.createElement(RNText, null, 'Next Phase 3')
    );
  },
}));

jest.mock('../../src/screens/register/Phase4InvitationCode', () => ({
  Phase4InvitationCode: ({
    onNext,
  }: {
    onNext: (data: { hasInvitationCode: boolean }) => void;
  }) => {
    const ReactLocal = require('react');
    const { TouchableOpacity: RNTouchableOpacity, Text: RNText } = require('react-native');
    return ReactLocal.createElement(
      RNTouchableOpacity,
      {
        testID: 'phase4-next',
        onPress: () => onNext({ hasInvitationCode: false }),
      },
      ReactLocal.createElement(RNText, null, 'Next Phase 4')
    );
  },
}));

jest.mock('../../src/screens/register/Phase3BirthDate', () => ({
  Phase3BirthDate: ({
    onComplete,
  }: {
    onComplete: (data: { birthDate: string }) => void;
  }) => {
    const ReactLocal = require('react');
    const { TouchableOpacity: RNTouchableOpacity, Text: RNText } = require('react-native');
    return ReactLocal.createElement(
      RNTouchableOpacity,
      {
        testID: 'phase5-complete',
        onPress: () => onComplete({ birthDate: '1998-10-10' }),
      },
      ReactLocal.createElement(RNText, null, 'Complete Phase 5')
    );
  },
}));

jest.mock('../../src/services/authService', () => ({
  authService: {
    loginWithGoogle: (...args: unknown[]) => mockLoginWithGoogle(...args),
    registerPhase1: (...args: unknown[]) => mockRegisterPhase1(...args),
    registerPhase2: (...args: unknown[]) => mockRegisterPhase2(...args),
    registerPhase3: (...args: unknown[]) => mockRegisterPhase3(...args),
  },
}));

const { AuthContext } = require('../../src/context/AuthContext');
const { LoginScreen } = require('../../src/screens/LoginScreen');
const { RegisterScreen } = require('../../src/screens/RegisterScreen');

const buildAuthContextValue = (overrides: Partial<any> = {}) => ({
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  loginWithSession: jest.fn(),
  logout: jest.fn(),
  handleAuthError: jest.fn(() => false),
  loading: false,
  ...overrides,
});

describe('Google flow integration in Login/Register screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoute.mockReturnValue({ params: undefined });
  });

  it('LoginScreen navigates to Register with googleUser when loginWithGoogle returns isNewUser', async () => {
    mockLoginWithGoogle.mockResolvedValue({
      isNewUser: true,
      user: {
        id: 'u1',
        email: 'new@test.com',
        first_name: 'New',
        last_name: 'User',
      },
      token: 'token-g',
      refreshToken: 'refresh-g',
      tempToken: 'temp-g',
      googleUserId: 'google-u1',
    });

    const authContextValue = buildAuthContextValue();
    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <AuthContext.Provider value={authContextValue}>
          <LoginScreen />
        </AuthContext.Provider>
      );
    });

    const googleButton = tree!.root.findByProps({ testID: 'google-signin' });
    await ReactTestRenderer.act(async () => {
      googleButton.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Register', {
      googleUser: {
        email: 'new@test.com',
        firstName: 'New',
        lastName: 'User',
        token: 'token-g',
        refreshToken: 'refresh-g',
        tempToken: 'temp-g',
        googleUserId: 'google-u1',
      },
    });
    expect(authContextValue.loginWithSession).not.toHaveBeenCalled();
  });

  it('LoginScreen logs in directly when Google user is existing', async () => {
    mockLoginWithGoogle.mockResolvedValue({
      isNewUser: false,
      user: { id: 'u2', email: 'old@test.com' },
      token: 'token-old',
      refreshToken: 'refresh-old',
    });

    const authContextValue = buildAuthContextValue();
    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <AuthContext.Provider value={authContextValue}>
          <LoginScreen />
        </AuthContext.Provider>
      );
    });

    const googleButton = tree!.root.findByProps({ testID: 'google-signin' });
    await ReactTestRenderer.act(async () => {
      googleButton.props.onPress();
    });

    expect(authContextValue.loginWithSession).toHaveBeenCalledWith(
      { id: 'u2', email: 'old@test.com' },
      'token-old',
      'refresh-old'
    );
    expect(mockNavigate).not.toHaveBeenCalledWith('Register', expect.anything());
  });

  it('RegisterScreen starts at phase 2 for googleUser and completes with google token session', async () => {
    mockRoute.mockReturnValue({
      params: {
        googleUser: {
          email: 'new@test.com',
          firstName: 'Google',
          lastName: 'User',
          token: 'google-token',
          refreshToken: 'google-refresh',
          tempToken: 'temp-google',
          googleUserId: 'google-u3',
        },
      },
    });
    mockRegisterPhase2.mockResolvedValue(undefined);
    mockRegisterPhase3.mockResolvedValue({
      user: { id: 'u3', email: 'new@test.com' },
      token: 'backend-token',
      refreshToken: 'backend-refresh',
    });

    const authContextValue = buildAuthContextValue();
    let tree: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        <AuthContext.Provider value={authContextValue}>
          <RegisterScreen />
        </AuthContext.Provider>
      );
    });

    const initialText = tree!.root.findByProps({ testID: 'phase2-initial' });
    expect(initialText.props.children).toBe('Google|User');
    expect(tree!.root.findAllByType(Text).some((node) => node.props.children === 'Phase1Email')).toBe(
      false
    );

    await ReactTestRenderer.act(async () => {
      tree!.root.findByProps({ testID: 'phase2-next' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      tree!.root.findByProps({ testID: 'phase3-next' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      tree!.root.findByProps({ testID: 'phase4-next' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      tree!.root.findByProps({ testID: 'phase5-complete' }).props.onPress();
    });

    expect(mockRegisterPhase2).toHaveBeenCalledWith('temp-google', {
      firstName: 'Ana',
      lastName: 'Lopez',
      gender: 'female',
    });
    expect(mockRegisterPhase3).toHaveBeenCalledWith(
      'temp-google',
      { birthDate: '1998-10-10', invitationCode: undefined },
      { googleUserId: 'google-u3' }
    );
    expect(authContextValue.loginWithSession).toHaveBeenCalledWith(
      { id: 'u3', email: 'new@test.com' },
      'google-token',
      'google-refresh'
    );
  });
});
