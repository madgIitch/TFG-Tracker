// src/screens/register/Phase2Name.styles.ts
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
    input: {
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder,
      color: theme.colors.text,
    },
  }),
});
