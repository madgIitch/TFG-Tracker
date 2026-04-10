import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';

export const createFiltersStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: '70%',
    },
    activeFilterBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.text,
    },
    activeFilterBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    resetText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
    },
    segmentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
    },
    segmentButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    segmentButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    segmentButtonTextActive: {
      color: '#FFFFFF',
    },
    budgetValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    budgetValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    footerButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    footerButtonSecondary: {
      flex: 1,
    },
    footerButtonPrimary: {
      flex: 1.2,
    },
    noticeCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 16,
      gap: 8,
    },
    noticeTitle: {
      fontSize: 16,
      fontWeight: '600',
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
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    ruleOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    ruleChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    ruleChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    ruleChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    ruleChipTextActive: {
      color: '#FFFFFF',
    },
    sliderTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
    },
    sliderContainer: {
      paddingVertical: 12,
      position: 'relative',
      minHeight: 36,
    },
    sliderTrackActive: {
      position: 'absolute',
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    sliderThumb: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      top: -7,
    },
    sliderTicks: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    sliderTick: {
      width: 2,
      height: 6,
      backgroundColor: theme.colors.border,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    sliderLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    lockOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.darkOverlay,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    upgradeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });

export default createFiltersStyles;
