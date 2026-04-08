// src/screens/ProfileDetailScreen.styles.ts
import { Dimensions, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
export const HERO_HEIGHT = Math.round(Dimensions.get('window').height * 0.60);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },

  // ── Glass Header (absolute overlay) ───────────────────────
  glassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  glassHeaderBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassHeaderTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242, 242, 247, 0.55)',
  },
  glassHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.60)',
    overflow: 'hidden',
  },
  glassHeaderSpacer: {
    flex: 1,
  },
  glassHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  glassIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.60)',
    overflow: 'hidden',
  },
  glassIconDanger: {
    backgroundColor: 'rgba(254, 242, 242, 0.85)',
    borderColor: 'rgba(252, 202, 202, 0.70)',
  },

  // ── Content ScrollView ────────────────────────────────────
  content: {
    flex: 1,
  },

  // ── Hero carousel ─────────────────────────────────────────
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: '#E5E7EB',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.40)',
  },
  heroChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  heroDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroDotActive: {
    width: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },

  // ── Sections wrapper ──────────────────────────────────────
  sectionsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // ── Tab switcher ──────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // ── Section label ─────────────────────────────────────────
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },

  // ── Glass card (content sections) ────────────────────────
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  glassCardInner: {
    padding: 16,
  },

  // ── About text ────────────────────────────────────────────
  aboutText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },

  // ── Compact chips ─────────────────────────────────────────
  compactChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  compactChipEmoji: {
    fontSize: 14,
  },
  purpleChip: {
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  purpleChipText: {
    color: '#6D28D9',
  },

  // ── Convivencia info rows ─────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // ── Manage card ───────────────────────────────────────────
  manageCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  manageInfo: {
    marginBottom: 12,
  },
  manageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  manageSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  manageButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Piso tab ──────────────────────────────────────────────
  flatList: {
    gap: 16,
  },
  flatCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  flatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  flatMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  flatSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  flatSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  listContainer: {
    gap: 6,
  },
  listItem: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  roomList: {
    gap: 10,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
  },
  roomPhoto: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  roomPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  roomMeta: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },
  mutedText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // ── Floating action bar (like / dislike) ──────────────────
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingTop: 16,
    paddingHorizontal: 40,
    overflow: 'hidden',
  },
  actionBarBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  actionBarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(242, 242, 247, 0.72)',
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  actionBtnReject: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  actionBtnLike: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderColor: 'rgba(124, 58, 237, 0.22)',
  },
  actionBtnBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  actionBtnTintReject: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.07)',
    borderRadius: 30,
  },
  actionBtnTintLike: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124, 58, 237, 0.07)',
    borderRadius: 30,
  },

  // ── Lightbox ──────────────────────────────────────────────
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  lightboxContent: {
    width: '90%',
    height: '70%',
    borderRadius: 20,
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
    backgroundColor: 'rgba(17, 24, 39, 0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
