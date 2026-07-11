import { AlertTriangle } from 'lucide-react'
import { QuickBooking } from '@/features/kasse/QuickBooking'
import { useDrinks, useTransactions, useUsers } from '@/hooks/useAppData'
import { isSupabaseConfigured } from '@/services/supabase'

export function KassePage() {
  const users = useUsers()
  const drinks = useDrinks()
  const transactions = useTransactions()

  if (!isSupabaseConfigured) return <SetupHint />
  if (users.isLoading || drinks.isLoading) return <div className="p-8 text-center text-muted-foreground">Lade Getränkekasse…</div>
  if (users.error || drinks.error) return <div className="rounded-2xl border border-destructive/40 p-4 text-destructive">Daten konnten nicht geladen werden. Supabase prüfen.</div>

  return <QuickBooking users={users.data ?? []} drinks={drinks.data ?? []} transactions={transactions.data ?? []} />
}

function SetupHint() {
  return <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-6 w-6 text-amber-400" /><div><h2 className="font-bold">Supabase noch nicht verbunden</h2><p className="mt-1 text-muted-foreground">Lege eine .env Datei aus .env.example an und setze VITE_SUPABASE_URL sowie VITE_SUPABASE_ANON_KEY.</p></div></div></div>
}
