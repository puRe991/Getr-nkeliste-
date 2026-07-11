export const appConfig = {
  name: import.meta.env.VITE_APP_NAME ?? 'Getränkekasse',
  lowStockThreshold: 12,
  currency: 'EUR',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined,
} as const
