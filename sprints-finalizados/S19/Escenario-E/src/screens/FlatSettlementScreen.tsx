// src/screens/FlatSettlementScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { styles } from './FlatSettlementScreen.styles';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useTheme } from '../theme/ThemeContext';
import { flatSettlementService } from '../services/flatSettlementService';
import { flatExpenseService } from '../services/flatExpenseService';
import { supabaseClient } from '../services/authService';
import type { FlatSettlement, FlatMember } from '../types/flatExpense';

type RouteParams = {
  FlatSettlement: { flatId: string; flatAddress?: string };
};

const formatAmount = (amount: number) =>
  amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export const FlatSettlementScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'FlatSettlement'>>();
  const { flatId, flatAddress } = route.params;

  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<FlatSettlement[]>([]);
  const [members, setMembers] = useState<FlatMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('authUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { id?: string };
          if (parsed.id) setCurrentUserId(parsed.id);
        } catch {}
      }

      const [settlementsData, membersData] = await Promise.all([
        flatSettlementService.getSettlements(flatId),
        flatExpenseService.getFlatMembers(flatId),
      ]);
      setSettlements(settlementsData);
      setMembers(membersData);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las liquidaciones');
    } finally {
      setLoading(false);
    }
  }, [flatId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // Supabase Realtime: actualización automática al añadir gastos o saldar deudas
  useEffect(() => {
    const setupRealtime = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        supabaseClient.realtime.setAuth(token);
      }

      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
      }

      const channel = supabaseClient
        .channel(`flat-settlements-${flatId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'flat_expenses' },
          (payload) => {
            const row = payload.new as { flat_id?: string };
            if (row.flat_id !== flatId) return;
            void loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'flat_settlements' },
          (payload) => {
            const row = payload.new as { flat_id?: string };
            if (row.flat_id !== flatId) return;
            void loadData();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'flat_settlements' },
          (payload) => {
            const row = payload.new as { flat_id?: string };
            if (row.flat_id !== flatId) return;
            void loadData();
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    void setupRealtime();

    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [flatId, loadData]);

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.id === userId);
    return member?.display_name ?? 'Usuario';
  };

  const handleSettle = (settlement: FlatSettlement) => {
    const fromName = settlement.from_user_name ?? getMemberName(settlement.from_user);
    const toName = settlement.to_user_name ?? getMemberName(settlement.to_user);
    Alert.alert(
      'Marcar como saldado',
      `¿Confirmas que ${fromName} ha pagado ${formatAmount(settlement.amount)} € a ${toName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setSettling(`${settlement.from_user}-${settlement.to_user}`);
              await flatSettlementService.settleDebt(
                flatId,
                settlement.from_user,
                settlement.to_user,
                settlement.amount
              );
              await loadData();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo saldar la deuda');
            } finally {
              setSettling(null);
            }
          },
        },
      ]
    );
  };

  const pending = settlements.filter((s) => !s.settled_at);
  const settled = settlements.filter((s) => !!s.settled_at);

  // Calculate balance per member for the summary
  const balanceMap = new Map<string, number>();
  pending.forEach((s) => {
    balanceMap.set(s.from_user, (balanceMap.get(s.from_user) ?? 0) - s.amount);
    balanceMap.set(s.to_user, (balanceMap.get(s.to_user) ?? 0) + s.amount);
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Liquidaciones</Text>
          {flatAddress ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{flatAddress}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('FlatExpenses', { flatId, flatAddress })}>
          <Ionicons name="receipt-outline" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text style={styles.loadingText}>Calculando...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Balance Summary */}
          {members.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Balance actual</Text>
              {members.map((member) => {
                const balance = balanceMap.get(member.id) ?? 0;
                const isPositive = balance > 0.005;
                const isNegative = balance < -0.005;
                return (
                  <View key={member.id} style={styles.balanceRow}>
                    <View style={styles.balanceAvatarWrap}>
                      <Text style={styles.balanceAvatarText}>
                        {(member.display_name ?? 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.balanceName}>{member.display_name ?? 'Usuario'}</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        isPositive && styles.balancePositive,
                        isNegative && styles.balanceNegative,
                      ]}
                    >
                      {isPositive ? '+' : ''}{formatAmount(balance)} €
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Pending Settlements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Deudas pendientes
              {pending.length > 0 ? (
                <Text style={styles.sectionBadge}> · {pending.length}</Text>
              ) : null}
            </Text>

            {pending.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" />
                <Text style={styles.emptyTitle}>Todo liquidado</Text>
                <Text style={styles.emptySubtitle}>No hay deudas pendientes en este piso.</Text>
              </View>
            ) : (
              pending.map((s) => {
                const fromName = s.from_user_name ?? getMemberName(s.from_user);
                const toName = s.to_user_name ?? getMemberName(s.to_user);
                const isMyDebt = s.from_user === currentUserId;
                const isMyCash = s.to_user === currentUserId;
                const settlingKey = `${s.from_user}-${s.to_user}`;

                return (
                  <View
                    key={`${s.from_user}-${s.to_user}`}
                    style={[
                      styles.settlementCard,
                      isMyDebt && styles.settlementCardMyDebt,
                      isMyCash && styles.settlementCardMyCash,
                    ]}
                  >
                    <View style={styles.settlementRow}>
                      <View style={styles.settlementNames}>
                        <Text style={styles.settlementFrom}>{fromName}</Text>
                        <View style={styles.settlementArrowWrap}>
                          <Ionicons name="arrow-forward" size={14} color="#6B7280" />
                        </View>
                        <Text style={styles.settlementTo}>{toName}</Text>
                      </View>
                      <Text style={styles.settlementAmount}>{formatAmount(s.amount)} €</Text>
                    </View>

                    {isMyDebt ? (
                      <Text style={styles.settlementHint}>Debes pagar a {toName}</Text>
                    ) : isMyCash ? (
                      <Text style={[styles.settlementHint, styles.hintGreen]}>
                        {fromName} te debe a ti
                      </Text>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.settleButton,
                        settling === settlingKey && styles.settleButtonDisabled,
                      ]}
                      onPress={() => handleSettle(s)}
                      disabled={settling === settlingKey}
                    >
                      {settling === settlingKey ? (
                        <ActivityIndicator size="small" color="#7C3AED" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-outline" size={14} color="#7C3AED" />
                          <Text style={styles.settleButtonText}>Marcar como saldado</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Settled History */}
          {settled.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historial saldado</Text>
              {settled.map((s, idx) => {
                const fromName = s.from_user_name ?? getMemberName(s.from_user);
                const toName = s.to_user_name ?? getMemberName(s.to_user);
                return (
                  <View key={`settled-${idx}`} style={styles.settledCard}>
                    <View style={styles.settlementRow}>
                      <View style={styles.settlementNames}>
                        <Text style={styles.settledName}>{fromName}</Text>
                        <Ionicons name="arrow-forward" size={13} color="#9CA3AF" />
                        <Text style={styles.settledName}>{toName}</Text>
                      </View>
                      <View style={styles.settledRight}>
                        <Text style={styles.settledAmount}>{formatAmount(s.amount)} €</Text>
                        <Text style={styles.settledDate}>{formatDate(s.settled_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.settledBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                      <Text style={styles.settledBadgeText}>Saldado</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

