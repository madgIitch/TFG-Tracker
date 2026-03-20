// src/screens/register/Phase1Email.tsx  
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button } from '../../components/Button';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useTheme } from '../../theme/ThemeContext';
import { Phase1Data } from '../../types/auth';
import { phaseStyles as styles } from '../../styles/screens/RegisterPhases.styles';

interface Phase1EmailProps {
  onNext: (data: Phase1Data) => void;
  onGoogleSignIn: () => void;
  onGoToLogin: () => void;
  loading: boolean;
}

export const Phase1Email: React.FC<Phase1EmailProps> = ({
  onNext,
  onGoogleSignIn,
  onGoToLogin,
  loading,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Log component mount  
  useEffect(() => {
    console.log('[Phase1Email] Component mounted');
  }, []); 

  const handleNext = () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return;
    }

    const phaseData: Phase1Data = { email, password };
    try {
      onNext(phaseData);
    } catch (error) {
      console.error('[Phase1Email] Error en fase 1:', error);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleGoogleSignIn = () => {
    onGoogleSignIn();
  };

  const handleGoToLogin = () => {
    onGoToLogin();
  };

  return (
    <KeyboardAwareScrollView 
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 }}
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Crea tu cuenta
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Paso 1 de 4
        </Text>
        <View style={styles.stepper}>
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === 1;
            return (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isActive ? theme.colors.primary : '#E5E7EB',
                  },
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
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
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
          placeholder="Contraseña"
          placeholderTextColor={theme.colors.textTertiary}
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry
        />

        <View style={styles.authButtons}>
          <GoogleSignInButton onPress={handleGoogleSignIn} loading={loading} />
        </View>
        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={handleGoToLogin}
          variant="secondary"
        />
        <Button title="Continuar" onPress={handleNext} loading={loading} />
      </View>
    </KeyboardAwareScrollView>
  );
};
