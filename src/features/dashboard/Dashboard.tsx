import type { ReactNode } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Euro, Package, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { appConfig } from '@/lib/config'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { AppUser, Drink, Transaction } from '@/types/database'

export function Dashboard({ users, drinks, transactions }: { users: AppUser[]; drinks: Drink[]; transactions: Transaction[] }) {
  const openAmount = users.reduce((sum, user) => sum + Math.max(0, -user.balance), 0)
  const lowStock = drinks.filter((drink) => drink.stock <= appConfig.lowStockThreshold)
  const topDrinks = Object.values(transactions.reduce<Record<string, { name: string; count: number }>>((acc, transaction) => {
    const name = transaction.drink?.name ?? 'Unbekannt'
    acc[name] = { name, count: (acc[name]?.count ?? 0) + 1 }
    return acc
  }, {})).sort((a, b) => b.count - a.count).slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric title="Offene Beträge" value={formatCurrency(openAmount)} icon={<Euro className="h-5 w-5" />} />
        <Metric title="Buchungen" value={String(transactions.length)} icon={<Receipt className="h-5 w-5" />} />
        <Metric title="Niedriger Bestand" value={String(lowStock.length)} icon={<Package className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Meistverkaufte Getränke</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={topDrinks}><XAxis dataKey="name" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} /><Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Letzte Buchungen</CardTitle></CardHeader><CardContent className="space-y-2">{transactions.slice(0, 8).map((transaction) => <div key={transaction.id} className="flex items-center justify-between rounded-xl bg-slate-950 p-3"><div><p className="font-semibold">{transaction.user?.name ?? 'Unbekannt'} · {transaction.drink?.icon} {transaction.drink?.name}</p><p className="text-sm text-muted-foreground">{formatDateTime(transaction.created_at)}</p></div><Badge>{formatCurrency(transaction.price)}</Badge></div>)}</CardContent></Card>
      </div>
      {lowStock.length > 0 && <Card className="border-amber-500/40"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-400" /> Lagerwarnung</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{lowStock.map((drink) => <Badge key={drink.id} className="border-amber-500/40 text-amber-200">{drink.icon} {drink.name}: {drink.stock}</Badge>)}</CardContent></Card>}
    </div>
  )
}

function Metric({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-black">{value}</p></div><div className="rounded-2xl bg-primary/15 p-3 text-primary">{icon}</div></CardContent></Card>
}
