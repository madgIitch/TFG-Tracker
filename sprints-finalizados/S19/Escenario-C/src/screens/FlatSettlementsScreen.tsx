import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { FormSection } from '../components/FormSection';
import { supabaseClient } from '../services/authService';
import { roomService } from '../services/roomService';
import { flatSettlementService } from '../services/flatSettlementService';
import type { Flat } from '../types/room';
import type { FlatDebtSummary } from '../types/flatExpenses';
import { styles } from '../styles/screens/FlatSettlementsScreen.styles';

const formatMoney = (amount: number) => `${amount.toFixed(2)} EUR`;

export const FlatSettlementsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute() as { params?: { flatId?: string } };

  const [loading, setLoading] = useState(true);
  const [savingTransfer, setSavingTransfer] = useState<string | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(
    route.params?.flatId ?? null
  );
  const [summary, setSummary] = useState<FlatDebtSummary | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  const memberNameById = useMemo(
    () =>
      new Map(
        (summary?.members ?? []).map((member) => [
          member.id,
          member.display_name?.trim() || 'Usuario',
        ])
      ),
    [summary?.members]
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

  const loadSummary = useCallback(async () => {
    if (!selectedFlatId) {
      setSummary(null);
      return;
    }

    const response = await flatSettlementService.getSummary(selectedFlatId);
    setSummary(response);
  }, [selectedFlatId]);

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
      loadSummary().catch((error) => {
        console.error('Error cargando resumen:', error);
        Alert.alert('Error', 'No se pudo cargar el resumen de deudas.');
      });
    }, [loadSummary, selectedFlatId])
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
        .channel(`rt:flat-settlements:flat:${selectedFlatId}:screen:FlatSettlements`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'flat_settlements',
            filter: `flat_id=eq.${selectedFlatId}`,
          },
          () => {
            if (!isMounted) return;
            loadSummary().catch((error) => {
              console.error('Error refrescando liquidaciones realtime:', error);
            });
          }
        )
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
            loadSummary().catch((error) => {
              console.error('Error refrescando resumen por gastos realtime:', error);
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
            loadSummary().catch((error) => {
              console.error('Error refrescando resumen por splits realtime:', error);
            });
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    };

    subscribeRealtime().catch((error) => {
      console.error('Error suscribiendo realtime de liquidaciones:', error);
    });

    return () => {
      isMounted = false;
      const channel = realtimeChannelRef.current;
      realtimeChannelRef.current = null;
      if (channel) {
        channel.unsubscribe().catch((error) => {
          console.error('Error cancelando realtime de liquidaciones:', error);
        });
        supabaseClient.removeChannel(channel);
      }
    };
  }, [selectedFlatId, loadSummary]);

  const handleSettleTransfer = async (fromUser: string, toUser: string, amount: number) => {
    if (!selectedFlatId) return;

    const transferKey = `${fromUser}-${toUser}-${amount}`;
    try {
      setSavingTransfer(transferKey);
      const updated = await flatSettlementService.createSettlement({
        flat_id: selectedFlatId,
        from_user: fromUser,
        to_user: toUser,
        amount,
      });
      setSummary(updated);
      Alert.alert('Exito', 'Liquidacion registrada.');
    } catch (error) {
      console.error('Error registrando liquidacion:', error);
      Alert.alert('Error', 'No se pudo registrar la liquidacion.');
    } finally {
      setSavingTransfer(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liquidaciones</Text>
        <View style={styles.headerSpacer} />
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

          <FormSection title="Balance por persona" iconName="stats-chart-outline">
            {!summary ? (
              <Text style={styles.mutedText}>Selecciona un piso para ver el resumen.</Text>
            ) : (
              <View style={styles.listContainer}>
                {summary.balances.map((balance) => (
                  <View key={balance.user_id} style={styles.balanceRow}>
                    <Text style={styles.balanceName}>
                      {memberNameById.get(balance.user_id) ?? 'Usuario'}
                    </Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        balance.amount > 0 && styles.positive,
                        balance.amount < 0 && styles.negative,
                      ]}
                    >
                      {balance.amount > 0
                        ? `+${formatMoney(balance.amount)}`
                        : balance.amount < 0
                        ? `-${formatMoney(Math.abs(balance.amount))}`
                        : formatMoney(0)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </FormSection>

          <FormSection title="Transferencias sugeridas" iconName="swap-horizontal-outline">
            {!summary ? (
              <Text style={styles.mutedText}>Selecciona un piso para ver sugerencias.</Text>
            ) : summary.suggested_transfers.length === 0 ? (
              <Text style={styles.mutedText}>No hay deudas pendientes. Todo al dia.</Text>
            ) : (
              <View style={styles.listContainer}>
                {summary.suggested_transfers.map((transfer) => {
                  const key = `${transfer.from_user}-${transfer.to_user}-${transfer.amount}`;
                  const isSaving = savingTransfer === key;
                  return (
                    <View key={key} style={styles.transferCard}>
                      <Text style={styles.transferText}>
                        {memberNameById.get(transfer.from_user) ?? 'Usuario'} debe pagar{' '}
                        <Text style={styles.transferHighlight}>
                          {formatMoney(transfer.amount)}
                        </Text>{' '}
                        a {memberNameById.get(transfer.to_user) ?? 'Usuario'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.settleButton, isSaving && styles.settleButtonDisabled]}
                        onPress={() =>
                          handleSettleTransfer(
                            transfer.from_user,
                            transfer.to_user,
                            transfer.amount
                          )
                        }
                        disabled={isSaving}
                      >
                        <Text style={styles.settleButtonText}>
                          {isSaving ? 'Guardando...' : 'Marcar saldado'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </FormSection>

          <FormSection title="Historial" iconName="time-outline">
            {!summary ? (
              <Text style={styles.mutedText}>Selecciona un piso para ver historial.</Text>
            ) : summary.settlements.length === 0 ? (
              <Text style={styles.mutedText}>No hay liquidaciones registradas.</Text>
            ) : (
              <View style={styles.listContainer}>
                {summary.settlements.map((settlement) => (
                  <View key={settlement.id} style={styles.historyCard}>
                    <Text style={styles.historyText}>
                      {memberNameById.get(settlement.from_user) ?? 'Usuario'} pago{' '}
                      {formatMoney(settlement.amount)} a{' '}
                      {memberNameById.get(settlement.to_user) ?? 'Usuario'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {settlement.settled_at
                        ? new Date(settlement.settled_at).toLocaleDateString('es-ES')
                        : 'Pendiente'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </FormSection>
        </ScrollView>
      )}
    </View>
  );
};

