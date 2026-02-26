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

type FlatSummary = {
  id: string;
  owner_id: string;
  address: string | null;
  city: string | null;
  district: string | null;
};

type SplitInput = {
  user_id: string;
  amount: number;
};

type ExpenseBody = {
  flat_id?: string;
  description?: string;
  amount?: number;
  paid_by?: string;
  split_type?: 'equal' | 'custom';
  split_between?: string[];
  custom_splits?: SplitInput[];
};

type ExpenseRow = {
  id: string;
  flat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
};

type ExpenseSplitRow = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (amountCents: number) => amountCents / 100;

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

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

async function getMemberFlatIds(userId: string): Promise<string[]> {
  const memberIds = new Set<string>();

  const { data: ownedFlats } = await supabaseAdmin
    .from('flats')
    .select('id')
    .eq('owner_id', userId);
  (ownedFlats ?? []).forEach((flat) => {
    if (flat.id) memberIds.add(flat.id as string);
  });

  const { data: acceptedAssignments } = await supabaseAdmin
    .from('room_assignments')
    .select('room_id')
    .eq('assignee_id', userId)
    .eq('status', 'accepted');

  const roomIds = (acceptedAssignments ?? [])
    .map((row) => row.room_id as string)
    .filter(Boolean);

  if (roomIds.length > 0) {
    const { data: rooms } = await supabaseAdmin
      .from('rooms')
      .select('flat_id')
      .in('id', roomIds);
    (rooms ?? []).forEach((room) => {
      if (room.flat_id) memberIds.add(room.flat_id as string);
    });
  }

  return Array.from(memberIds);
}

