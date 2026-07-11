export type UserRole = 'admin' | 'mitglied'

export type AppUser = {
  id: string
  name: string
  email?: string | null
  role: UserRole
  is_active: boolean
  balance: number
  created_at: string
}

export type Drink = {
  id: string
  name: string
  price: number
  stock: number
  is_active: boolean
  icon: string
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  drink_id: string
  price: number
  created_at: string
  user?: Pick<AppUser, 'name'>
  drink?: Pick<Drink, 'name' | 'icon'>
}

export type Setting = {
  key: string
  value: unknown
  updated_at: string
}

export type OfflineBooking = {
  id: string
  userId: string
  drinkId: string
  price: number
  createdAt: string
}
