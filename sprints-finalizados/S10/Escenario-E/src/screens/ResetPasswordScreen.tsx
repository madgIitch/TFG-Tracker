// src/screens/ResetPasswordScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { authService } from '../services/authService';
import { supabaseClient } from '../services/authService';
import { Button } from '../components/Button';
import { styles } from './ResetPasswordScreen.styles';

type RootStackParamList = {
  Login: undefined;
  ResetPassword: undefined;
};

type ResetPasswordNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const theme = useTheme();

  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const parseUrl = (url: string | null) => {
      if (!url) return;
      const hash = url.split('#')[1] ?? '';
      const params = new URLSearchParams(hash);
      if (params.get('type') === 'recovery') {
        setAccessToken(params.get('access_token') ?? '');
        setRefreshToken(params.get('refresh_token') ?? '');
      }
    };

    Linking.getInitialURL().then(parseUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => parseUrl(url));
    return () => subscription.remove();
  }, []);

  const validatePasswords = (): boolean => {
    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleReset = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      await authService.resetPassword(password);
      Alert.alert(
        'Contraseña actualizada',
        'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.',
        [{ text: 'Aceptar', onPress: () => navigation.navigate('Login') }],
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.invalidState}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={[styles.invalidText, styles.invalidTextSpacing, { color: theme.colors.textSecondary }]}>
              El enlace de recuperación no es válido o ha expirado.
              Solicita uno nuevo desde la pantalla de inicio de sesión.
            </Text>
            <Button title="Volver al inicio de sesión" onPress={() => navigation.navigate('Login')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="key-outline" size={32} color="#7C3AED" />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Nueva contraseña</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Introduce tu nueva contraseña. Debe tener al menos 8 caracteres.
          </Text>
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
            onChangeText={text => { setPassword(text); setPasswordError(''); }}
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
            onChangeText={text => { setConfirmPassword(text); setPasswordError(''); }}
            secureTextEntry
          />

          {passwordError !== '' && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          <Button title="Restablecer contraseña" onPress={handleReset} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
