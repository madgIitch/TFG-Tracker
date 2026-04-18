import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import type { Theme } from '../../theme';

export const createProfileDetailStyles = (theme: Theme) => {
  const isDark = theme.colors.background !== '#FFFFFF';

  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: isDark
      ? 'rgba(148, 163, 184, 0.24)'
      : 'rgba(255, 255, 255, 0.35)',
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.52)'
      : 'rgba(255, 255, 255, 0.14)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 92,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(148, 163, 184, 0.42)'
      : 'rgba(255, 255, 255, 0.52)',
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.7)'
      : 'rgba(255, 255, 255, 0.36)',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark
      ? 'rgba(30, 41, 59, 0.9)'
      : 'rgba(255, 255, 255, 0.55)',
  },
  headerIconDanger: {
    backgroundColor: isDark
      ? 'rgba(127, 29, 29, 0.45)'
      : 'rgba(254, 226, 226, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  contentContainer: {
    paddingBottom: spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lgd,
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: isDark
      ? 'rgba(15, 23, 42, 0.84)'
      : 'rgba(255, 255, 255, 0.84)',
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(148, 163, 184, 0.3)'
      : 'rgba(17, 24, 39, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: isDark
      ? 'rgba(124, 58, 237, 0.34)'
      : 'rgba(124, 58, 237, 0.14)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: isDark ? '#F8FAFC' : colors.primaryDark,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: '#D8DEE8',
  },
  heroImage: {
    width: '100%',
    height: 420,
    backgroundColor: '#D8DEE8',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: 360,
    backgroundColor: '#D8DEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(10, 15, 25, 0.36)',
  },
  heroName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  heroMetaChipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroDots: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    gap: 6,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  heroDotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.smd,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionMutedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: spacing.sm,
  },
  contentCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  compactChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  compactChip: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(148, 163, 184, 0.38)' : 'rgba(17, 24, 39, 0.08)',
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(243, 244, 246, 0.95)',
  },
  compactChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#F8FAFC' : '#213047',
    flexShrink: 1,
  },
  mutedText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRowSpacing: {
    marginTop: spacing.md,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.smd,
  },
  detailIconBlue: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  detailIconGreen: {
    backgroundColor: 'rgba(5, 150, 105, 0.14)',
  },
  detailIconPurple: {
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  detailValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  housingRow: {
    gap: spacing.sm,
  },
  housingBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  housingBadgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  housingDescription: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  flatCtaButton: {
    marginTop: spacing.smd,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
  },
  flatCtaButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  manageCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: spacing.md,
  },
  manageInfo: {
    marginBottom: spacing.smd,
  },
  manageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  manageSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  manageButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flatList: {
    gap: spacing.md,
  },
  flatCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  flatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  flatMeta: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  flatSection: {
    marginTop: spacing.md,
  },
  flatSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  listContainer: {
    gap: 6,
  },
  listItem: {
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 17,
  },
  roomList: {
    gap: spacing.sm,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    padding: spacing.smd,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
  },
  roomPhoto: {
    width: 68,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: '#E3E8F0',
  },
  roomPhotoPlaceholder: {
    width: 68,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  roomMeta: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bottomActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 6,
    alignItems: 'center',
  },
  bottomActionsTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.glassBg,
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  bottomActionReject: {
    borderColor: 'rgba(239, 68, 68, 0.36)',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  bottomActionLike: {
    borderColor: 'rgba(124, 58, 237, 0.36)',
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
  },
  bottomActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#F8FAFC' : theme.colors.text,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  visibilityInfo: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  visibilitySubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  visibilityPausedBanner: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
  },
  visibilityPausedText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 16,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  lightboxContent: {
    width: '90%',
    height: '70%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  lightboxClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  });
};

export default createProfileDetailStyles;

