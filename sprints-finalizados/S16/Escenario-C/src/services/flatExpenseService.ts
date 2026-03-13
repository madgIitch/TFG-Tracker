import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type { FlatExpensesResponse } from '../types/flatExpenses';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
  message?: string;
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
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private unwrapPayload<T>(payload: ApiResponse<T> | T): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      const nested = (payload as ApiResponse<T>).data;
      if (nested !== undefined) {
        return nested;
      }
    }
    return payload as T;
  }

  private async extractErrorMessage(
    response: Response,
    fallback: string
  ): Promise<string> {
    try {
      const json = await response.json();
      const detail = json?.details || json?.error || json?.message;
      if (detail) {
        return String(detail);
      }
    } catch {
      // ignore JSON parse failures
    }

    try {
      const text = await response.text();
      if (text) {
        return text;
      }
    } catch {
      // ignore text read failures
    }

    return fallback;
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
      throw new Error(
        await this.extractErrorMessage(response, 'Error al obtener gastos del piso')
      );
    }

    const rawPayload =
      (await response.json()) as ApiResponse<FlatExpensesResponse> | FlatExpensesResponse;
    const payload = this.unwrapPayload<FlatExpensesResponse>(rawPayload);
    if (!payload?.expenses || !payload?.members) {
      throw new Error('Respuesta invalida al obtener gastos');
    }

    return payload;
  }

  async createExpense(input: CreateExpenseInput): Promise<FlatExpensesResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorMessage(response, 'Error al crear gasto'));
    }

    const payload = (await response.json()) as ApiResponse<FlatExpensesResponse>;
    if (!payload.data) {
      throw new Error('Respuesta invalida al crear gasto');
    }

    return payload.data;
  }

  // Backward compatible aliases used by legacy tests/callers
  async getFlatExpenses(flatId: string): Promise<FlatExpensesResponse> {
    return this.getExpenses(flatId);
  }

  async getMyExpenseFlats(): Promise<Array<Record<string, unknown>>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses/flats`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(
        await this.extractErrorMessage(response, 'Error al obtener pisos con gastos')
      );
    }

    const rawPayload =
      (await response.json()) as
        | ApiResponse<{ flats?: Array<Record<string, unknown>> }>
        | { flats?: Array<Record<string, unknown>> };
    const payload = this.unwrapPayload<{ flats?: Array<Record<string, unknown>> }>(
      rawPayload
    );
    return payload.flats ?? [];
  }

  async createFlatExpense(
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorMessage(response, 'Error al crear gasto'));
    }

    const rawPayload =
      (await response.json()) as ApiResponse<Record<string, unknown>> | Record<string, unknown>;
    const payload = this.unwrapPayload<Record<string, unknown>>(rawPayload);
    return payload;
  }
}

export const flatExpenseService = new FlatExpenseService();
