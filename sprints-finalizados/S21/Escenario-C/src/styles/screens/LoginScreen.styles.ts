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
      alignItems: 'center',
      marginTop: '12%',
      marginBottom: '10%',
    },
    logoImage: {
      width: 84,
      height: 84,
      marginBottom: 12,
    },
    logo: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.primary,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    form: {
      width: '100%',
      gap: 8,
    },
    input: {
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      borderColor: colors.border,
      color: colors.text,
      backgroundColor: colors.surface,
    },
  });
};

export const styles = createStyles();
