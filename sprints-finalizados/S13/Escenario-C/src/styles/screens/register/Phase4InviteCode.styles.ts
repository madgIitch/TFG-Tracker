import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: 20,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  helper: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
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
    gap: 10,
    marginBottom: 14,
  },
  choiceButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  choiceButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  buttonSlot: {
    flex: 1,
  },
});
