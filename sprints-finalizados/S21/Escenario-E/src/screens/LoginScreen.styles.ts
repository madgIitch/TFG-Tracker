// src/screens/LoginScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
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
  },
  subtitle: {
    fontSize: 16,
  },
  form: {},
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
