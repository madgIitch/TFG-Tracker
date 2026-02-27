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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerSpacer: {
        width: 22,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    carouselContainer: {
        marginBottom: 24,
    },
    carouselImage: {
        width: '100%',
        height: 320,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surfaceLight,
    },
    carouselDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        gap: 6,
    },
    carouselDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.disabled,
    },
    carouselDotActive: {
        backgroundColor: theme.colors.primary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 10,
    },
    detailCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        gap: 12,
        shadowColor: theme.colors.text,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    detailLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 1,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'right',
        flexShrink: 1,
    },
    pricePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        backgroundColor: '#EEF2FF',
    },
    pricePillText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    statusPillAvailable: {
        backgroundColor: '#ECFDF3',
    },
    statusPillOccupied: {
        backgroundColor: '#FEF2F2',
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text,
    },
    detailNote: {
        padding: 12,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    detailNoteText: {
        fontSize: 13,
        color: theme.colors.text,
        lineHeight: 18,
    },
});
