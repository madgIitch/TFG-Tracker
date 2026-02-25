import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';
import { useTheme } from '../theme/ThemeContext';
import { flatExpenseService } from '../services/flatExpenseService';
import { AuthContext } from '../context/AuthContext';
import type {
  CreateFlatExpenseRequest,
  FlatExpense,
  FlatMember,
  FlatSummary,
} from '../types/flatExpense';
import styles from '../styles/screens/FlatExpensesScreen.styles';

type RouteParams = {
  flatId?: string;
};

const GlassCard: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => (
  <View style={[styles.glassCard, style]}>
    <BlurView
      blurType="light"
      blurAmount={14}
      reducedTransparencyFallbackColor="rgba(255,255,255,0.2)"
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.glassFill} />
    {children}
  </View>
);

const formatAmount = (amount: number) => `${amount.toFixed(2)} EUR`;

export const FlatExpensesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? null;
  const [flats, setFlats] = useState<FlatSummary[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(params?.flatId ?? null);
  const [expenses, setExpenses] = useState<FlatExpense[]>([]);
  const [members, setMembers] = useState<FlatMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const memberById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);

  const amountNumber = useMemo(() => {
    const normalized = amountText.trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const equalSplitPreview = useMemo(() => {
    if (splitBetween.length === 0 || amountNumber <= 0) return 0;
    return amountNumber / splitBetween.length;
  }, [amountNumber, splitBetween.length]);

  const loadFlats = useCallback(async () => {
    const memberFlats = await flatExpenseService.getMyExpenseFlats();
    setFlats(memberFlats);
    if (memberFlats.length === 0) {
      setSelectedFlatId(null);
      return;
    }
    if (!selectedFlatId || !memberFlats.some((flat) => flat.id === selectedFlatId)) {
      setSelectedFlatId(params?.flatId && memberFlats.some((flat) => flat.id === params.flatId)
        ? params.flatId
        : memberFlats[0].id);
    }
  }, [params?.flatId, selectedFlatId]);

  const loadExpenses = useCallback(async () => {
    if (!selectedFlatId) {
      setExpenses([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const payload = await flatExpenseService.getFlatExpenses(selectedFlatId);
      setExpenses(payload.expenses);
      setMembers(payload.members);
    } catch (error) {
      console.error('Error cargando gastos del piso:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos del piso.');
    } finally {
      setLoading(false);
    }
  }, [selectedFlatId]);

  useEffect(() => {
    loadFlats().catch((error) => {
      console.error('Error cargando pisos para gastos:', error);
    });
  }, [loadFlats]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses().catch((error) => {
        console.error('Error cargando gastos del piso:', error);
      });
    }, [loadExpenses])
  );

  useEffect(() => {
    if (!showCreateModal) return;
    if (members.length === 0) return;
    setSplitBetween(members.map((member) => member.id));
    setPaidBy((prev) => prev ?? currentUserId ?? members[0].id);
  }, [currentUserId, members, showCreateModal]);

  const resetForm = () => {
    setDescription('');
    setAmountText('');
    setPaidBy(currentUserId ?? members[0]?.id ?? null);
    setSplitType('equal');
    setSplitBetween(members.map((member) => member.id));
    setCustomAmounts({});
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const toggleSplitMember = (userId: string) => {
    setSplitBetween((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const submitExpense = async () => {
    if (!selectedFlatId) {
      Alert.alert('Error', 'Selecciona un piso.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validacion', 'La descripcion es obligatoria.');
      return;
    }
    if (!paidBy) {
      Alert.alert('Validacion', 'Debes seleccionar quien pago.');
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      Alert.alert('Validacion', 'El importe debe ser mayor que 0.');
      return;
    }
    if (splitBetween.length === 0) {
      Alert.alert('Validacion', 'Debes seleccionar al menos un miembro para el reparto.');
      return;
    }

    const payload: CreateFlatExpenseRequest = {
      flat_id: selectedFlatId,
      description: description.trim(),
      amount: Number(amountNumber.toFixed(2)),
      paid_by: paidBy,
      split_type: splitType,
      split_between: splitBetween,
    };

    if (splitType === 'custom') {
      const customSplits = splitBetween.map((userId) => {
        const parsed = parseFloat((customAmounts[userId] ?? '').replace(',', '.'));
        return {
          user_id: userId,
          amount: Number.isFinite(parsed) ? parsed : 0,
        };
      });
      const totalCustom = customSplits.reduce((sum, split) => sum + split.amount, 0);
      if (customSplits.some((split) => split.amount <= 0)) {
        Alert.alert('Validacion', 'Los importes personalizados deben ser mayores que 0.');
        return;
      }
      if (Math.abs(totalCustom - amountNumber) > 0.01) {
        Alert.alert(
          'Validacion',
          `Los importes personalizados deben sumar ${formatAmount(amountNumber)}.`
        );
        return;
      }
      payload.custom_splits = customSplits;
    }

    try {
      setSaving(true);
      await flatExpenseService.createFlatExpense(payload);
      closeCreateModal();
      await loadExpenses();
    } catch (error) {
      console.error('Error creando gasto:', error);
      Alert.alert('Error', 'No se pudo crear el gasto.');
    } finally {
      setSaving(false);
    }
  };

  const renderExpense = (expense: FlatExpense) => {
    const payerName =
      expense.paid_by_user?.display_name ??
      memberById.get(expense.paid_by)?.display_name ??
      'Usuario';

    return (
      <GlassCard key={expense.id} style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle}>{expense.description}</Text>
          <Text style={styles.expenseAmount}>{formatAmount(expense.amount)}</Text>
        </View>
        <Text style={styles.expenseMeta}>Pago: {payerName}</Text>
        <Text style={styles.expenseMeta}>
          Repartido entre {expense.split_between.length} personas
        </Text>
        <Text style={styles.expenseDate}>
          {new Date(expense.created_at).toLocaleDateString('es-ES')}
        </Text>
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gastos del piso</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.settlementButton, !selectedFlatId && styles.disabledButton]}
            onPress={() => navigation.navigate('FlatSettlement', { flatId: selectedFlatId })}
            disabled={!selectedFlatId}
          >
            <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, !selectedFlatId && styles.disabledButton]}
            onPress={openCreateModal}
            disabled={!selectedFlatId}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {flats.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.flatChips}>
              {flats.map((flat) => {
                const isActive = flat.id === selectedFlatId;
                return (
                  <TouchableOpacity
                    key={flat.id}
                    style={[styles.flatChip, isActive && styles.flatChipActive]}
                    onPress={() => setSelectedFlatId(flat.id)}
                  >
                    <Text style={[styles.flatChipText, isActive && styles.flatChipTextActive]}>
                      {flat.address}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.emptyText}>Cargando gastos...</Text>
          </View>
        ) : flats.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No perteneces a ningun piso</Text>
            <Text style={styles.emptyText}>Debes ser propietario o tener una habitacion asignada para gestionar gastos.</Text>
          </GlassCard>
        ) : expenses.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin gastos todavia</Text>
            <Text style={styles.emptyText}>Pulsa + para registrar el primer gasto compartido.</Text>
          </GlassCard>
        ) : (
          expenses.map((expense) => renderExpense(expense))
        )}
      </ScrollView>

      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={closeCreateModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <GlassCard style={styles.modalCard}>
                <Text style={styles.modalTitle}>Nuevo gasto</Text>

            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Compra supermercado"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Importe total (EUR)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amountText}
              onChangeText={setAmountText}
            />

            <Text style={styles.label}>Pagador</Text>
            <View style={styles.chipWrap}>
              {members.map((member) => {
                const isActive = paidBy === member.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    onPress={() => setPaidBy(member.id)}
                  >
                    <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                      {member.display_name ?? 'Sin nombre'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Tipo de reparto</Text>
            <View style={styles.segmentRow}>
              <Pressable
                style={[styles.segmentButton, splitType === 'equal' && styles.segmentButtonActive]}
                onPress={() => setSplitType('equal')}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    splitType === 'equal' && styles.segmentButtonTextActive,
                  ]}
                >
                  Igual
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentButton, splitType === 'custom' && styles.segmentButtonActive]}
                onPress={() => setSplitType('custom')}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    splitType === 'custom' && styles.segmentButtonTextActive,
                  ]}
                >
                  Personalizado
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Repartir entre</Text>
            <View style={styles.chipWrap}>
              {members.map((member) => {
                const isSelected = splitBetween.includes(member.id);
                return (
                  <TouchableOpacity
                    key={`split-${member.id}`}
                    style={[styles.optionChip, isSelected && styles.optionChipActive]}
                    onPress={() => toggleSplitMember(member.id)}
                  >
                    <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                      {member.display_name ?? 'Sin nombre'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {splitType === 'equal' ? (
              <Text style={styles.helperText}>
                Cada persona pagara aprox. {formatAmount(equalSplitPreview)}
              </Text>
            ) : (
              <View style={styles.customSplitBlock}>
                {splitBetween.map((memberId) => (
                  <View key={`custom-${memberId}`} style={styles.customSplitRow}>
                    <Text style={styles.customSplitName}>
                      {memberById.get(memberId)?.display_name ?? 'Sin nombre'}
                    </Text>
                    <TextInput
                      style={styles.customSplitInput}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={customAmounts[memberId] ?? ''}
                      onChangeText={(value) =>
                        setCustomAmounts((prev) => ({ ...prev, [memberId]: value }))
                      }
                    />
                  </View>
                ))}
              </View>
            )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={closeCreateModal}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={submitExpense}
                    disabled={saving}
                  >
                    <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

