// src/screens/register/Phase4InvitationCode.styles.ts
import { StyleSheet } from 'react-native';
import { makeRegisterPhaseStyles } from '../../styles/common';
import { Theme } from '../../theme';

export const makeStyles = (theme: Theme) => ({
  ...makeRegisterPhaseStyles(theme),
  ...StyleSheet.create({
    title: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    helper: {
      fontSize: 14,
      textAlign: 'center' as const,
      marginBottom: 24,
      lineHeight: 20,
    },
    inputRow: {
      flexDirection: 'row' as const,
      gap: 8,
      marginBottom: 12,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      padding: 16,
      fontSize: 18,
      letterSpacing: 4,
      textAlign: 'center' as const,
      borderRadius: 12,
      fontWeight: '700' as const,
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder,
      color: theme.colors.text,
    },
    verifyButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    verifyButtonText: {
      color: '#FFFFFF',
      fontWeight: '700' as const,
      fontSize: 14,
    },
    successBox: {
      borderRadius: 12,
      padding: 14,
      backgroundColor: 'rgba(16, 185, 129, 0.10)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.30)',
      marginBottom: 16,
      gap: 2,
    },
    successLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.success,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    successRoom: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme.colors.text,
    },
    successFlat: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      textAlign: 'center' as const,
      marginBottom: 12,
    },
    skipButton: {
      marginTop: 8,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    skipText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textDecorationLine: 'underline' as const,
    },
  }),
});
