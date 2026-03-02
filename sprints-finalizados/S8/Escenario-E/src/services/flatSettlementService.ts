// src/services/flatSettlementService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type { FlatSettlement } from '../types/flatExpense';

interface SettlementsResponse {
  data: FlatSettlement[];
}

class FlatSettlementService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSettlements(flatId: string): Promise<FlatSettlement[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-settlements?flat_id=${flatId}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener las liquidaciones');
    }

    const data: SettlementsResponse = await response.json();
    return data.data;
  }

  async settleDebt(flatId: string, fromUser: string, toUser: string, amount: number): Promise<void> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-settlements`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ flat_id: flatId, from_user: fromUser, to_user: toUser, amount }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al saldar la deuda');
    }
  }
}

export const flatSettlementService = new FlatSettlementService();
