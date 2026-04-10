// src/screens/register/Phase3Gender.styles.ts
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
      marginBottom: 6,
    },
    helper: {
      fontSize: 13,
      textAlign: 'center' as const,
      marginBottom: 18,
    },
    segmentRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
      justifyContent: 'center' as const,
    },
    segmentButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: theme.colors.glassBackground,
      borderColor: theme.colors.glassBorder,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    segmentButtonText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
    },
  }),
});
