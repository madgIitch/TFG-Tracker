// src/services/flatExpenseService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import type {
  FlatExpense,
  CreateExpenseRequest,
  CreateFlatExpenseRequest,
  FlatMember,
  ExpenseFlat,
} from '../types/flatExpense';

interface ExpensesResponse {
  data: FlatExpense[];
}

interface SingleExpenseResponse {
  data: FlatExpense;
}

interface MembersResponse {
  data: FlatMember[];
}

interface MyFlatsResponse {
  data: { flats: ExpenseFlat[] };
}

interface CombinedExpensesResponse {
  expenses: FlatExpense[];
  members: FlatMember[];
}

class FlatExpenseService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async throwFromResponse(response: Response): Promise<never> {
    const json = await response.json().catch(() => ({}));
    const message: string =
      (json as { details?: string; error?: string }).details ??
      (json as { details?: string; error?: string }).error ??
      'Error en la solicitud';
    throw new Error(message);
  }

  // ─── Methods used by screens ─────────────────────────────────────────────

  async getExpenses(flatId: string): Promise<FlatExpense[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${flatId}`,
      { method: 'GET', headers }
    );

    if (!response.ok) return this.throwFromResponse(response);

    const data: ExpensesResponse = await response.json();
    return data.data;
  }

  async createExpense(expenseData: CreateExpenseRequest): Promise<FlatExpense> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) return this.throwFromResponse(response);

    const data: SingleExpenseResponse = await response.json();
    return data.data;
  }

  async getFlatMembers(flatId: string): Promise<FlatMember[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${flatId}&type=members`,
      { method: 'GET', headers }
    );

    if (!response.ok) return this.throwFromResponse(response);

    const data: MembersResponse = await response.json();
    return data.data;
  }

  // ─── Methods required by the test suite ──────────────────────────────────

  /** Returns flats where the current user is owner or assigned tenant */
  async getMyExpenseFlats(): Promise<ExpenseFlat[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?type=my-flats`,
      { method: 'GET', headers }
    );

    if (!response.ok) return this.throwFromResponse(response);

    const payload: MyFlatsResponse = await response.json();
    return payload.data.flats;
  }

  /** Returns combined expenses + members for a flat in a single call */
  async getFlatExpenses(
    flatId: string
  ): Promise<{ expenses: FlatExpense[]; members: FlatMember[] }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.FUNCTIONS_URL}/flat-expenses?flat_id=${flatId}&type=combined`,
      { method: 'GET', headers }
    );

    if (!response.ok) return this.throwFromResponse(response);

    const payload: CombinedExpensesResponse = await response.json();
    return { expenses: payload.expenses, members: payload.members };
  }

  /** Creates an expense using the CreateFlatExpenseRequest shape */
  async createFlatExpense(expenseData: CreateFlatExpenseRequest): Promise<FlatExpense> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_CONFIG.FUNCTIONS_URL}/flat-expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) return this.throwFromResponse(response);

    const data: SingleExpenseResponse = await response.json();
    return data.data;
  }
}

export const flatExpenseService = new FlatExpenseService();
