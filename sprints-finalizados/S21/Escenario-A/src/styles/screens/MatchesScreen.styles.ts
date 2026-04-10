import { StyleSheet } from 'react-native';
import type { Theme } from '../../theme';
import { getCommonStyles } from '../common';

export const createMatchesScreenStyles = (theme: Theme) => {
  const commonStyles = getCommonStyles(theme);
  return StyleSheet.create({
    container: commonStyles.screenContainer,
    header: {
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
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
    },
    chatList: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    chatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.colors.glassBgStrong,
    },
    chatRowUnread: {
      borderColor: theme.colors.primaryLight,
      backgroundColor: theme.colors.glassBg,
    },
    chatAvatarWrap: {
      position: 'relative',
    },
    chatAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    chatUnreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      position: 'absolute',
      right: 0,
      top: 2,
      borderWidth: 1,
      borderColor: theme.colors.background,
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
    chatNameUnread: {
      fontWeight: '800',
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
    chatPreviewUnread: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.background,
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
};
