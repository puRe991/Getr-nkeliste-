import { useEffect, useState } from 'react'
import { getExistingPushSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from '@/lib/push'
import { deletePushSubscriptionByEndpoint, savePushSubscription } from '@/services/api'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function usePushNotifications() {
  const currentUser = useCurrentUser()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(isPushSupported)

  useEffect(() => {
    if (!isPushSupported) return
    let cancelled = false
    void getExistingPushSubscription().then((subscription) => {
      if (!cancelled) { setEnabled(Boolean(subscription)); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  async function enable() {
    if (!currentUser.data) throw new Error('Nutzer nicht geladen')
    setLoading(true)
    try {
      const subscription = await subscribeToPush()
      await savePushSubscription(currentUser.data.id, subscription)
      setEnabled(true)
    } finally {
      setLoading(false)
    }
  }

  async function disable() {
    setLoading(true)
    try {
      const subscription = await unsubscribeFromPush()
      if (subscription) await deletePushSubscriptionByEndpoint(subscription.endpoint)
      setEnabled(false)
    } finally {
      setLoading(false)
    }
  }

  return { supported: isPushSupported, enabled, loading, enable, disable }
}
