import { Dimensions, StyleSheet } from 'react-native';

const isSmallScreen = Dimensions.get('window').width <= 320;

export const createStyles = (_theme?: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: 20,
    padding: isSmallScreen ? 12 : 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: isSmallScreen ? 16 : 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    backgroundColor: '#7C3AED',
  },
  stepDotInactive: {
    backgroundColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 12 : 16,
    fontSize: isSmallScreen ? 14 : 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  authButtons: {
    marginBottom: 8,
  },
  buttonStack: {
    gap: 4,
  },
});

export const styles = createStyles();


