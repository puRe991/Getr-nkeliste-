import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Search, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cancelBooking, createBooking } from '@/services/api'
import { deleteOfflineBooking, saveOfflineBooking } from '@/services/offlineDb'
import { formatCurrency } from '@/lib/utils'
import type { AppUser, Drink, Transaction } from '@/types/database'

const UNDO_WINDOW_MS = 10_000

type BookingResult = { mode: 'online'; transactionId: string } | { mode: 'offline'; offlineId: string }

export function QuickBooking({ users, drinks, transactions }: { users: AppUser[]; drinks: Drink[]; transactions: Transaction[] }) {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [search, setSearch] = useState('')
  const [lastBooked, setLastBooked] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const usage = useMemo(() => {
    const userCounts = new Map<string, number>()
    const userLastUsed = new Map<string, string>()
    const drinkCounts = new Map<string, number>()
    for (const transaction of transactions) {
      if (transaction.cancelled_at) continue
      userCounts.set(transaction.user_id, (userCounts.get(transaction.user_id) ?? 0) + 1)
      if (!userLastUsed.has(transaction.user_id) || transaction.created_at > userLastUsed.get(transaction.user_id)!) {
        userLastUsed.set(transaction.user_id, transaction.created_at)
      }
      drinkCounts.set(transaction.drink_id, (drinkCounts.get(transaction.drink_id) ?? 0) + 1)
    }
    return { userCounts, userLastUsed, drinkCounts }
  }, [transactions])

  const activeUsers = useMemo(
    () =>
      users
        .filter((user) => user.is_active && user.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          const countDiff = (usage.userCounts.get(b.id) ?? 0) - (usage.userCounts.get(a.id) ?? 0)
          if (countDiff !== 0) return countDiff
          const lastDiff = (usage.userLastUsed.get(b.id) ?? '').localeCompare(usage.userLastUsed.get(a.id) ?? '')
          if (lastDiff !== 0) return lastDiff
          return a.name.localeCompare(b.name)
        }),
    [users, search, usage],
  )
  const activeDrinks = useMemo(
    () =>
      drinks
        .filter((drink) => drink.is_active)
        .sort((a, b) => (usage.drinkCounts.get(b.id) ?? 0) - (usage.drinkCounts.get(a.id) ?? 0) || a.name.localeCompare(b.name)),
    [drinks, usage],
  )

  const cancel = useMutation({
    mutationFn: async (result: BookingResult) => {
      if (result.mode === 'offline') await deleteOfflineBooking(result.offlineId)
      else await cancelBooking(result.transactionId)
    },
    onSuccess: async () => {
      toast.success('Buchung rückgängig gemacht')
      await queryClient.invalidateQueries()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const booking = useMutation({
    mutationFn: async (drink: Drink): Promise<BookingResult> => {
      if (!selectedUser) throw new Error('Bitte Mitglied auswählen')
      if (!navigator.onLine) {
        const offlineId = crypto.randomUUID()
        await saveOfflineBooking({ id: offlineId, userId: selectedUser.id, drinkId: drink.id, price: drink.price, createdAt: new Date().toISOString() })
        return { mode: 'offline', offlineId }
      }
      const transactionId = await createBooking(selectedUser.id, drink)
      return { mode: 'online', transactionId }
    },
    onSuccess: async (result, drink) => {
      setLastBooked(drink.id)
      window.setTimeout(() => setLastBooked(null), 900)
      toast.success(result.mode === 'offline' ? 'Offline gespeichert' : `${drink.name} gebucht`, {
        duration: UNDO_WINDOW_MS,
        action: { label: 'Rückgängig', onClick: () => cancel.mutate(result) },
      })
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
        <CardHeader><CardTitle>2. Getränk buchen</CardTitle></CardHeader>
        <CardContent>
          {!selectedUser ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Erst Mitglied antippen, dann Getränk buchen.</div> : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {activeDrinks.map((drink) => (
              <Button key={drink.id} size="lg" variant="secondary" disabled={!selectedUser || booking.isPending || drink.stock <= 0} onClick={() => booking.mutate(drink)} className={`h-28 flex-col text-lg ${lastBooked === drink.id ? 'scale-105 border border-primary bg-primary/20' : ''}`}>
                <span className="text-3xl" aria-hidden>{drink.icon}</span><span>{drink.name}</span><span className="text-sm text-muted-foreground">{formatCurrency(drink.price)} · {drink.stock}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
