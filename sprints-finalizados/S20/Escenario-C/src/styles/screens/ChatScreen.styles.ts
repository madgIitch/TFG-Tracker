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
    backgroundColor: '#EEF2FF',
  },
  assignmentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
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
    backgroundColor: '#7C3AED',
  },
  assignButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  assignButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    padding: 12,
    backgroundColor: colors.cardSurfaceAlt,
  },
  offerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  offerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#7C3AED',
  },
  offerReject: {
    backgroundColor: '#FEE2E2',
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
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
    color: '#111827',
  },
  roommatesBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  roommatesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  roommatesEmpty: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
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
    color: '#111827',
    fontWeight: '600',
  },
  roommateRoom: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: 'rgba(60, 82, 164, 0.92)',
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
    color: '#111827',
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
    color: '#6B7280',
  },
  bubbleStatus: {
    fontSize: 10,
    color: '#C7D2FE',
    fontWeight: '600',
  },
  bubbleStatusOther: {
    color: '#64748B',
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
    backgroundColor: '#334155',
    shadowColor: '#0F172A',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },
  newMessagesPillText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  modalList: {
    marginTop: 12,
  },
  modalRoomItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    marginBottom: 10,
  },
  modalRoomItemActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  modalRoomTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  modalRoomTitleActive: {
    color: '#7C3AED',
  },
  modalRoomMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
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
    color: '#111827',
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
