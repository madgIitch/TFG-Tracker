// src/screens/CreateFlatScreen.styles.ts
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
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
  },
  sectionHint: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  segmentButtonDisabled: {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  segmentButtonTextDisabled: {
    color: theme.colors.textTertiary,
  },
});
