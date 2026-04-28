// src/screens/FlatSettlementScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.systemBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.glassPanel,
  },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: theme.colors.textSecondary },
  content: { padding: 20, gap: 4 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  sectionBadge: { color: theme.colors.primary },

  // Balance summary
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
    gap: 12,
  },
  balanceAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAvatarText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
  balanceName: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.text },
  balanceAmount: { fontSize: 15, fontWeight: '700', color: theme.colors.textSecondary },
  balancePositive: { color: '#10B981' },
  balanceNegative: { color: theme.colors.error },

  // Pending settlements
  settlementCard: {
    backgroundColor: theme.colors.glassBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settlementCardMyDebt: { borderColor: 'rgba(239, 68, 68, 0.30)', backgroundColor: 'rgba(254, 245, 245, 0.80)' },
  settlementCardMyCash: { borderColor: 'rgba(16, 185, 129, 0.30)', backgroundColor: 'rgba(240, 253, 248, 0.80)' },
  settlementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settlementNames: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  settlementArrowWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementFrom: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  settlementTo: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  settlementAmount: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  settlementHint: { fontSize: 12, color: theme.colors.error, marginTop: 4 },
  hintGreen: { color: '#10B981' },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  settleButtonDisabled: { opacity: 0.5 },
  settleButtonText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' },

  // Settled history
  settledCard: {
    backgroundColor: theme.colors.glassBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 14,
    marginBottom: 8,
  },
  settledName: { fontSize: 13, color: theme.colors.textSecondary },
  settledRight: { alignItems: 'flex-end' },
  settledAmount: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  settledDate: { fontSize: 11, color: theme.colors.textTertiary, marginTop: 2 },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  settledBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
});
