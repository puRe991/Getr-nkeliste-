import { useEffect, useState, type ReactNode } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Euro, Package, Receipt, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/lib/config'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { cancelBooking } from '@/services/api'
import type { AppUser, Drink, Transaction } from '@/types/database'

const ADMIN_LATE_CANCEL_WINDOW_MS = 10 * 60 * 1000

export function Dashboard({ users, drinks, transactions, currentUser }: { users: AppUser[]; drinks: Drink[]; transactions: Transaction[]; currentUser?: AppUser }) {
  const openAmount = users.reduce((sum, user) => sum + Math.max(0, -user.balance), 0)
  const lowStock = drinks.filter((drink) => drink.stock <= appConfig.lowStockThreshold)
  const activeTransactions = transactions.filter((transaction) => !transaction.cancelled_at)
  const topDrinks = Object.values(activeTransactions.reduce<Record<string, { name: string; count: number }>>((acc, transaction) => {
    const name = transaction.drink?.name ?? 'Unbekannt'
    acc[name] = { name, count: (acc[name]?.count ?? 0) + 1 }
    return acc
  }, {})).sort((a, b) => b.count - a.count).slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric title="Offene Beträge" value={formatCurrency(openAmount)} icon={<Euro className="h-5 w-5" />} />
        <Metric title="Buchungen" value={String(activeTransactions.length)} icon={<Receipt className="h-5 w-5" />} />
        <Metric title="Niedriger Bestand" value={String(lowStock.length)} icon={<Package className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Meistverkaufte Getränke</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={topDrinks}><XAxis dataKey="name" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} /><Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Letzte Buchungen</CardTitle></CardHeader><CardContent className="space-y-2">{transactions.slice(0, 8).map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} currentUser={currentUser} />)}</CardContent></Card>
      </div>
      {lowStock.length > 0 && <Card className="border-amber-500/40"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-400" /> Lagerwarnung</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{lowStock.map((drink) => <Badge key={drink.id} className="border-amber-500/40 text-amber-200">{drink.icon} {drink.name}: {drink.stock}</Badge>)}</CardContent></Card>}
    </div>
  )
}

function TransactionRow({ transaction, currentUser }: { transaction: Transaction; currentUser?: AppUser }) {
  const queryClient = useQueryClient()
  const now = useNow(15_000)
  const mutation = useMutation({
    mutationFn: () => cancelBooking(transaction.id),
    onSuccess: async () => { toast.success('Buchung storniert'); await queryClient.invalidateQueries() },
    onError: (error: Error) => toast.error(error.message),
  })

  const isOwnRecentBooking = currentUser?.id === transaction.user_id && now - new Date(transaction.created_at).getTime() < ADMIN_LATE_CANCEL_WINDOW_MS
  const canCancel = !transaction.cancelled_at && (currentUser?.role === 'admin' || isOwnRecentBooking)

  return (
    <div className={`flex items-center justify-between rounded-xl bg-slate-950 p-3 ${transaction.cancelled_at ? 'opacity-50' : ''}`}>
      <div>
        <p className={`font-semibold ${transaction.cancelled_at ? 'line-through' : ''}`}>{transaction.user?.name ?? 'Unbekannt'} · {transaction.drink?.icon} {transaction.drink?.name}</p>
        <p className="text-sm text-muted-foreground">{formatDateTime(transaction.created_at)}{transaction.cancelled_at ? ' · storniert' : ''}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge>{formatCurrency(transaction.price)}</Badge>
        {canCancel && <Button type="button" size="icon" variant="ghost" title="Stornieren" disabled={mutation.isPending} onClick={() => mutation.mutate()}><Undo2 className="h-4 w-4" /></Button>}
      </div>
    </div>
  )
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function Metric({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-black">{value}</p></div><div className="rounded-2xl bg-primary/15 p-3 text-primary">{icon}</div></CardContent></Card>
}
