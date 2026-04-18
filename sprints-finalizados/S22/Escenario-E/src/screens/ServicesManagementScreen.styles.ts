// src/screens/ServicesManagementScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.glassPanel,
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
  categoryBlock: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
  },
  categoryChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: theme.colors.primary,
  },
  customRow: {
    marginTop: 12,
    gap: 10,
  },
  customColumn: {
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  serviceList: {
    marginBottom: 16,
    gap: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  priceInput: {
    minWidth: 56,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: 8,
    fontSize: 12,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceLight,
  },
  priceUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  removeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
