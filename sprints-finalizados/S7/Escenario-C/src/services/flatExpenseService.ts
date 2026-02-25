import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type { FlatExpensesResponse } from '../types/flatExpenses';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface CreateExpenseInput {
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  splits: Array<{
    user_id: string;
    amount: number;
  }>;
}

class FlatExpenseService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getExpenses(flatId: string): Promise<FlatExpensesResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${flatId}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al obtener gastos del piso');
    }

    const payload = (await response.json()) as ApiResponse<FlatExpensesResponse>;
    if (!payload.data) {
      throw new Error('Respuesta invalida al obtener gastos');
    }

    return payload.data;
  }

  async createExpense(input: CreateExpenseInput): Promise<FlatExpensesResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al crear gasto');
    }

    const payload = (await response.json()) as ApiResponse<FlatExpensesResponse>;
    if (!payload.data) {
      throw new Error('Respuesta invalida al crear gasto');
    }

    return payload.data;
  }
}

export const flatExpenseService = new FlatExpenseService();
