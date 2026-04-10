// src/screens/register/Phase3BirthDate.styles.ts
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
      marginBottom: 16,
    },
    dateInput: {
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
      height: 54,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.text,
    },
  }),
});
