import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.contentBackgroundMuted,
      paddingHorizontal: 20,
      paddingTop: 18,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      gap: 18,
      paddingVertical: 20,
    },
    hero: {
      gap: 8,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    comparison: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.cardSurface,
      gap: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
    },
    planRow: {
      flexDirection: 'row',
      gap: 10,
    },
    planColumn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      backgroundColor: colors.cardSurfaceAlt,
    },
    planColumnPremium: {
      borderColor: colors.primary,
    },
    planName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    planItem: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
  });
};

export const styles = createStyles();
