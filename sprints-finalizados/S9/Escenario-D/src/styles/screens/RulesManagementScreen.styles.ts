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
    emptyText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    ruleOptions: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    ruleBlock: {
        marginTop: 12,
    },
    ruleBlockLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    ruleOptionChip: {
        paddingHorizontal: 12,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    ruleOptionChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F5F3FF',
    },
    ruleOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
    },
    ruleOptionTextActive: {
        color: theme.colors.primary,
    },
    headerPadding: {
        paddingBottom: 16,
    },
});
