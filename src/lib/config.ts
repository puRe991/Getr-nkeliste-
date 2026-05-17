export const appConfig = {
  name: import.meta.env.VITE_APP_NAME ?? 'Getränkekasse',
  lowStockThreshold: 12,
  currency: 'EUR',
} as const
