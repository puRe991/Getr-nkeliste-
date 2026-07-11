import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'
import { corsHeaders } from '../_shared/cors.ts'

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'

function generatePassword(length = 14) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Nicht angemeldet')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

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
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const role = body.role === 'admin' ? 'admin' : 'mitglied'
    const isActive = Boolean(body.is_active)
    const balance = Number(body.balance ?? 0)

    if (name.length < 2 || name.length > 80) throw new Error('Name ungültig')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-Mail ungültig')
    if (!Number.isFinite(balance)) throw new Error('Guthaben ungültig')

    const password = generatePassword()

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, must_change_password: true },
    })
    if (createError || !created.user) throw createError ?? new Error('Benutzer konnte nicht erstellt werden')

    const { data: inserted, error: insertError } = await adminClient
      .from('users')
      .insert({ auth_user_id: created.user.id, name, role, is_active: isActive, balance, email })
      .select()
      .single()

    if (insertError) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      throw insertError
    }

    return new Response(JSON.stringify({ user: inserted, password }), {
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
