// supabase/functions/flat-expenses/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withAuth, getUserId } from '../_shared/auth.ts'
import { JWTPayload, ApiResponse } from '../_shared/types.ts'

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ExpenseSplitRow {
  id: string
  expense_id: string
  user_id: string
  amount: number
  profiles?: { display_name?: string | null } | null
}

interface ExpenseRow {
  id: string
  flat_id: string
  description: string
  amount: number
  paid_by: string
  created_at: string
  flat_expense_splits?: ExpenseSplitRow[]
  payer?: { display_name?: string | null } | null
}

interface FlatMember {
  id: string
  display_name: string | null
  avatar_url: string | null
}

/**
 * Devuelve los room_ids del piso (paso auxiliar reutilizable)
 */
async function getRoomIdsForFlat(flatId: string): Promise<string[]> {
  const { data } = await supabaseClient
    .from('rooms')
    .select('id')
    .eq('flat_id', flatId)
  return (data ?? []).map((r: any) => r.id as string)
}

/**
 * Verifica que el usuario autenticado es miembro del piso (propietario o inquilino asignado)
 */
async function assertFlatMember(flatId: string, userId: string): Promise<void> {
  // Comprobar si es el propietario
  const { data: flat } = await supabaseClient
    .from('flats')
    .select('owner_id')
    .eq('id', flatId)
    .single()

  if (flat && flat.owner_id === userId) return

  // Obtener los IDs de habitaciones del piso primero
  const roomIds = await getRoomIdsForFlat(flatId)

  if (roomIds.length === 0) {
    throw new Error('Forbidden: You are not a member of this flat')
  }

  // Comprobar si tiene asignación aceptada en alguna habitación del piso
  const { data: assignment } = await supabaseClient
    .from('room_assignments')
    .select('id')
    .eq('assignee_id', userId)
    .eq('status', 'accepted')
    .in('room_id', roomIds)
    .limit(1)
    .maybeSingle()

  if (!assignment) {
    throw new Error('Forbidden: You are not a member of this flat')
  }
}

/**
 * Obtiene los miembros del piso: propietario + inquilinos con asignación aceptada
 */
async function getFlatMembers(flatId: string): Promise<FlatMember[]> {
  // 1. Obtener owner_id del piso
  const { data: flat, error: flatError } = await supabaseClient
    .from('flats')
    .select('owner_id')
    .eq('id', flatId)
    .single()

  if (flatError || !flat) throw new Error('Flat not found')

  const memberIds = new Set<string>([flat.owner_id])

  // 2. Obtener habitaciones del piso y luego sus inquilinos aceptados
  const roomIds = await getRoomIdsForFlat(flatId)

  if (roomIds.length > 0) {
    const { data: assignments } = await supabaseClient
      .from('room_assignments')
      .select('assignee_id')
      .in('room_id', roomIds)
      .eq('status', 'accepted')

    for (const a of assignments ?? []) {
      memberIds.add(a.assignee_id)
    }
  }

  // 3. Obtener perfiles de todos los miembros en una sola query
  const { data: profiles } = await supabaseClient
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', Array.from(memberIds))

  return (profiles ?? []).map((p: any) => ({
    id: p.id as string,
    display_name: (p.display_name ?? null) as string | null,
    avatar_url: (p.avatar_url ?? null) as string | null,
  }))
}

/**
 * Lista los gastos del piso con sus splits
 */
