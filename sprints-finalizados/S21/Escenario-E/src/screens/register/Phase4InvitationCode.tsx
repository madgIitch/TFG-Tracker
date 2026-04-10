// src/screens/register/Phase4InvitationCode.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  invitationCodeService,
  ValidationResult,
} from '../../services/invitationCodeService';
import { makeStyles } from './Phase4InvitationCode.styles';

interface Phase4InvitationCodeProps {
  onNext: (code: string | null) => void;
  onBack: () => void;
  loading: boolean;
}

export const Phase4InvitationCode: React.FC<Phase4InvitationCodeProps> = ({
  onNext,
  onBack,
  loading,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setErrorMsg('El código debe tener al menos 4 caracteres');
      return;
    }
    setValidating(true);
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await invitationCodeService.validate(trimmed);
      setResult(res);
      if (!res.valid) {
        const reasons: Record<string, string> = {
          not_found: 'Código no encontrado',
          used: 'Este código ya fue utilizado',
          expired: 'Este código ha caducado',
        };
        setErrorMsg(reasons[res.reason ?? ''] ?? 'Código inválido');
      }
    } catch {
      setErrorMsg('No se pudo verificar el código. Inténtalo de nuevo.');
    } finally {
      setValidating(false);
    }
  };

  const handleContinueWithCode = () => {
    onNext(code.trim().toUpperCase());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Código de invitación
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Paso 4 de 5
          </Text>
          <Text style={[styles.helper, { color: theme.colors.textSecondary }]}>
            Si alguien te ha invitado a su piso, introduce el código aquí para unirte directamente.
          </Text>

          <View style={styles.stepper}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  { backgroundColor: step === 4 ? theme.colors.primary : '#E5E7EB' },
                ]}
              />
            ))}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="ABC12DEF"
              placeholderTextColor="#9CA3AF"
              value={code}
              onChangeText={(text) => {
                setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setResult(null);
                setErrorMsg(null);
              }}
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              disabled={validating || code.trim().length === 0}
            >
              {validating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verificar</Text>
              )}
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          {result?.valid && result.room && result.flat ? (
            <View style={styles.successBox}>
              <Text style={styles.successLabel}>Habitación encontrada</Text>
              <Text style={styles.successRoom}>{result.room.title}</Text>
              <Text style={styles.successFlat}>
                {result.flat.address}{result.flat.city ? `, ${result.flat.city}` : ''}
                {result.room.price_per_month
                  ? ` · ${result.room.price_per_month} EUR/mes`
                  : ''}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button title="Anterior" onPress={onBack} variant="tertiary" />
            {result?.valid ? (
              <Button
                title="Continuar con código"
                onPress={handleContinueWithCode}
                loading={loading}
              />
            ) : (
              <Button
                title="Sin código"
                onPress={() => onNext(null)}
                variant="secondary"
              />
            )}
          </View>

          {result?.valid ? (
            <TouchableOpacity style={styles.skipButton} onPress={() => onNext(null)}>
              <Text style={styles.skipText}>Continuar sin código</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
