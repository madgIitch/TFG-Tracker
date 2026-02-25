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

interface ExpenseSplitInput {
  user_id: string;
  amount: number;
}

interface ExpenseInput {
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  splits: ExpenseSplitInput[];
}

interface AssignmentRow {
  assignee_id: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ExpenseRow {
  id: string;
}

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const toCents = (value: number) => Math.round(value * 100);

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

async function createExpense(input: ExpenseInput) {
  const { data: expense, error: expenseError } = await supabaseAdmin
    .from('flat_expenses')
    .insert({
      flat_id: input.flat_id,
      description: input.description,
      amount: input.amount,
      paid_by: input.paid_by,
    })
    .select('*')
    .single();

  if (expenseError || !expense) {
    throw new Error('No se pudo crear el gasto');
  }

  const splitsToInsert = input.splits.map((split) => ({
    expense_id: expense.id,
    user_id: split.user_id,
    amount: split.amount,
  }));

  const { error: splitError } = await supabaseAdmin
    .from('flat_expense_splits')
    .insert(splitsToInsert);

  if (splitError) {
    await supabaseAdmin.from('flat_expenses').delete().eq('id', expense.id);
    throw new Error('No se pudieron crear los repartos del gasto');
  }

  return expense.id as string;
}

async function getExpensesForFlat(flatId: string) {
  const { data, error } = await supabaseAdmin
    .from('flat_expenses')
    .select(
      `
      *,
      payer:profiles!flat_expenses_paid_by_fkey(id, display_name, avatar_url),
      splits:flat_expense_splits(
        id,
        user_id,
        amount,
        user:profiles!flat_expense_splits_user_id_fkey(id, display_name, avatar_url)
      )
    `
    )
    .eq('flat_id', flatId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('No se pudieron obtener los gastos');
  }

  return data ?? [];
}

function validateExpensePayload(body: unknown): ExpenseInput {
  const payload = body as Partial<ExpenseInput>;

  const description = payload.description?.trim() ?? '';
  if (!payload.flat_id || !description || !payload.paid_by || !payload.amount) {
    throw new Error('flat_id, description, amount, paid_by y splits son obligatorios');
  }

  if (!Array.isArray(payload.splits) || payload.splits.length === 0) {
    throw new Error('Debes indicar al menos un participante en el reparto');
  }

  if (payload.amount <= 0) {
    throw new Error('El importe del gasto debe ser mayor que 0');
  }

  const splitUsers = new Set<string>();
  for (const split of payload.splits) {
    if (!split?.user_id || typeof split.amount !== 'number' || split.amount <= 0) {
      throw new Error('Cada reparto debe incluir user_id y amount > 0');
    }
    if (splitUsers.has(split.user_id)) {
      throw new Error('No se permiten usuarios repetidos en los repartos');
    }
    splitUsers.add(split.user_id);
  }

  const amountCents = toCents(payload.amount);
  const splitsTotalCents = payload.splits.reduce((acc, item) => acc + toCents(item.amount), 0);

  if (amountCents !== splitsTotalCents) {
    throw new Error('La suma de repartos debe coincidir con el importe del gasto');
  }

  return {
    flat_id: payload.flat_id,
    description,
    amount: payload.amount,
    paid_by: payload.paid_by,
    splits: payload.splits,
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
        const [expenses, members] = await Promise.all([
          getExpensesForFlat(flatId),
          getFlatMembers(flatId),
        ]);

        return jsonResponse(200, {
          data: {
            flat_id: flatId,
            members,
            expenses,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno';
        return jsonResponse(500, { error: message });
      }
    }

    if (req.method === 'POST') {
      let input: ExpenseInput;
      try {
        input = validateExpensePayload(await req.json());
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

      if (!memberIds.includes(input.paid_by)) {
        return jsonResponse(400, { error: 'paid_by must be a flat member' });
      }

      const invalidSplit = input.splits.find((split) => !memberIds.includes(split.user_id));
      if (invalidSplit) {
        return jsonResponse(400, { error: 'All split users must belong to the flat' });
      }

      try {
        const createdExpenseId = await createExpense(input);
        const [expenses, members] = await Promise.all([
          getExpensesForFlat(input.flat_id),
          getFlatMembers(input.flat_id),
        ]);

        const createdExpense =
          (expenses as ExpenseRow[]).find((item: ExpenseRow) => item.id === createdExpenseId) ??
          null;

        return jsonResponse(201, {
          data: {
            flat_id: input.flat_id,
            members,
            expense: createdExpense,
            expenses,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error interno';
        return jsonResponse(500, { error: message });
      }
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  })
);
