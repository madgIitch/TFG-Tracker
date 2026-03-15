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
        paddingBottom: 16,
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
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 10,
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
});
