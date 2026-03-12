import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const commonStyles = StyleSheet.create({
    keyboardAvoiding: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.body.fontSize,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
    },
});
