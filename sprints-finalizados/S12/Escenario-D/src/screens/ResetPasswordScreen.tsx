// src/screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { supabaseClient } from '../services/authService';
import { commonStyles } from '../styles/common.styles';
import { styles } from '../styles/screens/ResetPasswordScreen.styles';

type RootStackParamList = {
    Login: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const ResetPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const theme = useTheme();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: password
            });

            if (error) throw error;

            Alert.alert('Éxito', 'Tu contraseña ha sido actualizada', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[commonStyles.keyboardAvoiding, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={commonStyles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Nueva Contraseña</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Ingresa tu nueva contraseña a continuación.
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={[
                            commonStyles.input,
                            {
                                borderColor: theme.colors.border,
                                borderRadius: theme.borderRadius.md,
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                            },
                        ]}
                        placeholder="Nueva Contraseña"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TextInput
                        style={[
                            commonStyles.input,
                            {
                                borderColor: theme.colors.border,
                                borderRadius: theme.borderRadius.md,
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                            },
                        ]}
                        placeholder="Confirmar Contraseña"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Actualizar Contraseña"
                        onPress={handleUpdatePassword}
                        loading={loading}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
