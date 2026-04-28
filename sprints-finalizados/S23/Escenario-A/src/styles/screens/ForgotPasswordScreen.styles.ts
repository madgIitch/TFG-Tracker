import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export const createForgotPasswordStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 32,
    },
    header: {
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
      borderRadius: 16,
      padding: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
    },
    form: {
      gap: 12,
    },
    input: {
      borderWidth: 1,
      padding: 16,
      fontSize: 16,
    },
  });

export default createForgotPasswordStyles;
