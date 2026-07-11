import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { usePushNotifications } from '@/features/push/usePushNotifications'

export function PushToggleCard() {
  const { supported, enabled, loading, enable, disable } = usePushNotifications()

  if (!supported) return null

  async function toggle(checked: boolean) {
    try {
      if (checked) { await enable(); toast.success('Push-Benachrichtigungen aktiviert') }
      else { await disable(); toast.success('Push-Benachrichtigungen deaktiviert') }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler bei Push-Benachrichtigungen')
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2">{enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />} Push-Benachrichtigungen</CardTitle></CardHeader>
      <CardContent>
        <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
          Auf diesem Gerät aktivieren
          <Switch checked={enabled} disabled={loading} onCheckedChange={toggle} />
        </label>
      </CardContent>
    </Card>
  )
}
