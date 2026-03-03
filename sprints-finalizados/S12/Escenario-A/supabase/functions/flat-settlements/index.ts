import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { getUserId, withAuth } from '../_shared/auth.ts';
import type { JWTPayload } from '../_shared/types.ts';

type FlatMember = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ExpenseRow = {
  id: string;
  amount: number;
  paid_by: string;
};

type SplitRow = {
  expense_id: string;
  user_id: string;
  amount: number;
};

type SettledRow = {
  id: string;
  flat_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at: string | null;
};

type SettlementBody = {
  flat_id?: string;
  from_user?: string;
  to_user?: string;
  amount?: number;
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (amountCents: number) => amountCents / 100;

async function getFlatOwnerId(flatId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('flats')
    .select('owner_id')
    .eq('id', flatId)
    .single();

  if (error || !data?.owner_id) return null;
  return data.owner_id as string;
}

async function getFlatMemberIds(flatId: string): Promise<string[]> {
  const ownerId = await getFlatOwnerId(flatId);
  if (!ownerId) return [];

  const memberIds = new Set<string>([ownerId]);
  const { data: rooms } = await supabaseAdmin
    .from('rooms')
    .select('id')
    .eq('flat_id', flatId);

  const roomIds = (rooms ?? []).map((room) => room.id as string);
  if (roomIds.length > 0) {
    const { data: assignments } = await supabaseAdmin
      .from('room_assignments')
      .select('assignee_id')
      .eq('status', 'accepted')
      .in('room_id', roomIds);

    (assignments ?? []).forEach((assignment) => {
      if (assignment.assignee_id) {
        memberIds.add(assignment.assignee_id as string);
      }
    });
  }

  return Array.from(memberIds);
}

async function getFlatMembers(flatId: string): Promise<FlatMember[]> {
  const memberIds = await getFlatMemberIds(flatId);
  if (memberIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', memberIds);

  if (error || !data) return [];
  return data as FlatMember[];
}

async function ensureIsFlatMember(flatId: string, userId: string): Promise<boolean> {
  const memberIds = await getFlatMemberIds(flatId);
  return memberIds.includes(userId);
}

function calculateBalances(
  memberIds: string[],
  expenses: ExpenseRow[],
  splits: SplitRow[],
  settled: SettledRow[]
) {
  const balances = new Map<string, number>();
  memberIds.forEach((memberId) => balances.set(memberId, 0));

  const addDelta = (userId: string, deltaCents: number) => {
    balances.set(userId, (balances.get(userId) ?? 0) + deltaCents);
  };

  const splitByExpense = new Map<string, SplitRow[]>();
  splits.forEach((split) => {
    if (!splitByExpense.has(split.expense_id)) {
      splitByExpense.set(split.expense_id, []);
    }
    splitByExpense.get(split.expense_id)?.push(split);
  });

  expenses.forEach((expense) => {
    addDelta(expense.paid_by, toCents(expense.amount));
    const expenseSplits = splitByExpense.get(expense.id) ?? [];
    expenseSplits.forEach((split) => {
      addDelta(split.user_id, -toCents(split.amount));
    });
  });

  settled.forEach((entry) => {
    addDelta(entry.from_user, toCents(entry.amount));
    addDelta(entry.to_user, -toCents(entry.amount));
  });

  return balances;
}

function buildGreedySettlements(balances: Map<string, number>) {
  const debtors = Array.from(balances.entries())
    .filter(([, value]) => value < 0)
    .map(([userId, value]) => ({ userId, amountCents: Math.abs(value) }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const creditors = Array.from(balances.entries())
    .filter(([, value]) => value > 0)
    .map(([userId, value]) => ({ userId, amountCents: value }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const settlements: Array<{ from_user: string; to_user: string; amount: number }> = [];
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

serve(
  withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const userId = getUserId(payload);
    const url = new URL(req.url);
    const flatId = url.searchParams.get('flat_id');

    if (req.method === 'GET') {
      if (!flatId) {
        return jsonResponse(400, { error: 'flat_id es obligatorio' });
      }

      const isMember = await ensureIsFlatMember(flatId, userId);
      if (!isMember) {
        return jsonResponse(403, { error: 'Solo miembros del piso pueden ver liquidaciones' });
      }

      const memberIds = await getFlatMemberIds(flatId);
      const members = await getFlatMembers(flatId);

      const { data: expenses, error: expensesError } = await supabaseAdmin
        .from('flat_expenses')
        .select('id, amount, paid_by')
        .eq('flat_id', flatId);

      if (expensesError) {
        console.error('[flat-settlements][GET] Error fetching expenses:', expensesError);
        return jsonResponse(500, { error: 'No se pudieron obtener los gastos del piso' });
      }

      const expenseIds = (expenses ?? []).map((expense) => expense.id as string);
      let splits: SplitRow[] = [];
      if (expenseIds.length > 0) {
        const { data: splitRows, error: splitError } = await supabaseAdmin
          .from('flat_expense_splits')
          .select('expense_id, user_id, amount')
          .in('expense_id', expenseIds);

        if (splitError) {
          console.error('[flat-settlements][GET] Error fetching splits:', splitError);
          return jsonResponse(500, { error: 'No se pudieron obtener los splits del piso' });
        }
        splits = (splitRows ?? []) as SplitRow[];
      }

      const { data: settledRows, error: settledError } = await supabaseAdmin
        .from('flat_settlements')
        .select('id, flat_id, from_user, to_user, amount, settled_at')
        .eq('flat_id', flatId)
        .not('settled_at', 'is', null);

      if (settledError) {
        console.error('[flat-settlements][GET] Error fetching settled rows:', settledError);
        return jsonResponse(500, { error: 'No se pudieron obtener liquidaciones saldadas' });
      }

      const balances = calculateBalances(
        memberIds,
        (expenses ?? []) as ExpenseRow[],
        splits,
        (settledRows ?? []) as SettledRow[]
      );

      const settlements = buildGreedySettlements(balances);
      const balancesObject = Object.fromEntries(
        Array.from(balances.entries()).map(([memberId, value]) => [memberId, fromCents(value)])
      );

      return jsonResponse(200, {
        data: {
          settlements,
          members,
          balances: balancesObject,
          settled: settledRows ?? [],
        },
      });
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as SettlementBody;
      const nextFlatId = body.flat_id?.trim();
      const fromUser = body.from_user?.trim();
      const toUser = body.to_user?.trim();
      const amount = Number(body.amount ?? 0);

      if (!nextFlatId || !fromUser || !toUser || !Number.isFinite(amount) || amount <= 0) {
        return jsonResponse(400, {
          error: 'flat_id, from_user, to_user y amount son obligatorios',
        });
      }

      const memberIds = await getFlatMemberIds(nextFlatId);
      const ownerId = await getFlatOwnerId(nextFlatId);
      if (!memberIds.includes(userId)) {
        return jsonResponse(403, { error: 'Solo miembros del piso pueden registrar saldos' });
      }
      if (!memberIds.includes(fromUser) || !memberIds.includes(toUser)) {
        return jsonResponse(400, { error: 'from_user y to_user deben ser miembros del piso' });
      }
      const canSettle = userId === fromUser || userId === toUser || userId === ownerId;
      if (!canSettle) {
        return jsonResponse(403, {
          error: 'Solo deudor, acreedor u owner pueden marcar una deuda como saldada',
        });
      }

      const { data, error } = await supabaseAdmin
        .from('flat_settlements')
        .insert({
          flat_id: nextFlatId,
          from_user: fromUser,
          to_user: toUser,
          amount: Number(amount.toFixed(2)),
          settled_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error || !data) {
        console.error('[flat-settlements][POST] Error creating settled row:', error);
        return jsonResponse(500, { error: 'No se pudo marcar la deuda como saldada' });
      }

      return jsonResponse(201, { data });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  })
);
