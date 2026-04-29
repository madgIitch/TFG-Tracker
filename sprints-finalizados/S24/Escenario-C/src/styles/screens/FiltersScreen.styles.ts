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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 2,
  },
  activeCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurfaceAlt,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.selectionSurface,
    borderColor: colors.selectionSurface,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: colors.textOnPrimary,
  },
  budgetValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  premiumLockedSection: {
    position: 'relative',
  },
  lockBadgeWrap: {
    position: 'absolute',
    top: -10,
    right: 0,
    zIndex: 2,
  },
  lockedContent: {
    opacity: 0.45,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.glassSurfaceStrong,
    borderRadius: 14,
  },
  upgradeBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSurface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  upgradeButton: {
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  upgradeButtonText: {
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurface,
    padding: 16,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  noticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  locationSelectionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSurface,
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  locationHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rulesList: {
    gap: 12,
  },
  ruleBlock: {
    gap: 8,
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ruleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ruleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurfaceAlt,
  },
  ruleChipActive: {
    borderColor: colors.selectionSurface,
    backgroundColor: colors.selectionSurface,
  },
  ruleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  ruleChipTextActive: {
    color: colors.textOnPrimary,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  sliderContainer: {
    paddingVertical: 12,
    position: 'relative',
    minHeight: 36,
  },
  sliderTrackActive: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: isDark ? colors.contentBackgroundMuted : colors.cardSurface,
    top: -7,
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderTick: {
    width: 2,
    height: 6,
    backgroundColor: colors.border,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  });
};

export const styles = createStyles();

