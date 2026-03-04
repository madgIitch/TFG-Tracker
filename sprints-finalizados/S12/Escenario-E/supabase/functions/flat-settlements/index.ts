// supabase/functions/flat-settlements/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withAuth, getUserId } from '../_shared/auth.ts'
import { JWTPayload, ApiResponse } from '../_shared/types.ts'

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface SettlementResult {
  id: string
  flat_id: string
  from_user: string
  to_user: string
  amount: number
  settled_at: string | null
  from_user_name?: string | null
  to_user_name?: string | null
}

/**
 * Verifica que el usuario autenticado es miembro del piso
 */
async function assertFlatMember(flatId: string, userId: string): Promise<void> {
  const { data: flat } = await supabaseClient
    .from('flats')
    .select('owner_id')
    .eq('id', flatId)
    .single()

  if (flat && flat.owner_id === userId) return

  const { data: rooms } = await supabaseClient
    .from('rooms')
    .select('id')
    .eq('flat_id', flatId)

  const roomIds = (rooms ?? []).map((r: any) => r.id)

  if (roomIds.length > 0) {
    const { data: assignment } = await supabaseClient
      .from('room_assignments')
      .select('id')
      .eq('assignee_id', userId)
      .eq('status', 'accepted')
      .in('room_id', roomIds)
      .limit(1)
      .maybeSingle()

    if (assignment) return
  }

  throw new Error('Forbidden: You are not a member of this flat')
}

/**
 * Obtiene nombres de perfil para una lista de user IDs
 */
async function getProfileNames(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()

  const { data } = await supabaseClient
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)

  const map = new Map<string, string>()
  for (const p of data ?? []) {
    map.set(p.id, p.display_name ?? 'Usuario')
  }
  return map
}

/**
 * Algoritmo greedy: calcula las transferencias mínimas a partir de balances netos.
 * El que más debe paga primero al que más se le debe.
 */
function calculateMinimumTransfers(
  balances: Map<string, number>
): Array<{ from: string; to: string; amount: number }> {
  const debts: Array<{ id: string; amount: number }> = []
  const credits: Array<{ id: string; amount: number }> = []

  for (const [id, balance] of balances.entries()) {
    if (balance < -0.005) debts.push({ id, amount: -balance })
    else if (balance > 0.005) credits.push({ id, amount: balance })
  }

  debts.sort((a, b) => b.amount - a.amount)
  credits.sort((a, b) => b.amount - a.amount)

  const transfers: Array<{ from: string; to: string; amount: number }> = []
  let i = 0
  let j = 0

  while (i < debts.length && j < credits.length) {
    const transfer = Math.min(debts[i].amount, credits[j].amount)
    if (transfer > 0.005) {
      transfers.push({
        from: debts[i].id,
        to: credits[j].id,
        amount: Math.round(transfer * 100) / 100,
      })
    }
    debts[i].amount -= transfer
    credits[j].amount -= transfer
    if (debts[i].amount < 0.005) i++
    if (credits[j].amount < 0.005) j++
  }

  return transfers
}

/**
 * GET: calcula liquidaciones pendientes basadas en gastos actuales y pagos ya registrados
 */
