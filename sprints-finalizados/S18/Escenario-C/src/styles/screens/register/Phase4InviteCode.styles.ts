import { Dimensions, StyleSheet } from 'react-native';

const isSmallScreen = Dimensions.get('window').width <= 320;

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: 20,
    padding: isSmallScreen ? 12 : 20,
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
    marginBottom: 10,
  },
  helper: {
    fontSize: isSmallScreen ? 12 : 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: isSmallScreen ? 14 : 20,
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
  choiceRow: {
    flexDirection: 'row',
    gap: isSmallScreen ? 8 : 10,
    marginBottom: 14,
  },
  choiceButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: isSmallScreen ? 10 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  choiceButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  choiceText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 10 : 12,
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: isSmallScreen ? 12 : 16,
  },
  buttonSlot: {
    flex: 1,
  },
});
