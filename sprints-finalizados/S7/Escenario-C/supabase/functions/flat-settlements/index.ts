import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { withAuth, getUserId } from '../_shared/auth.ts';
import type { JWTPayload } from '../_shared/types.ts';

interface FlatMemberProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface SettlementInput {
  flat_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  settled_at?: string;
}

interface BalanceItem {
  user_id: string;
  amount: number;
}

interface SuggestedTransfer {
  from_user: string;
  to_user: string;
  amount: number;
}

interface AssignmentRow {
  assignee_id: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => Math.round(value) / 100;

async function getFlatOwner(flatId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('flats')
    .select('owner_id')
    .eq('id', flatId)
    .single();

  if (error || !data?.owner_id) return null;
  return data.owner_id as string;
}

async function getAcceptedAssignees(flatId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('room_assignments')
    .select('assignee_id, room:rooms!inner(flat_id)')
    .eq('status', 'accepted')
    .eq('room.flat_id', flatId);

  if (error || !data) return [];
  const ids = (data as AssignmentRow[])
    .map((item: AssignmentRow) => item.assignee_id)
    .filter((id: string): id is string => typeof id === 'string' && id.length > 0);

  return Array.from(new Set(ids));
}

async function getFlatMemberIds(flatId: string): Promise<string[] | null> {
  const ownerId = await getFlatOwner(flatId);
  if (!ownerId) return null;

  const assignees = await getAcceptedAssignees(flatId);
  return Array.from(new Set([ownerId, ...assignees]));
}

async function getFlatMembers(flatId: string): Promise<FlatMemberProfile[]> {
  const memberIds = await getFlatMemberIds(flatId);
  if (!memberIds || memberIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', memberIds);

  if (error || !data) return [];

  const profiles = data as ProfileRow[];
  const byId = new Map<string, FlatMemberProfile>(
    profiles.map((profile: ProfileRow) => [
      profile.id,
      {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
    ])
  );

  return memberIds
    .map((id) => byId.get(id))
    .filter((member): member is FlatMemberProfile => Boolean(member));
}

async function getFlatExpensesAndSplits(flatId: string) {
  const { data, error } = await supabaseAdmin
    .from('flat_expenses')
    .select(
      `
      id,
      paid_by,
      splits:flat_expense_splits(user_id, amount)
    `
    )
    .eq('flat_id', flatId);

  if (error) {
    throw new Error('No se pudieron obtener los gastos del piso');
  }

  return (data ?? []) as Array<{
    id: string;
    paid_by: string;
    splits: Array<{ user_id: string; amount: number }>;
  }>;
}

async function getSettlements(flatId: string) {
  const { data, error } = await supabaseAdmin
    .from('flat_settlements')
    .select(
      `
      *,
      from_profile:profiles!flat_settlements_from_user_fkey(id, display_name, avatar_url),
      to_profile:profiles!flat_settlements_to_user_fkey(id, display_name, avatar_url)
    `
    )
    .eq('flat_id', flatId)
    .order('settled_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error('No se pudieron obtener las liquidaciones');
  }

  return data ?? [];
}

function buildBalances(
  memberIds: string[],
  expenses: Array<{ paid_by: string; splits: Array<{ user_id: string; amount: number }> }>,
  settlements: Array<{ from_user: string; to_user: string; amount: number; settled_at: string | null }>
): BalanceItem[] {
  const centsByUser = new Map<string, number>();
  memberIds.forEach((id) => centsByUser.set(id, 0));

  expenses.forEach((expense) => {
    expense.splits.forEach((split) => {
      const splitCents = toCents(split.amount);
      centsByUser.set(split.user_id, (centsByUser.get(split.user_id) ?? 0) - splitCents);
      centsByUser.set(expense.paid_by, (centsByUser.get(expense.paid_by) ?? 0) + splitCents);
    });
  });

  settlements
    .filter((item) => item.settled_at !== null)
    .forEach((settlement) => {
      const amountCents = toCents(settlement.amount);
      centsByUser.set(
        settlement.from_user,
        (centsByUser.get(settlement.from_user) ?? 0) + amountCents
      );
      centsByUser.set(
        settlement.to_user,
        (centsByUser.get(settlement.to_user) ?? 0) - amountCents
      );
    });

  return Array.from(centsByUser.entries()).map(([user_id, amountCents]) => ({
    user_id,
    amount: fromCents(amountCents),
  }));
}

function buildSuggestedTransfers(balances: BalanceItem[]): SuggestedTransfer[] {
  const debtors = balances
    .filter((balance) => balance.amount < 0)
    .map((balance) => ({ user_id: balance.user_id, amountCents: toCents(-balance.amount) }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const creditors = balances
    .filter((balance) => balance.amount > 0)
    .map((balance) => ({ user_id: balance.user_id, amountCents: toCents(balance.amount) }))
    .sort((a, b) => b.amountCents - a.amountCents);

  const transfers: SuggestedTransfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.amountCents, creditor.amountCents);

    if (amountCents > 0) {
      transfers.push({
        from_user: debtor.user_id,
        to_user: creditor.user_id,
        amount: fromCents(amountCents),
      });
    }

    debtor.amountCents -= amountCents;
    creditor.amountCents -= amountCents;

    if (debtor.amountCents === 0) debtorIndex += 1;
    if (creditor.amountCents === 0) creditorIndex += 1;
  }

  return transfers;
}

function validateSettlementPayload(body: unknown): SettlementInput {
  const payload = body as Partial<SettlementInput>;

  if (!payload.flat_id || !payload.from_user || !payload.to_user || !payload.amount) {
    throw new Error('flat_id, from_user, to_user y amount son obligatorios');
  }

  if (payload.from_user === payload.to_user) {
    throw new Error('from_user y to_user no pueden ser el mismo usuario');
  }

  if (payload.amount <= 0) {
    throw new Error('amount debe ser mayor que 0');
  }

  return {
    flat_id: payload.flat_id,
    from_user: payload.from_user,
    to_user: payload.to_user,
    amount: payload.amount,
    settled_at: payload.settled_at,
  };
}

async function buildSummary(flatId: string) {
  const memberIds = await getFlatMemberIds(flatId);
  if (!memberIds) {
    throw new Error('FLAT_NOT_FOUND');
  }

  const [members, expenses, settlementsRaw] = await Promise.all([
    getFlatMembers(flatId),
    getFlatExpensesAndSplits(flatId),
    getSettlements(flatId),
  ]);

  const settlements = settlementsRaw as Array<{
    from_user: string;
    to_user: string;
    amount: number;
    settled_at: string | null;
  }>;

  const balances = buildBalances(memberIds, expenses, settlements);
  const suggestedTransfers = buildSuggestedTransfers(balances);

  return {
    flat_id: flatId,
    members,
    balances,
    suggested_transfers: suggestedTransfers,
    settlements: settlementsRaw,
  };
}

serve(
  withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const userId = getUserId(payload);
    const url = new URL(req.url);

    if (req.method === 'GET') {
      const flatId = url.searchParams.get('flat_id');
      if (!flatId) {
        return jsonResponse(400, { error: 'flat_id is required' });
      }

      const memberIds = await getFlatMemberIds(flatId);
      if (!memberIds) {
        return jsonResponse(404, { error: 'Flat not found' });
      }
      if (!memberIds.includes(userId)) {
        return jsonResponse(403, { error: 'Unauthorized' });
      }

      try {
        const summary = await buildSummary(flatId);
        return jsonResponse(200, { data: summary });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno';
        return jsonResponse(500, { error: message });
      }
    }

    if (req.method === 'POST') {
      let input: SettlementInput;
      try {
        input = validateSettlementPayload(await req.json());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Payload invalido';
        return jsonResponse(400, { error: message });
      }

      const memberIds = await getFlatMemberIds(input.flat_id);
      if (!memberIds) {
        return jsonResponse(404, { error: 'Flat not found' });
      }
      if (!memberIds.includes(userId)) {
        return jsonResponse(403, { error: 'Unauthorized' });
      }
      if (!memberIds.includes(input.from_user) || !memberIds.includes(input.to_user)) {
        return jsonResponse(400, { error: 'from_user and to_user must be flat members' });
      }

      const { error: insertError } = await supabaseAdmin
        .from('flat_settlements')
        .insert({
          flat_id: input.flat_id,
          from_user: input.from_user,
          to_user: input.to_user,
          amount: input.amount,
          settled_at: input.settled_at ?? new Date().toISOString(),
        });

      if (insertError) {
        return jsonResponse(500, { error: 'No se pudo registrar la liquidacion' });
      }

      try {
        const summary = await buildSummary(input.flat_id);
        return jsonResponse(201, { data: summary });
      } catch (summaryError) {
        const message =
          summaryError instanceof Error ? summaryError.message : 'Error al calcular resumen';
        return jsonResponse(500, { error: message });
      }
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  })
);
