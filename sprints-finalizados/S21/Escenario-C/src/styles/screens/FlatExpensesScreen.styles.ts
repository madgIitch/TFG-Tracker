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
  },
  headerActionText: {
    color: '#7C3AED',
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
  },
  mutedText: {
    color: '#6B7280',
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
    backgroundColor: colors.cardSurface,
  },
  chipActive: {
    backgroundColor: '#3C52A4',
    borderColor: '#3C52A4',
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 10,
  },
  expenseCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  expenseMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
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
    color: '#111827',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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


