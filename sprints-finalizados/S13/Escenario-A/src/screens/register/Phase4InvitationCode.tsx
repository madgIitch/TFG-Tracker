import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useTheme } from '../../theme/ThemeContext';
import type { PhaseInvitationData } from '../../types/auth';
import styles from '../../styles/screens/register/Phase4InvitationCode.styles';

interface Phase4InvitationCodeProps {
  onNext: (data: PhaseInvitationData) => void;
  onBack: () => void;
  loading: boolean;
}

export const Phase4InvitationCode: React.FC<Phase4InvitationCodeProps> = ({
  onNext,
  onBack,
  loading,
}) => {
  const theme = useTheme();
  const [hasInvitationCode, setHasInvitationCode] = useState<boolean | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const activeStepDotStyle = { backgroundColor: theme.colors.primary };

  const handleNext = () => {
    if (hasInvitationCode == null) {
      Alert.alert('Error', 'Indica si tienes codigo de invitacion');
      return;
    }

    const normalizedCode = invitationCode.trim().toUpperCase();
    if (hasInvitationCode && !normalizedCode) {
      Alert.alert('Error', 'Introduce el codigo de invitacion');
      return;
    }

    onNext({
      hasInvitationCode,
      invitationCode: hasInvitationCode ? normalizedCode : undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Codigo de invitacion
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Paso 4 de 5
        </Text>
        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
          Si ya te invitaron a un piso, podras unirte directamente.
        </Text>
        <View style={styles.stepper}>
          {[1, 2, 3, 4, 5].map((step) => {
            const isActive = step === 4;
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
          <TouchableOpacity
            style={[
              styles.segmentButton,
              { borderColor: theme.colors.border },
              hasInvitationCode === false && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setHasInvitationCode(false)}
          >
            <Text
              style={[
                styles.segmentButtonText,
                { color: theme.colors.text },
                hasInvitationCode === false && styles.segmentButtonTextActive,
              ]}
            >
              No tengo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              { borderColor: theme.colors.border },
              hasInvitationCode === true && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setHasInvitationCode(true)}
          >
            <Text
              style={[
                styles.segmentButtonText,
                { color: theme.colors.text },
                hasInvitationCode === true && styles.segmentButtonTextActive,
              ]}
            >
              Si tengo
            </Text>
          </TouchableOpacity>
        </View>

        {hasInvitationCode ? (
          <Input
            label="Codigo"
            value={invitationCode}
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={(value) => setInvitationCode(value.toUpperCase())}
            placeholder="Ejemplo: A1B2C3D4"
            maxLength={16}
          />
        ) : null}

        <View style={styles.buttonContainer}>
          <Button title="Anterior" onPress={onBack} variant="tertiary" />
          <Button title="Continuar" onPress={handleNext} loading={loading} />
        </View>
      </View>
    </View>
  );
};
