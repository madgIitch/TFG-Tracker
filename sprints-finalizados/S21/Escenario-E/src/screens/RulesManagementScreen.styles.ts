// src/screens/RulesManagementScreen.styles.ts
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
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  ruleOptions: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ruleBlock: {
    marginTop: 12,
  },
  ruleBlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ruleOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
  },
  ruleOptionChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  ruleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  ruleOptionTextActive: {
    color: theme.colors.primary,
  },
});
