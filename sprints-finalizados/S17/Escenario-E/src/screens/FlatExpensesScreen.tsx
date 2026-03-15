// src/screens/FlatExpensesScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { styles } from './FlatExpensesScreen.styles';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
      await flatExpenseService.createFlatExpense({
        flat_id: flatId,
        description: description.trim(),
        amount: parsedAmount,
        paid_by: paidBy,
        split_between: Array.from(splitBetween),
        split_type: 'equal',
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
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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

