// src/screens/register/Phase3Gender.styles.ts
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
    marginBottom: 6,
  },
  helper: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  segmentButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});

export const styles = { ...registerPhaseStyles, ..._extra };
