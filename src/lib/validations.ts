import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(80),
  role: z.enum(['admin', 'mitglied']),
  is_active: z.boolean(),
  balance: z.number().finite(),
})

export const drinkSchema = z.object({
  name: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(80),
  price: z.number().positive('Preis muss positiv sein').max(99),
  stock: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
  icon: z.string().trim().min(1).max(4),
})

export const balanceAdjustmentSchema = z.object({
  amount: z.number().finite().refine((value) => value !== 0, 'Betrag darf nicht 0 sein'),
  note: z.string().trim().max(140).optional(),
})

export const bookingSchema = z.object({
  userId: z.string().uuid(),
  drinkId: z.string().uuid(),
  price: z.number().positive(),
})

export const dateRangeSchema = z.object({
  from: z.string().min(10),
  to: z.string().min(10),
})

export type UserFormValues = z.infer<typeof userSchema>
export type DrinkFormValues = z.infer<typeof drinkSchema>
export type BalanceAdjustmentFormValues = z.infer<typeof balanceAdjustmentSchema>
