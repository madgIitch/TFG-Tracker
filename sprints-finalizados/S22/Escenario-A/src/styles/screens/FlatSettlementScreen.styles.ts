import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export const createFlatSettlementStyles = (theme: Theme) =>
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
      alignItems: 'center',
      gap: 8,
      marginTop: 20,
    },
    glassCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
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
      color: theme.colors.text,
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtleText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    balanceName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    balanceAmount: {
      fontSize: 13,
      fontWeight: '700',
    },
    positiveBalance: {
      color: theme.colors.success,
    },
    negativeBalance: {
      color: theme.colors.error,
    },
    settlementRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 10,
    },
    settlementInfo: {
      gap: 4,
    },
    settlementText: {
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 18,
    },
    settlementAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    historyDate: {
      fontSize: 11,
      color: theme.colors.textTertiary,
    },
    settleButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    settleButtonDisabled: {
      backgroundColor: theme.colors.primaryLight,
    },
    settleButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default createFlatSettlementStyles;
