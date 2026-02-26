import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { styles } from '../styles/screens/ForgotPasswordScreen.styles';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

const PASSWORD_RESET_REDIRECT_URL = 'homimatchapp://auth/reset-password';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Introduce tu email');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(
        trimmedEmail,
        PASSWORD_RESET_REDIRECT_URL
      );
      Alert.alert(
        'Correo enviado',
        'Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.'
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el correo de recuperación'
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar contraseña</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Ingresa tu email y te enviaremos un enlace para restablecerla.</Text>
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
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Button
            title="Enviar enlace"
            onPress={handleSendResetEmail}
            loading={loading}
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
