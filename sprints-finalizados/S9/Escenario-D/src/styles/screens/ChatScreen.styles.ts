import { theme } from '../../theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerSpacer: {
        width: 22,
    },
    assignmentPanel: {
        marginHorizontal: theme.spacing.md,
        marginTop: 8,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.text,
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 2,
        gap: 10,
    },
    assignmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    assignmentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    assignmentSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    assignmentStatusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        backgroundColor: '#EEF2FF',
    },
    assignmentStatusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },
    assignActions: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        marginTop: 6,
    },
    assignButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
    },
    assignButtonDisabled: {
        backgroundColor: '#C4B5FD',
    },
    assignButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.background,
    },
    offerCard: {
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
        backgroundColor: theme.colors.surface,
    },
    offerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },
    offerSubtitle: {
        marginTop: 6,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    offerActions: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 10,
    },
    offerButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    offerAccept: {
        backgroundColor: theme.colors.primary,
    },
    offerReject: {
        backgroundColor: theme.colors.errorLight,
    },
    offerButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.background,
    },
    offerRejectText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.error,
    },
    roommatesPanel: {
        marginHorizontal: theme.spacing.md,
        marginTop: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.text,
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 2,
    },
    roommatesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    roommatesTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    roommatesBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    roommatesBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    roommatesEmpty: {
        marginTop: 8,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    roommatesList: {
        marginTop: 10,
        gap: 6,
    },
    roommateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    roommateName: {
        fontSize: 12,
        color: theme.colors.text,
        fontWeight: '600',
    },
    roommateRoom: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    messagesList: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 20,
        gap: 12,
    },
    messageRow: {
        flexDirection: 'row',
    },
    messageRowMine: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.lg,
    },
    bubbleMine: {
        backgroundColor: '#EDE9FE',
        borderTopRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: theme.colors.surfaceLight,
        borderTopLeftRadius: 4,
    },
    bubbleText: {
        fontSize: 14,
        lineHeight: 20,
    },
    bubbleMeta: {
        marginTop: 6,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.sm,
    },
    bubbleTime: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    bubbleStatus: {
        fontSize: 10,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceLight,
        fontSize: 14,
        color: theme.colors.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    modalSubtitle: {
        marginTop: 6,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    modalList: {
        marginTop: 12,
    },
    modalRoomItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 10,
    },
    modalRoomItemActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF',
    },
    modalRoomTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },
    modalRoomTitleActive: {
        color: theme.colors.primary,
    },
    modalRoomMeta: {
        marginTop: 4,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    modalCancel: {
        backgroundColor: theme.colors.surfaceLight,
    },
    modalCancelText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    modalConfirmText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.background,
    },
    modalConfirm: {
        backgroundColor: theme.colors.primary,
    },
    modalButtonDisabled: {
        backgroundColor: '#C4B5FD',
    },
    bubbleTextDark: {
        color: theme.colors.text,
    },
});
