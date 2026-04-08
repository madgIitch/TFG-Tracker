// src/screens/RulesManagementScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
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
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  ruleOptions: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ruleBlock: {
    marginTop: 12,
  },
  ruleBlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ruleOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  ruleOptionChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  ruleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  ruleOptionTextActive: {
    color: '#7C3AED',
  },
});
