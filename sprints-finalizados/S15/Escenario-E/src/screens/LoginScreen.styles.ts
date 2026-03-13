// src/screens/LoginScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
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
