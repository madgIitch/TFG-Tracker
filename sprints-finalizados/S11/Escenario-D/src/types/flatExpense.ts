// src/types/flatExpense.ts

export interface FlatExpense {
    id: string;
    flat_id: string;
    description: string;
    amount: number;
    paid_by: string; // user_id
    created_at: string;
    splits?: FlatExpenseSplit[];
}

export interface FlatExpenseSplit {
    id: string;
    expense_id: string;
    user_id: string;
    amount: number;
}

export interface FlatSettlement {
    id: string;
    flat_id: string;
    from_user: string;
    to_user: string;
    amount: number;
    settled_at: string | null;
}

export interface FlatExpenseCreateRequest {
    flat_id: string;
    description: string;
    amount: number;
    paid_by: string;
    splits: { user_id: string; amount: number }[];
}

export interface FlatSettlementCreateRequest {
    flat_id: string;
    from_user: string;
    to_user: string;
    amount: number;
}
