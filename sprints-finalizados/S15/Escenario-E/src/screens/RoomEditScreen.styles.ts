// src/screens/RoomEditScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(242, 242, 247, 0.80)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17, 24, 39, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addPhotoTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#7C3AED',
  },
  addPhotoLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  photoHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  choiceContainer: {
    flex: 1,
    padding: 24,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  choiceSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  choiceGrid: {
    marginTop: 24,
    gap: 16,
  },
  choiceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  choiceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  choiceCardText: {
    fontSize: 13,
    color: '#6B7280',
  },
  commonAreaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  commonAreaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  commonAreaChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  commonAreaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  commonAreaChipTextActive: {
    color: '#7C3AED',
  },
  flatList: {
    gap: 12,
  },
  flatOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  flatOptionActive: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  flatOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  flatOptionTitleActive: {
    color: '#7C3AED',
  },
  flatOptionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  flatEmptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  switchButtonTextActive: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
});
