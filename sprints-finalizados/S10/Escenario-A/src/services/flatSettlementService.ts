import { supabase } from '../lib/supabase';
import type {
  FlatExpense,
  FlatSettlement,
  FlatSettlementsPayload,
  SettledFlatSettlement,
} from '../types/flatExpense';

type EdgePayload<T> = {
  data?: T;
  error?: string;
};

const unwrapData = <T>(payload: unknown): T => {
  const parsed = payload as EdgePayload<T> | T;
  return (parsed as EdgePayload<T>).data ?? (parsed as T);
};

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (amountCents: number) => amountCents / 100;

const toError = (message: string, fallback: string) =>
  new Error(message || fallback);

type SettledInput = Pick<
  SettledFlatSettlement,
  'flat_id' | 'from_user' | 'to_user' | 'amount'
>;

class FlatSettlementService {
  calculateNetBalances(
    expenses: FlatExpense[],
    settled: Array<Pick<SettledFlatSettlement, 'from_user' | 'to_user' | 'amount'>> = []
  ): Record<string, number> {
    const balancesInCents = new Map<string, number>();

    const addDelta = (userId: string, deltaCents: number) => {
      balancesInCents.set(userId, (balancesInCents.get(userId) ?? 0) + deltaCents);
    };

    expenses.forEach((expense) => {
      const totalCents = toCents(expense.amount);
      addDelta(expense.paid_by, totalCents);

      expense.splits.forEach((split) => {
        addDelta(split.user_id, -toCents(split.amount));
      });
    });

    settled.forEach((item) => {
      const amountCents = toCents(item.amount);
      addDelta(item.from_user, amountCents);
      addDelta(item.to_user, -amountCents);
    });

    const result: Record<string, number> = {};
    balancesInCents.forEach((value, key) => {
      result[key] = fromCents(value);
    });

    return result;
  }

  generateMinimalSettlements(balances: Record<string, number>): FlatSettlement[] {
    const debtors = Object.entries(balances)
      .filter(([, amount]) => amount < 0)
      .map(([userId, amount]) => ({ userId, amountCents: Math.abs(toCents(amount)) }))
      .sort((a, b) => b.amountCents - a.amountCents);

    const creditors = Object.entries(balances)
      .filter(([, amount]) => amount > 0)
      .map(([userId, amount]) => ({ userId, amountCents: toCents(amount) }))
      .sort((a, b) => b.amountCents - a.amountCents);

    const settlements: FlatSettlement[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amountCents = Math.min(debtor.amountCents, creditor.amountCents);

      if (amountCents > 0) {
        settlements.push({
          from_user: debtor.userId,
          to_user: creditor.userId,
          amount: fromCents(amountCents),
        });
      }

      debtor.amountCents -= amountCents;
      creditor.amountCents -= amountCents;

      if (debtor.amountCents === 0) debtorIndex += 1;
      if (creditor.amountCents === 0) creditorIndex += 1;
    }

    return settlements;
  }

  async getPendingSettlements(flatId: string): Promise<FlatSettlementsPayload> {
    const { data, error } = await supabase.functions.invoke(
      `flat-settlements?flat_id=${encodeURIComponent(flatId)}`,
      { method: 'GET' }
    );

    if (error) {
      throw toError(error.message, 'Error al calcular liquidaciones');
    }

    const payload = unwrapData<FlatSettlementsPayload>(data);
    return {
      settlements: payload.settlements ?? [],
      members: payload.members ?? [],
      balances: payload.balances ?? {},
      settled: payload.settled ?? [],
    };
  }

  async markSettlementAsSettled(input: SettledInput): Promise<SettledFlatSettlement> {
    const { data, error } = await supabase.functions.invoke('flat-settlements', {
      method: 'POST',
      body: input,
    });

    if (error) {
      throw toError(error.message, 'Error al marcar liquidacion como saldada');
    }

    return unwrapData<SettledFlatSettlement>(data);
  }
}

export const flatSettlementService = new FlatSettlementService();
