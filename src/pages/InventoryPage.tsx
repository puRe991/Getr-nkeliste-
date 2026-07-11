import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { appConfig } from '@/lib/config'
import { formatCurrency } from '@/lib/utils'
import { drinkSchema, type DrinkFormValues } from '@/lib/validations'
import { sendPushNotification, updateDrink } from '@/services/api'
import { useDrinks } from '@/hooks/useAppData'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { Drink, ProductCategory } from '@/types/database'

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'getraenk', label: 'Getränke' },
  { value: 'essen', label: 'Essen' },
]

export function InventoryPage() {
  const [category, setCategory] = useState<ProductCategory>('getraenk')
  const drinks = useDrinks()
  const currentUser = useCurrentUser()
  const isAdmin = currentUser.data?.role === 'admin'
  if (drinks.isLoading) return <div className="p-8 text-center text-muted-foreground">Lade Lager…</div>
  const filtered = (drinks.data ?? []).filter((drink) => drink.category === category)
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Aktueller Lagerbestand</CardTitle>
        <div className="flex gap-2">
          {categories.map((tab) => (
            <Button key={tab.value} type="button" size="sm" variant={category === tab.value ? 'default' : 'outline'} onClick={() => setCategory(tab.value)}>{tab.label}</Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && <p className="text-muted-foreground">Keine Produkte in dieser Kategorie.</p>}
        {filtered.map((drink) => (isAdmin ? <AdminDrinkCard key={drink.id} drink={drink} /> : <DrinkCard key={drink.id} drink={drink} />))}
      </CardContent>
    </Card>
  )
}

function DrinkCard({ drink }: { drink: Drink }) {
  const low = drink.stock <= appConfig.lowStockThreshold
  return (
    <div className="rounded-2xl border border-border bg-slate-950 p-4">
      <div className="flex items-center justify-between"><span className="text-3xl">{drink.icon}</span>{low && <Badge className="border-amber-500/40 text-amber-200"><AlertTriangle className="mr-1 h-3 w-3" /> niedrig</Badge>}</div>
      <h3 className="mt-3 text-xl font-bold">{drink.name}</h3>
      <p className="text-muted-foreground">{formatCurrency(drink.price)}</p>
      <p className="mt-4 text-4xl font-black">{drink.stock}</p>
    </div>
  )
}

function AdminDrinkCard({ drink }: { drink: Drink }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (values: DrinkFormValues) => updateDrink(drink.id, values),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['drinks'] }) },
    onError: (error: Error) => toast.error(error.message),
  })

  function patch(partial: Partial<DrinkFormValues>) {
    const values: DrinkFormValues = { name: drink.name, icon: drink.icon, price: drink.price, stock: drink.stock, is_active: drink.is_active, category: drink.category, ...partial }
    const parsed = drinkSchema.safeParse(values)
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Ungültiger Wert'); return }
    mutation.mutate(parsed.data)
    if (drink.stock > appConfig.lowStockThreshold && parsed.data.stock <= appConfig.lowStockThreshold) {
      void sendPushNotification({ title: 'Lagerwarnung', body: `${drink.name} ist bald leer (noch ${parsed.data.stock}).`, url: '/lager' }).catch(() => {})
    }
  }

  const low = drink.stock <= appConfig.lowStockThreshold
  return (
    <div className="rounded-2xl border border-border bg-slate-950 p-4">
      <div className="flex items-center justify-between"><span className="text-3xl">{drink.icon}</span>{low && <Badge className="border-amber-500/40 text-amber-200"><AlertTriangle className="mr-1 h-3 w-3" /> niedrig</Badge>}</div>
      <h3 className="mt-3 text-xl font-bold">{drink.name}</h3>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Preis</span>
        <Input className="h-10 w-24" type="number" step="0.01" defaultValue={drink.price} disabled={mutation.isPending}
          onBlur={(e) => { const value = Number(e.target.value); if (value !== drink.price) patch({ price: value }) }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={mutation.isPending} onClick={() => patch({ stock: Math.max(0, drink.stock - 1) })}>−1</Button>
        <span className="min-w-12 text-center text-3xl font-black">{drink.stock}</span>
        <Button type="button" variant="outline" size="sm" disabled={mutation.isPending} onClick={() => patch({ stock: drink.stock + 1 })}>+1</Button>
        <Button type="button" variant="outline" size="sm" disabled={mutation.isPending} onClick={() => patch({ stock: drink.stock + 10 })}>+10</Button>
      </div>
      <label className="mt-3 flex items-center justify-between rounded-xl border border-border p-2 text-sm">Aktiv <Switch checked={drink.is_active} onCheckedChange={(checked) => patch({ is_active: checked })} /></label>
    </div>
  )
}
