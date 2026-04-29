import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export const createCreateFlatStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
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
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
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

export default createCreateFlatStyles;
