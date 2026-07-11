import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTransactions } from '@/hooks/useAppData'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export function PersonalStats() {
  const currentUser = useCurrentUser()
  const transactions = useTransactions()

  const ownTransactions = useMemo(
    () => (transactions.data ?? []).filter((transaction) => transaction.user_id === currentUser.data?.id && !transaction.cancelled_at),
    [transactions.data, currentUser.data?.id],
  )

  const favorites = useMemo(() => {
    const counts = new Map<string, { name: string; icon: string; count: number }>()
    for (const transaction of ownTransactions) {
      const existing = counts.get(transaction.drink_id)
      counts.set(transaction.drink_id, { name: transaction.drink?.name ?? 'Unbekannt', icon: transaction.drink?.icon ?? '🥤', count: (existing?.count ?? 0) + 1 })
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [ownTransactions])

  const totalSpent = ownTransactions.reduce((sum, transaction) => sum + transaction.price, 0)

  if (!currentUser.data) return null

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Mein Konto</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div><p className="text-sm text-muted-foreground">Kontostand</p><p className="text-2xl font-black">{formatCurrency(currentUser.data.balance)}</p></div>
          <div><p className="text-sm text-muted-foreground">Ausgegeben</p><p className="text-2xl font-black">{formatCurrency(totalSpent)}</p></div>
        </CardContent>
      </Card>
      {favorites.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Meine Lieblingsgetränke</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {favorites.map((favorite) => <Badge key={favorite.name}>{favorite.icon} {favorite.name} · {favorite.count}×</Badge>)}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Meine letzten Buchungen</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ownTransactions.length === 0 && <p className="text-muted-foreground">Noch keine Buchungen.</p>}
          {ownTransactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between rounded-xl bg-slate-950 p-3">
              <div><p className="font-semibold">{transaction.drink?.icon} {transaction.drink?.name}</p><p className="text-sm text-muted-foreground">{formatDateTime(transaction.created_at)}</p></div>
              <Badge>{formatCurrency(transaction.price)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
