// src/screens/RoomInterestsScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.glassPanel,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  roomBanner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  roomLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  roomTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyStateInline: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  assignButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assignOwnerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  assignOwnerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
