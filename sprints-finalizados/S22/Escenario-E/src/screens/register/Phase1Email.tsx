// src/screens/register/Phase1Email.tsx  
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '../../components/Button';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useTheme } from '../../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phase1Data } from '../../types/auth';
import { makeStyles } from './Phase1Email.styles';  
  
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
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  
  const handleNext = () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'El formato del email no es válido');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return;
    }

    onNext({ email: email.trim(), password });
  };  
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
      <Text style={[styles.title, { color: theme.colors.text }]}>  
          Crea tu cuenta  
        </Text>  
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>  
          Paso 1 de 5
        </Text>
        <View style={styles.stepper}>
          {[1, 2, 3, 4, 5].map((step) => {
            const isActive = step === 1;
            return (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.border,
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
          onChangeText={setEmail}
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
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.authButtons}>
          <GoogleSignInButton onPress={onGoogleSignIn} loading={loading} />
        </View>
        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={onGoToLogin}
          variant="secondary"
        />
        <Button title="Continuar" onPress={handleNext} loading={loading} />  
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );  
};  
  
