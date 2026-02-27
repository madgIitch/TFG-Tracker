import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { flatExpenseService } from '../services/flatExpenseService';

import type { FlatExpense } from '../types/flatExpense';
import type { Profile } from '../types/profile';
import { Button } from '../components/Button';
import { FormSection } from '../components/FormSection';

type FlatExpensesRouteProp = RouteProp<{
    FlatExpenses: { flatId: string };
}, 'FlatExpenses'>;

export const FlatExpensesScreen: React.FC = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<FlatExpensesRouteProp>();
    const { flatId } = route.params;
    const authContext = useContext(AuthContext);
    const currentUserId = authContext?.user?.id;

    const [expenses, setExpenses] = useState<FlatExpense[]>([]);
    const [flatmates, setFlatmates] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [description, setDescription] = useState('');
    const [amountStr, setAmountStr] = useState('');
    const [paidBy, setPaidBy] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flatId]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch expenses
            const expensesData = await flatExpenseService.getFlatExpenses(flatId);
            setExpenses(expensesData);

            // Fetch exact flatmates
            const members = await flatExpenseService.getFlatMembers(flatId);
            setFlatmates(members);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron cargar los gastos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async () => {
        if (!description || !amountStr || !paidBy) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Error', 'Monto inválido');
            return;
        }

        // Default: Equal split among mock flatmates or current user 
        // Usually we get members from a flat, here we mock splitting with oneself if no members
        const membersToSplit = flatmates.length > 0 ? flatmates.map(m => m.id) : [currentUserId!];
        const splitAmount = amount / membersToSplit.length;

        const splits = membersToSplit.map(userId => ({
            user_id: userId,
            amount: parseFloat(splitAmount.toFixed(2))
        }));

        try {
            setSubmitting(true);
            const newExpense = await flatExpenseService.createExpense({
                flat_id: flatId,
                description,
                amount,
                paid_by: paidBy,
                splits
            });
            setExpenses([newExpense, ...expenses]);
            setModalVisible(false);
            setDescription('');
            setAmountStr('');
            setPaidBy(currentUserId || null);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear el gasto');
        } finally {
            setSubmitting(false);
        }
    };

    const openNewExpenseModal = () => {
        if (!paidBy) setPaidBy(currentUserId || null);
        setModalVisible(true);
    };

    const renderExpenseItem = ({ item }: { item: FlatExpense }) => {
        return (
            <View style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                    <View style={styles.expenseIconContainer}>
                        <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.expenseInfo}>
                        <Text style={styles.expenseDescription}>{item.description}</Text>
                        <Text style={styles.expenseDate}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={[styles.expenseAmount, { color: theme.colors.primary }]}>
                        {item.amount.toFixed(2)} €
                    </Text>
                </View>
                <View style={styles.expenseFooter}>
                    <Text style={styles.expensePaidBy}>
                        Pagado por: {item.paid_by === currentUserId ? 'Ti' : flatmates.find(m => m.id === item.paid_by)?.display_name || 'Compañero'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Gastos del Piso</Text>
                <View style={styles.placeholderSpacer} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : expenses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No hay gastos registrados todavía.</Text>
                </View>
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderExpenseItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={openNewExpenseModal}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Modal Añadir Gasto */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nuevo Gasto</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <FormSection title="Concepto" iconName="text-outline">
                                <TextInput
                                    style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                    placeholder="Ej. Internet, Luz, Supermercado..."
                                    placeholderTextColor="#9CA3AF"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </FormSection>

                            <FormSection title="Importe Total" iconName="cash-outline">
                                <TextInput
                                    style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={amountStr}
                                    onChangeText={setAmountStr}
                                />
                            </FormSection>

                            <FormSection title="Pagado por" iconName="person-outline">
                                {/* Temporary mock selector, normally a dropdown of flatmates */}
                                <View style={styles.segmentRowWrapped}>
                                    {flatmates.length > 0 ? (
                                        flatmates.map(member => (
                                            <TouchableOpacity
                                                key={`payer-${member.id}`}
                                                style={[
                                                    styles.segmentButton,
                                                    styles.segmentButtonWrap,
                                                    paidBy === member.id && styles.segmentButtonActive,
                                                ]}
                                                onPress={() => setPaidBy(member.id)}
                                            >
                                                <Text style={[styles.segmentText, paidBy === member.id && styles.segmentTextActive]}>
                                                    {member.id === currentUserId ? 'Yo' : member.display_name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.segmentButton, paidBy === currentUserId && styles.segmentButtonActive]}
                                            onPress={() => setPaidBy(currentUserId!)}
                                        >
                                            <Text style={[styles.segmentText, paidBy === currentUserId && styles.segmentTextActive]}>Yo</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </FormSection>

                            <Button
                                title={submitting ? "Guardando..." : "Guardar Gasto"}
                                onPress={handleCreateExpense}
                                disabled={submitting}
                                style={styles.submitButton}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280', textAlign: 'center' },
    listContainer: { padding: 16, paddingBottom: 100 },

    // Glassmorphism Card Style
    expenseCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    expenseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    expenseIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    expenseInfo: { flex: 1 },
    expenseDescription: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
    expenseDate: { fontSize: 13, color: '#6B7280' },
    expenseAmount: { fontSize: 18, fontWeight: '700' },
    expenseFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    expensePaidBy: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    segmentRow: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    segmentTextActive: { color: '#111827' },
    placeholderSpacer: { width: 40 },
    segmentRowWrapped: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
        flexWrap: 'wrap',
    },
    segmentButtonWrap: {
        minWidth: '48%',
        margin: '1%',
    },
    submitButton: {
        marginTop: 24,
    },
});
