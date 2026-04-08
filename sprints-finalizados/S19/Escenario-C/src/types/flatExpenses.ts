export interface FlatMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface FlatExpenseSplit {
  id: string;
  user_id: string;
  amount: number;
  user?: FlatMember;
}

export interface FlatExpense {
  id: string;
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  payer?: FlatMember;
  splits: FlatExpenseSplit[];
}

export interface FlatExpensesResponse {
  flat_id: string;
  members: FlatMember[];
  expenses: FlatExpense[];
  expense?: FlatExpense | null;
}

export interface BalanceItem {
  user_id: string;
  amount: number;
}

export interface SuggestedTransfer {
  from_user: string;
  to_user: string;
  amount: number;
}

export interface FlatSettlement {
  id: string;
  flat_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at: string | null;
  from_profile?: FlatMember;
  to_profile?: FlatMember;
}

export interface FlatDebtSummary {
  flat_id: string;
  members: FlatMember[];
  balances: BalanceItem[];
  suggested_transfers: SuggestedTransfer[];
  settlements: FlatSettlement[];
}
