import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    color: '#1C1C1E',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  counterChip: {
    height: 32,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
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
    color: '#1C1C1E',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  profileBio: {
    fontSize: 14.5,
    color: '#3A3A3C',
    lineHeight: 20,
  },
  profileButton: {
    justifyContent: 'space-between',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
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
    color: '#1C1C1E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6C6C70',
    marginTop: 6,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 12,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  limitOverlay: {
    position: 'absolute',
    bottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});

export default styles;
