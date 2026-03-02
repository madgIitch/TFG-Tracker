// src/screens/FlatExpensesScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { flatExpenseService } from '../services/flatExpenseService';
import type { FlatExpense, FlatMember } from '../types/flatExpense';

type RouteParams = {
  FlatExpenses: { flatId: string; flatAddress?: string };
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAmount = (amount: number) =>
  amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const FlatExpensesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'FlatExpenses'>>();
  const { flatId, flatAddress } = route.params;

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<FlatExpense[]>([]);
  const [members, setMembers] = useState<FlatMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [splitBetween, setSplitBetween] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('authUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { id?: string };
          if (parsed.id) {
            setCurrentUserId(parsed.id);
            setPaidBy(parsed.id);
          }
        } catch {}
      }
    };
    void loadUser();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesData, membersData] = await Promise.all([
        flatExpenseService.getExpenses(flatId),
        flatExpenseService.getFlatMembers(flatId),
      ]);
      setExpenses(expensesData);
      setMembers(membersData);
      // Default: split between all members
      setSplitBetween(new Set(membersData.map((m) => m.id)));
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [flatId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member?.display_name ?? 'Usuario';
  };

  const openModal = () => {
    setDescription('');
    setAmount('');
    setPaidBy(currentUserId ?? members[0]?.id ?? '');
    setSplitBetween(new Set(members.map((m) => m.id)));
    setModalVisible(true);
  };

  const handleToggleSplit = (userId: string) => {
    setSplitBetween((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreateExpense = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Añade una descripción al gasto');
      return;
    }
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'El importe debe ser un número positivo');
      return;
    }
    if (!paidBy) {
      Alert.alert('Error', 'Selecciona quién ha pagado');
      return;
    }
    if (splitBetween.size === 0) {
      Alert.alert('Error', 'Selecciona al menos un miembro para dividir el gasto');
      return;
    }

    try {
      setSubmitting(true);
      await flatExpenseService.createExpense({
        flat_id: flatId,
        description: description.trim(),
        amount: parsedAmount,
        paid_by: paidBy,
        split_between: Array.from(splitBetween),
      });
      setModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gastos del piso</Text>
          {flatAddress ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{flatAddress}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={openModal}>
          <Ionicons name="add" size={20} color="#7C3AED" />
          <Text style={styles.headerActionText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{expenses.length}</Text>
                <Text style={styles.summaryLabel}>Gastos</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{formatAmount(totalExpenses)} €</Text>
                <Text style={styles.summaryLabel}>Total acumulado</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settlementButton}
              onPress={() => navigation.navigate('FlatSettlement', { flatId, flatAddress })}
            >
              <Ionicons name="calculator-outline" size={16} color="#7C3AED" />
              <Text style={styles.settlementButtonText}>Ver liquidaciones</Text>
            </TouchableOpacity>
          </View>

          {/* Expense List */}
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Sin gastos registrados</Text>
              <Text style={styles.emptySubtitle}>
                Añade el primer gasto del piso pulsando "Nuevo".
              </Text>
            </View>
          ) : (
            expenses.map((expense) => {
              const perPerson =
                expense.splits && expense.splits.length > 0
                  ? null
                  : Number(expense.amount) / Math.max(members.length, 1);

              return (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseIconWrap}>
                      <Ionicons name="receipt-outline" size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseMeta}>
                        Pagado por {expense.payer_name ?? getMemberName(expense.paid_by)}
                        {' · '}{formatDate(expense.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>{formatAmount(Number(expense.amount))} €</Text>
                  </View>

                  {/* Splits */}
                  {expense.splits && expense.splits.length > 0 ? (
                    <View style={styles.splitsList}>
                      {expense.splits.map((split) => (
                        <View key={split.id} style={styles.splitRow}>
                          <Text style={styles.splitName}>
                            {split.user_name ?? getMemberName(split.user_id)}
                          </Text>
                          <Text style={styles.splitAmount}>{formatAmount(Number(split.amount))} €</Text>
                        </View>
                      ))}
                    </View>
                  ) : perPerson !== null ? (
                    <Text style={styles.splitEqual}>
                      A partes iguales: {formatAmount(perPerson)} € / persona
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Create Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuevo gasto</Text>

            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Compra semanal, factura del gas..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.fieldLabel}>Importe (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.fieldLabel}>Pagado por</Text>
            <View style={styles.memberChips}>
              {members.map((member) => {
                const isSelected = paidBy === member.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                    onPress={() => setPaidBy(member.id)}
                  >
                    <Text style={[styles.memberChipText, isSelected && styles.memberChipTextSelected]}>
                      {member.display_name ?? 'Usuario'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Dividir entre</Text>
            <View style={styles.memberChips}>
              {members.map((member) => {
                const isSelected = splitBetween.has(member.id);
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                    onPress={() => handleToggleSplit(member.id)}
                  >
                    <Text style={[styles.memberChipText, isSelected && styles.memberChipTextSelected]}>
                      {member.display_name ?? 'Usuario'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preview split amount */}
            {amount && splitBetween.size > 0 && !isNaN(parseFloat(amount.replace(',', '.'))) ? (
              <Text style={styles.splitPreview}>
                Cada persona paga:{' '}
                {formatAmount(parseFloat(amount.replace(',', '.')) / splitBetween.size)} €
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
                onPress={handleCreateExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Añadir gasto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerActionText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
  content: { padding: 20, gap: 12 },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  settlementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
  },
  settlementButtonText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6, textAlign: 'center' },

  // Expense cards
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  expenseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  expenseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: 15, fontWeight: '600', color: '#111827' },
  expenseMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  splitsList: { marginTop: 12, gap: 4 },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  splitName: { fontSize: 13, color: '#374151' },
  splitAmount: { fontSize: 13, fontWeight: '600', color: '#374151' },
  splitEqual: { marginTop: 10, fontSize: 12, color: '#6B7280' },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: -4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  memberChipSelected: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  memberChipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  memberChipTextSelected: { color: '#7C3AED' },
  splitPreview: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
