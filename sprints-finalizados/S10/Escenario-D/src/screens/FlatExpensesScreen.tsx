import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
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
import { styles } from '../styles/screens/FlatExpensesScreen.styles';

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

                            <View style={styles.submitButton}>
                                <Button
                                    title={submitting ? "Guardando..." : "Guardar Gasto"}
                                    onPress={handleCreateExpense}
                                    disabled={submitting}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
