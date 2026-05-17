import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteOfflineBooking, listOfflineBookings } from '@/services/offlineDb'
import { syncOfflineBooking } from '@/services/api'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    let cancelled = false
    async function refreshPending() {
      const rows = await listOfflineBookings()
      if (!cancelled) setPending(rows.length)
    }
    async function sync() {
      setIsOnline(navigator.onLine)
      if (!navigator.onLine) return refreshPending()
      const rows = await listOfflineBookings()
      for (const row of rows) {
        try {
          await syncOfflineBooking(row.userId, row.drinkId)
          await deleteOfflineBooking(row.id)
        } catch {
          break
        }
      }
      await queryClient.invalidateQueries()
      await refreshPending()
    }
    void sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    const interval = window.setInterval(sync, 30_000)
    return () => {
      cancelled = true
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
      window.clearInterval(interval)
    }
  }, [queryClient])

  return { isOnline, pending }
}
