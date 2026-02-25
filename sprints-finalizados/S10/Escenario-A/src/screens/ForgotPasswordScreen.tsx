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
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { useTheme } from '../theme/ThemeContext';
import styles from '../styles/screens/ForgotPasswordScreen.styles';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Main: undefined;
};

type ForgotPasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

export const ForgotPasswordScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRecoveryEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Introduce tu correo electronico');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordResetEmail(email.trim());
      Alert.alert(
        'Correo enviado',
        'Si el email existe, recibiras un enlace para restablecer tu contrasena.'
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo enviar el correo'
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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Recuperar contrasena
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Introduce tu email y te enviaremos un enlace para restablecerla.
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
          />

          <Button
            title="Enviar enlace"
            onPress={handleSendRecoveryEmail}
            loading={loading}
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
