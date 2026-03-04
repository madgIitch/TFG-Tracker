// src/screens/register/Phase2Name.styles.ts
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
  input: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(242, 242, 247, 0.80)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
});

export const styles = { ...registerPhaseStyles, ..._extra };
