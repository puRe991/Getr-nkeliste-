import { Dashboard } from '@/features/dashboard/Dashboard'
import { useDrinks, useTransactions, useUsers } from '@/hooks/useAppData'

export function DashboardPage() {
  const users = useUsers()
  const drinks = useDrinks()
  const transactions = useTransactions()
  if (users.isLoading || drinks.isLoading || transactions.isLoading) return <div className="p-8 text-center text-muted-foreground">Lade Dashboard…</div>
  return <Dashboard users={users.data ?? []} drinks={drinks.data ?? []} transactions={transactions.data ?? []} />
}
