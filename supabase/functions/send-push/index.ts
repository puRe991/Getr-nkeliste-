import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'
import webpush from 'https://esm.sh/web-push@3.6.7?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Nicht angemeldet')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com'

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData.user) throw new Error('Nicht angemeldet')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerRow, error: callerRowError } = await adminClient
      .from('users')
      .select('role, is_active')
      .eq('auth_user_id', callerData.user.id)
      .maybeSingle()
    if (callerRowError) throw callerRowError
    if (!callerRow || callerRow.role !== 'admin' || !callerRow.is_active) throw new Error('Keine Berechtigung')

    const body = await req.json()
    const title = String(body.title ?? '').trim()
    const message = String(body.body ?? '').trim()
    const url = typeof body.url === 'string' ? body.url : undefined
    const userIds: string[] | undefined = Array.isArray(body.user_ids) ? body.user_ids.map(String) : undefined

    if (title.length < 1 || title.length > 80) throw new Error('Titel ungültig')
    if (message.length < 1 || message.length > 200) throw new Error('Nachricht ungültig')

    let query = adminClient.from('push_subscriptions').select('id, endpoint, p256dh, auth')
    if (userIds && userIds.length > 0) query = query.in('user_id', userIds)
    const { data: subscriptions, error: subscriptionsError } = await query
    if (subscriptionsError) throw subscriptionsError

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const payload = JSON.stringify({ title, body: message, url })
    let sent = 0
    let removed = 0
    for (const subscription of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          payload,
        )
        sent += 1
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await adminClient.from('push_subscriptions').delete().eq('id', subscription.id)
          removed += 1
        }
      }
    }

    return new Response(JSON.stringify({ sent, removed, total: subscriptions?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