async function getSettlements(flatId: string): Promise<SettlementResult[]> {
  // 1. Obtener todos los splits de gastos del piso (gastos no saldados)
  const { data: splits, error: splitsError } = await supabaseClient
    .from('flat_expense_splits')
    .select(`
      user_id,
      amount,
      flat_expenses!inner(flat_id, paid_by)
    `)
    .eq('flat_expenses.flat_id', flatId)

  if (splitsError) throw new Error(`Failed to fetch splits: ${splitsError.message}`)

  // 2. Obtener pagos ya saldados para restarlos del balance
  const { data: settledPayments, error: settledError } = await supabaseClient
    .from('flat_settlements')
    .select('*')
    .eq('flat_id', flatId)

  if (settledError) throw new Error(`Failed to fetch settlements: ${settledError.message}`)

  // 3. Calcular balance neto por usuario
  // Un split significa: user_id debe 'amount' al paid_by del gasto
  const balances = new Map<string, number>()

  for (const split of splits ?? []) {
    const expense = split.flat_expenses as { flat_id: string; paid_by: string } | null
    if (!expense) continue

    const debtor = split.user_id
    const creditor = expense.paid_by
    const amount = Number(split.amount)

    if (debtor === creditor) continue // El pagador no se debe a sí mismo

    balances.set(debtor, (balances.get(debtor) ?? 0) - amount)
    balances.set(creditor, (balances.get(creditor) ?? 0) + amount)
  }

  // 4. Aplicar pagos ya saldados para ajustar el balance
  const settledRows = settledPayments ?? []
  for (const s of settledRows) {
    const amount = Number(s.amount)
    balances.set(s.from_user, (balances.get(s.from_user) ?? 0) + amount)
    balances.set(s.to_user, (balances.get(s.to_user) ?? 0) - amount)
  }

  // 5. Calcular transferencias mínimas con algoritmo greedy
  const pendingTransfers = calculateMinimumTransfers(balances)

  // 6. Obtener nombres de los perfiles involucrados
  const allUserIds = Array.from(
    new Set([
      ...pendingTransfers.map((t) => t.from),
      ...pendingTransfers.map((t) => t.to),
      ...settledRows.map((s) => s.from_user),
      ...settledRows.map((s) => s.to_user),
    ])
  )
  const names = await getProfileNames(allUserIds)

  // 7. Construir resultado: pendientes calculados + historial saldado
  const result: SettlementResult[] = [
    ...pendingTransfers.map((t) => ({
      id: `pending-${t.from}-${t.to}`,
      flat_id: flatId,
      from_user: t.from,
      to_user: t.to,
      amount: t.amount,
      settled_at: null,
      from_user_name: names.get(t.from) ?? null,
      to_user_name: names.get(t.to) ?? null,
    })),
    ...settledRows.map((s) => ({
      id: s.id,
      flat_id: s.flat_id,
      from_user: s.from_user,
      to_user: s.to_user,
      amount: Number(s.amount),
      settled_at: s.settled_at,
      from_user_name: names.get(s.from_user) ?? null,
      to_user_name: names.get(s.to_user) ?? null,
    })),
  ]

  return result
}

/**
 * POST: registra un pago como saldado
 */
async function createSettlement(body: {
  flat_id: string
  from_user: string
  to_user: string
  amount: number
}): Promise<void> {
  const { flat_id, from_user, to_user, amount } = body

  if (!flat_id || !from_user || !to_user || !amount || amount <= 0) {
    throw new Error('flat_id, from_user, to_user y amount son requeridos')
  }

  const { error } = await supabaseClient
    .from('flat_settlements')
    .insert({
      flat_id,
      from_user,
      to_user,
      amount,
      settled_at: new Date().toISOString(),
    })

  if (error) throw new Error(`Failed to create settlement: ${error.message}`)
}

const handler = withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
  const userId = getUserId(payload)
  const url = new URL(req.url)
  const method = req.method

  try {
    if (method === 'GET') {
      const flatId = url.searchParams.get('flat_id')
      if (!flatId) {
        return new Response(
          JSON.stringify({ error: 'flat_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await assertFlatMember(flatId, userId)
      const settlements = await getSettlements(flatId)
      const response: ApiResponse<SettlementResult[]> = { data: settlements }
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      const body = await req.json()
      await assertFlatMember(body.flat_id, userId)
      await createSettlement(body)
      return new Response(
        JSON.stringify({ message: 'Settlement recorded successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('flat-settlements error:', error)
    const message = error instanceof Error ? error.message : String(error)
    const status = message.startsWith('Forbidden') ? 403 : 500
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

Deno.serve(handler)
