import { theme } from '../../theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
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
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
    },
    segmentButtonActive: {
        backgroundColor: theme.colors.text,
        borderColor: theme.colors.text,
    },
    segmentButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    segmentButtonTextActive: {
        color: theme.colors.background,
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
        backgroundColor: theme.colors.background,
    },
    noticeCard: {
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
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
        gap: theme.spacing.sm,
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
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    ruleChipActive: {
        borderColor: theme.colors.text,
        backgroundColor: theme.colors.text,
    },
    ruleChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    ruleChipTextActive: {
        color: theme.colors.background,
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
        backgroundColor: theme.colors.text,
    },
    sliderThumb: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.text,
        borderWidth: 2,
        borderColor: theme.colors.background,
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
        backgroundColor: theme.colors.disabled,
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
});
