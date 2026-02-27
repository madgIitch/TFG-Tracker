import { theme } from '../../theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoTile: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoRemove: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(17, 24, 39, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoRemoveText: {
        color: theme.colors.background,
        fontSize: 11,
        fontWeight: '700',
    },
    addPhotoTile: {
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
    },
    addPhotoText: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    addPhotoLabel: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    photoHint: {
        marginTop: 8,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    choiceContainer: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    choiceTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    choiceSubtitle: {
        marginTop: 8,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    choiceGrid: {
        marginTop: 24,
        gap: theme.spacing.md,
    },
    choiceCard: {
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        gap: 10,
    },
    choiceCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    choiceCardText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    commonAreaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    commonAreaChip: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    commonAreaChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF',
    },
    commonAreaChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    commonAreaChipTextActive: {
        color: theme.colors.primary,
    },
    flatList: {
        gap: 12,
    },
    flatOption: {
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 12,
        backgroundColor: theme.colors.background,
    },
    flatOptionActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF',
    },
    flatOptionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    flatOptionTitleActive: {
        color: theme.colors.primary,
    },
    flatOptionSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    flatEmptyText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    headerPadding: {
        paddingBottom: 16,
    },
    switchRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    switchButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
    },
    switchButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    switchButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },
    switchButtonTextActive: {
        color: theme.colors.background,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    statusToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
        backgroundColor: '#F3E8FF',
    },
    statusToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
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
});
