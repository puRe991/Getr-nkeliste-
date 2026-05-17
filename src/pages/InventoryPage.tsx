import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { appConfig } from '@/lib/config'
import { formatCurrency } from '@/lib/utils'
import { useDrinks } from '@/hooks/useAppData'

export function InventoryPage() {
  const drinks = useDrinks()
  if (drinks.isLoading) return <div className="p-8 text-center text-muted-foreground">Lade Lager…</div>
  return (
    <Card>
      <CardHeader><CardTitle>Aktueller Lagerbestand</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(drinks.data ?? []).map((drink) => {
          const low = drink.stock <= appConfig.lowStockThreshold
          return <div key={drink.id} className="rounded-2xl border border-border bg-slate-950 p-4"><div className="flex items-center justify-between"><span className="text-3xl">{drink.icon}</span>{low && <Badge className="border-amber-500/40 text-amber-200"><AlertTriangle className="mr-1 h-3 w-3" /> niedrig</Badge>}</div><h3 className="mt-3 text-xl font-bold">{drink.name}</h3><p className="text-muted-foreground">{formatCurrency(drink.price)}</p><p className="mt-4 text-4xl font-black">{drink.stock}</p></div>
        })}
      </CardContent>
    </Card>
  )
}
