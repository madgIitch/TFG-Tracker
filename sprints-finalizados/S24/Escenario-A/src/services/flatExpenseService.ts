import { API_CONFIG } from '../config/api';
import { authService } from './authService';
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
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      apikey: API_CONFIG.SUPABASE_ANON_KEY,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let headers = await this.getAuthHeaders();
    let response = await fetch(url, { ...init, headers });
    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        headers = await this.getAuthHeaders();
        response = await fetch(url, { ...init, headers });
      }
    }
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
    const data = await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?scope=my_flats`,
      {
        method: 'GET',
      }
    );

    const payload = unwrapData<{ flats?: FlatSummary[] }>(data);
    return payload.flats ?? [];
  }

  async getFlatExpenses(flatId: string): Promise<FlatExpensesPayload> {
    const data = await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${encodeURIComponent(flatId)}`,
      {
        method: 'GET',
      }
    );

    const payload = unwrapData<FlatExpensesPayload>(data);
    return {
      expenses: payload.expenses ?? [],
      members: payload.members ?? [],
    };
  }

  async createFlatExpense(input: CreateFlatExpenseRequest): Promise<FlatExpense> {
    const data = await this.request<unknown>(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const payload = unwrapData<FlatExpense>(data);
    return payload;
  }

  async updateFlatExpense(
    expenseId: string,
    input: Partial<CreateFlatExpenseRequest>
  ): Promise<FlatExpense> {
    const data = await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?expense_id=${encodeURIComponent(expenseId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      }
    );

    return unwrapData<FlatExpense>(data);
  }

  async deleteFlatExpense(expenseId: string): Promise<void> {
    await this.request<unknown>(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?expense_id=${encodeURIComponent(expenseId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getFlatMembers(flatId: string): Promise<FlatMember[]> {
    const payload = await this.getFlatExpenses(flatId);
    return payload.members;
  }
}

export const flatExpenseService = new FlatExpenseService();
