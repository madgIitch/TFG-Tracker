import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export const createRegisterScreenStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 24,
    },
    scrollContentCompact: {
      paddingHorizontal: 14,
      paddingTop: 16,
    },
    header: {
      alignItems: 'center',
      marginTop: '6%',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    headerCompact: {
      marginTop: 0,
      marginBottom: 16,
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
    logoImage: {
      width: 84,
      height: 84,
      marginBottom: 12,
    },
    logoImageCompact: {
      width: 68,
      height: 68,
      marginBottom: 8,
    },
    logo: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    logoCompact: {
      fontSize: 27,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 16,
    },
    subtitleCompact: {
      fontSize: 14,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    footer: {
      marginTop: 16,
      paddingBottom: 16,
    },
  });
