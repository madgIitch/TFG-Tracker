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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerSpacer: {
        width: 24,
    },
    roomBanner: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 12,
        backgroundColor: theme.colors.surfaceLight,
    },
    roomLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    roomTitle: {
        marginTop: 4,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
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
    content: {
        padding: 20,
        gap: 20,
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    emptyStateInline: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
    },
    emptyTitle: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
    },
    emptySubtitle: {
        marginTop: 6,
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    assignmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.xl,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontWeight: '700',
        color: '#4338CA',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    cardSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    assignButton: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
    },
    assignButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.background,
    },
    assignOwnerButton: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
    },
    assignOwnerText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.background,
    },
    removeButton: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.errorLight,
    },
    removeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.error,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    headerPadding: {
        paddingBottom: 16,
    },
});
