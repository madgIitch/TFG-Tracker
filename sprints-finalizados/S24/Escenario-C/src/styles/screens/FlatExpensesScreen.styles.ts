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
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  mutedText: {
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
    color: colors.textOnPrimary,
  },
  listContainer: {
    gap: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.cardSurfaceAlt,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryAmount: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  summaryMeta: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  expenseCard: {
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.cardSurface,
  },
  expenseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  expenseMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  });
};

export const styles = createStyles();
