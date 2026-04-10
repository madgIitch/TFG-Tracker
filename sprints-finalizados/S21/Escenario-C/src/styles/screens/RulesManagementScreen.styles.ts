import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.contentBackgroundMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
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
    color: colors.textSecondary,
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
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ruleOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurfaceAlt,
  },
  ruleOptionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfacePrimary,
  },
  ruleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  ruleOptionTextActive: {
    color: colors.primary,
  },
  });
};

export const styles = createStyles();


