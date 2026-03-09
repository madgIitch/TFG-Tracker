// src/screens/register/Phase2Name.tsx  
import React, { useState } from 'react';  
import {
  View,
  Text,
  TextInput,
  Alert,
} from 'react-native';  
import { Button } from '../../components/Button';  
import { useTheme } from '../../theme/ThemeContext';  
import { Phase2Data } from '../../types/auth';  
import { styles } from '../../styles/screens/register/Phase2Name.styles';
  
interface Phase2NameProps {  
  onNext: (data: Phase2Data) => void;  
  onBack: () => void;  
  loading: boolean;  
}  
  
export const Phase2Name: React.FC<Phase2NameProps> = ({  
  onNext,  
  onBack,  
  loading,  
}) => {  
  const theme = useTheme();  
  const [firstName, setFirstName] = useState('');  
  const [lastName, setLastName] = useState('');  
  
  const handleNext = () => {  
    if (!firstName.trim()) {  
      Alert.alert('Error', 'Por favor ingresa tu nombre');  
      return;  
    }  
    if (!lastName.trim()) {  
      Alert.alert('Error', 'Por favor ingresa tus apellidos');  
      return;  
    }  
    onNext({ firstName, lastName });  
  };  
  
  return (  
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>  
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>  
          Tu información  
        </Text>  
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>  
          Paso 2 de 4  
        </Text>  
        <View style={styles.stepper}>
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === 2;
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
          placeholder="Nombre"  
          placeholderTextColor={theme.colors.textTertiary}  
          value={firstName}  
          onChangeText={setFirstName}  
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
          placeholder="Apellidos"  
          placeholderTextColor={theme.colors.textTertiary}  
          value={lastName}  
          onChangeText={setLastName}  
        />  

  
        <View style={styles.buttonContainer}>  
          <View style={styles.buttonSlot}>
            <Button title="Anterior" onPress={onBack} variant="tertiary" />
          </View>
          <View style={styles.buttonSlot}>
            <Button title="Continuar" onPress={handleNext} loading={loading} />
          </View>
        </View>  
      </View>
    </View>  
  );  
};  
  
