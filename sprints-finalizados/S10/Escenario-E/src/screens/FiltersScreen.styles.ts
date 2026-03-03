// src/screens/FiltersScreen.styles.ts
import { StyleSheet } from 'react-native';
import { sliderStyles } from '../styles/common';

const _extra = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  noticeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noticeText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  rulesList: {
    gap: 12,
  },
  ruleBlock: {
    gap: 8,
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ruleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ruleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  ruleChipActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  ruleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  ruleChipTextActive: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    paddingVertical: 12,
    position: 'relative',
    minHeight: 36,
  },
});

export const styles = { ...sliderStyles, ..._extra };
