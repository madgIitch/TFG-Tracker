// src/screens/ForgotPasswordScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { authService } from '../services/authService';
import { Button } from '../components/Button';
import { makeStyles } from './ForgotPasswordScreen.styles';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Por favor introduce tu email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      Alert.alert('Error', 'Introduce un email válido');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(trimmed);
      setSent(true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successWrap}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              ¡Correo enviado!
            </Text>
            <Text style={[styles.successText, { color: theme.colors.textSecondary }]}>
              Hemos enviado un enlace de recuperación a{' '}
              <Text style={[styles.successEmail, { color: theme.colors.text }]}>{email.trim()}</Text>
              {'. '}
              Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
            </Text>
            <Button
              title="Volver al inicio de sesión"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="lock-closed-outline" size={32} color="#7C3AED" />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Recuperar contraseña
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña
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
                placeholder="Email"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button title="Enviar enlace" onPress={handleSend} loading={loading} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