async function getExpenses(flatId: string): Promise<ExpenseRow[]> {
  const { data, error } = await supabaseClient
    .from('flat_expenses')
    .select(`
      *,
      flat_expense_splits(
        id,
        expense_id,
        user_id,
        amount,
        profiles:profiles!flat_expense_splits_user_id_fkey(display_name)
      ),
      payer:profiles!flat_expenses_paid_by_fkey(display_name)
    `)
    .eq('flat_id', flatId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`)

  return (data ?? []).map((row: any) => ({
    ...row,
    payer_name: row.payer?.display_name ?? null,
    splits: (row.flat_expense_splits ?? []).map((s: any) => ({
      id: s.id,
      expense_id: s.expense_id,
      user_id: s.user_id,
      amount: Number(s.amount),
      user_name: s.profiles?.display_name ?? null,
    })),
  }))
}

/**
 * Crea un gasto con sus splits (iguales o personalizados)
 */
async function createExpense(body: {
  flat_id: string
  description: string
  amount: number
  paid_by: string
  split_between: string[]
  custom_splits?: Record<string, number>
}): Promise<ExpenseRow> {
  const { flat_id, description, amount, paid_by, split_between, custom_splits } = body

  if (!description?.trim()) throw new Error('Description is required')
  if (!amount || amount <= 0) throw new Error('Amount must be positive')
  if (!paid_by) throw new Error('paid_by is required')
  if (!split_between || split_between.length === 0) throw new Error('split_between must not be empty')

  // Insertar gasto
  const { data: expense, error: expenseError } = await supabaseClient
    .from('flat_expenses')
    .insert({ flat_id, description: description.trim(), amount, paid_by })
    .select()
    .single()

  if (expenseError || !expense) {
    throw new Error(`Failed to create expense: ${expenseError?.message}`)
  }

  // Calcular splits
  const splits = split_between.map((userId) => ({
    expense_id: expense.id,
    user_id: userId,
    amount: custom_splits?.[userId] ?? Math.round((amount / split_between.length) * 100) / 100,
  }))

  const { error: splitError } = await supabaseClient
    .from('flat_expense_splits')
    .insert(splits)

  if (splitError) throw new Error(`Failed to create splits: ${splitError.message}`)

  // Devolver gasto completo
  const rows = await getExpenses(flat_id)
  return rows.find((r) => r.id === expense.id) ?? expense
}

const handler = withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
  const userId = getUserId(payload)
  const url = new URL(req.url)
  const method = req.method

  try {
    const flatId = url.searchParams.get('flat_id')

    if (method === 'GET') {
      const type = url.searchParams.get('type')

      // GET ?type=my-flats — pisos del usuario (propietario o inquilino asignado)
      if (type === 'my-flats') {
        const { data: ownedFlats } = await supabaseClient
          .from('flats')
          .select('id, owner_id, address, city, district')
          .eq('owner_id', userId)

        const { data: assignments } = await supabaseClient
          .from('room_assignments')
          .select('rooms!inner(flat_id)')
          .eq('assignee_id', userId)
          .eq('status', 'accepted')

        const assignedFlatIds = Array.from(
          new Set(
            (assignments ?? []).map((a: any) => a.rooms?.flat_id).filter(Boolean)
          )
        )

        let assignedFlats: any[] = []
        if (assignedFlatIds.length > 0) {
          const { data } = await supabaseClient
            .from('flats')
            .select('id, owner_id, address, city, district')
            .in('id', assignedFlatIds)
          assignedFlats = data ?? []
        }

        const seen = new Set<string>()
        const allFlats = [...(ownedFlats ?? []), ...assignedFlats].filter((f) => {
          if (seen.has(f.id)) return false
          seen.add(f.id)
          return true
        })

        return new Response(
          JSON.stringify({ data: { flats: allFlats } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!flatId) {
        return new Response(
          JSON.stringify({ error: 'flat_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await assertFlatMember(flatId, userId)

      if (type === 'members') {
        const members = await getFlatMembers(flatId)
        const response: ApiResponse<FlatMember[]> = { data: members }
        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // GET ?flat_id=...&type=combined — gastos + miembros en una sola llamada
      if (type === 'combined') {
        const [expenses, members] = await Promise.all([
          getExpenses(flatId),
          getFlatMembers(flatId),
        ])
        return new Response(
          JSON.stringify({ expenses, members }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const expenses = await getExpenses(flatId)
      const response: ApiResponse<ExpenseRow[]> = { data: expenses }
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      const body = await req.json()
      await assertFlatMember(body.flat_id, userId)
      // Forzar paid_by al usuario autenticado si es él quien paga
      const expense = await createExpense(body)
      const response: ApiResponse<ExpenseRow> = { data: expense }
      return new Response(
        JSON.stringify(response),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('flat-expenses error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.startsWith('Forbidden') ? 403 : 500
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

Deno.serve(handler)
