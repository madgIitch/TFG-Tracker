import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TextInput, Linking } from 'react-native';
import { ForgotPasswordScreen } from '../../src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../../src/screens/ResetPasswordScreen';

const mockNavigate = jest.fn();
const mockRouteParams = jest.fn();
const mockRequestPasswordReset = jest.fn();
const mockSetRecoverySession = jest.fn();
const mockUpdatePassword = jest.fn();
const mockFormKeyboardWrapper = jest.fn(({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams() }),
}));

jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      border: '#E5E7EB',
      surface: '#F8FAFC',
      primary: '#7C3AED',
      onPrimary: '#FFFFFF',
      disabled: '#9CA3AF',
    },
    borderRadius: {
      md: 12,
    },
  }),
}));

jest.mock('../../src/services/authService', () => ({
  authService: {
    requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
    setRecoverySession: (...args: unknown[]) => mockSetRecoverySession(...args),
    updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
  },
}));

jest.mock('../../src/components/FormKeyboardWrapper', () => ({
  FormKeyboardWrapper: (props: { children: React.ReactNode }) =>
    mockFormKeyboardWrapper(props),
}));

describe('Auth recovery screens integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.mockReturnValue({});
    mockRequestPasswordReset.mockResolvedValue(undefined);
    mockSetRecoverySession.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ForgotPasswordScreen normalizes email and navigates to Login after success', async () => {
    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<ForgotPasswordScreen />);
      await Promise.resolve();
    });

    expect(mockFormKeyboardWrapper).toHaveBeenCalled();

    const emailInput = tree!.root.findByType(TextInput);
    await ReactTestRenderer.act(async () => {
      emailInput.props.onChangeText('  USER@Test.com  ');
      await Promise.resolve();
    });

    const sendButton = tree!.root.find(
      (node) => node.props?.title === 'Enviar enlace'
    );

    await ReactTestRenderer.act(async () => {
      await sendButton.props.onPress();
    });

    expect(mockRequestPasswordReset).toHaveBeenCalledWith(
      'user@test.com',
      'homimatchapp://auth/reset-password'
    );
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('ResetPasswordScreen prepares session and updates password', async () => {
    mockRouteParams.mockReturnValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
    });

    let tree: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<ResetPasswordScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFormKeyboardWrapper).toHaveBeenCalled();
    expect(mockSetRecoverySession).toHaveBeenCalledWith('access-1', 'refresh-1');

    const inputs = tree!.root.findAllByType(TextInput);
    expect(inputs).toHaveLength(2);

    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('new-password');
      inputs[1].props.onChangeText('new-password');
      await Promise.resolve();
    });

    const updateButton = tree!.root.find(
      (node) => node.props?.title === 'Actualizar contraseña'
    );

    await ReactTestRenderer.act(async () => {
      await updateButton.props.onPress();
    });

    expect(mockUpdatePassword).toHaveBeenCalledWith('new-password');
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
