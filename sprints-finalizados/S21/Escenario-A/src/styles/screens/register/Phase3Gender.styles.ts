import { StyleSheet } from 'react-native';
import type { Theme } from '../../../theme';

export const createPhase3GenderStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    card: {
      width: '100%',
      borderRadius: 20,
      padding: 20,
      backgroundColor: theme.colors.glassBgStrong,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.glassShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 6,
    },
    helper: {
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 18,
    },
    stepper: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    stepDotInactive: {
      backgroundColor: theme.colors.border,
    },
    segmentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'center',
    },
    segmentButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      shadowColor: theme.colors.glassShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    segmentButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    segmentButtonTextActive: {
      color: '#FFFFFF',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
  });
