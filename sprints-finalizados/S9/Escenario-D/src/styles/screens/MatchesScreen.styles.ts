import { theme } from '../../theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    matchesSection: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    matchesSectionEmpty: {
        paddingHorizontal: 20,
        paddingBottom: 6,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    matchesRow: {
        gap: 12,
    },
    matchItem: {
        alignItems: 'center',
        width: 90,
    },
    avatarWrapper: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        padding: 3,
        marginBottom: 8,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    matchName: {
        fontSize: 13,
        fontWeight: '600',
    },
    chatList: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    chatRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    chatAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    chatBody: {
        flex: 1,
        marginLeft: 12,
    },
    chatHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
    },
    chatTime: {
        fontSize: 12,
    },
    chatPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    chatPreview: {
        flex: 1,
        fontSize: 13,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.background,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
