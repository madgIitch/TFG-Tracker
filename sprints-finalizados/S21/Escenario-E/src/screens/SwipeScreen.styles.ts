// src/screens/SwipeScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    overflow: 'hidden',
  },
  glassButton: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.glassTint,
  },
  counterChip: {
    height: 32,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
  },
  cardsArea: {
    flex: 1,
    justifyContent: 'center',
  },
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: {
    position: 'absolute',
  },
  profileCard: {
    flex: 1,
  },
  profileImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  profileImageRadius: {
    borderRadius: 24,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  photoDotActive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  photoTapOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  photoTapZone: {
    flex: 1,
  },
  profileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  profileOverlayBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  profileOverlayFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  overlayContent: {
    gap: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    overflow: 'hidden',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  profileBio: {
    fontSize: 14.5,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  profileButton: {
    justifyContent: 'space-between',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionDock: {
    position: 'absolute',
    left: 24,
    right: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 12,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  limitOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitContent: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  limitSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  limitUpgradeBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  limitUpgradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compatBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  compatBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
