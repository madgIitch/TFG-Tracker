import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type {
  CreateFlatExpenseRequest,
  FlatExpense,
  FlatExpensesPayload,
  FlatMember,
  FlatSummary,
} from '../types/flatExpense';

type EdgePayload<T> = {
  data?: T;
  error?: string;
};

const unwrapData = <T>(payload: unknown): T => {
  const parsed = payload as EdgePayload<T> | T;
  return (parsed as EdgePayload<T>).data ?? (parsed as T);
};

class FlatExpenseService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      let detail = `status ${response.status}`;
      try {
        const payload = await response.json();
        detail = payload?.details || payload?.error || detail;
      } catch {
        try {
          const text = await response.text();
          if (text) detail = text;
        } catch {
          // ignore parse failures
        }
      }
      throw new Error(detail);
    }

    const payload = (await response.json()) as T;
    return payload;
  }

  async getMyExpenseFlats(): Promise<FlatSummary[]> {
    const headers = await this.getAuthHeaders();
    const data = await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?scope=my_flats`,
      {
        method: 'GET',
        headers,
      }
    );

    const payload = unwrapData<{ flats?: FlatSummary[] }>(data);
    return payload.flats ?? [];
  }

  async getFlatExpenses(flatId: string): Promise<FlatExpensesPayload> {
    const headers = await this.getAuthHeaders();
    const data = await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${encodeURIComponent(flatId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    const payload = unwrapData<FlatExpensesPayload>(data);
    return {
      expenses: payload.expenses ?? [],
      members: payload.members ?? [],
    };
  }

  async createFlatExpense(input: CreateFlatExpenseRequest): Promise<FlatExpense> {
    const headers = await this.getAuthHeaders();
    const data = await this.request<unknown>(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const payload = unwrapData<FlatExpense>(data);
    return payload;
  }

  async updateFlatExpense(
    expenseId: string,
    input: Partial<CreateFlatExpenseRequest>
  ): Promise<FlatExpense> {
    const headers = await this.getAuthHeaders();
    const data = await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?expense_id=${encodeURIComponent(expenseId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(input),
      }
    );

    return unwrapData<FlatExpense>(data);
  }

  async deleteFlatExpense(expenseId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?expense_id=${encodeURIComponent(expenseId)}`,
      {
        method: 'DELETE',
        headers,
      }
    );
  }

  async getFlatMembers(flatId: string): Promise<FlatMember[]> {
    const payload = await this.getFlatExpenses(flatId);
    return payload.members;
  }
}

export const flatExpenseService = new FlatExpenseService();
