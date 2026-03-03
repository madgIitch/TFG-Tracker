import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { FormSection } from '../components/FormSection';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { roomService } from '../services/roomService';
import { flatExpenseService } from '../services/flatExpenseService';
import type { Flat } from '../types/room';
import type { FlatExpense, FlatMember } from '../types/flatExpenses';
import { styles } from '../styles/screens/FlatExpensesScreen.styles';

const formatMoney = (amount: number) => `${amount.toFixed(2)} EUR`;

const splitEvenly = (totalAmount: number, memberIds: string[]) => {
  const totalCents = Math.round(totalAmount * 100);
  const base = Math.floor(totalCents / memberIds.length);
  let remainder = totalCents - base * memberIds.length;

  return memberIds.map((userId) => {
    const cents = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return {
      user_id: userId,
      amount: cents / 100,
    };
  });
};

export const FlatExpensesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute() as { params?: { flatId?: string } };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(
    route.params?.flatId ?? null
  );
  const [members, setMembers] = useState<FlatMember[]>([]);
  const [expenses, setExpenses] = useState<FlatExpense[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const memberNameById = useMemo(
    () =>
      new Map(
        members.map((member) => [member.id, member.display_name?.trim() || 'Usuario'])
      ),
    [members]
  );

  const selectedFlat = useMemo(
    () => flats.find((flat) => flat.id === selectedFlatId) ?? null,
    [flats, selectedFlatId]
  );

  const loadFlats = useCallback(async () => {
    const myFlats = await roomService.getMyFlats();
    setFlats(myFlats);
    if (myFlats.length === 0) {
      setSelectedFlatId(null);
      return;
    }

    if (!selectedFlatId || !myFlats.some((flat) => flat.id === selectedFlatId)) {
      setSelectedFlatId(route.params?.flatId ?? myFlats[0].id);
    }
  }, [route.params?.flatId, selectedFlatId]);

  const loadExpenses = useCallback(async () => {
    if (!selectedFlatId) {
      setMembers([]);
      setExpenses([]);
      return;
    }

    const response = await flatExpenseService.getExpenses(selectedFlatId);
    setMembers(response.members);
    setExpenses(response.expenses);

    if (!paidBy && response.members.length > 0) {
      setPaidBy(response.members[0].id);
    }
    if (selectedParticipants.length === 0 && response.members.length > 0) {
      setSelectedParticipants(response.members.map((member) => member.id));
    }
  }, [paidBy, selectedFlatId, selectedParticipants.length]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await loadFlats();
    } catch (error) {
      console.error('Error cargando pisos:', error);
      Alert.alert('Error', 'No se pudieron cargar tus pisos.');
    } finally {
      setLoading(false);
    }
  }, [loadFlats]);

  useFocusEffect(
    useCallback(() => {
      loadData().catch((error) => {
        console.error('Error inicial:', error);
      });
    }, [loadData])
  );

  useFocusEffect(
    useCallback(() => {
      if (!selectedFlatId) return;
      loadExpenses().catch((error) => {
        console.error('Error cargando gastos:', error);
        Alert.alert('Error', 'No se pudieron cargar los gastos.');
      });
    }, [loadExpenses, selectedFlatId])
  );

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setPaidBy(members[0]?.id ?? null);
    setSelectedParticipants(members.map((member) => member.id));
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleCreateExpense = async () => {
    if (!selectedFlatId) return;

    const parsedAmount = Number(amount.replace(',', '.'));
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !paidBy) {
      Alert.alert('Error', 'Completa descripcion, importe y pagador.');
      return;
    }

    if (selectedParticipants.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un participante para repartir el gasto.');
      return;
    }

    try {
      setSaving(true);
      const splits = splitEvenly(parsedAmount, selectedParticipants);
      const response = await flatExpenseService.createExpense({
        flat_id: selectedFlatId,
        description: description.trim(),
        amount: parsedAmount,
        paid_by: paidBy,
        splits,
      });

      setMembers(response.members);
      setExpenses(response.expenses);
      setIsModalVisible(false);
      resetForm();
      Alert.alert('Exito', 'Gasto registrado correctamente.');
    } catch (error) {
      console.error('Error creando gasto:', error);
      Alert.alert('Error', 'No se pudo registrar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gastos compartidos</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
          style={styles.headerAction}
          disabled={!selectedFlatId}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.headerActionText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FormSection title="Piso" iconName="home-outline">
            {flats.length === 0 ? (
              <Text style={styles.mutedText}>No tienes pisos disponibles.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {flats.map((flat) => {
                    const active = flat.id === selectedFlatId;
                    return (
                      <TouchableOpacity
                        key={flat.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setSelectedFlatId(flat.id)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {flat.address}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </FormSection>

          <FormSection title="Listado de gastos" iconName="receipt-outline">
            {!selectedFlat ? (
              <Text style={styles.mutedText}>Selecciona un piso para ver sus gastos.</Text>
            ) : expenses.length === 0 ? (
              <Text style={styles.mutedText}>Aun no hay gastos registrados.</Text>
            ) : (
              <View style={styles.listContainer}>
                {expenses.map((expense) => (
                  <View key={expense.id} style={styles.expenseCard}>
                    <View style={styles.expenseTopRow}>
                      <Text style={styles.expenseTitle}>{expense.description}</Text>
                      <Text style={styles.expenseAmount}>{formatMoney(expense.amount)}</Text>
                    </View>
                    <Text style={styles.expenseMeta}>
                      Pago: {memberNameById.get(expense.paid_by) ?? 'Usuario'}
                    </Text>
                    <Text style={styles.expenseMeta}>
                      Repartido entre:{' '}
                      {expense.splits
                        .map((split) => memberNameById.get(split.user_id) ?? 'Usuario')
                        .join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </FormSection>
        </ScrollView>
      )}

      <Modal visible={isModalVisible} transparent animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo gasto</Text>
            <Input
              label="Descripcion"
              value={description}
              onChangeText={setDescription}
              placeholder="Compra supermercado"
            />
            <Input
              label="Importe"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.sectionLabel}>Quien pago</Text>
            <View style={styles.chipsRowWrap}>
              {members.map((member) => {
                const active = paidBy === member.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setPaidBy(member.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {member.display_name ?? 'Usuario'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Se reparte entre</Text>
            <View style={styles.chipsRowWrap}>
              {members.map((member) => {
                const active = selectedParticipants.includes(member.id);
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleParticipant(member.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {member.display_name ?? 'Usuario'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="secondary" onPress={() => setIsModalVisible(false)} />
              <Button title="Guardar" onPress={handleCreateExpense} loading={saving} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

