import { Dimensions, StyleSheet } from 'react-native';
import type { Theme } from '../../../theme';

const isCompactWidth = Dimensions.get('window').width <= 320;

export const createPhase4InvitationCodeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    card: {
      width: '100%',
      borderRadius: 20,
      padding: isCompactWidth ? 14 : 20,
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
      fontSize: isCompactWidth ? 21 : 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: isCompactWidth ? 14 : 16,
      textAlign: 'center',
      marginBottom: 6,
    },
    helper: {
      fontSize: isCompactWidth ? 12 : 13,
      textAlign: 'center',
      marginBottom: 18,
    },
    stepper: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: isCompactWidth ? 6 : 8,
      marginBottom: isCompactWidth ? 16 : 24,
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
      gap: isCompactWidth ? 8 : 10,
      justifyContent: 'center',
      marginBottom: 14,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: isCompactWidth ? 10 : 12,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
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
      marginTop: isCompactWidth ? 4 : 8,
    },
  });
