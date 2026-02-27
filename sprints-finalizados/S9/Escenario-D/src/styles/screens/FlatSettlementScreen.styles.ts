import { theme } from '../../theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { marginTop: 16, fontSize: 20, fontWeight: '700', color: theme.colors.text },
    emptySubText: { marginTop: 8, fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
    listContainer: { padding: theme.spacing.md, paddingBottom: 40 },

    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: theme.borderRadius.lg,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.xl,
        backgroundColor: theme.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    amountText: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    namesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    nameText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        width: 80,
        textAlign: 'center',
    },
    settleButton: {
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    settleButtonText: {
        color: theme.colors.background,
        fontWeight: '600',
        fontSize: 14,
    },
    avatarPlaceholderTo: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    loadingText: {
        marginTop: 12,
    },
});
