// src/screens/register/Phase3Gender.tsx  
import React, { useState } from 'react';  
import {
  View,
  Text,
  Alert,
  TouchableOpacity
} from 'react-native';  
import { Button } from '../../components/Button';  
import { useTheme } from '../../theme/ThemeContext';  
import type { Gender } from '../../types/gender';
import styles from '../../styles/screens/register/Phase3Gender.styles';
  
interface Phase3GenderProps {  
  onNext: (gender: Gender) => void;  
  onBack: () => void;  
  loading: boolean;  
}  
  
export const Phase3Gender: React.FC<Phase3GenderProps> = ({  
  onNext,  
  onBack,  
  loading,  
}) => {  
  const theme = useTheme();  
  const [gender, setGender] = useState<Gender | null>(null);
  const activeStepDotStyle = { backgroundColor: theme.colors.primary };
  
  const handleNext = () => {  
    if (!gender) {  
      Alert.alert('Error', 'Por favor selecciona tu género');  
      return;  
    }  
    onNext(gender);  
  };  
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>  
          Tu género  
        </Text>  
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>  
          Paso 3 de 4  
        </Text>  
        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
          Esto nos ayuda a mostrarte pisos y compas adecuados.
        </Text>
        <View style={styles.stepper}>
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === 3;
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
  
        <View style={styles.segmentRow}>
          {[
            { id: 'male' as const, label: 'Hombre' },
            { id: 'female' as const, label: 'Mujer' },
            { id: 'non_binary' as const, label: 'No binario' },
            { id: 'other' as const, label: 'Otro' },
          ].map((option) => {
            const isActive = gender === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.segmentButton,
                  { borderColor: theme.colors.border },
                  isActive && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setGender(option.id)}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    { color: theme.colors.text },
                    isActive && styles.segmentButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
  
        <View style={styles.buttonContainer}>  
          <Button title="Anterior" onPress={onBack} variant="tertiary" />  
          <Button title="Continuar" onPress={handleNext} loading={loading} />  
        </View>  
      </View>
    </View>
  );
};

