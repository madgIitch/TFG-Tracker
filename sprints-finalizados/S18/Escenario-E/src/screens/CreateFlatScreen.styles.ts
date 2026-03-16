// src/screens/CreateFlatScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  sectionHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segmentButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  segmentButtonDisabled: {
    backgroundColor: 'rgba(242, 242, 247, 0.60)',
    borderColor: 'rgba(229, 231, 235, 0.60)',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  segmentButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
