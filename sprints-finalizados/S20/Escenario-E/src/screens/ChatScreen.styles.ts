// src/screens/ChatScreen.styles.ts
import { StyleSheet } from 'react-native';
import { Theme } from '../theme';

export const makeStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemBackground,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.glassPanel,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 22,
  },
  assignmentPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
    gap: 10,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  assignmentSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  assignmentStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  assignmentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  assignActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  assignButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  assignButtonDisabled: {
    backgroundColor: theme.colors.primaryLight,
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: 12,
    backgroundColor: theme.colors.glassBackground,
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  offerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  offerActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  offerButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  offerAccept: {
    backgroundColor: theme.colors.primary,
  },
  offerReject: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.error,
  },
  roommatesPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  roommatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roommatesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  roommatesBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  roommatesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  roommatesEmpty: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  roommatesList: {
    marginTop: 10,
    gap: 6,
  },
  roommateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roommateName: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  roommateRoom: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // Chat container — wraps FlatList + input para KeyboardAvoidingView
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },

  // Day separator
  daySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  daySeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.separator,
  },
  daySeparatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Message bubbles
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.glassBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  bubbleTextOther: {
    color: theme.colors.text,
  },
  bubbleMeta: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  bubbleTime: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  bubbleTimeMine: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  bubbleStatus: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // New messages indicator
  newMessagesBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginBottom: 8,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  newMessagesBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: theme.colors.glassPanel,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.separator,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: theme.colors.systemBackground,
    fontSize: 14,
    color: theme.colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  modalList: {
    marginTop: 12,
  },
  modalRoomItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    backgroundColor: theme.colors.glassBackground,
    marginBottom: 10,
  },
  modalRoomItemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  modalRoomTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalRoomTitleActive: {
    color: theme.colors.primary,
  },
  modalRoomMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: theme.colors.systemBackground,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalConfirmText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalConfirm: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonDisabled: {
    backgroundColor: theme.colors.primaryLight,
  },
});
