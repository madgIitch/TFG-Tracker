import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EEF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mutedText: {
    color: '#6B7280',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  chipActive: {
    backgroundColor: '#3C52A4',
    borderColor: '#3C52A4',
  },
  chipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  balanceName: {
    color: '#111827',
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#111827',
    fontWeight: '700',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#DC2626',
  },
  transferCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    gap: 10,
  },
  transferText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  transferHighlight: {
    fontWeight: '700',
  },
  settleButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#3C52A4',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settleButtonDisabled: {
    opacity: 0.6,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  historyText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  historyDate: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 12,
  },
});
