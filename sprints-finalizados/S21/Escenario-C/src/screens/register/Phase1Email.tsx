// src/screens/register/Phase1Email.tsx  
import React, { useState, useMemo } from 'react';  
import { View, Text, TextInput, Alert } from 'react-native';  
import { Button } from '../../components/Button';  
import { GoogleSignInButton } from '../../components/GoogleSignInButton';  
import { useTheme } from '../../theme/ThemeContext';  
import { Phase1Data } from '../../types/auth';  
import { createStyles } from '../../styles/screens/register/Phase1Email.styles';
  
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
  const styles = useMemo(() => createStyles(theme), [theme]);  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  

  const isValidEmailFormat = (value: string) => {
    const normalized = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i;
    return emailRegex.test(normalized);
  };
  
  const handleNext = () => {  
    if (!email) {  
      Alert.alert('Error', 'Por favor ingresa tu email');  
      return;  
    }  
    if (!password) {  
      Alert.alert('Error', 'Por favor ingresa tu contraseña');  
      return;  
    }  

    if (!isValidEmailFormat(email)) {
      Alert.alert('Error', 'Introduce un email valido.');
      return;
    }
  
    const phaseData: Phase1Data = { email: email.trim().toLowerCase(), password };  
    try {  
      onNext(phaseData);  
    } catch (error) {  
      console.error('ƒ?O Error en fase 1:', error);  
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
    <View style={styles.container}>  
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
                  isActive ? styles.stepDotActive : styles.stepDotInactive,
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
        <View style={styles.buttonStack}>
          <Button  
            title="¿Ya tienes cuenta? Inicia sesión"  
            onPress={handleGoToLogin}  
            variant="secondary"  
          />  
          <Button title="Continuar" onPress={handleNext} loading={loading} />
        </View>
      </View>
    </View>  
  );  
};  
  




