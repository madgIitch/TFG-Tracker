import type { ViewStyle, TextStyle } from 'react-native';

export const commonStyles: {
  screenContainer: ViewStyle;
  card: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  input: ViewStyle;
} = {
  screenContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
};
