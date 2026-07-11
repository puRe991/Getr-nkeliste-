import { Dashboard } from '@/features/dashboard/Dashboard'
import { useDrinks, useTransactions, useUsers } from '@/hooks/useAppData'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function DashboardPage() {
  const users = useUsers()
  const drinks = useDrinks()
  const transactions = useTransactions()
  const currentUser = useCurrentUser()
  if (users.isLoading || drinks.isLoading || transactions.isLoading) return <div className="p-8 text-center text-muted-foreground">Lade Dashboard…</div>
  return <Dashboard users={users.data ?? []} drinks={drinks.data ?? []} transactions={transactions.data ?? []} currentUser={currentUser.data} />
}
