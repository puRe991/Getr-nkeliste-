import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'
import { corsHeaders } from '../_shared/cors.ts'

const DEFAULT_THRESHOLD = -10
const RESEND_SUPPRESS_DAYS = 25

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
      throw new Error('Nicht berechtigt')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL')
    const appName = Deno.env.get('VITE_APP_NAME') ?? 'Getränkekasse'

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: settingRow } = await adminClient.from('settings').select('value').eq('key', 'reminders').maybeSingle()
    const settings = (settingRow?.value ?? {}) as { negativeBalanceThreshold?: number; enabled?: boolean }
    if (settings.enabled === false) {
      return json({ skipped: true, reason: 'Mahnungen sind in den Einstellungen deaktiviert' })
    }
    const threshold = typeof settings.negativeBalanceThreshold === 'number' ? settings.negativeBalanceThreshold : DEFAULT_THRESHOLD

    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, name, email, balance')
      .lt('balance', threshold)
      .eq('is_active', true)
      .not('email', 'is', null)
    if (usersError) throw usersError

    const results: Array<{ userId: string; status: string }> = []

    for (const user of users ?? []) {
      const suppressSince = new Date(Date.now() - RESEND_SUPPRESS_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const { data: recent } = await adminClient
        .from('balance_reminders')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', suppressSince)
        .limit(1)
        .maybeSingle()
      if (recent) {
        results.push({ userId: user.id, status: 'suppressed_recent' })
        continue
      }

      let status: 'sent' | 'failed' | 'skipped_no_provider'
      let detail: string | null = null

      if (!resendApiKey || !resendFrom) {
        status = 'skipped_no_provider'
        detail = 'RESEND_API_KEY oder RESEND_FROM_EMAIL nicht konfiguriert'
      } else {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: resendFrom,
              to: user.email,
              subject: `${appName}: offener Betrag`,
              html: `<p>Hallo ${user.name},</p><p>dein aktueller Kontostand bei der ${appName} beträgt <strong>${user.balance.toFixed(2)} €</strong>.</p><p>Bitte gleiche den offenen Betrag zeitnah aus.</p>`,
            }),
          })
          if (!response.ok) throw new Error(await response.text())
          status = 'sent'
        } catch (sendError) {
          status = 'failed'
          detail = sendError instanceof Error ? sendError.message : 'Unbekannter Fehler beim Versand'
        }
      }

      await adminClient.from('balance_reminders').insert({ user_id: user.id, balance: user.balance, status, detail })
      results.push({ userId: user.id, status })
    }

    return json({ threshold, checked: users?.length ?? 0, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return json({ error: message }, 400)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status })
}
