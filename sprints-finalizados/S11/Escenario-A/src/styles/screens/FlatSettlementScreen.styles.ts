import { StyleSheet } from 'react-native';
import { commonStyles } from '../common';

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  flatChips: {
    flexDirection: 'row',
    gap: 10,
  },
  flatChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  flatChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  flatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  flatChipTextActive: {
    color: '#7C3AED',
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  glassCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionCard: {
    padding: 14,
  },
  emptyCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subtleText: {
    fontSize: 13,
    color: '#6B7280',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.7)',
  },
  balanceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  balanceAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#DC2626',
  },
  settlementRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.7)',
    gap: 10,
  },
  settlementInfo: {
    gap: 4,
  },
  settlementText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  settlementAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  historyDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  settleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  settleButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  settleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default styles;
