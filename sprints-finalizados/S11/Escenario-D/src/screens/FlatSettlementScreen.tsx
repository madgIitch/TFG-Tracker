import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { flatSettlementService, PendingSettlement } from '../services/flatSettlementService';
import { styles } from '../styles/screens/FlatSettlementScreen.styles';

type FlatSettlementRouteProp = RouteProp<{
    FlatSettlement: { flatId: string };
}, 'FlatSettlement'>;

export const FlatSettlementScreen: React.FC = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<FlatSettlementRouteProp>();
    const { flatId } = route.params;
    const authContext = useContext(AuthContext);
    const currentUserId = authContext?.user?.id;

    const [settlements, setSettlements] = useState<PendingSettlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadSettlements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flatId]);

    const loadSettlements = async () => {
        try {
            setLoading(true);
            const data = await flatSettlementService.getPendingSettlements(flatId);
            setSettlements(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron calcular las liquidaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleSettle = async (settlement: PendingSettlement) => {
        Alert.alert(
            'Saldar Deuda',
            `¿Confirmas que se han pagado los ${settlement.amount}€?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const id = `${settlement.from_user}-${settlement.to_user}`;
                            setProcessingId(id);
                            await flatSettlementService.markAsSettled({
                                flat_id: flatId,
                                from_user: settlement.from_user,
                                to_user: settlement.to_user,
                                amount: settlement.amount,
                            });

                            // Recalculate settlements
                            await loadSettlements();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'No se pudo liquidar la deuda');
                        } finally {
                            setProcessingId(null);
                        }
                    },
                },
            ]
        );
    };

    // Utility to map an ID to a name if we had the user profiles
    // For now we'll just show "Tú" or part of the ID since we mocked members
    const getUserName = (id: string) => {
        if (id === currentUserId) return 'Ti';
        return `ID: ${id.substring(0, 5)}...`; // Mocking short id for visual
    };

    const renderSettlementItem = ({ item }: { item: PendingSettlement }) => {
        const isCurrentUserFrom = item.from_user === currentUserId;
        const isCurrentUserTo = item.to_user === currentUserId;

        // Glassmorphism styling concept
        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={20} color="#6B7280" />
                    </View>
                    <View style={styles.arrowContainer}>
                        <Text style={styles.amountText}>{item.amount.toFixed(2)} €</Text>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                    </View>
                    <View style={[styles.avatarPlaceholder, styles.avatarPlaceholderTo]}>
                        <Ionicons name="person" size={20} color={theme.colors.primary} />
                    </View>
                </View>

                <View style={styles.namesRow}>
                    <Text style={styles.nameText}>
                        {isCurrentUserFrom ? 'Tú debes' : `${getUserName(item.from_user)} debe`}
                    </Text>
                    <Text style={styles.nameText}>
                        {isCurrentUserTo ? 'A ti' : `A ${getUserName(item.to_user)}`}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.settleButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleSettle(item)}
                    disabled={processingId !== null}
                >
                    {processingId === `${item.from_user}-${item.to_user}` ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.settleButtonText}>Marcar como saldado</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Cuentas Claras</Text>
                <TouchableOpacity onPress={loadSettlements} style={styles.backButton}>
                    <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>Calculando balances...</Text>
                </View>
            ) : settlements.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
                    <Text style={styles.emptyText}>¡Todo está al día!</Text>
                    <Text style={styles.emptySubText}>No hay deudas pendientes en el piso.</Text>
                </View>
            ) : (
                <FlatList
                    data={settlements}
                    keyExtractor={(item) => `${item.from_user}-${item.to_user}`}
                    renderItem={renderSettlementItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
};
