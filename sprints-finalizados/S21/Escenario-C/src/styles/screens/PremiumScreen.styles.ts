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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      marginTop: 10,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
};

export const styles = createStyles();
