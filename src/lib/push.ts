import { appConfig } from '@/lib/config'

export const isPushSupported =
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export async function getExistingPushSubscription() {
  if (!isPushSupported) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush() {
  if (!isPushSupported) throw new Error('Push wird von diesem Gerät nicht unterstützt')
  if (!appConfig.vapidPublicKey) throw new Error('Push ist nicht konfiguriert (VITE_VAPID_PUBLIC_KEY fehlt)')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt')

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(appConfig.vapidPublicKey),
  })
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingPushSubscription()
  if (!subscription) return null
  await subscription.unsubscribe()
  return subscription
}
