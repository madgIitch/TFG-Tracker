import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { flatExpenseService } from '../services/flatExpenseService';
import { flatSettlementService } from '../services/flatSettlementService';
import { AuthContext } from '../context/AuthContext';
import {
  buildRealtimeChannelName,
  cleanupRealtimeSubscription,
  createRealtimeSubscription,
} from '../services/realtime';
import type {
  FlatMember,
  FlatSettlement,
  FlatSummary,
  SettledFlatSettlement,
} from '../types/flatExpense';
import { createFlatSettlementStyles } from '../styles/screens/FlatSettlementScreen.styles';
import { GlassBackground } from '../components/GlassBackground';

type RouteParams = {
  flatId?: string;
};

const formatAmount = (amount: number) => `${amount.toFixed(2)} EUR`;

export const FlatSettlementScreen: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createFlatSettlementStyles(theme), [theme]);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const authContext = useContext(AuthContext);
  const currentUserId = authContext?.user?.id ?? null;
  const [flats, setFlats] = useState<FlatSummary[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(params?.flatId ?? null);
  const [members, setMembers] = useState<FlatMember[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [settlements, setSettlements] = useState<FlatSettlement[]>([]);
  const [settledHistory, setSettledHistory] = useState<SettledFlatSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const memberNameById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member.display_name ?? 'Sin nombre']));
  }, [members]);

  const loadFlats = useCallback(async () => {
    const myFlats = await flatExpenseService.getMyExpenseFlats();
    setFlats(myFlats);
    if (myFlats.length === 0) {
      setSelectedFlatId(null);
      return;
    }
    if (!selectedFlatId || !myFlats.some((flat) => flat.id === selectedFlatId)) {
      setSelectedFlatId(params?.flatId && myFlats.some((flat) => flat.id === params.flatId)
        ? params.flatId
        : myFlats[0].id);
    }
  }, [params?.flatId, selectedFlatId]);

  const loadSettlements = useCallback(async () => {
    if (!selectedFlatId) {
      setMembers([]);
      setBalances({});
      setSettlements([]);
      setSettledHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const payload = await flatSettlementService.getPendingSettlements(selectedFlatId);
      setMembers(payload.members);
      setBalances(payload.balances);
      setSettlements(payload.settlements);
      setSettledHistory(payload.settled);
    } catch (error) {
      console.error('Error cargando liquidaciones:', error);
      Alert.alert('Error', 'No se pudieron calcular las liquidaciones.');
    } finally {
      setLoading(false);
    }
  }, [selectedFlatId]);

  useFocusEffect(
    useCallback(() => {
      loadFlats().catch((error) => {
        console.error('Error cargando pisos para liquidaciones:', error);
      });
    }, [loadFlats])
  );

  useFocusEffect(
    useCallback(() => {
      loadSettlements().catch((error) => {
        console.error('Error cargando liquidaciones:', error);
      });
    }, [loadSettlements])
  );

  useEffect(() => {
    if (!selectedFlatId) return;

    let mounted = true;
    let channel: RealtimeChannel | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (!mounted) return;
        loadSettlements().catch((error) => {
          console.error('Error recargando liquidaciones por realtime:', error);
        });
      }, 250);
    };

    const subscribe = async () => {
      const channelName = buildRealtimeChannelName(
        'flat-settlement',
        'flat',
        selectedFlatId,
        currentUserId
      );
      channel = await createRealtimeSubscription(channelName, [
        {
          filter: {
            event: '*',
            schema: 'public',
            table: 'flat_expenses',
            filter: `flat_id=eq.${selectedFlatId}`,
          },
          onEvent: scheduleRefresh,
        },
        {
          filter: {
            event: '*',
            schema: 'public',
            table: 'flat_expense_splits',
          },
          onEvent: scheduleRefresh,
        },
        {
          filter: {
            event: '*',
            schema: 'public',
            table: 'flat_settlements',
            filter: `flat_id=eq.${selectedFlatId}`,
          },
          onEvent: scheduleRefresh,
        },
      ]);
    };

    subscribe().catch((error) => {
      console.error('Error suscribiendo realtime de liquidaciones:', error);
    });

    return () => {
      mounted = false;
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      cleanupRealtimeSubscription(channel);
    };
  }, [currentUserId, loadSettlements, selectedFlatId]);

  const settleDebt = async (settlement: FlatSettlement) => {
    if (!selectedFlatId) return;
    const key = `${settlement.from_user}-${settlement.to_user}-${settlement.amount}`;
    try {
      setSettlingKey(key);
      await flatSettlementService.markSettlementAsSettled({
        flat_id: selectedFlatId,
        from_user: settlement.from_user,
        to_user: settlement.to_user,
        amount: settlement.amount,
      });
      await loadSettlements();
    } catch (error) {
      console.error('Error marcando liquidacion:', error);
      Alert.alert('Error', 'No se pudo marcar la liquidacion como saldada.');
    } finally {
      setSettlingKey(null);
    }
  };

  const sortedBalances = useMemo(() => {
    return Object.entries(balances).sort((a, b) => b[1] - a[1]);
  }, [balances]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liquidaciones</Text>
        <View style={styles.headerSpacer} />
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
            <Text style={styles.subtleText}>Calculando balances...</Text>
          </View>
        ) : flats.length === 0 ? (
          <View style={[styles.glassCard, styles.emptyCard]}>
            <Text style={styles.emptyTitle}>No hay pisos</Text>
            <Text style={styles.subtleText}>Necesitas un piso para gestionar liquidaciones.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.glassCard, styles.sectionCard]}>
              <Text style={styles.sectionTitle}>Balance neto por miembro</Text>
              {sortedBalances.length === 0 ? (
                <Text style={styles.subtleText}>Sin movimientos todavia.</Text>
              ) : (
                sortedBalances.map(([userId, amount]) => (
                  <View key={userId} style={styles.balanceRow}>
                    <Text style={styles.balanceName}>
                      {memberNameById.get(userId) ?? 'Sin nombre'}
                    </Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        amount >= 0 ? styles.positiveBalance : styles.negativeBalance,
                      ]}
                    >
                      {amount >= 0 ? '+' : ''}
                      {formatAmount(amount)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.glassCard, styles.sectionCard]}>
              <Text style={styles.sectionTitle}>Liquidaciones pendientes</Text>
              {settlements.length === 0 ? (
                <Text style={styles.subtleText}>No hay deudas pendientes.</Text>
              ) : (
                settlements.map((settlement) => {
                  const key = `${settlement.from_user}-${settlement.to_user}-${settlement.amount}`;
                  const isLoading = settlingKey === key;
                  return (
                    <View key={key} style={styles.settlementRow}>
                      <View style={styles.settlementInfo}>
                        <Text style={styles.settlementText}>
                          {memberNameById.get(settlement.from_user) ?? 'Sin nombre'} debe pagar a{' '}
                          {memberNameById.get(settlement.to_user) ?? 'Sin nombre'}
                        </Text>
                        <Text style={styles.settlementAmount}>
                          {formatAmount(settlement.amount)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.settleButton, isLoading && styles.settleButtonDisabled]}
                        onPress={() => settleDebt(settlement)}
                        disabled={isLoading}
                      >
                        <Text style={styles.settleButtonText}>
                          {isLoading ? 'Guardando...' : 'Marcar saldada'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

            <View style={[styles.glassCard, styles.sectionCard]}>
              <Text style={styles.sectionTitle}>Historial de cuentas saldadas</Text>
              {settledHistory.length === 0 ? (
                <Text style={styles.subtleText}>Aun no hay liquidaciones saldadas.</Text>
              ) : (
                settledHistory
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime()
                  )
                  .map((item) => (
                    <View key={item.id} style={styles.settlementRow}>
                      <View style={styles.settlementInfo}>
                        <Text style={styles.settlementText}>
                          {memberNameById.get(item.from_user) ?? 'Sin nombre'} pago a{' '}
                          {memberNameById.get(item.to_user) ?? 'Sin nombre'}
                        </Text>
                        <Text style={styles.settlementAmount}>{formatAmount(item.amount)}</Text>
                        <Text style={styles.historyDate}>
                          Saldada el {new Date(item.settled_at).toLocaleDateString('es-ES')}
                        </Text>
                      </View>
                    </View>
                  ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

