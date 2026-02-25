import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { FormSection } from '../components/FormSection';
import { roomService } from '../services/roomService';
import { flatSettlementService } from '../services/flatSettlementService';
import type { Flat } from '../types/room';
import type { FlatDebtSummary } from '../types/flatExpenses';

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mutedText: {
    color: '#6B7280',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  balanceName: {
    color: '#111827',
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#111827',
    fontWeight: '700',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#DC2626',
  },
  transferCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  transferText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  transferHighlight: {
    fontWeight: '700',
  },
  settleButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  settleButtonDisabled: {
    opacity: 0.6,
  },
  settleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  historyText: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 20,
  },
  historyDate: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 12,
  },
});
