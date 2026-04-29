import React, { useMemo, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import type { PhaseInviteCodeData } from '../../types/auth';
import { flatInvitationService } from '../../services/flatInvitationService';
import { createStyles } from '../../styles/screens/register/Phase4InviteCode.styles';

interface Phase4InviteCodeProps {
  onNext: (data: PhaseInviteCodeData) => void;
  onBack: () => void;
  loading: boolean;
}

export const Phase4InviteCode: React.FC<Phase4InviteCodeProps> = ({
  onNext,
  onBack,
  loading,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [hasInviteCode, setHasInviteCode] = useState<boolean | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [validating, setValidating] = useState(false);

  const canContinue = useMemo(() => {
    if (hasInviteCode === false) return true;
    if (hasInviteCode === true) return inviteCode.trim().length > 0;
    return false;
  }, [hasInviteCode, inviteCode]);

  const handleContinue = async () => {
    if (hasInviteCode == null) {
      Alert.alert('Error', 'Selecciona una opcion para continuar');
      return;
    }

    if (!hasInviteCode) {
      onNext({ hasInviteCode: false });
      return;
    }

    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      Alert.alert('Error', 'Introduce un codigo de invitacion');
      return;
    }

    setValidating(true);
    try {
      const validation = await flatInvitationService.validateCode(normalizedCode);
      if (!validation) {
        Alert.alert(
          'Codigo invalido',
          'El codigo no es valido, ha expirado o la habitacion ya no esta disponible.'
        );
        return;
      }

      onNext({ hasInviteCode: true, inviteCode: normalizedCode });
    } catch (error) {
      console.error('Error validando codigo de invitacion:', error);
      Alert.alert('Error', 'No se pudo validar el codigo. Intentalo de nuevo.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Codigo de invitacion</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Paso 4 de 5</Text>

        <View style={styles.stepper}>
          {[1, 2, 3, 4, 5].map((step) => {
            const isActive = step === 4;
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

        <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
          Tienes un codigo para unirte directamente a un piso?
        </Text>

        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              { borderColor: theme.colors.border },
              hasInviteCode === true && styles.choiceButtonActive,
            ]}
            onPress={() => setHasInviteCode(true)}
          >
            <Text
              style={[
                styles.choiceText,
                { color: theme.colors.text },
                hasInviteCode === true && styles.choiceTextActive,
              ]}
            >
              Si, tengo codigo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.choiceButton,
              { borderColor: theme.colors.border },
              hasInviteCode === false && styles.choiceButtonActive,
            ]}
            onPress={() => setHasInviteCode(false)}
          >
            <Text
              style={[
                styles.choiceText,
                { color: theme.colors.text },
                hasInviteCode === false && styles.choiceTextActive,
              ]}
            >
              No tengo
            </Text>
          </TouchableOpacity>
        </View>

        {hasInviteCode ? (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            placeholder="Ej: HM-ABCD1234"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
          />
        ) : null}

        <View style={styles.buttonContainer}>
          <View style={styles.buttonSlot}>
            <Button title="Anterior" onPress={onBack} variant="tertiary" />
          </View>
          <View style={styles.buttonSlot}>
            <Button
              title="Continuar"
              onPress={handleContinue}
              loading={loading || validating}
              disabled={!canContinue || loading || validating}
            />
          </View>
        </View>
      </View>
    </View>
  );
};


