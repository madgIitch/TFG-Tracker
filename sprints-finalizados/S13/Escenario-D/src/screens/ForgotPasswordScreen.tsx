// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeContext';
import { supabaseClient } from '../services/authService';
import { commonStyles } from '../styles/common.styles';
import { styles } from '../styles/screens/ForgotPasswordScreen.styles';

type RootStackParamList = {
    Login: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSendResetEmail = async () => {
        if (!email) {
            Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: 'homimatch://reset-password',
            });

            if (error) throw error;
            setSubmitted(true);
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Error al enviar el enlace');
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
                    <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar Contraseña</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </Text>
                </View>

                <View style={styles.form}>
                    {!submitted ? (
                        <>
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
                                placeholder="Email"
                                placeholderTextColor={theme.colors.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Button
                                title="Enviar Enlace"
                                onPress={handleSendResetEmail}
                                loading={loading}
                            />
                        </>
                    ) : (
                        <View style={styles.successContainer}>
                            <Text style={[styles.successText, { color: theme.colors.primary }]}>
                                ¡Enlace enviado! Revisa tu bandeja de entrada.
                            </Text>
                        </View>
                    )}

                    <Button
                        title="Volver al Login"
                        onPress={() => navigation.navigate('Login')}
                        variant="tertiary"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
