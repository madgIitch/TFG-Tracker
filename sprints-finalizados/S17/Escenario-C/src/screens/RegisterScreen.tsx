// src/screens/RegisterScreen.tsx  
import React, { useRef, useState, useContext } from 'react';  
import {
  View,
  Alert,
  Text,
  Image,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';  
import { StackNavigationProp } from '@react-navigation/stack';  
import { AuthContext } from '../context/AuthContext';  
import { Button } from '../components/Button';  
import { useTheme } from '../theme/ThemeContext';  
import { authService } from '../services/authService';
import { Phase1Email } from './register/Phase1Email';  
import { Phase2Name } from './register/Phase2Name';  
import { Phase3Gender } from './register/Phase3Gender';
import { Phase4InviteCode } from './register/Phase4InviteCode';
import { Phase3BirthDate } from './register/Phase3BirthDate';  
import {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  PhaseGenderData,
  PhaseInviteCodeData,
  TempRegistration,
} from '../types/auth';  
import { styles } from '../styles/screens/RegisterScreen.styles';
import { useKeyboardAutoScroll } from '../hooks/useKeyboardAutoScroll';
  
type RootStackParamList = {  
  Login: undefined;  
  Register: undefined;  
  Main: undefined;  
};  
  
type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;  
  
export const RegisterScreen: React.FC = () => {  
  const navigation = useNavigation<RegisterScreenNavigationProp>();  
  const authContext = useContext(AuthContext);  
  
  if (!authContext) {  
    throw new Error('RegisterScreen must be used within AuthProvider');  
  }  
  
  const { loginWithSession } = authContext;  
  const theme = useTheme();  
  const scrollRef = useRef<KeyboardAwareScrollView | null>(null);
  useKeyboardAutoScroll(scrollRef, Platform.OS === 'ios' ? 12 : 96);
    
  const [currentPhase, setCurrentPhase] = useState(1);  
  const [tempRegistration, setTempRegistration] = useState<TempRegistration | null>(null);  
  const [phase2Data, setPhase2Data] = useState<Phase2Data | null>(null);
  const [inviteData, setInviteData] = useState<PhaseInviteCodeData | null>(null);
  const [loading, setLoading] = useState(false);  
  
  const handlePhase1 = async (data: Phase1Data) => {  
    setLoading(true);  
    try {  
      if (data.isGoogleUser) {  
        const result = await authService.loginWithGoogle();  
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
      console.error('ƒ?O Error en fase 1:', error);  
      const errorMessage = error instanceof Error ? error.message : String(error);  
      Alert.alert('Error', errorMessage);  
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
      console.error('ƒ?O Error en fase 3:', error);  
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');  
    } finally {  
      setLoading(false);  
    }  
  };  

  const handlePhase4 = (data: PhaseInviteCodeData) => {
    setInviteData(data);
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
        inviteCode: inviteData?.hasInviteCode ? inviteData.inviteCode : undefined,
      });  
      await loginWithSession(result.user, result.token, result.refreshToken);  
      // NavegaciÇün automÇ­tica manejada por AuthContext  
    } catch (error) {  
      console.error('ƒ?O Error en fase 4:', error);  
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
        tempToken: 'google_' + result.user.id,  
        email: result.user.email,  
        isGoogleUser: true,  
      });  
      // Para usuarios de Google, saltar directamente al paso 2  
      setCurrentPhase(2);  
    } catch (error) {  
      console.error('ƒ?O Error en login con Google:', error);  
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  return (  
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'ios' ? 12 : 0}
      showsVerticalScrollIndicator={false}
    >
        <View style={styles.header}>  
          <Image
            source={require('../assets/homiLogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
  
          <Text style={[styles.logo, { color: theme.colors.primary }]}>HomiMatch</Text>  
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>  
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
            />  
          )}
          {currentPhase === 2 && (  
            <Phase2Name  
              onNext={handlePhase2}  
              onBack={handleBack}  
              loading={loading}  
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
            <Phase4InviteCode
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
    </KeyboardAwareScrollView>
  );  
};
  
  
