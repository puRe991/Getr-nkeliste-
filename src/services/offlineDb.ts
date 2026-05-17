import { openDB, type DBSchema } from 'idb'
import type { OfflineBooking } from '@/types/database'

interface DrinkCashDb extends DBSchema {
  offline_bookings: {
    key: string
    value: OfflineBooking
    indexes: { 'by-created-at': string }
  }
}

const dbPromise = openDB<DrinkCashDb>('getraenkekasse', 1, {
  upgrade(db) {
    const store = db.createObjectStore('offline_bookings', { keyPath: 'id' })
    store.createIndex('by-created-at', 'createdAt')
  },
})

export async function saveOfflineBooking(booking: OfflineBooking) {
  const db = await dbPromise
  await db.put('offline_bookings', booking)
}

export async function listOfflineBookings() {
  const db = await dbPromise
  return db.getAll('offline_bookings')
}

export async function deleteOfflineBooking(id: string) {
  const db = await dbPromise
  await db.delete('offline_bookings', id)
}
