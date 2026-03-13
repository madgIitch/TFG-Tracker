// src/screens/RoomInterestsScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.40)',
  },
  roomLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6B7280',
    fontWeight: '600',
  },
  roomTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    color: '#111827',
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
    color: '#111827',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
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
    color: '#7C3AED',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  assignButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
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
    backgroundColor: '#7C3AED',
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
    color: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
