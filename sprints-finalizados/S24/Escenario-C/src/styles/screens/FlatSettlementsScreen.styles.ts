import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;

  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.contentBackgroundMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
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
  loadingText: { color: colors.textSecondary },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  mutedText: { color: colors.textSecondary },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.cardSurface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.cardSurface,
  },
  listContainer: {
    gap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.cardSurface,
  },
  balanceName: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  balanceAmount: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.error,
  },
  transferCard: {
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.cardSurface,
    gap: 10,
  },
  transferText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  transferHighlight: {
    fontWeight: '700',
  },
  settleAction: {
    alignSelf: 'flex-start',
  },
  historyCard: {
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.cardSurface,
  },
  historyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  historyDate: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
  },
  });
};

export const styles = createStyles();
