import React, { useContext, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { authService } from '../services/authService';
import { useKeyboardAutoScroll } from '../hooks/useKeyboardAutoScroll';
import { Phase1Email } from './register/Phase1Email';
import { Phase2Name } from './register/Phase2Name';
import { Phase3Gender } from './register/Phase3Gender';
import { Phase4InvitationCode } from './register/Phase4InvitationCode';
import { Phase3BirthDate } from './register/Phase3BirthDate';
import styles from '../styles/screens/RegisterScreen.styles';
import { GlassBackground } from '../components/GlassBackground';
import {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  PhaseGenderData,
  PhaseInvitationData,
  TempRegistration,
} from '../types/auth';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('RegisterScreen must be used within AuthProvider');
  }

  const { loginWithSession } = authContext;
  const theme = useTheme();
  const { scrollRef, handleInputFocus } = useKeyboardAutoScroll({ extraOffset: 90 });
  const isCompactWidth = width <= 320;

  const [currentPhase, setCurrentPhase] = useState(1);
  const [tempRegistration, setTempRegistration] = useState<TempRegistration | null>(null);
  const [phase2Data, setPhase2Data] = useState<Phase2Data | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handlePhase1 = async (data: Phase1Data) => {
    setLoading(true);
    try {
      if (data.isGoogleUser) {
        const result = await authService.loginWithGoogle();
        setTempRegistration({
          tempToken: `google_${result.user.id}`,
          email: result.user.email,
          isGoogleUser: true,
        });
        setCurrentPhase(2);
      } else {
        const tempReg = await authService.registerPhase1(data);
        setTempRegistration(tempReg);
        setCurrentPhase(2);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handlePhase2 = (data: Phase2Data) => {
    setPhase2Data(data);
    setCurrentPhase(3);
  };

  const handlePhase3 = async (gender: PhaseGenderData['gender']) => {
    if (!tempRegistration) {
      Alert.alert('Error', 'Registro temporal no encontrado');
      return;
    }
    if (!phase2Data) {
      Alert.alert('Error', 'Datos personales incompletos');
      return;
    }

    setLoading(true);
    try {
      await authService.registerPhase2(tempRegistration.tempToken, {
        ...phase2Data,
        gender,
      });
      setCurrentPhase(4);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handlePhase4 = (data: PhaseInvitationData) => {
    setInvitationCode(data.hasInvitationCode ? data.invitationCode : undefined);
    setCurrentPhase(5);
  };

  const handlePhase5 = async (data: Phase3Data) => {
    if (!tempRegistration) {
      Alert.alert('Error', 'Registro temporal no encontrado');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.registerPhase3(tempRegistration.tempToken, {
        ...data,
        invitationCode,
      });
      await loginWithSession(result.user, result.token, result.refreshToken);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle();
      setTempRegistration({
        tempToken: `google_${result.user.id}`,
        email: result.user.email,
        isGoogleUser: true,
      });
      setCurrentPhase(2);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
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
      <GlassBackground />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 28) },
          isCompactWidth && styles.scrollContentCompact,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, isCompactWidth && styles.headerCompact]}>
          <Image
            source={require('../assets/homiLogo.png')}
            style={[styles.logoImage, isCompactWidth && styles.logoImageCompact]}
            resizeMode="contain"
          />

          <Text style={[styles.logo, isCompactWidth && styles.logoCompact, { color: theme.colors.primary }]}>HomiMatch</Text>
          <Text style={[styles.subtitle, isCompactWidth && styles.subtitleCompact, { color: theme.colors.textSecondary }]}>
            Crea tu cuenta - Paso {currentPhase} de 5
          </Text>
        </View>

        <View style={styles.content}>
          {currentPhase === 1 && (
            <Phase1Email
              onNext={handlePhase1}
              onGoogleSignIn={handleGoogleSignIn}
              onGoToLogin={() => navigation.navigate('Login')}
              loading={loading}
              onInputFocus={handleInputFocus}
            />
          )}
          {currentPhase === 2 && (
            <Phase2Name
              onNext={handlePhase2}
              onBack={handleBack}
              loading={loading}
              onInputFocus={handleInputFocus}
            />
          )}
          {currentPhase === 3 && (
            <Phase3Gender
              onNext={handlePhase3}
              onBack={handleBack}
              loading={loading}
            />
          )}
          {currentPhase === 4 && (
            <Phase4InvitationCode
              onNext={handlePhase4}
              onBack={handleBack}
              loading={loading}
              onInputFocus={handleInputFocus}
            />
          )}
          {currentPhase === 5 && (
            <Phase3BirthDate
              onComplete={handlePhase5}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Button
            title="Ya tienes cuenta? Inicia sesion"
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
