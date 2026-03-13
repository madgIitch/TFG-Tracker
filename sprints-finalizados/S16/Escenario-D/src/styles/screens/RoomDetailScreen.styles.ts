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
        width: 36,
    },
    headerBackButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    heroContainer: {
        marginHorizontal: -20,
        marginTop: -20,
        marginBottom: 28,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.surfaceLight,
    },
    heroPagination: {
        position: 'absolute',
        top: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 20,
        zIndex: 5,
    },
    heroDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    heroDotActive: {
        backgroundColor: '#FFFFFF',
    },
    heroOverlayContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    heroCapsule: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    heroCapsuleContent: {
        padding: 16,
    },
    heroName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    heroLocation: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
    },
    heroBadgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    heroBadgeClear: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    heroBadgeAccent: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    heroBadgeTextClear: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    detailCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
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
    bottomActions: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    priceContainer: {
        flex: 1,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '700',
    },
    priceUnit: {
        fontSize: 14,
        fontWeight: '500',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    actionButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});



