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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
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
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
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
  emptyCard: {
    padding: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  expenseCard: {
    padding: 14,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  expenseMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#4B5563',
  },
  expenseDate: {
    marginTop: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
  },
  modalKeyboardContainer: {
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  modalCard: {
    padding: 16,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  chipWrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  optionChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  optionChipTextActive: {
    color: '#7C3AED',
  },
  segmentRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  segmentButtonActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#7C3AED',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  customSplitBlock: {
    marginTop: 8,
    gap: 8,
  },
  customSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  customSplitName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  customSplitInput: {
    width: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111827',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  modalActions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
  },
  saveBtnDisabled: {
    backgroundColor: '#A78BFA',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default styles;
