import { theme } from '../../theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    flatSelector: {
        marginBottom: 8,
    },
    flatSelectorLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    flatChips: {
        flexDirection: 'row',
        gap: 10,
    },
    flatChip: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    flatChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF',
    },
    flatChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    flatChipTextActive: {
        color: theme.colors.primary,
    },
    flatChipAdd: {
        borderStyle: 'dashed',
        borderColor: '#C4B5FD',
        backgroundColor: '#F5F3FF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    flatChipAddText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    createFlatCard: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: 40,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    createFlatButton: {
        marginTop: 16,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
    },
    createFlatButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.background,
    },
    emptyStateInline: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: 12,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
    },
    emptySubtitle: {
        marginTop: 8,
        fontSize: 13,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    detailText: {
        fontSize: 14,
        color: theme.colors.text,
    },
    detailMeta: {
        marginTop: 6,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    detailEmpty: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    rulesList: {
        gap: 6,
    },
    servicesList: {
        gap: theme.spacing.sm,
    },
    serviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inlineAction: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
        backgroundColor: '#F3E8FF',
    },
    inlineActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
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
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
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
        color: theme.colors.text,
    },
    segmentButtonTextActive: {
        color: theme.colors.background,
    },
    segmentButtonTextDisabled: {
        color: theme.colors.textTertiary,
    },
    roomCard: {
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        padding: 14,
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    roomCardHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    roomPhoto: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
    },
    roomPhotoPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roomInfo: {
        flex: 1,
    },
    roomTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    roomMeta: {
        marginTop: 4,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    content: {
        padding: 20,
        gap: theme.spacing.md,
    },
    card: {
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
    },
    cardHeader: {
        marginBottom: 12,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
    },
    cardMeta: {
        marginTop: 4,
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    statusBadge: {
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 86,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    statusAvailable: {
        backgroundColor: '#DCFCE7',
    },
    statusPaused: {
        backgroundColor: theme.colors.warningLight,
    },
    statusReserved: {
        backgroundColor: '#DBEAFE',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
        marginTop: 12,
    },
    actionButton: {
        flexGrow: 1,
        flexBasis: '48%',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: theme.colors.background,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },
    deleteButton: {
        borderColor: '#FECACA',
        backgroundColor: '#FEF2F2',
    },
    deleteButtonText: {
        color: theme.colors.error,
    },
    expensesButtonStart: {
        flex: 1,
        marginRight: 8,
    },
    expensesButtonEnd: {
        flex: 1,
    },
});
