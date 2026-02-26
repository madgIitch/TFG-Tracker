import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
  },
  subtitle: {
    fontSize: 16,
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
  },
});
