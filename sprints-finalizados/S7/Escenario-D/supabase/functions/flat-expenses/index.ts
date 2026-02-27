import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withAuth, getUserId } from '../_shared/auth.ts'
import {
    FlatExpenseCreateRequest,
    ApiResponse,
    JWTPayload,
    FlatExpense,
    FlatExpenseSplit
} from '../_shared/types.ts'

const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

/**
 * Obtener gastos del piso
 */
async function getFlatExpenses(flatId: string): Promise<any[]> {
    const { data, error } = await supabaseClient
        .from('flat_expenses')
        .select(`
      *,
      splits:flat_expense_splits(*)
    `)
        .eq('flat_id', flatId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch flat expenses: ${error.message}`)
    }

    return data
}

/**
 * Crear un gasto y sus divisiones
 */
async function createFlatExpense(requestData: FlatExpenseCreateRequest): Promise<any> {
    const { flat_id, description, amount, paid_by, splits } = requestData

    // First verify flat membership ... (Assuming authenticated user is part of flat or paid_by is them)

    // Insert the expense
    const { data: expense, error: expenseError } = await supabaseClient
        .from('flat_expenses')
        .insert({
            flat_id,
            description,
            amount,
            paid_by
        })
        .select()
        .single()

    if (expenseError || !expense) {
        throw new Error(`Failed to create expense: ${expenseError?.message}`)
    }

    // Insert the splits
    if (splits && splits.length > 0) {
        const splitsToInsert = splits.map(split => ({
            expense_id: expense.id,
            user_id: split.user_id,
            amount: split.amount
        }))

        const { error: splitsError } = await supabaseClient
            .from('flat_expense_splits')
            .insert(splitsToInsert)

        if (splitsError) {
            // In a real scenario we might want a transaction/RPC or delete the expense if splits fail
            throw new Error(`Failed to create expense splits: ${splitsError.message}`)
        }
    }

    // Return the created expense with splits
    const { data: fullExpense, error: finalError } = await supabaseClient
        .from('flat_expenses')
        .select(`
      *,
      splits:flat_expense_splits(*)
    `)
        .eq('id', expense.id)
        .single()

    if (finalError) {
        throw new Error(`Failed to fetch complete expense: ${finalError.message}`)
    }

    return fullExpense
}

function validateExpenseRequest(data: FlatExpenseCreateRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.flat_id) errors.push('Flat ID is required')
    if (!data.description) errors.push('Description is required')
    if (!data.amount || data.amount <= 0) errors.push('Amount must be greater than 0')
    if (!data.paid_by) errors.push('Paid by user_id is required')
    if (!data.splits || data.splits.length === 0) errors.push('Splits are required')

    if (data.splits) {
        const totalSplit = data.splits.reduce((acc, split) => acc + split.amount, 0)
        // Accept small rounding differences
        if (Math.abs(totalSplit - data.amount) > 0.01) {
            errors.push(`Split amounts (${totalSplit}) do not sum up to total amount (${data.amount})`)
        }
    }

    return { isValid: errors.length === 0, errors }
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
                    JSON.stringify({ error: 'flat_id parameter is required' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Check if user has access to flat (optional for now, assumes UI hides this or RLS protects)

            const expenses = await getFlatExpenses(flatId)
            const response: ApiResponse<any[]> = { data: expenses }

            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (method === 'POST') {
            const body = await req.json()

            const validation = validateExpenseRequest(body)
            if (!validation.isValid) {
                return new Response(
                    JSON.stringify({ error: 'Validation failed', details: validation.errors }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const newExpense = await createFlatExpense(body)
            const response: ApiResponse<any> = { data: newExpense }

            return new Response(JSON.stringify(response), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Flat Expenses function error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

Deno.serve(handler)
