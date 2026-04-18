import { StyleSheet } from 'react-native';
import { lightColors } from '../tokens/colors';

export const createStyles = (theme?: any) => {
  const colors = theme?.colors ?? lightColors;
  const isDark = theme?.isDark ?? false;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.contentBackgroundMuted,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
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
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    shadowColor: '#111827',
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
    color: colors.text,
  },
  assignmentSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  assignmentStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: isDark ? 'rgba(79,70,229,0.25)' : '#EEF2FF',
  },
  assignmentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: colors.primary,
  },
  assignButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    padding: 12,
    backgroundColor: colors.cardSurfaceAlt,
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  offerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  offerReject: {
    backgroundColor: colors.errorLight,
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  roommatesPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.glassSurfaceStrong,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    shadowColor: '#111827',
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
    color: colors.text,
  },
  roommatesBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(124,58,237,0.22)' : '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  roommatesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  roommatesEmpty: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
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
    color: colors.text,
    fontWeight: '600',
  },
  roommateRoom: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  dayDividerWrap: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.glassOverlaySoft,
    marginBottom: 4,
  },
  dayDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
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
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  bubbleTextMine: {
    color: '#FFFFFF',
  },
  bubbleMeta: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bubbleTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  bubbleStatus: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  bubbleStatusOther: {
    color: colors.textTertiary,
  },
  newMessagesPill: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceLight,
    shadowColor: '#0F172A',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },
  newMessagesPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassStroke,
    backgroundColor: colors.glassSurface,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.cardSurface,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalList: {
    marginTop: 12,
  },
  modalRoomItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    marginBottom: 10,
  },
  modalRoomItemActive: {
    borderColor: colors.primary,
    backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : '#F5F3FF',
  },
  modalRoomTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  modalRoomTitleActive: {
    color: colors.primary,
  },
  modalRoomMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.cardSurfaceAlt,
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  modalConfirmText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  });
};

export const styles = createStyles();
