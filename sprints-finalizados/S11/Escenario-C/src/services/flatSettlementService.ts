import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type { FlatDebtSummary } from '../types/flatExpenses';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface CreateSettlementInput {
  flat_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at?: string;
}

class FlatSettlementService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSummary(flatId: string): Promise<FlatDebtSummary> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-settlements?flat_id=${flatId}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al obtener resumen de deudas');
    }

    const payload = (await response.json()) as ApiResponse<FlatDebtSummary>;
    if (!payload.data) {
      throw new Error('Respuesta invalida al obtener resumen de deudas');
    }

    return payload.data;
  }

  async createSettlement(input: CreateSettlementInput): Promise<FlatDebtSummary> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-settlements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar liquidacion');
    }

    const payload = (await response.json()) as ApiResponse<FlatDebtSummary>;
    if (!payload.data) {
      throw new Error('Respuesta invalida al registrar liquidacion');
    }

    return payload.data;
  }
}

export const flatSettlementService = new FlatSettlementService();
