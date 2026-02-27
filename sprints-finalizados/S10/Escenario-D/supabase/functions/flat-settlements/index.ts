import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withAuth, getUserId } from '../_shared/auth.ts'
import {
    JWTPayload,
    FlatSettlementCreateRequest
} from '../_shared/types.ts'

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

/**
 * Calculador de deudas usando algoritmo Greedy.
 * Retorna las transferencias minimas para saldar todas las deudas del piso.
 */
async function calculateNetBalances(flatId: string) {
    // 1. Fetch all expenses for the flat
    const { data: expenses, error: expensesError } = await supabaseClient
        .from('flat_expenses')
        .select(`
      id, amount, paid_by,
      splits:flat_expense_splits(user_id, amount)
    `)
        .eq('flat_id', flatId)

    if (expensesError) throw new Error(expensesError.message)

    // 2. Fetch all resolved settlements for the flat
    const { data: settlements, error: settlementsError } = await supabaseClient
        .from('flat_settlements')
        .select('*')
        .eq('flat_id', flatId)
        .not('settled_at', 'is', null) // only settled payments

    if (settlementsError) throw new Error(settlementsError.message)

    // Balances maps: user_id -> net_amount (positive means they should receive money, negative means they owe money)
    const balances: Record<string, number> = {}

    // A. Add paid amounts (user should receive this back)
    // B. Subtract owed amounts (user owes this)
    expenses.forEach(expense => {
        // Add full amount to payer
        balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount

        // Subtract split amounts from debtors
        expense.splits.forEach((split: any) => {
            balances[split.user_id] = (balances[split.user_id] || 0) - split.amount
        })
    })

    // C. Adjust for already settled debts
    settlements.forEach(settlement => {
        // The person who paid (from_user) has given money, increasing their balance
        balances[settlement.from_user] = (balances[settlement.from_user] || 0) + settlement.amount
        // The person who received (to_user) has gotten money, decreasing their balance
        balances[settlement.to_user] = (balances[settlement.to_user] || 0) - settlement.amount
    })

    // Clear zero balances (or extremely small due to floating point)
    Object.keys(balances).forEach(user => {
        if (Math.abs(balances[user]) < 0.01) {
            delete balances[user]
        }
    })

    // Greedy Algorithm to find minimum network flow
    const debtors = []
    const creditors = []

    for (const user of Object.keys(balances)) {
        if (balances[user] < 0) {
            debtors.push({ user, amount: -balances[user] })
        } else if (balances[user] > 0) {
            creditors.push({ user, amount: balances[user] })
        }
    }

    // Sort by highest amount first to minimize transactions
    debtors.sort((a, b) => b.amount - a.amount)
    creditors.sort((a, b) => b.amount - a.amount)

    const pendingSettlements = []

    let i = 0 // creditors
    let j = 0 // debtors

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i]
        const debtor = debtors[j]

        const amount = Math.min(creditor.amount, debtor.amount)

        pendingSettlements.push({
            from_user: debtor.user,
            to_user: creditor.user,
            amount: parseFloat(amount.toFixed(2))
        })

        creditor.amount -= amount
        debtor.amount -= amount

        // Rounding error tolerance
        if (Math.abs(creditor.amount) < 0.01) i++
        if (Math.abs(debtor.amount) < 0.01) j++
    }

    return pendingSettlements
}

/**
 * Validates marking a debt as settled
 */
function validateSettlementRequest(data: FlatSettlementCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!data.flat_id) errors.push('Flat ID is required')
    if (!data.from_user) errors.push('From User is required')
    if (!data.to_user) errors.push('To User is required')
    if (!data.amount || data.amount <= 0) errors.push('Amount must be positive')
    return { isValid: errors.length === 0, errors }
}

const handler = withAuth(async (req: Request, payload: JWTPayload): Promise<Response> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const userId = getUserId(payload)
    const url = new URL(req.url)
    const method = req.method

    try {
        if (method === 'GET') {
            const flatId = url.searchParams.get('flat_id')

            if (!flatId) {
                return new Response(
                    JSON.stringify({ error: 'flat_id parameter is required' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const pendingSettlements = await calculateNetBalances(flatId)

            return new Response(JSON.stringify({ data: pendingSettlements }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (method === 'POST') {
            const body = await req.json()

            const validation = validateSettlementRequest(body)
            if (!validation.isValid) {
                return new Response(
                    JSON.stringify({ error: 'Validation failed', details: validation.errors }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Ensure the "from_user" is the one making the request? Optional policy. 
            // For now we just insert into flat_settlements
            const { data, error } = await supabaseClient
                .from('flat_settlements')
                .insert({
                    ...body,
                    settled_at: new Date().toISOString() // Assuming POST implies it is settled NOW
                })
                .select()
                .single()

            if (error) throw new Error(error.message)

            return new Response(JSON.stringify({ data }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Flat Settlements function error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

Deno.serve(handler)
