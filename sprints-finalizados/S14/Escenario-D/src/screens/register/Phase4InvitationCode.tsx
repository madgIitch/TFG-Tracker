import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/ThemeContext';
import { commonStyles } from '../../styles/common.styles';

interface Props {
    onNext: (data: { invitationCode?: string }) => void;
    onBack: () => void;
    loading?: boolean;
}

export const Phase4InvitationCode: React.FC<Props> = ({ onNext, onBack, loading }) => {
    const theme = useTheme();
    const [code, setCode] = useState('');

    const handleNext = () => {
        onNext({ invitationCode: code.trim() || undefined });
    };

    const handleSkip = () => {
        onNext({});
    };

    return (
        <View style={commonStyles.formContainer}>
            <Text style={[commonStyles.title, { color: theme.colors.text }]}>
                ¿Tienes un código de invitación?
            </Text>
            <Text style={[commonStyles.subtitle, { color: theme.colors.textSecondary, marginBottom: 24 }]}>
                Si un propietario te ha invitado a su piso, introduce el código aquí para unirte directamente a tu nueva habitación.
            </Text>

            <Text style={[commonStyles.label, { color: theme.colors.text }]}>
                Código de Invitación (Opcional)
            </Text>
            <TextInput
                style={[commonStyles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Ej: A1B2C3"
                placeholderTextColor={theme.colors.textSecondary}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                editable={!loading}
            />

            <View style={{ marginTop: 24, gap: 12 }}>
                <Button
                    title="Continuar"
                    onPress={handleNext}
                    loading={loading}
                    disabled={loading}
                />
                <Button
                    title="Omitir este paso"
                    onPress={handleSkip}
                    variant="secondary"
                    disabled={loading}
                />
                <TouchableOpacity onPress={onBack} disabled={loading} style={{ alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Volver atrás</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
