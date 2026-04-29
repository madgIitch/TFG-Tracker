export type SplitType = 'equal' | 'custom';

export interface FlatMember {
  id: string;
  display_name: string | null;
  avatar_url?: string | null;
}

export interface FlatSummary {
  id: string;
  owner_id: string;
  address: string | null;
  city: string | null;
  district: string | null;
}

export interface FlatExpenseSplit {
  id?: string;
  expense_id?: string;
  user_id: string;
  amount: number;
  user?: FlatMember | null;
}

export interface FlatExpense {
  id: string;
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  created_at: string;
  paid_by_user?: FlatMember | null;
  splits: FlatExpenseSplit[];
}

export interface CreateFlatExpenseRequest {
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type?: SplitType;
  split_between: string[];
  custom_splits?: FlatExpenseSplit[];
}

export interface FlatExpensesPayload {
  expenses: FlatExpense[];
  members: FlatMember[];
}

export interface FlatSettlement {
  from_user: string;
  to_user: string;
  amount: number;
}

export interface SettledFlatSettlement {
  id: string;
  flat_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at: string;
}

export interface FlatSettlementsPayload {
  settlements: FlatSettlement[];
  members: FlatMember[];
  balances: Record<string, number>;
  settled: SettledFlatSettlement[];
}
