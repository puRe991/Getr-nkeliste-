import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, RotateCcw, Search, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cancelBooking, createBooking } from '@/services/api'
import { saveOfflineBooking } from '@/services/offlineDb'
import { useRecentTransactions } from '@/hooks/useAppData'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { AppUser, Drink, ProductCategory } from '@/types/database'

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'getraenk', label: 'Getränke' },
  { value: 'essen', label: 'Essen' },
]

export function QuickBooking({ users, drinks }: { users: AppUser[]; drinks: Drink[] }) {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory>('getraenk')
  const [lastBooked, setLastBooked] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const activeUsers = useMemo(() => users.filter((user) => user.is_active && user.name.toLowerCase().includes(search.toLowerCase())), [users, search])
  const activeDrinks = useMemo(() => drinks.filter((drink) => drink.is_active && drink.category === category), [drinks, category])

  const booking = useMutation({
    mutationFn: async (drink: Drink) => {
      if (!selectedUser) throw new Error('Bitte Mitglied auswählen')
      if (!navigator.onLine) {
        await saveOfflineBooking({ id: crypto.randomUUID(), userId: selectedUser.id, drinkId: drink.id, price: drink.price, createdAt: new Date().toISOString() })
        return 'offline'
      }
      await createBooking(selectedUser.id, drink)
      return 'online'
    },
    onSuccess: async (mode, drink) => {
      setLastBooked(drink.id)
      window.setTimeout(() => setLastBooked(null), 900)
      toast.success(mode === 'offline' ? 'Offline gespeichert' : `${drink.name} gebucht`)
      await queryClient.invalidateQueries()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader><CardTitle>1. Mitglied</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="relative"><Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" /><Input className="pl-10" placeholder="Name suchen" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="grid max-h-[54vh] gap-2 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
            {activeUsers.map((user) => (
              <button key={user.id} onClick={() => setSelectedUser(user)} className={`flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left transition active:scale-[0.99] ${selectedUser?.id === user.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-border bg-slate-950 hover:bg-secondary'}`}>
                <span className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary" /><span><span className="block font-semibold">{user.name}</span><span className="text-sm text-muted-foreground">Saldo {formatCurrency(user.balance)}</span></span></span>
                {selectedUser?.id === user.id && <Check className="h-5 w-5 text-primary" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>2. Buchen</CardTitle>
          <div className="flex gap-2">
            {categories.map((tab) => (
              <Button key={tab.value} type="button" size="sm" variant={category === tab.value ? 'default' : 'outline'} onClick={() => setCategory(tab.value)}>{tab.label}</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedUser ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Erst Mitglied antippen, dann Produkt buchen.</div> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {activeDrinks.map((drink) => (
              <Button key={drink.id} size="lg" variant="secondary" disabled={!selectedUser || booking.isPending || drink.stock <= 0} onClick={() => booking.mutate(drink)} className={`h-28 flex-col text-lg ${lastBooked === drink.id ? 'scale-105 border border-primary bg-primary/20' : ''}`}>
                <span className="text-3xl" aria-hidden>{drink.icon}</span><span>{drink.name}</span><span className="text-sm text-muted-foreground">{formatCurrency(drink.price)} · {drink.stock}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <RecentBookings />
    </div>
  )
}

function RecentBookings() {
  const recent = useRecentTransactions()
  const queryClient = useQueryClient()
  const cancel = useMutation({
    mutationFn: (transactionId: string) => cancelBooking(transactionId),
    onSuccess: async () => { toast.success('Buchung storniert'); await queryClient.invalidateQueries() },
    onError: (error: Error) => toast.error(error.message),
  })

  if (!recent.data?.length) return null

  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Letzte Buchungen</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {recent.data.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-border bg-slate-950 p-3">
            <span className="flex items-center gap-2">
              <span className="font-semibold">{transaction.user?.name ?? 'Unbekannt'}</span>
              <span className="text-muted-foreground">· {transaction.drink?.icon} {transaction.drink?.name}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded-full border border-border px-3 py-1 text-sm">{formatCurrency(transaction.price)}</span>
              <span className="text-sm text-muted-foreground">{formatDateTime(transaction.created_at)}</span>
              <Button type="button" size="icon" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(transaction.id)} aria-label="Buchung stornieren">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
