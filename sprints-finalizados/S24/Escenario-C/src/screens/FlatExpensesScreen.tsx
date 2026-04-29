import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { FormSection } from '../components/FormSection';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState, ErrorBanner, LoadingState } from '../components/UiState';
import { supabaseClient } from '../services/authService';
import { roomService } from '../services/roomService';
import { flatExpenseService } from '../services/flatExpenseService';
import type { Flat } from '../types/room';
import type { FlatExpense, FlatMember } from '../types/flatExpenses';
import { createStyles } from '../styles/screens/FlatExpensesScreen.styles';

const formatMoney = (amount: number) => `${amount.toFixed(2).replace('.', ',')} EUR`;

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
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

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

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
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
    setErrorMessage(null);

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
      setErrorMessage(null);
      await loadFlats();
    } catch (error) {
      console.error('Error cargando pisos:', error);
      setErrorMessage('No se pudieron cargar tus pisos. Revisa la conexion e intentalo de nuevo.');
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
      setErrorMessage(null);
      loadExpenses().catch((error) => {
        console.error('Error cargando gastos:', error);
        setErrorMessage('No se pudieron cargar los gastos compartidos.');
      });
    }, [loadExpenses, selectedFlatId])
  );

  useEffect(() => {
    let isMounted = true;

    const subscribeRealtime = async () => {
      if (!selectedFlatId) {
        if (realtimeChannelRef.current) {
          await realtimeChannelRef.current.unsubscribe();
          supabaseClient.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        return;
      }

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (session?.access_token) {
        supabaseClient.realtime.setAuth(session.access_token);
      }

      if (realtimeChannelRef.current) {
        await realtimeChannelRef.current.unsubscribe();
        supabaseClient.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }

      const channel = supabaseClient
        .channel(`rt:flat-expenses:flat:${selectedFlatId}:screen:FlatExpenses`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'flat_expenses',
            filter: `flat_id=eq.${selectedFlatId}`,
          },
          () => {
            if (!isMounted) return;
            loadExpenses().catch((error) => {
              console.error('Error refrescando gastos en realtime:', error);
              setErrorMessage('La informacion no se pudo actualizar en tiempo real.');
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'flat_expense_splits',
          },
          () => {
            if (!isMounted) return;
            loadExpenses().catch((error) => {
              console.error('Error refrescando splits en realtime:', error);
              setErrorMessage('La informacion no se pudo actualizar en tiempo real.');
            });
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    };

    subscribeRealtime().catch((error) => {
      console.error('Error suscribiendo realtime de gastos:', error);
    });

    return () => {
      isMounted = false;
      const channel = realtimeChannelRef.current;
      realtimeChannelRef.current = null;
      if (channel) {
        channel.unsubscribe().catch((error) => {
          console.error('Error cancelando realtime de gastos:', error);
        });
        supabaseClient.removeChannel(channel);
      }
    };
  }, [selectedFlatId, loadExpenses]);

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
      setErrorMessage(null);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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
          accessibilityRole="button"
          accessibilityLabel="Registrar nuevo gasto"
          accessibilityState={{ disabled: !selectedFlatId }}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.headerActionText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState label="Cargando gastos" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              onActionPress={() => {
                if (selectedFlatId) {
                  loadExpenses().catch(() => undefined);
                } else {
                  loadData().catch(() => undefined);
                }
              }}
            />
          ) : null}

          <FormSection title="Piso" iconName="home-outline">
            {flats.length === 0 ? (
              <EmptyState
                iconName="home-outline"
                title="Sin pisos disponibles"
                message="Crea o unete a un piso para empezar a registrar gastos."
              />
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
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar piso ${flat.address}`}
                        accessibilityState={{ selected: active }}
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
              <EmptyState
                iconName="receipt-outline"
                title="Selecciona un piso"
                message="Elige un piso para consultar los gastos compartidos."
              />
            ) : expenses.length === 0 ? (
              <EmptyState
                iconName="receipt-outline"
                title="Aun no hay gastos"
                message="Cuando alguien registre un pago, aparecera aqui con su reparto."
                actionLabel="Nuevo gasto"
                onActionPress={() => {
                  resetForm();
                  setIsModalVisible(true);
                }}
              />
            ) : (
              <View style={styles.listContainer}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total registrado</Text>
                  <Text style={styles.summaryAmount}>{formatMoney(totalAmount)}</Text>
                  <Text style={styles.summaryMeta}>
                    {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} en este piso
                  </Text>
                </View>
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
                    accessibilityRole="button"
                    accessibilityLabel={`Pagado por ${member.display_name ?? 'Usuario'}`}
                    accessibilityState={{ selected: active }}
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
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Repartir con ${member.display_name ?? 'Usuario'}`}
                    accessibilityState={{ checked: active }}
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



