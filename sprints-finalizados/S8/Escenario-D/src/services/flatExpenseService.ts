import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatExpense, FlatExpenseCreateRequest } from '../types/flatExpense';
import type { Profile } from '../types/profile';

class FlatExpenseService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = await AsyncStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    /**
     * Obtiene los miembros de un piso (propietario + inquilinos)
     */
    async getFlatMembers(flatId: string): Promise<Profile[]> {
        const headers = await this.getAuthHeaders();
        const baseHeaders = {
            ...headers,
            apikey: API_CONFIG.SUPABASE_ANON_KEY
        };

        try {
            // 1. Get owner
            const flatRes = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/flats?select=owner:profiles!owner_id(*)&id=eq.${flatId}`, {
                headers: baseHeaders
            });
            const flatData = await flatRes.json();
            const owner = flatData?.[0]?.owner;

            // 2. Get rooms
            const roomsRes = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/rooms?select=id&flat_id=eq.${flatId}`, {
                headers: baseHeaders
            });
            const roomsData = await roomsRes.json();
            const roomIds = Array.isArray(roomsData) ? roomsData.map((r: any) => r.id) : [];

            const members: Profile[] = [];
            if (owner) members.push(owner);

            // 3. Get tenants
            if (roomIds.length > 0) {
                const assignmentsRes = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/room_assignments?select=assignee:profiles(*)&room_id=in.(${roomIds.join(',')})&status=eq.accepted`, {
                    headers: baseHeaders
                });
                const assignmentsData = await assignmentsRes.json();

                if (Array.isArray(assignmentsData)) {
                    assignmentsData.forEach((a: any) => {
                        if (a.assignee && !members.find(m => m.id === a.assignee.id)) {
                            members.push(a.assignee);
                        }
                    });
                }
            }
            return members;
        } catch (error) {
            console.error('Error fetching flat members:', error);
            return [];
        }
    }

    /**
     * Obtiene los gastos de un piso
     */
    async getFlatExpenses(flatId: string): Promise<FlatExpense[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${flatId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Error fetching flat expenses:', error);
            throw new Error(error.error || 'Error al obtener gastos');
        }

        const data = await response.json();
        return data?.data || [];
    }

    /**
     * Crea un nuevo gasto con divisiones
     */
    async createExpense(request: FlatExpenseCreateRequest): Promise<FlatExpense> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Error creating flat expense:', error);
            throw new Error(error.error || 'Error al crear gasto');
        }

        const data = await response.json();
        return data?.data;
    }
}

export const flatExpenseService = new FlatExpenseService();
