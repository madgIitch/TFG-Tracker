import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.contentBackgroundMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.glassStroke,
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
    color: colors.textSecondary,
  },
  choiceContainer: {
    flex: 1,
    padding: 24,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  choiceSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  choiceGrid: {
    marginTop: 24,
    gap: 16,
  },
  choiceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurface,
    padding: 16,
    gap: 10,
  },
  choiceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  choiceCardText: {
    fontSize: 13,
    color: colors.textSecondary,
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
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurfaceAlt,
  },
  commonAreaChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  commonAreaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
    borderColor: 'rgba(255,255,255,0.45)',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  flatOptionActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
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
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurfaceAlt,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
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
    backgroundColor: '#F3E8FF',
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
    color: colors.textSecondary,
  },
  });
};

export const styles = createStyles();


