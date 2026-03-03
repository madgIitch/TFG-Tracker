import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { styles } from '../styles/screens/ResetPasswordScreen.styles';

type RootStackParamList = {
  Login: undefined;
  ResetPassword:
    | {
        access_token?: string;
        refresh_token?: string;
      }
    | undefined;
};

type ResetPasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ResetPassword'
>;

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>();
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [preparingSession, setPreparingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const tokensFromRoute = useMemo(
    () => ({
      accessToken: route.params?.access_token,
      refreshToken: route.params?.refresh_token,
    }),
    [route.params?.access_token, route.params?.refresh_token]
  );

  useEffect(() => {
    let isMounted = true;

    const extractTokensFromUrl = (url: string | null) => {
      if (!url) {
        return { accessToken: undefined, refreshToken: undefined };
      }

      const queryPart =
        (url.includes('#') ? url.split('#')[1] : undefined) ??
        (url.includes('?') ? url.split('?')[1] : '');

      const params = queryPart.split('&').reduce<Record<string, string>>((acc, part) => {
        const [rawKey, rawValue] = part.split('=');
        if (!rawKey || rawValue == null) {
          return acc;
        }

        acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
        return acc;
      }, {});

      return {
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
      };
    };

    const prepareRecoverySession = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        const tokensFromUrl = extractTokensFromUrl(initialUrl);

        const accessToken = tokensFromRoute.accessToken ?? tokensFromUrl.accessToken;
        const refreshToken =
          tokensFromRoute.refreshToken ?? tokensFromUrl.refreshToken;

        if (!accessToken || !refreshToken) {
          throw new Error('El enlace de recuperación es inválido o incompleto');
        }

        await authService.setRecoverySession(accessToken, refreshToken);

        if (isMounted) {
          setSessionReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setSessionReady(false);
          Alert.alert(
            'Enlace no válido',
            error instanceof Error
              ? error.message
              : 'No se pudo validar el enlace de recuperación'
          );
        }
      } finally {
        if (isMounted) {
          setPreparingSession(false);
        }
      }
    };

    prepareRecoverySession().catch((error) => {
      if (!isMounted) return;
      setPreparingSession(false);
      setSessionReady(false);
      Alert.alert(
        'Enlace no válido',
        error instanceof Error
          ? error.message
          : 'No se pudo validar el enlace de recuperación'
      );
    });

    return () => {
      isMounted = false;
    };
  }, [tokensFromRoute.accessToken, tokensFromRoute.refreshToken]);

  const handleUpdatePassword = async () => {
    if (!sessionReady) {
      Alert.alert('Error', 'Debes abrir la pantalla desde el enlace del correo');
      return;
    }

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert('Error', 'Completa ambos campos');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(trimmedPassword);
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la contraseña'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Nueva contraseña</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Introduce tu nueva contraseña para completar la recuperación.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            placeholder="Nueva contraseña"
            placeholderTextColor={theme.colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            placeholder="Confirmar contraseña"
            placeholderTextColor={theme.colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title="Actualizar contraseña"
            onPress={handleUpdatePassword}
            loading={loading || preparingSession}
            disabled={preparingSession || !sessionReady}
          />

          <Button
            title="Volver a iniciar sesión"
            onPress={() => navigation.navigate('Login')}
            variant="tertiary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
