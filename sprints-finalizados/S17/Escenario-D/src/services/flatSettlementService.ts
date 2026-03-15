// src/services/flatSettlementService.ts
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatSettlementCreateRequest, FlatSettlement } from '../types/flatExpense';

export interface PendingSettlement {
    from_user: string;
    to_user: string;
    amount: number;
}

class FlatSettlementService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = await AsyncStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    /**
     * Obtiene las transferencias pendientes mínimas sugeridas (greedy algorithm)
     */
    async getPendingSettlements(flatId: string): Promise<PendingSettlement[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-settlements?flat_id=${flatId}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Error fetching pending settlements:', error);
            throw new Error(error.error || 'Error calculando liquidaciones');
        }

        const data = await response.json();
        return data?.data || [];
    }

    /**
     * Registra una transferencia como completada/saldada
     */
    async markAsSettled(request: FlatSettlementCreateRequest): Promise<FlatSettlement> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-settlements`, {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Error marking settlement as completed:', error);
            throw new Error(error.error || 'Error al completar liquidacion');
        }

        const data = await response.json();
        return data?.data;
    }
}

export const flatSettlementService = new FlatSettlementService();