async function getMemberFlats(userId: string): Promise<FlatSummary[]> {
  const flatIds = await getMemberFlatIds(userId);
  if (flatIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('flats')
    .select('id, owner_id, address, city, district')
    .in('id', flatIds)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as FlatSummary[];
}

async function ensureIsFlatMember(flatId: string, userId: string): Promise<boolean> {
  const memberIds = await getFlatMemberIds(flatId);
  return memberIds.includes(userId);
}

const buildEqualSplits = (totalAmount: number, splitBetween: string[]) => {
  const totalCents = toCents(totalAmount);
  const memberCount = splitBetween.length;
  const baseShare = Math.floor(totalCents / memberCount);
  let remainder = totalCents - baseShare * memberCount;

  return splitBetween.map((userId) => {
    const next = baseShare + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return {
      user_id: userId,
      amount: fromCents(next),
    };
  });
};

function buildCustomSplits(
  totalAmount: number,
  splitBetween: string[],
  customSplits: SplitInput[]
) {
  const splitMap = new Map(customSplits.map((split) => [split.user_id, split.amount]));
  const prepared = splitBetween.map((userId) => ({
    user_id: userId,
    amount: Number(splitMap.get(userId) ?? 0),
  }));

  const invalid = prepared.some((split) => !Number.isFinite(split.amount) || split.amount <= 0);
  if (invalid) {
    throw new Error('Los importes personalizados deben ser mayores que 0');
  }

  const totalCustomCents = prepared.reduce((sum, split) => sum + toCents(split.amount), 0);
  if (Math.abs(totalCustomCents - toCents(totalAmount)) > 1) {
    throw new Error('Los importes personalizados no suman el total del gasto');
  }

  return prepared.map((split) => ({
    ...split,
    amount: Number(split.amount.toFixed(2)),
  }));
}

async function getProfileMap(userIds: string[]): Promise<Map<string, FlatMember>> {
  const unique = uniqueIds(userIds.filter(Boolean));
  if (unique.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', unique);

  if (error || !data) return new Map();

  return new Map((data as FlatMember[]).map((profile) => [profile.id, profile]));
}

async function getSplitsByExpense(expenseIds: string[]): Promise<Map<string, ExpenseSplitRow[]>> {
  if (expenseIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('flat_expense_splits')
    .select('id, expense_id, user_id, amount')
    .in('expense_id', expenseIds);

  if (error || !data) return new Map();

  const map = new Map<string, ExpenseSplitRow[]>();
  (data as ExpenseSplitRow[]).forEach((split) => {
    const current = map.get(split.expense_id) ?? [];
    current.push(split);
    map.set(split.expense_id, current);
  });
  return map;
}

async function hydrateExpenses(expenses: ExpenseRow[]) {
  const expenseIds = expenses.map((expense) => expense.id);
  const splitsByExpense = await getSplitsByExpense(expenseIds);

  const relatedUserIds: string[] = [];
  expenses.forEach((expense) => {
    relatedUserIds.push(expense.paid_by);
    (splitsByExpense.get(expense.id) ?? []).forEach((split) => {
      relatedUserIds.push(split.user_id);
    });
  });

  const profileMap = await getProfileMap(relatedUserIds);

  return expenses.map((expense) => {
    const splits = (splitsByExpense.get(expense.id) ?? []).map((split) => ({
      id: split.id,
      expense_id: split.expense_id,
      user_id: split.user_id,
      amount: Number(split.amount),
      user: profileMap.get(split.user_id) ?? null,
    }));

    return {
      id: expense.id,
      flat_id: expense.flat_id,
      description: expense.description,
      amount: Number(expense.amount),
      paid_by: expense.paid_by,
      split_between: uniqueIds(splits.map((split) => split.user_id)),
      created_at: expense.created_at,
      paid_by_user: profileMap.get(expense.paid_by) ?? null,
      splits,
    };
  });
}

async function fetchExpenseWithRelations(expenseId: string) {
  const { data, error } = await supabaseAdmin
    .from('flat_expenses')
    .select('id, flat_id, description, amount, paid_by, created_at')
    .eq('id', expenseId)
    .single();

  if (error || !data) return null;
  const hydrated = await hydrateExpenses([data as ExpenseRow]);
  return hydrated[0] ?? null;
}

serve(
  withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const userId = getUserId(payload);
    const url = new URL(req.url);
    const flatId = url.searchParams.get('flat_id');
    const expenseId = url.searchParams.get('expense_id');
    const scope = url.searchParams.get('scope');

    if (req.method === 'GET') {
      if (scope === 'my_flats') {
        const flats = await getMemberFlats(userId);
        return jsonResponse(200, { data: { flats } });
      }

      if (!flatId) {
        return jsonResponse(400, { error: 'flat_id es obligatorio' });
      }

      const isMember = await ensureIsFlatMember(flatId, userId);
      if (!isMember) {
        return jsonResponse(403, { error: 'Solo miembros del piso pueden ver gastos' });
      }

      const { data, error } = await supabaseAdmin
        .from('flat_expenses')
        .select('id, flat_id, description, amount, paid_by, created_at')
        .eq('flat_id', flatId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[flat-expenses][GET] Error fetching expenses:', error);
        return jsonResponse(500, {
          error: 'No se pudieron obtener los gastos',
          details: error.message,
        });
      }

      const members = await getFlatMembers(flatId);
      const hydratedExpenses = await hydrateExpenses((data ?? []) as ExpenseRow[]);
      return jsonResponse(200, {
        data: {
          expenses: hydratedExpenses,
          members,
        },
      });
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as ExpenseBody;
      const nextFlatId = body.flat_id?.trim();
      const description = body.description?.trim();
      const amount = Number(body.amount ?? 0);
      const paidBy = body.paid_by?.trim();
      const splitBetween = uniqueIds((body.split_between ?? []).filter(Boolean));
      const splitType = body.split_type === 'custom' ? 'custom' : 'equal';
      const customSplits = body.custom_splits ?? [];

      if (!nextFlatId || !description || !paidBy || !Number.isFinite(amount) || amount <= 0) {
        return jsonResponse(400, { error: 'flat_id, description, amount y paid_by son obligatorios' });
      }
      if (splitBetween.length === 0) {
        return jsonResponse(400, { error: 'split_between debe incluir al menos un miembro' });
      }

      const memberIds = await getFlatMemberIds(nextFlatId);
      if (!memberIds.includes(userId)) {
        return jsonResponse(403, { error: 'Solo miembros del piso pueden crear gastos' });
      }
      if (!memberIds.includes(paidBy)) {
        return jsonResponse(400, { error: 'paid_by debe ser miembro del piso' });
      }
      if (splitBetween.some((memberId) => !memberIds.includes(memberId))) {
        return jsonResponse(400, { error: 'split_between contiene usuarios no miembros del piso' });
      }

      let splits: SplitInput[] = [];
      try {
        splits =
          splitType === 'custom'
            ? buildCustomSplits(amount, splitBetween, customSplits)
            : buildEqualSplits(amount, splitBetween);
      } catch (error) {
        return jsonResponse(400, {
          error: error instanceof Error ? error.message : 'Error en reparto de gasto',
        });
      }

      const { data: createdExpense, error: createExpenseError } = await supabaseAdmin
        .from('flat_expenses')
        .insert({
          flat_id: nextFlatId,
          description,
          amount: Number(amount.toFixed(2)),
          paid_by: paidBy,
        })
        .select('id')
        .single();

      if (createExpenseError || !createdExpense) {
        console.error('[flat-expenses][POST] Error creating expense:', createExpenseError);
        return jsonResponse(500, { error: 'No se pudo crear el gasto' });
      }

      const { error: splitError } = await supabaseAdmin.from('flat_expense_splits').insert(
        splits.map((split) => ({
          expense_id: createdExpense.id as string,
          user_id: split.user_id,
          amount: split.amount,
        }))
      );

      if (splitError) {
        console.error('[flat-expenses][POST] Error creating splits:', splitError);
        await supabaseAdmin.from('flat_expenses').delete().eq('id', createdExpense.id);
        return jsonResponse(500, { error: 'No se pudieron guardar los splits del gasto' });
      }

      const hydrated = await fetchExpenseWithRelations(createdExpense.id as string);
      if (!hydrated) {
        return jsonResponse(201, {
          data: {
            id: createdExpense.id,
            flat_id: nextFlatId,
            description,
            amount: Number(amount.toFixed(2)),
            paid_by: paidBy,
            split_between: splitBetween,
            created_at: new Date().toISOString(),
            splits,
          },
        });
      }

      return jsonResponse(201, { data: hydrated });
    }

    if (req.method === 'PATCH') {
      if (!expenseId) {
        return jsonResponse(400, { error: 'expense_id es obligatorio' });
      }

      const current = await fetchExpenseWithRelations(expenseId);
      if (!current) {
        return jsonResponse(404, { error: 'Gasto no encontrado' });
      }

      const ownerId = await getFlatOwnerId(current.flat_id);
      const isOwner = ownerId === userId;
      const isPayer = current.paid_by === userId;
      const isMember = await ensureIsFlatMember(current.flat_id, userId);
      if (!isMember) {
        return jsonResponse(403, { error: 'Solo miembros del piso pueden editar gastos' });
      }
      if (!isOwner && !isPayer) {
        return jsonResponse(403, { error: 'Solo el pagador u owner pueden editar este gasto' });
      }

      const body = (await req.json()) as ExpenseBody;
      const description = body.description?.trim() ?? current.description;
      const amount = Number(body.amount ?? current.amount);
      const paidBy = body.paid_by?.trim() ?? current.paid_by;
      const existingSplitUsers = (current.splits ?? []).map((split) => split.user_id);
      const keepCurrentSplits =
        body.split_type === undefined &&
        body.split_between === undefined &&
        body.custom_splits === undefined &&
        body.amount === undefined;
      const splitBetween = uniqueIds(body.split_between ?? existingSplitUsers);
      const splitType =
        body.split_type === 'custom' || body.custom_splits !== undefined
          ? 'custom'
          : 'equal';
      const customSplits = (
        body.custom_splits ??
        (current.splits ?? []).map((split) => ({
          user_id: split.user_id,
          amount: Number(split.amount),
        }))
      ) as SplitInput[];

      if (!description || !Number.isFinite(amount) || amount <= 0 || !paidBy) {
        return jsonResponse(400, { error: 'Datos invalidos para actualizar el gasto' });
      }
      if (splitBetween.length === 0) {
        return jsonResponse(400, { error: 'split_between debe incluir al menos un miembro' });
      }

      const memberIds = await getFlatMemberIds(current.flat_id);
      if (!memberIds.includes(paidBy)) {
        return jsonResponse(400, { error: 'paid_by debe ser miembro del piso' });
      }
      if (splitBetween.some((memberId) => !memberIds.includes(memberId))) {
        return jsonResponse(400, { error: 'split_between contiene usuarios no miembros del piso' });
      }

      let splits: SplitInput[] = [];
      if (keepCurrentSplits) {
        splits = (current.splits ?? []).map((split) => ({
          user_id: split.user_id,
          amount: Number(split.amount),
        }));
      } else {
        try {
          splits =
            splitType === 'custom'
              ? buildCustomSplits(amount, splitBetween, customSplits)
              : buildEqualSplits(amount, splitBetween);
        } catch (error) {
          return jsonResponse(400, {
            error: error instanceof Error ? error.message : 'Error en reparto del gasto',
          });
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('flat_expenses')
        .update({
          description,
          amount: Number(amount.toFixed(2)),
          paid_by: paidBy,
        })
        .eq('id', expenseId);

      if (updateError) {
        console.error('[flat-expenses][PATCH] Error updating expense:', updateError);
        return jsonResponse(500, { error: 'No se pudo actualizar el gasto' });
      }

      const { error: deleteSplitsError } = await supabaseAdmin
        .from('flat_expense_splits')
        .delete()
        .eq('expense_id', expenseId);

      if (deleteSplitsError) {
        console.error('[flat-expenses][PATCH] Error replacing splits:', deleteSplitsError);
        return jsonResponse(500, { error: 'No se pudieron actualizar los splits del gasto' });
      }

      const { error: insertSplitsError } = await supabaseAdmin.from('flat_expense_splits').insert(
        splits.map((split) => ({
          expense_id: expenseId,
          user_id: split.user_id,
          amount: split.amount,
        }))
      );

      if (insertSplitsError) {
        console.error('[flat-expenses][PATCH] Error inserting splits:', insertSplitsError);
        return jsonResponse(500, { error: 'No se pudieron guardar los nuevos splits' });
      }

      const hydrated = await fetchExpenseWithRelations(expenseId);
      if (!hydrated) {
        return jsonResponse(200, { message: 'Gasto actualizado' });
      }
      return jsonResponse(200, { data: hydrated });
    }

    if (req.method === 'DELETE') {
      if (!expenseId) {
        return jsonResponse(400, { error: 'expense_id es obligatorio' });
      }

      const current = await fetchExpenseWithRelations(expenseId);
      if (!current) {
        return jsonResponse(404, { error: 'Gasto no encontrado' });
      }

      const ownerId = await getFlatOwnerId(current.flat_id);
      const isMember = await ensureIsFlatMember(current.flat_id, userId);
      if (!isMember) {
        return jsonResponse(403, { error: 'Solo miembros del piso pueden eliminar gastos' });
      }
      if (current.paid_by !== userId && ownerId !== userId) {
        return jsonResponse(403, { error: 'Solo el pagador u owner pueden eliminar este gasto' });
      }

      const { error: deleteSplitsError } = await supabaseAdmin
        .from('flat_expense_splits')
        .delete()
        .eq('expense_id', expenseId);

      if (deleteSplitsError) {
        console.error('[flat-expenses][DELETE] Error deleting splits:', deleteSplitsError);
        return jsonResponse(500, { error: 'No se pudieron eliminar los splits del gasto' });
      }

      const { error: deleteExpenseError } = await supabaseAdmin
        .from('flat_expenses')
        .delete()
        .eq('id', expenseId);

      if (deleteExpenseError) {
        console.error('[flat-expenses][DELETE] Error deleting expense:', deleteExpenseError);
        return jsonResponse(500, { error: 'No se pudo eliminar el gasto' });
      }

      return jsonResponse(200, { message: 'Gasto eliminado' });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  })
);
