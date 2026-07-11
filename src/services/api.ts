import { supabase } from '@/services/supabase'
import type { AppUser, Drink, Transaction } from '@/types/database'
import type { DrinkFormValues, UserFormValues } from '@/lib/validations'

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*').order('name')
  assertNoError(error)
  return (data ?? []) as AppUser[]
}

export async function getDrinks() {
  const { data, error } = await supabase.from('drinks').select('*').order('name')
  assertNoError(error)
  return (data ?? []) as Drink[]
}

export async function createUser(values: UserFormValues) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', {
    body: { name: values.name, email: values.email, role: values.role, is_active: values.is_active, balance: values.balance },
  })
  if (error) throw new Error(await extractFunctionError(error))
  return data as { user: AppUser; password: string }
}

async function extractFunctionError(error: unknown) {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context
    if (context) {
      try {
        const body = await context.json()
        if (body?.error) return body.error as string
      } catch {
        return error instanceof Error ? error.message : 'Unbekannter Fehler'
      }
    }
  }
  return error instanceof Error ? error.message : 'Unbekannter Fehler'
}

export async function updateUser(id: string, values: UserFormValues) {
  const { error } = await supabase.from('users').update(values).eq('id', id)
  assertNoError(error)
}

export async function createDrink(values: DrinkFormValues) {
  const { error } = await supabase.from('drinks').insert(values)
  assertNoError(error)
}

export async function updateDrink(id: string, values: DrinkFormValues) {
  const { error } = await supabase.from('drinks').update(values).eq('id', id)
  assertNoError(error)
}

export async function adjustBalance(userId: string, amount: number, note?: string) {
  const { error } = await supabase.rpc('adjust_balance', { p_user_id: userId, p_amount: amount, p_note: note ?? null })
  assertNoError(error)
}

export async function createBooking(userId: string, drink: Drink) {
  const { error } = await supabase.rpc('book_drink', { p_user_id: userId, p_drink_id: drink.id })
  assertNoError(error)
}

export async function getTransactions(from?: string, to?: string) {
  let query = supabase
    .from('transactions')
    .select('*, user:users(name), drink:drinks(name, icon)')
    .order('created_at', { ascending: false })
    .limit(250)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)
  const { data, error } = await query
  assertNoError(error)
  return (data ?? []) as Transaction[]
}

export async function syncOfflineBooking(userId: string, drinkId: string) {
  const { error } = await supabase.rpc('book_drink_by_id', { p_user_id: userId, p_drink_id: drinkId })
  assertNoError(error)
}
