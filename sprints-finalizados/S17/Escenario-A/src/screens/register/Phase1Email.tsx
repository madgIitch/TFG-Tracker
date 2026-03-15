// src/screens/register/Phase1Email.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { Button } from '../../components/Button';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useTheme } from '../../theme/ThemeContext';
import { Phase1Data } from '../../types/auth';
import styles from '../../styles/screens/register/Phase1Email.styles';

interface Phase1EmailProps {
  onNext: (data: Phase1Data) => void;
  onGoogleSignIn: () => void;
  onGoToLogin: () => void;
  loading: boolean;
  onInputFocus?: () => void;
}

export const Phase1Email: React.FC<Phase1EmailProps> = ({
  onNext,
  onGoogleSignIn,
  onGoToLogin,
  loading,
  onInputFocus,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const activeStepDotStyle = { backgroundColor: theme.colors.primary };

  const handleNext = () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Por favor ingresa tu contrasena');
      return;
    }

    const phaseData: Phase1Data = { email, password };
    try {
      onNext(phaseData);
    } catch (error) {
      console.error('Error en fase 1:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Crea tu cuenta</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Paso 1 de 4</Text>
        <View style={styles.stepper}>
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === 1;
            return (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  isActive ? activeStepDotStyle : styles.stepDotInactive,
                ]}
              />
            );
          })}
        </View>

        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
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
          onFocus={onInputFocus}
        />

        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            },
          ]}
          placeholder="Contrasena"
          placeholderTextColor={theme.colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={onInputFocus}
        />

        <View style={styles.authButtons}>
          <GoogleSignInButton onPress={onGoogleSignIn} loading={loading} />
        </View>
        <Button
          title="Ya tienes cuenta? Inicia sesion"
          onPress={onGoToLogin}
          variant="secondary"
        />
        <Button title="Continuar" onPress={handleNext} loading={loading} />
      </View>
    </View>
  );
};
