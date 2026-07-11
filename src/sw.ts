import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 6,
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 })],
  }),
)

self.addEventListener('install', () => { void self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })

type PushPayload = { title: string; body: string; url?: string; icon?: string }

self.addEventListener('push', (event) => {
  let payload: PushPayload = { title: 'Getränkekasse', body: 'Neue Benachrichtigung' }
  if (event.data) {
    try {
      payload = { ...payload, ...(event.data.json() as Partial<PushPayload>) }
    } catch {
      payload = { ...payload, body: event.data.text() }
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/pwa-192x192.svg',
      badge: '/pwa-192x192.svg',
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url ?? '/'
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = clientsList.find((client) => client.url.includes(targetUrl))
      if (existing) { await existing.focus(); return }
      await self.clients.openWindow(targetUrl)
    })(),
  )
})
