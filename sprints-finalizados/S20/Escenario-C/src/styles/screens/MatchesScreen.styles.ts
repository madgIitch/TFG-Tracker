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
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  matchesSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginTop: 8,
  },
  matchesSectionEmpty: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  matchesRow: {
    gap: 12,
  },
  matchItem: {
    alignItems: 'center',
    width: 90,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: 'rgba(60, 82, 164, 0.75)',
    padding: 3,
    marginBottom: 8,
    backgroundColor: colors.glassSurfaceStrong,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  matchName: {
    fontSize: 13,
    fontWeight: '600',
  },
  chatList: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  chatRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    backgroundColor: colors.cardSurface,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  chatBody: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
  },
  chatPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatPreview: {
    flex: 1,
    fontSize: 13,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3C52A4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.contentBackgroundMuted,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.text,
  },
  });
};

export const styles = createStyles();
