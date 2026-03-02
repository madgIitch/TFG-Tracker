// src/screens/FlatSettlementScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { flatSettlementService } from '../services/flatSettlementService';
import { flatExpenseService } from '../services/flatExpenseService';
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
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'FlatSettlement'>>();
  const { flatId, flatAddress } = route.params;

  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);
  const [settlements, setSettlements] = useState<FlatSettlement[]>([]);
  const [members, setMembers] = useState<FlatMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
  content: { padding: 20, gap: 4 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  sectionBadge: { color: '#7C3AED' },

  // Balance summary
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  balanceAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAvatarText: { fontSize: 15, fontWeight: '700', color: '#7C3AED' },
  balanceName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  balanceAmount: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  balancePositive: { color: '#10B981' },
  balanceNegative: { color: '#EF4444' },

  // Pending settlements
  settlementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settlementCardMyDebt: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  settlementCardMyCash: { borderColor: '#6EE7B7', backgroundColor: '#F0FDF8' },
  settlementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settlementNames: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  settlementArrowWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementFrom: { fontSize: 14, fontWeight: '600', color: '#111827' },
  settlementTo: { fontSize: 14, fontWeight: '600', color: '#111827' },
  settlementAmount: { fontSize: 17, fontWeight: '700', color: '#111827' },
  settlementHint: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  hintGreen: { color: '#10B981' },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
  },
  settleButtonDisabled: { opacity: 0.5 },
  settleButtonText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', marginTop: 6, textAlign: 'center' },

  // Settled history
  settledCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 8,
  },
  settledName: { fontSize: 13, color: '#6B7280' },
  settledRight: { alignItems: 'flex-end' },
  settledAmount: { fontSize: 14, fontWeight: '600', color: '#374151' },
  settledDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  settledBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
});
