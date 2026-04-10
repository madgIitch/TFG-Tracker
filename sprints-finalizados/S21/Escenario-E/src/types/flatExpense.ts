// src/types/flatExpense.ts

export interface FlatExpense {
  id: string;
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  splits?: FlatExpenseSplit[];
  payer_name?: string;
}

export interface FlatExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  user_name?: string;
}

export interface FlatSettlement {
  id: string;
  flat_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at: string | null;
  from_user_name?: string;
  to_user_name?: string;
  is_mine?: boolean; // true if the current user is from_user or to_user
}

export interface FlatMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface CreateExpenseRequest {
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[]; // array of user IDs
  custom_splits?: Record<string, number>; // user_id -> amount (overrides equal split)
}

// Shape expected by the test suite (and sent from screens)
export interface CreateFlatExpenseRequest {
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  split_type: 'equal' | 'custom';
  custom_splits?: Record<string, number>;
}

export interface ExpenseFlat {
  id: string;
  owner_id: string;
  address: string;
  city: string;
  district: string | null;
}
