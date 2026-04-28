import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 24,
      gap: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    form: {
      width: '100%',
      gap: 12,
    },
    input: {
      borderWidth: 1,
      padding: 16,
      fontSize: 16,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.surface,
    },
  });
};

export const styles = createStyles();
