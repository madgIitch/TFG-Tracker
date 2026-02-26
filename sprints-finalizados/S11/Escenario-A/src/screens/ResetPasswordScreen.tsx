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
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { useTheme } from '../theme/ThemeContext';
import styles from '../styles/screens/ResetPasswordScreen.styles';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword:
    | {
        access_token?: string;
        refresh_token?: string;
        type?: string;
      }
    | undefined;
  Main: undefined;
};

type ResetPasswordRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ResetPassword'
>;

export const ResetPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<ResetPasswordRouteProp>();
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const recoveryParams = useMemo(() => route.params ?? {}, [route.params]);

  useEffect(() => {
    let isMounted = true;

    const consumeRecoveryData = async () => {
      try {
        const fromParams = await authService.establishRecoverySessionFromParams(
          recoveryParams
        );
        if (fromParams) {
          if (isMounted) {
            setLinkError(null);
            setInitializing(false);
          }
          return;
        }

        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const fromUrl = await authService.establishRecoverySessionFromUrl(initialUrl);
          if (isMounted) {
            setLinkError(fromUrl ? null : 'El enlace de recuperacion no es valido.');
            setInitializing(false);
          }
          return;
        }

        if (isMounted) {
          setLinkError('Abre esta pantalla desde el enlace de recuperacion del email.');
          setInitializing(false);
        }
      } catch (error) {
        if (isMounted) {
          setLinkError(
            error instanceof Error
              ? error.message
              : 'No se pudo validar el enlace de recuperacion.'
          );
          setInitializing(false);
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      authService
        .establishRecoverySessionFromUrl(url)
        .then((ok) => {
          if (!isMounted) return;
          setLinkError(ok ? null : 'El enlace de recuperacion no es valido.');
        })
        .catch((error) => {
          if (!isMounted) return;
          setLinkError(
            error instanceof Error
              ? error.message
              : 'No se pudo validar el enlace de recuperacion.'
          );
        });
    });

    consumeRecoveryData().catch(() => {
      if (isMounted) {
        setLinkError('No se pudo validar el enlace de recuperacion.');
        setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [recoveryParams]);

  const handleResetPassword = async () => {
    if (linkError) {
      Alert.alert('Error', linkError);
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Completa ambos campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(password);
      await authService.logout();
      Alert.alert('Contrasena actualizada', 'Ya puedes iniciar sesion con tu nueva contrasena.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo actualizar la contrasena'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Nueva contrasena</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Introduce y confirma tu nueva contrasena.
          </Text>
        </View>

        {linkError && (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.errorLight }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{linkError}</Text>
          </View>
        )}

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
            placeholder="Nueva contrasena"
            placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
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
            placeholder="Confirmar contrasena"
            placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title={initializing ? 'Validando enlace...' : 'Actualizar contrasena'}
            onPress={handleResetPassword}
            loading={loading || initializing}
            disabled={initializing || !!linkError}
          />

          <Button
            title="Volver a iniciar sesion"
            onPress={() => navigation.navigate('Login')}
            variant="tertiary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
