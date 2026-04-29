import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;
  const isDark = theme?.isDark ?? false;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.contentBackgroundMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
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
  contentInner: {
    paddingBottom: 128,
  },
  carouselContainer: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
    shadowColor: isDark ? colors.overlayMuted : '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  carouselImage: {
    width: '100%',
    height: 320,
    backgroundColor: colors.surfaceLight,
  },
  carouselOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassStroke,
    padding: 12,
  },
  carouselOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glassOverlaySoft,
  },
  carouselOverlayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overlayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
  },
  overlayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
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
    backgroundColor: '#D1D5DB',
  },
  carouselDotActive: {
    backgroundColor: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    padding: 16,
    gap: 12,
    shadowColor: isDark ? colors.overlayMuted : '#0F172A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
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
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: isDark ? colors.selectionSurface : '#EEF2FF',
  },
  pricePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? colors.textOnPrimary : '#4F46E5',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillAvailable: {
    backgroundColor: isDark ? colors.successLight : '#ECFDF3',
  },
  statusPillOccupied: {
    backgroundColor: isDark ? colors.errorLight : '#FEF2F2',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  detailNote: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cardSurfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  roommatesList: {
    gap: 12,
  },
  roommateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roommateAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
  },
  roommateAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roommateInfo: {
    flex: 1,
  },
  roommateName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  roommateMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#6B7280',
  },
  bottomCtaBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.glassSurfaceStrong,
    shadowColor: isDark ? colors.overlayMuted : '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 8,
    flexDirection: 'row',
    gap: 10,
  },
  bottomCtaPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  bottomCtaSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCtaSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  });
};

export const styles = createStyles();
