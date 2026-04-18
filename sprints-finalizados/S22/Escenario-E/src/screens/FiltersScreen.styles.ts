import { StyleSheet } from 'react-native';
import { makeSliderStyles } from '../styles/common';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => ({
  ...makeSliderStyles(theme),
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.systemBackground,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.glassPanel,
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    activeFilterBadge: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: theme.colors.primary,
    },
    resetText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.colors.text,
      marginBottom: 10,
    },
    segmentRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBackground,
      alignItems: 'center' as const,
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    segmentButtonText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
    },
    segmentButtonTextActive: {
      color: '#FFFFFF',
    },
    footer: {
      padding: 20,
      backgroundColor: theme.colors.glassPanel,
      flexDirection: 'row' as const,
      gap: 12,
    },
    footerButtonWrap: {
      flex: 1,
    },
    noticeCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBackground,
      padding: 16,
      gap: 8,
    },
    noticeTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.colors.text,
    },
    noticeText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    rulesList: {
      gap: 12,
    },
    ruleBlock: {
      gap: 8,
    },
    ruleTitle: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    ruleOptions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
    },
    ruleChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBackground,
    },
    ruleChipActive: {
      borderColor: theme.colors.text,
      backgroundColor: theme.colors.text,
    },
    ruleChipText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
    },
    ruleChipTextActive: {
      color: '#FFFFFF',
    },
    sliderContainer: {
      paddingVertical: 12,
      position: 'relative' as const,
      minHeight: 36,
    },
    ageSliderContainer: {
      paddingVertical: 12,
      position: 'relative' as const,
      minHeight: 36,
    },
    ageValues: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    ageValue: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
    },
    budgetValues: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    budgetValue: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
    },
  }),
});
