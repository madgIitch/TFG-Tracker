// src/screens/register/Phase4InvitationCode.styles.ts
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
    marginBottom: 8,
  },
  helper: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 16,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    borderRadius: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(242, 242, 247, 0.80)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  verifyButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  successBox: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    marginBottom: 16,
    gap: 2,
  },
  successLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  successRoom: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  successFlat: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  skipButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});

export const styles = { ...registerPhaseStyles, ..._extra };
