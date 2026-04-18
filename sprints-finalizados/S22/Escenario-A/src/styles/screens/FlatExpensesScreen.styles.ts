import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export const createFlatExpensesStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
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
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settlementButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryDark,
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    flatChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.glassBg,
    },
    flatChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    flatChipTextActive: {
      color: theme.colors.primary,
    },
    loadingState: {
      marginTop: 20,
      alignItems: 'center',
      gap: 8,
    },
    glassCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
    },
    emptyCard: {
      padding: 16,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    emptyText: {
      marginTop: 6,
      fontSize: 13,
      color: theme.colors.textSecondary,
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
      color: theme.colors.text,
      flex: 1,
    },
    expenseAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    expenseMeta: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    expenseDate: {
      marginTop: 6,
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
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
      color: theme.colors.text,
      marginBottom: 12,
    },
    label: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    input: {
      marginTop: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    optionChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.glassBg,
    },
    optionChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    optionChipTextActive: {
      color: theme.colors.primary,
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
      borderColor: theme.colors.border,
      paddingVertical: 8,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    segmentButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    segmentButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    segmentButtonTextActive: {
      color: '#FFFFFF',
    },
    helperText: {
      marginTop: 8,
      fontSize: 12,
      color: theme.colors.textSecondary,
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
      color: theme.colors.textSecondary,
      flex: 1,
    },
    customSplitInput: {
      width: 90,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
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
      backgroundColor: theme.colors.surfaceLight,
    },
    cancelBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
    },
    saveBtn: {
      backgroundColor: theme.colors.primary,
    },
    saveBtnDisabled: {
      backgroundColor: theme.colors.primaryLight,
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default createFlatExpensesStyles;
