import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { FormSection } from '../components/FormSection';
import { Button } from '../components/Button';
import { EmptyState, ErrorBanner, LoadingState } from '../components/UiState';
import { supabaseClient } from '../services/authService';
import { roomService } from '../services/roomService';
import { flatSettlementService } from '../services/flatSettlementService';
import type { Flat } from '../types/room';
import type { FlatDebtSummary } from '../types/flatExpenses';
import { createStyles } from '../styles/screens/FlatSettlementsScreen.styles';

const formatMoney = (amount: number) => `${amount.toFixed(2).replace('.', ',')} EUR`;

export const FlatSettlementsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute() as { params?: { flatId?: string } };

  const [loading, setLoading] = useState(true);
  const [savingTransfer, setSavingTransfer] = useState<string | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(
    route.params?.flatId ?? null
  );
  const [summary, setSummary] = useState<FlatDebtSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setErrorMessage(null);
  }, [selectedFlatId]);

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
      loadSummary().catch((error) => {
        console.error('Error cargando resumen:', error);
        setErrorMessage('No se pudo cargar el resumen de deudas.');
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
              setErrorMessage('La informacion no se pudo actualizar en tiempo real.');
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
            loadSummary().catch((error) => {
              console.error('Error refrescando resumen por splits realtime:', error);
              setErrorMessage('La informacion no se pudo actualizar en tiempo real.');
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
      setErrorMessage(null);
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liquidaciones</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <LoadingState label="Cargando liquidaciones" />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              onActionPress={() => {
                if (selectedFlatId) {
                  loadSummary().catch(() => undefined);
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
                message="Crea o unete a un piso para calcular balances."
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

          <FormSection title="Balance por persona" iconName="stats-chart-outline">
            {!summary ? (
              <EmptyState
                iconName="stats-chart-outline"
                title="Selecciona un piso"
                message="El balance muestra quien adelanto dinero y quien debe compensar."
              />
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
                      accessibilityLabel={`Balance de ${
                        memberNameById.get(balance.user_id) ?? 'Usuario'
                      }: ${formatMoney(balance.amount)}`}
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
              <EmptyState
                iconName="swap-horizontal-outline"
                title="Selecciona un piso"
                message="Aqui veras las transferencias minimas para saldar deudas."
              />
            ) : summary.suggested_transfers.length === 0 ? (
              <EmptyState
                iconName="checkmark-circle-outline"
                title="Todo al dia"
                message="No hay deudas pendientes entre los miembros del piso."
              />
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
                      <Button
                        title={isSaving ? 'Guardando...' : 'Marcar saldado'}
                        size="small"
                        iconName="checkmark"
                        style={styles.settleAction}
                        onPress={() =>
                          handleSettleTransfer(
                            transfer.from_user,
                            transfer.to_user,
                            transfer.amount
                          )
                        }
                        disabled={isSaving}
                        loading={isSaving}
                        accessibilityLabel={`Marcar como saldado el pago de ${
                          memberNameById.get(transfer.from_user) ?? 'Usuario'
                        } a ${memberNameById.get(transfer.to_user) ?? 'Usuario'} por ${formatMoney(
                          transfer.amount
                        )}`}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </FormSection>

          <FormSection title="Historial" iconName="time-outline">
            {!summary ? (
              <EmptyState
                iconName="time-outline"
                title="Selecciona un piso"
                message="El historial muestra liquidaciones ya registradas."
              />
            ) : summary.settlements.length === 0 ? (
              <EmptyState
                iconName="time-outline"
                title="Sin liquidaciones"
                message="Cuando marques una transferencia como saldada, aparecera aqui."
              />
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



