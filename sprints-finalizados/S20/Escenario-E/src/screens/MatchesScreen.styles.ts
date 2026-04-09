// src/screens/MatchesScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  },
  matchesSectionEmpty: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: theme.colors.textSecondary,
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
    borderColor: theme.colors.primary,
    padding: 3,
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  matchName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  chatRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    alignItems: 'center',
  },
  chatAvatarWrap: {
    position: 'relative',
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.systemBackground,
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
    fontWeight: '500',
  },
  chatNameUnread: {
    fontWeight: '700',
  },
  chatTime: {
    fontSize: 12,
  },
  chatTimeUnread: {
    color: theme.colors.primary,
    fontWeight: '600',
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
  chatPreviewUnread: {
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
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
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
