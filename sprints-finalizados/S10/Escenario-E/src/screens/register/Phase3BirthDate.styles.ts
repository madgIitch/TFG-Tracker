// src/screens/register/Phase3BirthDate.styles.ts
import { StyleSheet } from 'react-native';
import { registerPhaseStyles } from '../../styles/common';

const _extra = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
  },
});

export const styles = { ...registerPhaseStyles, ..._extra };
