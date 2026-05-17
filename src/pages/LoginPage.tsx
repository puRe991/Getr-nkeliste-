import type { FormEvent } from 'react'
import { useState } from 'react'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { appConfig } from '@/lib/config'
import { supabase } from '@/services/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (error) toast.error(error.message)
    else toast.success('Magic Link wurde versendet')
  }
  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader><p className="text-xs uppercase tracking-[0.25em] text-primary">Feuerwehr</p><CardTitle className="text-3xl">{appConfig.name}</CardTitle></CardHeader>
        <CardContent><form onSubmit={submit} className="space-y-4"><p className="text-muted-foreground">Mit Magic Link anmelden. Keine Passwörter, keine Hürden.</p><Input type="email" required placeholder="name@feuerwehr.de" value={email} onChange={(event) => setEmail(event.target.value)} /><Button className="w-full" size="lg" disabled={loading}><Mail className="h-5 w-5" /> Link senden</Button></form></CardContent>
      </Card>
    </div>
  )
}
