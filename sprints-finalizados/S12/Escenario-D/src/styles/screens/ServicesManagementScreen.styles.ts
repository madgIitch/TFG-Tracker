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
    categoryBlock: {
        marginBottom: 16,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    categoryChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    categoryChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF',
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    categoryChipTextActive: {
        color: theme.colors.primary,
    },
    customRow: {
        marginTop: 12,
        gap: 10,
    },
    customColumn: {
        flex: 1,
    },
    emptyText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    serviceList: {
        marginBottom: 16,
        gap: 10,
    },
    serviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    priceRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    priceInput: {
        minWidth: 56,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        fontSize: 12,
        color: theme.colors.text,
    },
    priceUnit: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    removeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.error,
    },
    headerPadding: {
        paddingBottom: 16,
    },
});
