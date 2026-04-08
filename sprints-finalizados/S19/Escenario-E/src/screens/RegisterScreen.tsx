// src/screens/RegisterScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, Alert, Text, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { authService } from '../services/authService';
import { invitationCodeService } from '../services/invitationCodeService';
import { Phase1Email } from './register/Phase1Email';
import { Phase2Name } from './register/Phase2Name';
import { Phase3Gender } from './register/Phase3Gender';
import { Phase4InvitationCode } from './register/Phase4InvitationCode';
import { Phase3BirthDate } from './register/Phase3BirthDate';
import {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  PhaseGenderData,
  TempRegistration,
  GoogleUserParams,
} from '../types/auth';
import type { Gender } from '../types/gender';
import { styles } from './RegisterScreen.styles';

type RootStackParamList = {
  Login: undefined;
  Register: { googleUser?: GoogleUserParams } | undefined;
  Main: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const route = useRoute<RegisterScreenRouteProp>();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('RegisterScreen must be used within AuthProvider');
  }

  const { loginWithSession } = authContext;
  const theme = useTheme();

  // Google user params passed from LoginScreen when isNewUser === true
  const googleUserParams = route.params?.googleUser ?? null;

  const [currentPhase, setCurrentPhase] = useState(googleUserParams ? 2 : 1);
  const [tempRegistration, setTempRegistration] = useState<TempRegistration | null>(null);
  const [phase2Data, setPhase2Data] = useState<Phase2Data | null>(null);
  const [googleGender, setGoogleGender] = useState<Gender | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isGoogleFlow = Boolean(googleUserParams);

  const handlePhase1 = async (data: Phase1Data) => {
    setLoading(true);
    try {
      if (data.isGoogleUser) {
        const result = await authService.loginWithGoogle();
        if (result.isNewUser === false) {
          // Already registered — log them in directly
          await loginWithSession(result.user, result.token, result.refreshToken);
          return;
        }
        setTempRegistration({
          tempToken: 'google_' + result.user.id,
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
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePhase2 = (data: Phase2Data) => {
    setPhase2Data(data);
    setCurrentPhase(3);
  };

  const handlePhase3 = async (gender: PhaseGenderData['gender']) => {
    if (isGoogleFlow) {
      // For Google flow: store gender locally, skip API call
      setGoogleGender(gender);
      setCurrentPhase(4);
      return;
    }

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

  const handlePhase4 = (code: string | null) => {
    setInvitationCode(code);
    setCurrentPhase(5);
  };

  const handlePhase5 = async (data: Phase3Data) => {
    if (isGoogleFlow) {
      if (!googleUserParams || !phase2Data || !googleGender) {
        Alert.alert('Error', 'Faltan datos del registro con Google');
        return;
      }

      setLoading(true);
      try {
        await authService.completeGoogleRegistration(googleUserParams.token, {
          firstName: phase2Data.firstName,
          lastName: phase2Data.lastName,
          gender: googleGender,
          birthDate: data.birthDate,
        });

        if (invitationCode) {
          try {
            await invitationCodeService.redeem(invitationCode, googleUserParams.token);
          } catch (redeemError) {
            console.warn('Error al canjear código de invitación:', redeemError);
          }
        }

        await loginWithSession(
          googleUserParams.user,
          googleUserParams.token,
          googleUserParams.refreshToken
        );
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!tempRegistration) {
      Alert.alert('Error', 'Registro temporal no encontrado');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.registerPhase3(tempRegistration.tempToken, data);
      if (invitationCode) {
        try {
          await invitationCodeService.redeem(invitationCode, result.token);
        } catch (redeemError) {
          console.warn('Error al canjear código de invitación:', redeemError);
        }
      }
      await loginWithSession(result.user, result.token, result.refreshToken);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isGoogleFlow && currentPhase === 2) {
      navigation.goBack();
      return;
    }
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle();
      if (result.isNewUser === false) {
        await loginWithSession(result.user, result.token, result.refreshToken);
        return;
      }
      setTempRegistration({
        tempToken: 'google_' + result.user.id,
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

  const totalPhases = 5;
  const displayPhase = isGoogleFlow ? currentPhase - 1 : currentPhase;
  const displayTotal = isGoogleFlow ? totalPhases - 1 : totalPhases;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/homiLogo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.logo, { color: theme.colors.primary }]}>HomiMatch</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Crea tu cuenta - Paso {displayPhase} de {displayTotal}
        </Text>
      </View>

      <View style={styles.content}>
        {currentPhase === 1 && (
          <Phase1Email
            onNext={handlePhase1}
            onGoogleSignIn={handleGoogleSignIn}
            onGoToLogin={() => navigation.navigate('Login')}
            loading={loading}
          />
        )}
        {currentPhase === 2 && (
          <Phase2Name
            onNext={handlePhase2}
            onBack={handleBack}
            loading={loading}
            initialFirstName={googleUserParams?.user.first_name ?? ''}
            initialLastName={googleUserParams?.user.last_name ?? ''}
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
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
        />
      </View>
    </View>
  );
};
