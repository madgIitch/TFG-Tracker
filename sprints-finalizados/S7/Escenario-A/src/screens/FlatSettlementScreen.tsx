import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
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
import { flatSettlementService } from '../services/flatSettlementService';
import type {
  FlatMember,
  FlatSettlement,
  FlatSummary,
  SettledFlatSettlement,
} from '../types/flatExpense';

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

export const FlatSettlementScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
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
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay pisos</Text>
            <Text style={styles.subtleText}>Necesitas un piso para gestionar liquidaciones.</Text>
          </GlassCard>
        ) : (
          <>
            <GlassCard style={styles.sectionCard}>
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
            </GlassCard>

            <GlassCard style={styles.sectionCard}>
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
            </GlassCard>

            <GlassCard style={styles.sectionCard}>
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
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  flatChips: {
    flexDirection: 'row',
    gap: 10,
  },
  flatChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  flatChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  flatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  flatChipTextActive: {
    color: '#7C3AED',
  },
  loadingState: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  glassCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionCard: {
    padding: 14,
  },
  emptyCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subtleText: {
    fontSize: 13,
    color: '#6B7280',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.7)',
  },
  balanceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  balanceAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  positiveBalance: {
    color: '#059669',
  },
  negativeBalance: {
    color: '#DC2626',
  },
  settlementRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.7)',
    gap: 10,
  },
  settlementInfo: {
    gap: 4,
  },
  settlementText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  settlementAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  historyDate: {
    fontSize: 11,
    color: '#6B7280',
  },
  settleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
  },
  settleButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  settleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
